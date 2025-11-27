import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Tracks from './pages/Tracks';
import Curriculum from './pages/Curriculum';
import ModuleDetail from './pages/ModuleDetail';
import ResourceLibrary from './pages/ResourceLibrary';
import Insights from './pages/Insights';
import AddResource from './pages/AddResource';
import SettingsPage from './pages/Settings';
import { db, generateId } from './db';
import { Button, Card, CardContent, CardHeader, CardTitle } from './components/ui';
import { ShieldCheck, Loader2 } from 'lucide-react';

// Seed data function for demo purposes
function SeedData() {
  const { isLoading, data } = db.useQuery({ tracks: {} });

  React.useEffect(() => {
    if (!isLoading && data && data.tracks.length === 0) {
      const trackId = generateId();
      const moduleId = generateId();
      const resId1 = generateId();
      const resId2 = generateId();
      const resId3 = generateId();
      
      // Generate consistent IDs for relationships
      const mrId1 = generateId();
      const mrId2 = generateId();
      const mrId3 = generateId();

      const tx = db.tx;

      db.transact([
        tx.tracks[trackId].update({
          id: trackId,
          name: "Product Discovery",
          description: "Learn how to validate ideas and understand user needs.",
          order: 1,
          color: "#3b82f6",
          estimatedTotalHours: 12
        }),
        tx.modules[moduleId].update({
          id: moduleId,
          trackId: trackId,
          name: "User Interview Basics",
          description: "Master the art of talking to users.",
          order: 1,
          estimatedHours: 2,
          prerequisites: []
        }),
        tx.resources[resId1].update({
          id: resId1,
          title: "The Mom Test Summary",
          url: "https://example.com/mom-test",
          contentType: "article",
          difficulty: "beginner",
          estimatedMinutes: 10,
          status: "completed",
          dateAdded: new Date().toISOString(),
          completionDate: new Date().toISOString(),
          topics: ["user-research", "interviewing"]
        }),
        tx.resources[resId2].update({
          id: resId2,
          title: "Conducting CustDev Interviews",
          url: "https://example.com/cust-dev",
          contentType: "video",
          difficulty: "intermediate",
          estimatedMinutes: 45,
          status: "queued",
          dateAdded: new Date().toISOString(),
          topics: ["user-research", "discovery"],
          prerequisiteTopics: ["interviewing"]
        }),
        tx.resources[resId3].update({
          id: resId3,
          title: "Advanced Empathy Mapping",
          url: "https://example.com/empathy",
          contentType: "article",
          difficulty: "advanced",
          estimatedMinutes: 20,
          status: "queued",
          dateAdded: new Date().toISOString(),
          topics: ["empathy", "design-thinking"],
          prerequisiteTopics: ["user-research"]
        }),
        // Use consistent IDs for key and entity
        tx.moduleResources[mrId1].update({ id: mrId1, moduleId, resourceId: resId1, sequenceOrder: 1 }),
        tx.moduleResources[mrId2].update({ id: mrId2, moduleId, resourceId: resId2, sequenceOrder: 2 }),
        tx.moduleResources[mrId3].update({ id: mrId3, moduleId, resourceId: resId3, sequenceOrder: 3 }),
      ]);
    }
  }, [isLoading, data]);

  return null;
}

export default function App() {
  const [hasKey, setHasKey] = React.useState(false);
  const [checkingKey, setCheckingKey] = React.useState(true);

  React.useEffect(() => {
    async function checkKey() {
      if (window.aistudio && window.aistudio.hasSelectedApiKey) {
        const has = await window.aistudio.hasSelectedApiKey();
        setHasKey(has);
      } else {
        // Fallback for environments without the aistudio object
        setHasKey(true);
      }
      setCheckingKey(false);
    }
    checkKey();
  }, []);

  const handleSelectKey = async () => {
    if (window.aistudio && window.aistudio.openSelectKey) {
      await window.aistudio.openSelectKey();
      // Assume success to proceed immediately
      setHasKey(true);
    }
  };

  if (checkingKey) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!hasKey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-primary" />
              Authentication Required
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              To use the AI synthesis features of ProductMgmt OS, please connect your Google Gemini API key. This uses your existing Google account billing.
            </p>
            <Button onClick={handleSelectKey} className="w-full">
              Connect Google Account
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">
                View billing documentation
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <Router>
      <SeedData />
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/tracks" element={<Tracks />} />
          <Route path="/curriculum" element={<Curriculum />} />
          <Route path="/modules/:id" element={<ModuleDetail />} />
          <Route path="/library" element={<ResourceLibrary />} />
          <Route path="/insights" element={<Insights />} />
          <Route path="/add" element={<AddResource />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Layout>
    </Router>
  );
}