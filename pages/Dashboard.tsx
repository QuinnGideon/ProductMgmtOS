import React from 'react';
import { db } from '../db';
import { Card, CardHeader, CardTitle, CardContent, Progress, Button, Badge } from '../components/ui';
import { Link } from 'react-router-dom';
import { CheckCircle2, PlayCircle, Award, TrendingUp, Clock, ArrowRight } from 'lucide-react';
import { Resource } from '../types';

export default function Dashboard() {
  const { isLoading, error, data } = db.useQuery({
    resources: {},
    modules: {},
    tracks: {}
  });

  if (isLoading) return <div className="p-8 flex justify-center">Loading dashboard...</div>;
  if (error || !data) return <div className="p-8 text-destructive">Error loading data</div>;

  const totalResources = data.resources.length;
  const completedResources = data.resources.filter(r => r.status === 'completed');
  const completionPercentage = totalResources > 0 ? Math.round((completedResources.length / totalResources) * 100) : 0;
  
  // Recent activity
  const recentActivity = [...completedResources]
    .sort((a, b) => new Date(b.completionDate || 0).getTime() - new Date(a.completionDate || 0).getTime())
    .slice(0, 5);

  // Simple recommendation (mock algorithm for dashboard)
  const inProgress = data.resources.find(r => r.status === 'in-progress');
  const nextUp = data.resources.find(r => r.status === 'queued' && !r.completionDate);

  return (
    <div className="space-y-8">
      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Resources</p>
              <h2 className="text-3xl font-bold">{totalResources}</h2>
            </div>
            <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
              <BookOpenIcon className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Completed</p>
              <h2 className="text-3xl font-bold">{completedResources.length}</h2>
            </div>
            <div className="h-10 w-10 bg-green-500/10 rounded-full flex items-center justify-center text-green-500">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Progress</p>
              <h2 className="text-3xl font-bold">{completionPercentage}%</h2>
            </div>
            <div className="h-10 w-10 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-500">
              <TrendingUp className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Streak</p>
              <h2 className="text-3xl font-bold">3 Days</h2>
            </div>
            <div className="h-10 w-10 bg-orange-500/10 rounded-full flex items-center justify-center text-orange-500">
              <Award className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Continue Learning */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-l-4 border-l-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PlayCircle className="h-6 w-6 text-primary" />
                Continue Learning
              </CardTitle>
            </CardHeader>
            <CardContent>
              {inProgress ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <Badge variant="outline" className="mb-2">{inProgress.contentType}</Badge>
                      <h3 className="text-xl font-bold">{inProgress.title}</h3>
                      <p className="text-muted-foreground text-sm mt-1 flex items-center gap-2">
                        <Clock className="h-4 w-4" /> {inProgress.estimatedMinutes} min
                      </p>
                    </div>
                    <Button asChild>
                      <a href={inProgress.url} target="_blank" rel="noopener noreferrer">Resume</a>
                    </Button>
                  </div>
                  <div className="bg-muted p-4 rounded-md">
                    <p className="text-sm font-medium mb-2">Up Next:</p>
                    {nextUp ? (
                       <div className="flex items-center justify-between text-sm">
                         <span>{nextUp.title}</span>
                         <span className="text-muted-foreground">{nextUp.estimatedMinutes} min</span>
                       </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No more items queued.</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">No active resources. Start something new!</p>
                  <Button asChild>
                    <Link to="/tracks">Browse Tracks</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

           <div className="space-y-4">
            <h3 className="text-lg font-bold">Track Progress</h3>
            {data.tracks.map(track => {
              // Calculate specific track progress (mock logic for demo as module-resource linking needs robust filtering)
              // In real app: filter resources by moduleResource -> module -> track
              return (
                <div key={track.id} className="bg-card border rounded-lg p-4">
                   <div className="flex justify-between mb-2">
                     <span className="font-medium">{track.name}</span>
                     <span className="text-muted-foreground text-sm">30%</span>
                   </div>
                   <Progress value={30} className="h-2" />
                </div>
              )
            })}
           </div>
        </div>

        {/* Recent Activity */}
        <div className="space-y-6">
           <Card>
             <CardHeader>
               <CardTitle>Recent Activity</CardTitle>
             </CardHeader>
             <CardContent>
               <div className="space-y-4">
                 {recentActivity.length > 0 ? recentActivity.map(item => (
                   <div key={item.id} className="flex gap-3 items-start border-b pb-3 last:border-0 last:pb-0">
                     <div className="mt-1">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                     </div>
                     <div>
                       <p className="font-medium text-sm line-clamp-2">{item.title}</p>
                       <p className="text-xs text-muted-foreground">Completed {new Date(item.completionDate!).toLocaleDateString()}</p>
                     </div>
                   </div>
                 )) : (
                   <p className="text-sm text-muted-foreground">No completed activities yet.</p>
                 )}
               </div>
             </CardContent>
           </Card>

           <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950 dark:to-slate-900 border-indigo-200 dark:border-indigo-800">
              <CardContent className="pt-6">
                <h3 className="font-bold text-indigo-900 dark:text-indigo-100 mb-2 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" /> Recommended
                </h3>
                <p className="text-sm text-indigo-800 dark:text-indigo-300 mb-4">
                  Based on your progress in "Discovery", we suggest exploring "User Interview Techniques" next.
                </p>
                <Button variant="secondary" size="sm" className="w-full text-indigo-700">View Suggestion</Button>
              </CardContent>
           </Card>
        </div>
      </div>
    </div>
  );
}

function BookOpenIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}
