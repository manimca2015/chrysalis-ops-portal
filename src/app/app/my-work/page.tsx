"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ArrowRight,
  MessageSquare
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';

export default function MyWorkPage() {
  const tasks = [
    { id: '1', title: 'Finalize Singapore itinerary', project: 'Lim Family Holiday', due: 'Today', priority: 'high', status: 'pending' },
    { id: '2', title: 'Verify hotel availability', project: 'TechCorp Retreat', due: 'Tomorrow', priority: 'medium', status: 'pending' },
    { id: '3', title: 'Update costing for flight group', project: 'Education Tour SG', due: 'In 2 days', priority: 'low', status: 'ready_for_verification' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">My Work</h1>
        <p className="text-muted-foreground">Manage your assigned tasks and active project responsibilities.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="bg-primary text-primary-foreground">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Overdue Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">2</div>
            <p className="text-xs opacity-70 mt-1">Requires immediate attention</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">8</div>
            <p className="text-xs text-muted-foreground mt-1">Across 4 projects</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed (Week)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">14</div>
            <p className="text-xs text-muted-foreground mt-1">Good progress!</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="tasks" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tasks">Assigned Tasks</TabsTrigger>
          <TabsTrigger value="projects">My Projects</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>
        <TabsContent value="tasks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Task Queue</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {tasks.map((task) => (
                  <div key={task.id} className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors">
                    <Checkbox id={`task-${task.id}`} />
                    <div className="flex-1 space-y-1">
                      <label 
                        htmlFor={`task-${task.id}`}
                        className="text-sm font-semibold leading-none cursor-pointer hover:underline"
                      >
                        {task.title}
                      </label>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock size={12} /> {task.due}
                        </span>
                        <span className="flex items-center gap-1">
                          <ArrowRight size={12} /> {task.project}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={task.priority === 'high' ? 'destructive' : 'outline'}>
                        {task.priority}
                      </Badge>
                      <Button variant="ghost" size="icon">
                        <MessageSquare size={16} className="text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="projects">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="shadow-sm">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div>
                    <Badge variant="secondary" className="mb-2">Team Lead</Badge>
                    <h3 className="font-bold text-lg">TechCorp Annual Retreat</h3>
                    <p className="text-sm text-muted-foreground">Status: In Progress</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-muted-foreground">Progress</p>
                    <p className="text-xl font-bold text-primary">65%</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="mt-4 w-full">Go to Project</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}