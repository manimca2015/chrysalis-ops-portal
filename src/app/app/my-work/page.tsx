
"use client"

import { useQuery } from '@tanstack/react-query';
import { getUserTasks, getProjects } from '@/services/mgmt-service';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ArrowRight,
  MessageSquare,
  Loader2,
  Calendar
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { format } from 'date-fns';

export default function MyWorkPage() {
  const { user } = useAuth();
  
  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ['my-tasks', user?.uid],
    queryFn: () => user ? getUserTasks(user.uid) : Promise.resolve([]),
    enabled: !!user
  });

  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: getProjects,
  });

  const myProjects = projects?.filter(p => 
    p.teamAssignments?.some(a => a.staffId === user?.uid)
  ) || [];

  const pendingCount = tasks?.filter(t => t.status === 'pending').length || 0;
  const verificationCount = tasks?.filter(t => t.status === 'ready_for_verification').length || 0;

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">My Work</h1>
        <p className="text-muted-foreground">Focus on your active assignments across all projects.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="bg-primary text-primary-foreground border-none shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase font-bold tracking-widest opacity-80">Urgent Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black">{tasks?.filter(t => t.priority === 'high').length || 0}</div>
            <p className="text-[10px] opacity-70 mt-1 uppercase font-bold">High priority assigned to you</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase font-bold tracking-widest text-muted-foreground">In Verification</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-primary">{verificationCount}</div>
            <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold">Awaiting senior approval</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase font-bold tracking-widest text-muted-foreground">Assigned Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-accent">{myProjects.length}</div>
            <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold">Active project roles</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="tasks" className="space-y-4">
        <TabsList className="bg-white/50 p-1">
          <TabsTrigger value="tasks">Assigned Tasks ({tasks?.length || 0})</TabsTrigger>
          <TabsTrigger value="projects">My Active Projects</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-4">
          <Card className="border-none shadow-sm overflow-hidden">
            <CardContent className="p-0">
              {tasksLoading ? (
                <div className="p-12 text-center"><Loader2 className="animate-spin mx-auto text-primary" /></div>
              ) : tasks?.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground italic">
                  No active tasks assigned to you. Take a break!
                </div>
              ) : (
                <div className="divide-y">
                  {tasks?.map((task) => (
                    <div key={task.id} className="flex items-center gap-4 p-5 hover:bg-muted/30 transition-all group">
                      <Checkbox id={`task-${task.id}`} className="h-5 w-5" />
                      <div className="flex-1 space-y-1">
                        <label 
                          htmlFor={`task-${task.id}`}
                          className="text-sm font-bold leading-none cursor-pointer group-hover:text-primary transition-colors"
                        >
                          {task.title}
                        </label>
                        <div className="flex items-center gap-4 text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                          <span className="flex items-center gap-1">
                            <Clock size={12} className="text-accent" /> Due: {task.dueDate ? format(task.dueDate.toDate(), 'dd MMM') : 'No Date'}
                          </span>
                          <span className="flex items-center gap-1">
                            <ArrowRight size={12} /> {task.title.slice(0, 30)}...
                          </span>
                          <Badge variant="outline" className={`h-4 text-[8px] ${
                            task.priority === 'high' ? 'bg-red-50 text-red-600 border-red-200' : 
                            task.priority === 'medium' ? 'bg-orange-50 text-orange-600 border-orange-200' : 
                            'bg-blue-50 text-blue-600 border-blue-200'
                          }`}>
                            {task.priority}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" asChild>
                           <Link href={`/app/projects/${task.projectId}/tasks`}><ChevronRight size={18} /></Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects">
          <div className="grid gap-4 md:grid-cols-2">
            {myProjects.length === 0 ? (
              <div className="col-span-2 p-12 text-center bg-white rounded-lg border-2 border-dashed">
                 <p className="text-muted-foreground italic">You are not currently assigned to any active projects.</p>
              </div>
            ) : myProjects.map(project => (
              <Card key={project.id} className="shadow-sm hover:shadow-md transition-all border-none group bg-white">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <Badge variant="secondary" className="mb-2 bg-primary/5 text-primary">
                        {project.teamAssignments.find(a => a.staffId === user?.uid)?.role}
                      </Badge>
                      <h3 className="font-bold text-lg group-hover:text-primary transition-colors">{project.title}</h3>
                      <p className="text-xs text-muted-foreground">{project.customerDetails.name}</p>
                    </div>
                    <Badge variant="outline" className="capitalize">{project.status.replace('_', ' ')}</Badge>
                  </div>
                  <div className="space-y-2 mb-6">
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      <span>Overall Milestone</span>
                      <span>{project.status === 'completed' ? '100%' : 'In Progress'}</span>
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-accent" style={{ width: '45%' }} />
                    </div>
                  </div>
                  <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-all" asChild>
                    <Link href={`/app/projects/${project.id}`}>Open Workspace</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
