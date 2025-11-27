
import React from 'react';
import { db, generateId } from '../db';
import { useParams, Link } from 'react-router-dom';
import { Button, Badge, Card, CardContent, CardHeader, CardTitle, AccordionItem } from '../components/ui';
import { ArrowLeft, BookOpen, Video, FileText, CheckCircle, Circle, BrainCircuit, RotateCcw, Download } from 'lucide-react';
import { generateSynthesis } from '../services/geminiService';
import { Resource, Synthesis } from '../types';

export default function ModuleDetail() {
  const { id } = useParams<{ id: string }>();
  const { isLoading, data } = db.useQuery({
    modules: { $: { where: { id: id } } },
    moduleResources: { $: { where: { moduleId: id } } },
    resources: {},
    syntheses: { $: { where: { moduleId: id } } }
  });

  const [isGenerating, setIsGenerating] = React.useState(false);

  if (isLoading || !data) return <div className="p-8">Loading module...</div>;

  const module = data.modules[0];
  if (!module) return <div className="p-8">Module not found</div>;

  const relevantResourceIds = data.moduleResources.map(mr => mr.resourceId);
  const resources = data.resources
    .filter(r => relevantResourceIds.includes(r.id))
    // Mock sort by sequence order if we had that joined properly, usually need a join or map
    .sort((a,b) => {
      const mrA = data.moduleResources.find(mr => mr.resourceId === a.id);
      const mrB = data.moduleResources.find(mr => mr.resourceId === b.id);
      return (mrA?.sequenceOrder || 0) - (mrB?.sequenceOrder || 0);
    });

  const synthesis = data.syntheses[0];
  const allCompleted = resources.length > 0 && resources.every(r => r.status === 'completed');

  // Context-aware Keyboard Shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      if (e.key.toLowerCase() === 'c') {
        // Find first incomplete resource and mark it
        const firstIncomplete = resources.find(r => r.status !== 'completed');
        if (firstIncomplete) {
          toggleResourceStatus(firstIncomplete);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [resources]);

  const toggleResourceStatus = (resource: Resource) => {
    const newStatus = resource.status === 'completed' ? 'in-progress' : 'completed';
    const completionDate = newStatus === 'completed' ? new Date().toISOString() : undefined;
    db.transact(db.tx.resources[resource.id].update({ status: newStatus, completionDate }));
  };

  const handleGenerateSynthesis = async () => {
    setIsGenerating(true);
    try {
      const result = await generateSynthesis(module.name, resources);
      // Save to DB
      const synthesisId = generateId();
      db.transact(db.tx.syntheses[synthesisId].update({
        id: synthesisId,
        moduleId: module.id,
        ...result,
        generatedAt: new Date().toISOString()
      }));
    } catch (e) {
      alert("Failed to generate synthesis");
    } finally {
      setIsGenerating(false);
    }
  };

  const ContentIcon = ({ type }: { type: string }) => {
    switch(type) {
      case 'video': return <Video className="h-4 w-4" />;
      case 'pdf': return <FileText className="h-4 w-4" />;
      default: return <BookOpen className="h-4 w-4" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex justify-between items-center no-print">
        <Link to="/curriculum" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Curriculum
        </Link>
        <Button variant="outline" size="sm" onClick={() => window.print()}>
          <Download className="h-4 w-4 mr-2" /> Export Study Guide
        </Button>
      </div>

      <div className="space-y-4">
        <h1 className="text-3xl font-bold">{module.name}</h1>
        <p className="text-lg text-muted-foreground">{module.description}</p>
        <div className="flex gap-4">
          <Badge variant="outline" className="text-sm py-1 px-3">
            {module.estimatedHours} Hours
          </Badge>
          <Badge variant="outline" className="text-sm py-1 px-3">
            {resources.length} Resources
          </Badge>
        </div>
      </div>

      <div className="space-y-4 print-break-inside-avoid">
        <h2 className="text-xl font-semibold">Learning Resources</h2>
        <div className="bg-card rounded-lg border divide-y">
          {resources.map((resource, index) => (
            <div key={resource.id} className="p-4 flex items-center gap-4 hover:bg-accent/50 transition-colors">
              <span className="text-muted-foreground font-mono text-sm w-6">{index + 1}</span>
              <button onClick={() => toggleResourceStatus(resource)} className="text-muted-foreground hover:text-primary transition-colors no-print">
                {resource.status === 'completed' ? (
                  <CheckCircle className="h-6 w-6 text-green-500" />
                ) : (
                  <Circle className="h-6 w-6" />
                )}
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                   <Badge variant="secondary" className="text-[10px] px-1 py-0 h-5 gap-1">
                     <ContentIcon type={resource.contentType} /> {resource.contentType}
                   </Badge>
                   <span className="font-medium truncate">{resource.title}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                   <span>{resource.estimatedMinutes} min</span>
                   {resource.difficulty && <span className="capitalize">• {resource.difficulty}</span>}
                </div>
              </div>
              <Button variant="outline" size="sm" asChild className="no-print">
                <a href={resource.url} target="_blank" rel="noopener noreferrer">View</a>
              </Button>
            </div>
          ))}
          {resources.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">No resources assigned to this module yet.</div>
          )}
        </div>
      </div>

      {/* Synthesis Section */}
      {allCompleted && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 print-break-inside-avoid">
           <div className="flex items-center justify-between mb-4 no-print">
             <h2 className="text-2xl font-bold flex items-center gap-2">
               <BrainCircuit className="h-6 w-6 text-purple-500" /> Module Synthesis
             </h2>
             {!synthesis && (
               <Button onClick={handleGenerateSynthesis} disabled={isGenerating}>
                 {isGenerating ? "Generating..." : "Generate AI Synthesis"}
               </Button>
             )}
             {synthesis && (
               <Button variant="outline" size="sm" onClick={handleGenerateSynthesis} disabled={isGenerating}>
                 <RotateCcw className="h-4 w-4 mr-2" /> Regenerate
               </Button>
             )}
           </div>
           
           {/* For Print View Only */}
           <h2 className="text-2xl font-bold hidden print:block mb-4 mt-8 border-t pt-4">Module Synthesis & Study Guide</h2>

           {synthesis ? (
             <div className="space-y-6">
                <Card>
                  <CardHeader><CardTitle>Summary</CardTitle></CardHeader>
                  <CardContent>{synthesis.summaryText || "Summary not available."}</CardContent>
                </Card>

                <div className="grid md:grid-cols-2 gap-6">
                   <Card className="print:break-inside-avoid">
                     <CardHeader><CardTitle>Key Takeaways</CardTitle></CardHeader>
                     <CardContent>
                       <ul className="list-disc pl-5 space-y-2">
                         {synthesis.keyTakeaways?.map((k, i) => <li key={i}>{k}</li>)}
                         {!synthesis.keyTakeaways?.length && <li>No takeaways generated.</li>}
                       </ul>
                     </CardContent>
                   </Card>
                   <Card className="print:break-inside-avoid">
                     <CardHeader><CardTitle>Practical Applications</CardTitle></CardHeader>
                     <CardContent>
                       <ul className="list-check pl-0 space-y-2">
                         {synthesis.practicalApplications?.map((k, i) => (
                           <li key={i} className="flex gap-2">
                             <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                             <span>{k}</span>
                           </li>
                         ))}
                         {!synthesis.practicalApplications?.length && <li>No applications generated.</li>}
                       </ul>
                     </CardContent>
                   </Card>
                </div>

                <Card className="print:break-inside-avoid">
                  <CardHeader><CardTitle>Comprehension Check</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                     {synthesis.comprehensionQuestions?.map((q, i) => (
                       <div key={i} className="bg-muted/50 p-4 rounded-md">
                         <p className="font-medium">Q{i+1}: {q}</p>
                         <p className="text-sm text-muted-foreground mt-2 italic hover:not-italic cursor-help transition-all no-print">Hover for answer (Simulated)</p>
                       </div>
                     ))}
                     {!synthesis.comprehensionQuestions?.length && <p>No questions generated.</p>}
                  </CardContent>
                </Card>
             </div>
           ) : (
             !isGenerating && (
                <Card className="bg-muted border-dashed border-2 no-print">
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <BrainCircuit className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-lg font-medium">Ready to synthesize your learning?</p>
                    <p className="text-muted-foreground max-w-md mx-auto mb-6">
                      Our AI will analyze all completed resources to generate a summary, key takeaways, and a quiz.
                    </p>
                    <Button onClick={handleGenerateSynthesis}>Generate Synthesis</Button>
                  </CardContent>
                </Card>
             )
           )}
        </div>
      )}
    </div>
  );
}
