
import React from 'react';
import { db, lookupId } from '../db';
import { Card, CardHeader, CardTitle, CardContent, Input, Button, Dialog } from '../components/ui';
import { Webhook, Check, Save, Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { useToast } from '../components/Toast';

export default function SettingsPage() {
  const { toast } = useToast();
  // Default to the provided production URL if nothing is in local storage
  const DEFAULT_WEBHOOK = 'https://komplexq.app.n8n.cloud/webhook/ingest-resource';
  const [webhookUrl, setWebhookUrl] = React.useState('');
  const [isSaved, setIsSaved] = React.useState(false);
  const [isResetting, setIsResetting] = React.useState(false);
  const [showResetConfirm, setShowResetConfirm] = React.useState(false);
  
  // Fetch all data for reset functionality
  const { data } = db.useQuery({
    tracks: {},
    modules: {},
    resources: {},
    moduleResources: {},
    syntheses: {}
  });
  
  React.useEffect(() => {
    setWebhookUrl(localStorage.getItem('n8n_webhook_url') || DEFAULT_WEBHOOK);
  }, []);

  const handleSave = () => {
    localStorage.setItem('n8n_webhook_url', webhookUrl);
    setIsSaved(true);
    toast("Settings saved successfully", "success");
    setTimeout(() => setIsSaved(false), 2000);
  };

  const chunkArray = (arr: any[], size: number) => {
    return Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
      arr.slice(i * size, i * size + size)
    );
  };

  // Helper to check if ID is a valid UUID
  const isUuid = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

  const executeReset = async () => {
    if (!data) return;
    
    setIsResetting(true);
    setShowResetConfirm(false); // Close dialog
    
    try {
      const allOps: any[] = [];

      // Define helper to choose delete method based on ID validity
      const pushDeleteOp = (entity: any, id: string) => {
        if (isUuid(id)) {
          allOps.push(db.tx[entity][id].delete());
        } else {
          // Use lookup for legacy IDs
          allOps.push(db.tx[entity][lookupId('id', id)].delete());
        }
      };

      // Collect operations for all entities
      data.tracks.forEach(t => pushDeleteOp('tracks', t.id));
      data.modules.forEach(m => pushDeleteOp('modules', m.id));
      data.resources.forEach(r => pushDeleteOp('resources', r.id));
      data.moduleResources.forEach(mr => pushDeleteOp('moduleResources', mr.id));
      data.syntheses.forEach(s => pushDeleteOp('syntheses', s.id));

      if (allOps.length === 0) {
        toast("Database is already empty.", "info");
        setIsResetting(false);
        return;
      }

      // Chunk operations to avoid transaction size limits (approx 50 ops per tx)
      const chunks = chunkArray(allOps, 50);
      
      let processed = 0;
      for (const chunk of chunks) {
        await db.transact(chunk);
        processed += chunk.length;
        console.log(`Deleted ${processed}/${allOps.length} items`);
      }

      toast("Database reset complete. Refresh page to re-seed default data.", "success");
    } catch (error) {
      console.error("Reset failed:", error);
      toast("Failed to reset database. See console for details.", "error");
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Configure integrations and data.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Webhook className="h-5 w-5" /> n8n Integration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Connect your n8n workflow to automatically process URLs added to the library.
          </p>
          <div className="space-y-2">
            <label className="text-sm font-medium">Webhook URL</label>
            <Input 
              placeholder="https://n8n.your-domain.com/webhook/..." 
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Leaving this empty will enable "Simulation Mode" for manual testing.
            </p>
          </div>
          <div className="flex justify-end pt-2">
            <Button 
              onClick={handleSave} 
              className={isSaved ? "bg-green-600 hover:bg-green-700 text-white transition-all" : ""}
            >
              {isSaved ? (
                <>
                  <Check className="h-4 w-4 mr-2" /> Saved!
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" /> Save Settings
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive/50 bg-destructive/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" /> Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Resetting the database will completely wipe all your learning tracks, resources, and progress. 
            If the app is empty, default seed data will be restored on the next refresh.
          </p>
          <Button 
            variant="destructive" 
            onClick={() => setShowResetConfirm(true)}
            disabled={isResetting}
            className="w-full sm:w-auto"
          >
            {isResetting ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Deleting...</>
            ) : (
              <><Trash2 className="h-4 w-4 mr-2" /> Reset Database & Wipe All Data</>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Reset Confirmation Dialog */}
      <Dialog isOpen={showResetConfirm} onClose={() => setShowResetConfirm(false)}>
        <div className="p-6 max-w-md">
          <div className="flex items-center gap-3 text-destructive mb-4">
            <AlertTriangle className="h-8 w-8" />
            <h2 className="text-xl font-bold">Confirm Reset</h2>
          </div>
          <p className="text-muted-foreground mb-6">
            Are you absolutely sure? This action cannot be undone. It will permanently delete all tracks, modules, resources, and your learning progress.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowResetConfirm(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={executeReset}>
              Yes, Wipe Everything
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
