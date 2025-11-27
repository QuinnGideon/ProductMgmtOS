import React from 'react';
import { db } from '../db';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Progress } from '../components/ui';
import { Link } from 'react-router-dom';
import { Clock, Layers, ArrowRight } from 'lucide-react';

export default function Tracks() {
  // Fetch deeper relations to calculate real stats
  const { isLoading, error, data } = db.useQuery({
    tracks: {},
    modules: {},
    moduleResources: {},
    resources: {}
  });

  if (isLoading) return <div className="p-8">Loading tracks...</div>;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
         <div>
            <h1 className="text-3xl font-bold tracking-tight">Learning Tracks</h1>
            <p className="text-muted-foreground mt-2">Structured paths to master specific domains.</p>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {data.tracks.map(track => {
            const trackModules = data.modules.filter(m => m.trackId === track.id);
            const trackModuleIds = trackModules.map(m => m.id);
            
            // Find all resources associated with this track
            const relevantModuleResources = data.moduleResources.filter(mr => trackModuleIds.includes(mr.moduleId));
            const resourceIds = relevantModuleResources.map(mr => mr.resourceId);
            const trackResources = data.resources.filter(r => resourceIds.includes(r.id));
            
            // Calculate completion
            const completedCount = trackResources.filter(r => r.status === 'completed').length;
            const totalCount = trackResources.length;
            const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

            return (
              <Card key={track.id} className="flex flex-col h-full hover:shadow-md transition-shadow">
                <div className={`h-2 w-full rounded-t-lg`} style={{ backgroundColor: track.color || '#3b82f6' }} />
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl">{track.name}</CardTitle>
                    <Badge variant="outline">{trackModules.length} Modules</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{track.description}</p>
                </CardHeader>
                <CardContent className="mt-auto space-y-4">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="h-4 w-4"/> {track.estimatedTotalHours} hrs</span>
                    <span className="flex items-center gap-1"><Layers className="h-4 w-4"/> {trackModules.length} steps</span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-medium">
                      <span>Progress</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} />
                  </div>

                  <Button className="w-full" asChild>
                    <Link to={`/curriculum?track=${track.id}`}>
                       {progress > 0 ? 'Continue Track' : 'Start Track'} <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
        })}
      </div>
    </div>
  );
}