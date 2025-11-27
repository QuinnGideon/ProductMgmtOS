import React from 'react';
import { db } from '../db';
import { Link, useSearchParams } from 'react-router-dom';
import { AccordionItem, Card, Badge, cn } from '../components/ui';
import { CheckCircle2, Lock, Unlock, ArrowRight } from 'lucide-react';

export default function Curriculum() {
  const [searchParams] = useSearchParams();
  const activeTrackId = searchParams.get('track');
  
  const { isLoading, data } = db.useQuery({
    tracks: {},
    modules: {},
    moduleResources: {},
    resources: {}
  });

  const [openTrackId, setOpenTrackId] = React.useState<string | null>(activeTrackId);

  React.useEffect(() => {
    if (activeTrackId) setOpenTrackId(activeTrackId);
  }, [activeTrackId]);

  if (isLoading || !data) return <div className="p-8">Loading...</div>;

  // Helper to get module stats
  const getModuleStats = (moduleId: string) => {
    const modResourcesMap = data.moduleResources.filter(mr => mr.moduleId === moduleId);
    const resourceIds = modResourcesMap.map(mr => mr.resourceId);
    const resources = data.resources.filter(r => resourceIds.includes(r.id));
    
    const total = resources.length;
    const completed = resources.filter(r => r.status === 'completed').length;
    const isComplete = total > 0 && completed === total;
    const isStarted = completed > 0;
    
    return { total, completed, isComplete, isStarted };
  };

  // Calculate Track Progress
  const activeTrack = data.tracks.find(t => t.id === openTrackId);
  let trackProgress = 0;
  if (activeTrack) {
    const trackModules = data.modules.filter(m => m.trackId === activeTrack.id);
    const trackModuleIds = trackModules.map(m => m.id);
    const trackResourcesMap = data.moduleResources.filter(mr => trackModuleIds.includes(mr.moduleId));
    const trackResourceIds = trackResourcesMap.map(mr => mr.resourceId);
    const trackResources = data.resources.filter(r => trackResourceIds.includes(r.id));
    
    const totalTrack = trackResources.length;
    const completedTrack = trackResources.filter(r => r.status === 'completed').length;
    trackProgress = totalTrack > 0 ? Math.round((completedTrack / totalTrack) * 100) : 0;
  }

  // Logic to determine if a module is locked
  // A module is locked if the previous module in the order is not complete
  const getModuleStatus = (module: any, sortedModules: any[]) => {
    const stats = getModuleStats(module.id);
    
    if (stats.isComplete) return 'completed';
    
    // Check previous module
    const index = sortedModules.findIndex(m => m.id === module.id);
    if (index === 0) {
      // First module is always available unless explicit prereqs (simplified here)
      return 'available';
    }
    
    const prevModule = sortedModules[index - 1];
    const prevStats = getModuleStats(prevModule.id);
    
    if (prevStats.isComplete) return 'available';
    return 'locked';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 h-[calc(100vh-100px)]">
       {/* Sidebar */}
       <div className="lg:col-span-1 space-y-4 overflow-y-auto pr-2">
         <h2 className="font-bold text-lg mb-4">Tracks</h2>
         {data.tracks.sort((a,b) => a.order - b.order).map(track => {
           // Calculate quick status for sidebar items
           const tModules = data.modules.filter(m => m.trackId === track.id);
           // Approximate check: if any resource in this track is 'in-progress'
           // Real implementation would mirror the detailed calc above
           return (
             <div 
               key={track.id} 
               onClick={() => setOpenTrackId(track.id)}
               className={cn(
                 "p-4 rounded-lg cursor-pointer border transition-all hover:bg-accent",
                 openTrackId === track.id ? "border-primary bg-primary/5 shadow-sm" : "border-transparent bg-card"
               )}
             >
                <h3 className="font-medium">{track.name}</h3>
                <div className="flex items-center justify-between mt-2">
                   <span className="text-xs text-muted-foreground">{track.estimatedTotalHours} hrs</span>
                   <Badge variant="secondary" className="text-xs">View</Badge>
                </div>
             </div>
           );
         })}
       </div>

       {/* Main Content */}
       <div className="lg:col-span-3 space-y-6 overflow-y-auto pb-20">
          {activeTrack ? (
            <div className="space-y-4">
               <div className="flex items-center justify-between">
                 <h2 className="text-2xl font-bold">{activeTrack.name}</h2>
                 <Badge variant="outline">Track Progress: {trackProgress}%</Badge>
               </div>
               <p className="text-muted-foreground">{activeTrack.description}</p>
               
               <div className="border rounded-lg bg-card">
                  {(() => {
                    const sortedModules = data.modules
                      .filter(m => m.trackId === activeTrack.id)
                      .sort((a,b) => a.order - b.order);

                    return sortedModules.map(module => {
                      const status = getModuleStatus(module, sortedModules);
                      const stats = getModuleStats(module.id);
                      
                      return (
                        <div key={module.id} className={cn("border-b last:border-0 p-6 transition-colors group", status === 'locked' ? "bg-muted/30 opacity-75" : "hover:bg-slate-50 dark:hover:bg-slate-900")}>
                          <div className="flex justify-between items-start">
                            <div className="space-y-1">
                               <div className="flex items-center gap-2">
                                  <h3 className="font-semibold text-lg">{module.name}</h3>
                                  
                                  {status === 'completed' ? (
                                    <Badge variant="success" className="gap-1"><CheckCircle2 className="h-3 w-3" /> Completed</Badge>
                                  ) : status === 'available' && stats.isStarted ? (
                                     <Badge variant="secondary" className="gap-1"><Unlock className="h-3 w-3" /> In Progress</Badge>
                                  ) : status === 'available' ? (
                                     <Badge variant="secondary" className="gap-1"><Unlock className="h-3 w-3" /> Available</Badge>
                                  ) : (
                                     <Badge variant="outline" className="gap-1 text-muted-foreground"><Lock className="h-3 w-3" /> Locked</Badge>
                                  )}
                               </div>
                               <p className="text-sm text-muted-foreground max-w-2xl">{module.description}</p>
                            </div>
                            {status !== 'locked' ? (
                              <Link to={`/modules/${module.id}`}>
                                 <ArrowRight className="text-muted-foreground group-hover:text-primary transition-colors" />
                              </Link>
                            ) : (
                              <Lock className="text-muted-foreground h-5 w-5" />
                            )}
                          </div>
                          <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                             <span>{module.estimatedHours} hours</span>
                             <span>•</span>
                             <span>{stats.total} Resources</span>
                             <span>•</span>
                             <span>{stats.completed}/{stats.total} Done</span>
                          </div>
                        </div>
                      );
                    });
                  })()}
               </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
               Select a track to view curriculum
            </div>
          )}
       </div>
    </div>
  );
}