
"use client"

import React, { use, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getProjectById, 
  updateProjectStatus, 
  getProjectActivity, 
  getProjectTasks,
  cloneProject,
  getDocuments,
  finalizeProjectDetails
} from '@/services/mgmt-service';
import { generateProjectInsights, type ProjectIntelligenceOutput } from '@/ai/flows/ai-project-intelligence';
import { ProjectStatus } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { 
  CheckCircle2, 
  Clock, 
  Mail, 
  History,
  Info,
  Users as UsersIcon,
  ChevronRight,
  ListTodo,
  AlertTriangle,
  Copy,
  FileText,
  Download,
  FileIcon,
  Sparkles,
  Loader2,
  Settings,
  Edit3,
  Calendar,
  Zap
} from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { QuestionnaireModal } from '@/components/projects/questionnaire-modal';
import { EditProjectModal } from '@/components/projects/edit-project-modal';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

const STATUS_STEPS: ProjectStatus[] = ['enquiry', 'costing', 'quotation_sent', 'confirmed', 'in_progress', 'completed'];

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [aiInsight, setAiInsight] = useState<ProjectIntelligenceOutput | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isFinalizeModalOpen, setIsFinalizeModalOpen] = useState(false);

  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: () => getProjectById(id),
  });

  const { data: activities, isLoading: activitiesLoading } = useQuery({
    queryKey: ['project-activity', id],
    queryFn: () => getProjectActivity(id),
  });

  const { data: tasks } = useQuery({
    queryKey: ['tasks', id],
    queryFn: () => getProjectTasks(id),
  });

  const { data: documents } = useQuery({
    queryKey: ['documents', id],
    queryFn: () => getDocuments(id),
  });

  const finalizeMutation = useMutation({
    mutationFn: (data: any) => finalizeProjectDetails(id, data, user?.uid || 'system', user?.email || 'Staff'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      setIsFinalizeModalOpen(false);
      toast({ title: 'Details Finalized', description: 'Pax and pricing updated.' });
    }
  });

  if (projectLoading) return <div className="p-12 text-center"><Loader2 className="animate-spin mx-auto" /></div>;
  if (!project) return <div className="p-8 text-center">Project not found.</div>;

  const currentStatusIndex = STATUS_STEPS.indexOf(project.status);
  const taskProgress = tasks ? (tasks.filter(t => t.status === 'completed').length / (tasks.length || 1)) * 100 : 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 uppercase">
              {project.category.replace('-', ' ')}
            </Badge>
            <span className="text-sm text-muted-foreground font-mono">ID: {project.id.slice(0, 8)}</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">{project.title}</h1>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => setIsEditModalOpen(true)}><Edit3 size={14} className="mr-2" /> Edit</Button>
          <Dialog open={isFinalizeModalOpen} onOpenChange={setIsFinalizeModalOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90"><Settings size={14} className="mr-2" /> Finalize Pax/Rooms</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Finalize Details</DialogTitle></DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid gap-2">
                  <Label>Confirmed Pax Count</Label>
                  <Input type="number" defaultValue={project.provisionalPax} onChange={e => (project as any).actualPax = Number(e.target.value)} />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => finalizeMutation.mutate({ actualPax: (project as any).actualPax })} disabled={finalizeMutation.isPending}>
                  Lock In Changes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="bg-muted/50 p-1">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="activity">Activity Log</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader><CardTitle className="text-sm">Client Context</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center text-accent font-black">
                        {project.customerDetails.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold">{project.customerDetails.name}</p>
                        <p className="text-xs text-muted-foreground">{project.customerDetails.email}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="text-sm">Finance Summary</CardTitle></CardHeader>
                  <CardContent>
                    <div className="text-2xl font-black text-primary">SGD {project.finalPriceSgd?.toLocaleString() || project.agreedPriceSgd?.toLocaleString() || '---'}</div>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Projected Revenue</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-sm">Enquiry Intelligence</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {project.notes || 'No project notes available.'}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="timeline">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Project Journey</CardTitle>
                  <CardDescription>Sequence of tasks and operational dependencies.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-8 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-muted">
                    {tasks?.map((task, idx) => (
                      <div key={task.id} className="relative pl-10">
                        <div className={`absolute left-2.5 top-1 h-3.5 w-3.5 rounded-full border-2 border-white ring-2 ${
                          task.status === 'completed' ? 'ring-emerald-500 bg-emerald-500' : 'ring-muted bg-muted-foreground'
                        }`} />
                        <div className="space-y-1">
                          <p className="text-sm font-bold">{task.title}</p>
                          <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-bold uppercase">
                            <span className="flex items-center gap-1"><Calendar size={10} /> {task.dueDate ? format(task.dueDate.toDate(), 'dd MMM') : 'TBD'}</span>
                            <span className="flex items-center gap-1"><UsersIcon size={10} /> {task.assignedToName || 'Unassigned'}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {!tasks?.length && <p className="text-center text-muted-foreground py-12">No tasks generated for this project timeline.</p>}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documents">
               <Card>
                 <CardContent className="p-0">
                    <div className="divide-y">
                      {!documents?.length ? (
                        <div className="p-12 text-center text-muted-foreground">No documents found.</div>
                      ) : documents.map(doc => (
                        <div key={doc.id} className="p-4 flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <FileIcon className="text-primary" />
                            <div><p className="text-sm font-bold">{doc.title}</p><p className="text-[10px] uppercase text-muted-foreground">{doc.type}</p></div>
                          </div>
                          <Badge>{doc.status}</Badge>
                        </div>
                      ))}
                    </div>
                 </CardContent>
               </Card>
            </TabsContent>

            <TabsContent value="activity">
               <Card>
                 <CardContent className="p-0">
                   <div className="divide-y">
                      {activities?.map(item => (
                        <div key={item.id} className="p-4 flex gap-4">
                          <History size={16} className="text-muted-foreground mt-1" />
                          <div>
                            <p className="text-sm font-medium">{item.content}</p>
                            <p className="text-[10px] text-muted-foreground uppercase font-bold">{item.authorName} • {format(item.timestamp.toDate(), 'dd MMM HH:mm')}</p>
                          </div>
                        </div>
                      ))}
                   </div>
                 </CardContent>
               </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
           <Card className="bg-primary text-primary-foreground border-none shadow-lg overflow-hidden">
             <div className="h-1 bg-accent" />
             <CardHeader><CardTitle className="text-lg">Command Center</CardTitle></CardHeader>
             <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-between text-white border-white/20 hover:bg-white/10" asChild>
                  <Link href={`/app/projects/${id}/costing`}>Costing Engine <ChevronRight size={14} /></Link>
                </Button>
                <Button variant="outline" className="w-full justify-between text-white border-white/20 hover:bg-white/10" asChild>
                  <Link href={`/app/projects/${id}/quotation`}>Quotation Builder <ChevronRight size={14} /></Link>
                </Button>
                <Button className="w-full justify-between bg-accent text-accent-foreground hover:bg-accent/90" asChild>
                  <Link href={`/app/projects/${id}/tasks`}>Operational Checklist <ChevronRight size={14} /></Link>
                </Button>
             </CardContent>
           </Card>
           
           <Card>
             <CardHeader><CardTitle className="text-sm">Team Assignments</CardTitle></CardHeader>
             <CardContent className="space-y-3">
               {project.teamAssignments.map((a, i) => (
                 <div key={i} className="flex justify-between items-center text-xs">
                   <span className="font-bold">{a.staffName}</span>
                   <Badge variant="secondary" className="text-[8px] uppercase">{a.role}</Badge>
                 </div>
               ))}
             </CardContent>
           </Card>
        </div>
      </div>
      <EditProjectModal project={project} open={isEditModalOpen} onOpenChange={setIsEditModalOpen} />
    </div>
  );
}
