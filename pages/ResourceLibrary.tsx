
import React from 'react';
import { db, lookupId } from '../db';
import { Input, Badge, Button, Dialog } from '../components/ui';
import { Search, ExternalLink, Edit, Trash2, Save, X, Filter, FileText } from 'lucide-react';
import { Resource, ContentType, Difficulty, Status } from '../types';
import { useToast } from '../components/Toast';

export default function ResourceLibrary() {
  const { toast } = useToast();
  // Fetch moduleResources as well to handle cascading deletes
  const { isLoading, data } = db.useQuery({ resources: {}, moduleResources: {} });
  
  const [search, setSearch] = React.useState('');
  const [filterType, setFilterType] = React.useState('all');
  const [filterStatus, setFilterStatus] = React.useState('all');
  
  // Edit State
  const [editingResource, setEditingResource] = React.useState<Resource | null>(null);
  const [editForm, setEditForm] = React.useState<Partial<Resource>>({});

  // Delete State
  const [resourceToDelete, setResourceToDelete] = React.useState<string | null>(null);

  const querySearch = new URLSearchParams(location.hash.split('?')[1]).get('search');
  
  React.useEffect(() => {
    if (querySearch) {
      setSearch(decodeURIComponent(querySearch));
    }
  }, [querySearch]);

  if (isLoading || !data) return <div className="p-8">Loading library...</div>;

  const filteredResources = data.resources.filter(r => {
    const matchesSearch = r.title.toLowerCase().includes(search.toLowerCase()) || r.topics?.some(t => t.toLowerCase().includes(search.toLowerCase()));
    const matchesType = filterType === 'all' || r.contentType === filterType;
    const matchesStatus = filterStatus === 'all' || r.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  // Helper to check if ID is a valid UUID (standard InstantDB format)
  const isUuid = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

  const confirmDelete = () => {
    if (!resourceToDelete) return;
    
    const id = resourceToDelete;
    try {
      // Find related module connections
      const relatedLinks = data.moduleResources.filter(mr => mr.resourceId === id);
      
      const txs = [];

      // 1. Delete the Resource
      if (isUuid(id)) {
        txs.push(db.tx.resources[id].delete());
      } else {
        // Handle legacy data with non-UUID ids
        txs.push(db.tx.resources[lookupId('id', id)].delete());
      }

      // 2. Delete Relations (Cascading)
      relatedLinks.forEach(mr => {
        if (isUuid(mr.id)) {
          txs.push(db.tx.moduleResources[mr.id].delete());
        } else {
          txs.push(db.tx.moduleResources[lookupId('id', mr.id)].delete());
        }
      });
      
      db.transact(txs);
      toast("Resource deleted successfully", "success");
    } catch (e) {
      console.error("Delete error:", e);
      toast("Failed to delete resource. Check console.", "error");
    } finally {
      setResourceToDelete(null);
    }
  };

  const openEdit = (resource: Resource) => {
    setEditingResource(resource);
    setEditForm({ ...resource });
  };

  const handleSaveEdit = () => {
    if (editingResource && editForm) {
      try {
        // Clean up extracted content if it's just empty space
        const cleanForm = {
            ...editForm,
            extractedContent: editForm.extractedContent?.trim() || undefined
        };
        
        // Use lookup for update if legacy ID
        if (isUuid(editingResource.id)) {
           db.transact(db.tx.resources[editingResource.id].update(cleanForm));
        } else {
           db.transact(db.tx.resources[lookupId('id', editingResource.id)].update(cleanForm));
        }

        setEditingResource(null);
        toast("Resource updated successfully", "success");
      } catch (e) {
        toast("Failed to update resource", "error");
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold">Resource Library</h1>
        <div className="flex flex-wrap gap-2 w-full md:w-auto items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search title or topic..." 
              className="pl-8" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <select 
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="video">Video</option>
              <option value="article">Article</option>
              <option value="pdf">PDF</option>
            </select>
            <select 
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="queued">Queued</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      <div className="rounded-md border bg-card">
        <div className="relative w-full overflow-auto">
          <table className="w-full caption-bottom text-sm">
            <thead className="[&_tr]:border-b">
              <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Title</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Type</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Topics</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Action</th>
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {filteredResources.map(resource => (
                <tr key={resource.id} className="border-b transition-colors hover:bg-muted/50">
                  <td className="p-4 align-middle font-medium max-w-[300px] truncate" title={resource.title}>
                    {resource.title}
                  </td>
                  <td className="p-4 align-middle">
                     <Badge variant="outline" className="capitalize">{resource.contentType}</Badge>
                  </td>
                  <td className="p-4 align-middle">
                    <div className="flex flex-wrap gap-1">
                      {resource.topics?.slice(0, 2).map(t => (
                        <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>
                      ))}
                      {(resource.topics?.length || 0) > 2 && <span className="text-xs text-muted-foreground">+{resource.topics!.length - 2}</span>}
                    </div>
                  </td>
                  <td className="p-4 align-middle">
                     <Badge 
                        variant={resource.status === 'completed' ? 'success' : resource.status === 'in-progress' ? 'warning' : 'secondary'}
                        className="capitalize"
                     >
                       {resource.status}
                     </Badge>
                  </td>
                  <td className="p-4 align-middle text-right">
                    <div className="flex justify-end gap-1">
                      {resource.url ? (
                        <Button variant="ghost" size="icon" asChild title="Open Link">
                          <a href={resource.url} target="_blank" rel="noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      ) : (
                        <Button variant="ghost" size="icon" onClick={() => openEdit(resource)} title="Read Content">
                           <FileText className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => openEdit(resource)} title="Edit Resource">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setResourceToDelete(resource.id)} className="text-muted-foreground hover:text-destructive" title="Delete">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredResources.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            No resources found matching your filters.
          </div>
        )}
      </div>

      {/* Edit Resource Modal */}
      <Dialog isOpen={!!editingResource} onClose={() => setEditingResource(null)}>
        <div className="p-6 w-full max-w-2xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Edit Resource</h2>
            <Button variant="ghost" size="icon" onClick={() => setEditingResource(null)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {editingResource && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Title</label>
                <Input 
                  value={editForm.title || ''} 
                  onChange={(e) => setEditForm({...editForm, title: e.target.value})} 
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">URL</label>
                <div className="flex gap-2">
                  <Input 
                    value={editForm.url || ''} 
                    onChange={(e) => setEditForm({...editForm, url: e.target.value})} 
                  />
                  {editForm.url && (
                    <Button variant="outline" size="icon" asChild>
                      <a href={editForm.url} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /></a>
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Type</label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={editForm.contentType}
                    onChange={(e) => setEditForm({...editForm, contentType: e.target.value as ContentType})}
                  >
                    <option value="article">Article</option>
                    <option value="video">Video</option>
                    <option value="pdf">PDF</option>
                    <option value="screenshot">Screenshot</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={editForm.status}
                    onChange={(e) => setEditForm({...editForm, status: e.target.value as Status})}
                  >
                    <option value="queued">Queued</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Difficulty</label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={editForm.difficulty}
                    onChange={(e) => setEditForm({...editForm, difficulty: e.target.value as Difficulty})}
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Est. Minutes</label>
                  <Input 
                    type="number"
                    value={editForm.estimatedMinutes || 0}
                    onChange={(e) => setEditForm({...editForm, estimatedMinutes: parseInt(e.target.value)})} 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Topics (comma separated)</label>
                <Input 
                  value={editForm.topics?.join(', ') || ''}
                  onChange={(e) => setEditForm({
                    ...editForm, 
                    topics: e.target.value.split(',').map(t => t.trim()).filter(Boolean)
                  })}
                  placeholder="product, discovery, analytics"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Extracted Content / Notes</label>
                <textarea 
                  className="flex min-h-[150px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={editForm.extractedContent || editForm.userNotes || ''}
                  onChange={(e) => setEditForm({...editForm, extractedContent: e.target.value})}
                  placeholder="Paste text content here for the AI synthesis..."
                />
                <p className="text-xs text-muted-foreground">This content is used by the AI for generating summaries and quizzes.</p>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setEditingResource(null)}>Cancel</Button>
                <Button onClick={handleSaveEdit}>
                  <Save className="h-4 w-4 mr-2" /> Save Changes
                </Button>
              </div>
            </div>
          )}
        </div>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog isOpen={!!resourceToDelete} onClose={() => setResourceToDelete(null)}>
        <div className="p-6 max-w-sm">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
              <Trash2 className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold">Delete Resource?</h3>
            <p className="text-muted-foreground text-sm">
              Are you sure you want to delete this? This action cannot be undone and will remove it from any assigned modules.
            </p>
            <div className="flex gap-2 w-full pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setResourceToDelete(null)}>
                Cancel
              </Button>
              <Button variant="destructive" className="flex-1" onClick={confirmDelete}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
