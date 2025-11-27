import React from 'react';
import { db } from '../db';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '../components/ui';
import { AlertTriangle, Lightbulb, ArrowRight, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Resource } from '../types';

export default function Insights() {
  const { isLoading, data } = db.useQuery({
    resources: {},
    modules: {}
  });

  if (isLoading || !data) return <div className="p-8">Analyzing curriculum...</div>;

  // --- 1. Gap Detection Logic ---
  // Identify topics that appear as prerequisites (in resources.prerequisiteTopics) but have low coverage in actual resource topics
  const topicCounts: Record<string, number> = {};
  const prereqCounts: Record<string, number> = {};

  data.resources.forEach(r => {
    // Count coverage
    r.topics?.forEach(t => {
      topicCounts[t] = (topicCounts[t] || 0) + 1;
    });
    // Count demand
    r.prerequisiteTopics?.forEach(t => {
      prereqCounts[t] = (prereqCounts[t] || 0) + 1;
    });
  });

  const gaps = Object.entries(prereqCounts)
    .filter(([topic, requiredCount]) => {
      const availableCount = topicCounts[topic] || 0;
      return requiredCount > 0 && availableCount < 2; // Threshold: Need at least 2 resources for a prereq
    })
    .map(([topic, count]) => ({
      topic,
      required: count,
      available: topicCounts[topic] || 0
    }))
    .sort((a, b) => b.required - a.required);

  // --- 2. Recommendation Logic ---
  // Simple scoring: prioritize queued resources that match completed topics (reinforcement) or are short (quick wins)
  const completedTopics = new Set(
    data.resources
      .filter(r => r.status === 'completed')
      .flatMap(r => r.topics || [])
  );

  const recommendedResources = data.resources
    .filter(r => r.status === 'queued')
    .map(r => {
      let score = 0;
      // Score based on topic continuity
      const matches = r.topics?.filter(t => completedTopics.has(t)).length || 0;
      score += matches * 2;
      // Score based on brevity (< 15 min is a quick win)
      if (r.estimatedMinutes < 15) score += 3;
      // Demote if advanced and no prereqs met (simplified)
      if (r.difficulty === 'advanced' && matches === 0) score -= 5;
      
      return { resource: r, score, reason: matches > 0 ? "Builds on existing knowledge" : "Quick win" };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Insights & Recommendations</h1>
        <p className="text-muted-foreground">Smart analysis of your learning journey.</p>
      </div>

      {/* Gaps Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" /> Knowledge Gaps
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          {gaps.length > 0 ? gaps.map((gap, i) => (
             <Card key={i} className="border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-900">
               <CardContent className="pt-6">
                 <h3 className="font-bold text-lg mb-2 capitalize">{gap.topic}</h3>
                 <p className="text-sm text-muted-foreground mb-4">
                   This topic appears as a prerequisite in {gap.required} resources, but you only have {gap.available} dedicated resources for it.
                 </p>
                 <Button variant="outline" size="sm" className="w-full bg-background">
                   Find "{gap.topic}" Resources
                 </Button>
               </CardContent>
             </Card>
          )) : (
            <Card className="col-span-full bg-green-50 dark:bg-green-900/10 border-green-200">
              <CardContent className="pt-6 text-center text-green-700">
                No critical gaps detected! Your curriculum is well-balanced.
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Recommendations Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-yellow-500" /> Recommended Path
        </h2>
        <div className="grid md:grid-cols-1 gap-4">
          {recommendedResources.map((item, i) => (
            <Card key={item.resource.id} className="hover:border-primary transition-colors">
              <CardContent className="pt-6 flex items-start justify-between">
                <div>
                   <div className="flex items-center gap-2 mb-2">
                     <Badge>{item.reason}</Badge>
                     <span className="text-xs text-muted-foreground capitalize">• {item.resource.difficulty}</span>
                   </div>
                   <h3 className="font-bold text-lg">{item.resource.title}</h3>
                   <div className="flex gap-2 mt-2">
                     {item.resource.topics?.map(t => (
                       <span key={t} className="text-xs bg-muted px-2 py-1 rounded-full">{t}</span>
                     ))}
                   </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">{item.resource.estimatedMinutes} min</p>
                  {item.resource.url ? (
                    <Button size="sm" variant="ghost" className="mt-2" asChild>
                      <a href={item.resource.url} target="_blank" rel="noopener noreferrer">Start <ArrowRight className="h-4 w-4 ml-1"/></a>
                    </Button>
                  ) : (
                    <Button size="sm" variant="ghost" className="mt-2" asChild>
                      <Link to={`/library?search=${encodeURIComponent(item.resource.title)}`}>
                        View <BookOpen className="h-4 w-4 ml-1"/>
                      </Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          {recommendedResources.length === 0 && (
             <div className="p-8 border rounded-lg text-center text-muted-foreground">
               Add more queued resources to get recommendations.
             </div>
          )}
        </div>
      </div>
    </div>
  );
}