
import React from 'react';
import { db, generateId } from '../db';
import { Input, Button, Card, CardHeader, CardTitle, CardContent, Badge } from '../components/ui';
import { PlusCircle, Loader2, Settings, Link as LinkIcon, CheckCircle2, FileText, Type, DownloadCloud } from 'lucide-react';
import { Resource, ContentType, Difficulty } from '../types';

export default function AddResource() {
  const [mode, setMode] = React.useState<'auto' | 'manual'>('auto');
  
  // Auto Mode State
  const [url, setUrl] = React.useState('');
  const [webhookUrl, setWebhookUrl] = React.useState(localStorage.getItem('n8n_webhook_url') || '');
  const [showSettings, setShowSettings] = React.useState(false);
  
  // Manual Mode State
  const [manualTitle, setManualTitle] = React.useState('');
  const [manualType, setManualType] = React.useState<ContentType>('article');
  const [manualContent, setManualContent] = React.useState('');
  const [manualDifficulty, setManualDifficulty] = React.useState<Difficulty>('intermediate');
  const [manualMinutes, setManualMinutes] = React.useState(15);
  
  // Scraper State
  const [fetchUrl, setFetchUrl] = React.useState('');
  const [isFetching, setIsFetching] = React.useState(false);

  const [isLoading, setIsLoading] = React.useState(false);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  const handleWebhookChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    setWebhookUrl(newVal);
    localStorage.setItem('n8n_webhook_url', newVal);
  };

  const handleAutoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSuccessMessage(null);

    try {
      if (webhookUrl) {
        // REAL MODE: Send to n8n
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url, date: new Date().toISOString() })
        });
        setSuccessMessage("Sent to n8n workflow! The resource will appear in your library once processed.");
      } else {
        // SIMULATION MODE
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const newResource: Resource = {
          id: generateId(),
          title: "New Resource from " + new URL(url).hostname,
          url: url,
          contentType: 'article',
          topics: ['general', 'product'],
          difficulty: 'intermediate',
          estimatedMinutes: 10,
          status: 'queued',
          dateAdded: new Date().toISOString(),
          userNotes: ''
        };

        db.transact(db.tx.resources[newResource.id].update(newResource));
        setSuccessMessage("Resource added successfully (Simulation Mode)");
      }
      setUrl('');
    } catch (error) {
      console.error(error);
      alert("Failed to process resource");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFetchContent = async () => {
    if (!fetchUrl) return;
    setIsFetching(true);
    try {
      // Use a CORS proxy to fetch the content from the client side
      const response = await fetch(`https://corsproxy.io/?${encodeURIComponent(fetchUrl)}`);
      if (!response.ok) throw new Error("Failed to fetch");
      
      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      const title = doc.querySelector('title')?.innerText || '';
      // Simple extraction: Get all paragraphs and join them
      const paragraphs = Array.from(doc.querySelectorAll('p'))
        .map(p => p.innerText)
        .filter(text => text.length > 50); // Basic filter for nav/footer junk
      
      const content = paragraphs.join('\n\n');

      if (title) setManualTitle(title);
      if (content) setManualContent(content);
      
      // Try to guess time
      const wordCount = content.split(' ').length;
      const readingTime = Math.max(1, Math.ceil(wordCount / 200)); // Ensure at least 1 minute
      if (readingTime > 0) setManualMinutes(readingTime);

      setSuccessMessage("Content fetched successfully! Verify details below.");
    } catch (e) {
      console.error(e);
      alert("Could not scrape this URL automatically. The site might block proxies. Please paste content manually.");
    } finally {
      setIsFetching(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const newResource: Resource = {
        id: generateId(),
        title: manualTitle,
        url: fetchUrl || "", // Save source URL if we used the scraper
        contentType: manualType,
        topics: ['manual-entry'], // In a real app, we'd add a topic picker
        difficulty: manualDifficulty,
        estimatedMinutes: manualMinutes,
        status: 'queued',
        dateAdded: new Date().toISOString(),
        extractedContent: manualContent, // This allows the AI to work!
        userNotes: ''
      };

      db.transact(db.tx.resources[newResource.id].update(newResource));
      setSuccessMessage("Resource created manually. AI features can now use the content you pasted.");
      
      // Reset form
      setManualTitle('');
      setManualContent('');
      setFetchUrl('');
      setManualMinutes(15);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-12 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Add Resource</h1>
        <Button variant="ghost" size="sm" onClick={() => setShowSettings(!showSettings)} className="text-muted-foreground">
          <Settings className="h-4 w-4 mr-2" /> {showSettings ? 'Hide' : 'Configure'} n8n
        </Button>
      </div>

      {showSettings && (
        <Card className="bg-muted/30 border-dashed animate-in slide-in-from-top-2">
          <CardContent className="pt-6">
            <label className="text-sm font-medium block mb-2">n8n Webhook URL</label>
            <Input 
              placeholder="https://n8n.your-domain.com/webhook/..." 
              value={webhookUrl}
              onChange={handleWebhookChange}
            />
            <p className="text-xs text-muted-foreground mt-2">
              Required for "Link Ingestion" to automatically fetch content via your backend.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <div className="flex space-x-1 rounded-lg bg-muted p-1">
        <button
          onClick={() => setMode('auto')}
          className={`flex-1 flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all ${mode === 'auto' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:bg-background/50'}`}
        >
          <LinkIcon className="h-4 w-4" /> Link Ingestion (n8n)
        </button>
        <button
          onClick={() => setMode('manual')}
          className={`flex-1 flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all ${mode === 'manual' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:bg-background/50'}`}
        >
          <FileText className="h-4 w-4" /> Manual Entry / Scrape
        </button>
      </div>

      {successMessage && (
        <div className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 p-3 rounded-md flex items-start gap-2 text-sm animate-in fade-in">
          <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
          <span>{successMessage}</span>
        </div>
      )}

      {mode === 'auto' ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Paste a URL</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAutoSubmit} className="space-y-6">
              <div className="space-y-2">
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    className="pl-9"
                    placeholder="https://youtube.com/watch?v=..." 
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    required
                    type="url"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {webhookUrl 
                    ? "We will send this to n8n to extract content, summarize, and tag automatically." 
                    : "Simulation Mode: We will create a placeholder. Configure n8n to enable real extraction."}
                </p>
              </div>
              
              <Button type="submit" className="w-full" disabled={isLoading || !url}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                    {webhookUrl ? 'Sending to n8n...' : 'Simulating...'}
                  </>
                ) : (
                  "Add to Library"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Manual Entry</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              
              {/* Smart Scraper Section */}
              <div className="bg-muted/50 p-4 rounded-lg border space-y-3">
                <label className="text-sm font-medium flex items-center gap-2">
                  <DownloadCloud className="h-4 w-4" /> Auto-fill from URL
                </label>
                <div className="flex gap-2">
                  <Input 
                    placeholder="https://example.com/article" 
                    value={fetchUrl} 
                    onChange={(e) => setFetchUrl(e.target.value)} 
                    className="bg-background"
                  />
                  <Button 
                    type="button" 
                    variant="secondary" 
                    onClick={handleFetchContent}
                    disabled={isFetching || !fetchUrl}
                  >
                    {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Fetch"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Uses a client-side proxy to scrape text. Works best for blogs and articles.
                </p>
              </div>

              <form onSubmit={handleManualSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Title</label>
                  <Input 
                    placeholder="e.g., The Lean Startup Summary" 
                    value={manualTitle}
                    onChange={(e) => setManualTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Type</label>
                    <select 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      value={manualType}
                      onChange={(e) => setManualType(e.target.value as ContentType)}
                    >
                      <option value="article">Article</option>
                      <option value="video">Video</option>
                      <option value="pdf">PDF</option>
                      <option value="screenshot">Screenshot</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Difficulty</label>
                    <select 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      value={manualDifficulty}
                      onChange={(e) => setManualDifficulty(e.target.value as Difficulty)}
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Extracted Content (for AI)</label>
                  <textarea 
                    className="flex min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="Paste the article text, video transcript, or summary here. This allows the AI synthesis to work."
                    value={manualContent}
                    onChange={(e) => setManualContent(e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Paste the actual text content here so the AI can read it later.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Estimated Time (min)</label>
                  <Input 
                    type="number"
                    value={manualMinutes}
                    onChange={(e) => setManualMinutes(parseInt(e.target.value))}
                    min={1}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                  Create Resource
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
