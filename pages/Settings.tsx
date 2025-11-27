
import React from 'react';
import { db } from '../db';
import { Card, CardHeader, CardTitle, CardContent, Input, Button } from '../components/ui';
import { Webhook, Check, Save, Trash2, AlertTriangle } from 'lucide-react';

export default function SettingsPage() {
  // Default to the provided production URL if nothing is in local storage
  const DEFAULT_WEBHOOK = 'https://komplexq.app.n8n.cloud/webhook/ingest-resource';
  const [webhookUrl, setWebhookUrl] = React.useState('');
  const [isSaved, setIsSaved] = React.useState(false);
  
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
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleResetDatabase = () => {
    if (!data) return;
    
    const confirm = window.confirm(
      "DANGER: This will delete ALL data in the application (Tracks, Modules, Resources). \n\nAre you absolutely sure?"
    );

    if (confirm) {
      const txs = [
        ...data.tracks.map(t => db.tx.tracks[t.id].delete()),
        ...data.modules.map(m => db.tx.modules[m.id].delete()),
        ...data.resources.map(r => db.tx.resources[r.id].delete()),
        ...data.moduleResources.map(mr => db.tx.moduleResources[mr.id].delete()),
        ...data.syntheses.map(s => db.tx.syntheses[s.id].delete())
      ];

      if (txs.length > 0) {
        // Split into chunks if too large, though InstantDB handles large txs well usually
        db.transact(txs);
        alert("Database reset complete. Refresh the page to re-seed default data.");
      } else {
        alert("Database is already empty.");
      }
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
                  <Check className="h-4 w-4 mr-2" /> Settings Saved!
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
            onClick={handleResetDatabase}
            className="w-full sm:w-auto"
          >
            <Trash2 className="h-4 w-4 mr-2" /> Reset Database & Wipe All Data
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
