"use client"

import React, { use, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getProjectById, 
  updateProjectStatus, 
  getProjectActivity, 
  getProjectTasks,
  cloneProject,
  getDocuments
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
  MessageSquarePlus,
  Download,
  FileIcon,
  Sparkles,
  Loader2,
  Lightbulb,
  Edit3
} from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { QuestionnaireModal } from '@/components/projects/questionnaire-modal';
import { EditProjectModal } from '@/components/projects/edit-project-modal';

const STATUS_STEPS: ProjectStatus[] = [
  'enquiry',
  'costing',
  'quotation_sent',
  'confirmed',
  'in_progress',
  'completed'
];

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [aiInsight, setAiInsight] = useState<ProjectIntelligenceOutput | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

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

  const statusMutation = useMutation({
    mutationFn: (status: ProjectStatus) => 
      updateProjectStatus(id, status, user?.uid || 'unknown', user?.email || 'System'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      queryClient.invalidateQueries({ queryKey: ['project-activity', id] });
      toast({ title: 'Status Updated' });
    }
  });

  const cloneMutation = useMutation({
    mutationFn: () => cloneProject(id, user?.uid || 'system', user?.email || 'System'),
    onSuccess: (newId) => {
      toast({ title: 'Project Cloned', description: 'Redirecting to the new project...' });
      router.push(`/app/projects/${newId}`);
    }
  });

  const aiInsightMutation = useMutation({
    mutationFn: (type: 'itinerary' | 'summary') => generateProjectInsights({
      type,
      projectTitle: project!.title,
      category: project!.category,
      notes: project!.notes || 'No notes provided.'
    }),
    onMutate: () => {
      toast({ title: 'AI Assistant', description: 'Generating intelligence report...' });
    },
    onSuccess: (data) => {
      setAiInsight(data);
      toast({ title: 'Report Ready', description: 'Check the overview tab for your AI insights.' });
    },
    onError: (err: any) => {
      toast({ variant: 'destructive', title: 'AI Error', description: err.message });
    }
  });

  if (projectLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-1/3" />
        <div className="grid grid-cols-3 gap-6">
          <Skeleton className="h-48 col-span-2" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  if (!project) return <div className="p-8 text-center">Project not found.</div>;

  const currentStatusIndex = STATUS_STEPS.indexOf(project.status);
  const taskProgress = tasks ? (tasks.filter(t => t.status === 'completed').length / (tasks.length || 1)) * 100 : 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
              {project.category.replace('-', ' ').toUpperCase()}
            </Badge>
            <span className="text-sm text-muted-foreground">ID: {project.id}</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">{project.title}</h1>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="gap-2" onClick={() => setIsEditModalOpen(true)}>
            <Edit3 size={14} /> Edit Details
          </Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => cloneMutation.mutate()} disabled={cloneMutation.isPending}>
            <Copy size={14} /> Clone Project
          </Button>
          <Select 
            value={project.status} 
            onValueChange={(val) => statusMutation.mutate(val as ProjectStatus)}
            disabled={statusMutation.isPending}
          >
            <SelectTrigger className="w-[180px] bg-white">
              <SelectValue placeholder="Update Status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_STEPS.map(s => (
                <SelectItem key={s} value={s}>{s.replace('_', ' ').toUpperCase()}</SelectItem>
              ))}
              <SelectItem value="archived">ARCHIVED</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="border-none shadow-sm bg-white overflow-hidden">
        <CardContent className="p-6">
          <div className="relative flex justify-between items-center w-full">
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-muted -translate-y-1/2 z-0" />
            <div 
              className="absolute top-1/2 left-0 h-0.5 bg-accent -translate-y-1/2 z-0 transition-all duration-500"
              style={{ width: `${(currentStatusIndex / (STATUS_STEPS.length - 1)) * 100}%` }}
            />
            {STATUS_STEPS.map((step, idx) => {
              const isCompleted = idx < currentStatusIndex;
              const isCurrent = idx === currentStatusIndex;
              return (
                <div key={step} className="relative z-10 flex flex-col items-center gap-2 bg-white px-2">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                    isCompleted ? 'bg-accent border-accent text-white' : 
                    isCurrent ? 'border-accent bg-white text-accent ring-4 ring-accent/10' : 
                    'bg-white border-muted text-muted-foreground'
                  }`}>
                    {isCompleted ? <CheckCircle2 size={16} /> : <span>{idx + 1}</span>}
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${
                    isCurrent ? 'text-accent' : 'text-muted-foreground'
                  }`}>
                    {step.replace('_', '\n')}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="bg-muted/50 p-1">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="team">Team Assignments</TabsTrigger>
              <TabsTrigger value="activity">Activity Log</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {aiInsight && (
                <Card className="border-accent/30 bg-accent/5 shadow-sm relative overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
                  <div className="absolute top-0 right-0 p-4">
                    <Button variant="ghost" size="icon" onClick={() => setAiInsight(null)} className="h-6 w-6">
                      <ChevronRight className="rotate-90" size={14} />
                    </Button>
                  </div>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2 text-accent-foreground">
                      <Sparkles size={16} /> Chrysalis AI Insight
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="prose prose-sm max-w-none text-xs leading-relaxed whitespace-pre-wrap">
                      {aiInsight.content}
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-accent/20">
                      <div>
                        <p className="text-[10px] font-bold uppercase text-accent-foreground mb-1">Key Takeaways</p>
                        <ul className="text-[10px] space-y-1 list-disc pl-4 text-muted-foreground">
                          {aiInsight.keyTakeaways.map((k, i) => <li key={i} className="line-clamp-2">{k}</li>)}
                        </ul>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase text-accent-foreground mb-1">Suggested Actions</p>
                        <ul className="text-[10px] space-y-1 list-disc pl-4 text-muted-foreground">
                          {aiInsight.suggestedActions.map((s, i) => <li key={i} className="line-clamp-2">{s}</li>)}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Clock className="text-primary" size={16} /> Customer Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold">
                        {project.customerDetails.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold">{project.customerDetails.name}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Mail size={12} /> {project.customerDetails.email}
                        </p>
                        {project.customerDetails.phone && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock size={12} /> {project.customerDetails.phone}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                       <ListTodo className="text-primary" size={16} /> Task Progress
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-bold">
                        <span>Overall Checklist</span>
                        <span>{Math.round(taskProgress)}%</span>
                      </div>
                      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-accent" style={{ width: `${taskProgress}%` }} />
                      </div>
                    </div>
                    <Button variant="link" className="p-0 h-auto text-xs" asChild>
                      <Link href={`/app/projects/${id}/tasks`}>View full checklist</Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-sm">Enquiry Notes</CardTitle>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 gap-2 text-accent"
                    onClick={() => aiInsightMutation.mutate('summary')}
                    disabled={aiInsightMutation.isPending}
                  >
                    {aiInsightMutation.isPending ? <Loader2 className="animate-spin h-3 w-3" /> : <Sparkles size={12} />}
                    Summarize AI
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {project.notes || 'No project notes available.'}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documents">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Project Document Hub</CardTitle>
                  <CardDescription>Central repository for contracts, invoices, and client files.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {!documents || documents.length === 0 ? (
                      <div className="p-12 text-center text-muted-foreground text-sm flex flex-col items-center">
                        <FileText size={40} className="mb-2 opacity-20" />
                        No documents recorded for this project.
                      </div>
                    ) : (
                      documents.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between p-4 px-6 hover:bg-muted/30 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/5 text-primary rounded">
                              <FileIcon size={18} />
                            </div>
                            <div>
                              <p className="text-sm font-bold">{doc.title}</p>
                              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">{doc.type.replace('_', ' ')} • {format(doc.createdAt.toDate(), 'dd MMM yyyy')}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[9px] font-bold h-5">{doc.status}</Badge>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                               <Download size={16} className="text-primary" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="team">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Project Team</CardTitle>
                  <CardDescription>Assign roles for this specific project.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {project.teamAssignments?.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground text-sm">
                        No team members assigned yet.
                      </div>
                    ) : (
                      project.teamAssignments.map((assignment, idx) => (
                        <div key={idx} className="flex items-center justify-between p-4 px-6 hover:bg-muted/30 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                              {assignment.staffName.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-bold">{assignment.staffName}</p>
                              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">{assignment.role}</p>
                            </div>
                          </div>
                          <Badge variant="secondary" className="text-[10px]">ACTIVE</Badge>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <History size={20} className="text-primary" /> Activity Stream
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {activitiesLoading ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">Loading history...</div>
                    ) : activities?.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground text-sm">No activity recorded.</div>
                    ) : (
                      activities?.map((item) => (
                        <div key={item.id} className={`p-4 px-6 flex gap-4 ${item.isAnomaly ? 'bg-orange-50/50' : ''}`}>
                          <div className="mt-1">
                            {item.isAnomaly ? <AlertTriangle size={16} className="text-orange-500" /> : 
                             item.type === 'status_change' ? <Clock size={16} className="text-blue-500" /> : 
                             item.type === 'assignment' ? <UsersIcon size={16} className="text-purple-500" /> : 
                             item.type === 'task_update' ? <ListTodo size={16} className="text-orange-500" /> :
                             item.type === 'questionnaire_sent' ? <MessageSquarePlus size={16} className="text-accent" /> :
                             <Info size={16} className="text-muted-foreground" />}
                          </div>
                          <div className="space-y-1">
                            <div className="text-sm font-medium">
                              {item.content}
                              {item.isAnomaly && <Badge className="ml-2 bg-orange-100 text-orange-700 hover:bg-orange-100 border-none h-4 text-[8px]">ANOMALY</Badge>}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span className="font-bold text-foreground/80">{item.authorName}</span>
                              <span>•</span>
                              <span>{item.timestamp ? format(item.timestamp.toDate(), 'dd MMM, HH:mm') : '-'}</span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <Card className="shadow-md border-none overflow-hidden">
            <div className="h-2 bg-accent" />
            <CardHeader>
              <CardTitle className="text-lg">Command Center</CardTitle>
              <CardDescription>Lifecycle Actions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-between group border-accent/30 bg-accent/5 hover:bg-accent/10"
                onClick={() => aiInsightMutation.mutate('itinerary')}
                disabled={aiInsightMutation.isPending}
              >
                <span className="flex items-center gap-2">
                  {aiInsightMutation.isPending ? <Loader2 className="animate-spin h-4 w-4" /> : <Sparkles className="text-accent" size={14} />}
                  AI Itinerary Draft
                </span>
                <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Button>
              <QuestionnaireModal project={project} />
              
              <Button variant="outline" className="w-full justify-between group" asChild>
                <Link href={`/app/projects/${id}/costing`}>
                  Costing Engine <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-between group" asChild>
                <Link href={`/app/projects/${id}/quotation`}>
                  Quotation Builder <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button variant="default" className="w-full justify-between group bg-primary text-primary-foreground" asChild>
                <Link href={`/app/projects/${id}/tasks`}>
                  Project Checklist <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <EditProjectModal 
        project={project} 
        open={isEditModalOpen} 
        onOpenChange={setIsEditModalOpen} 
      />
    </div>
  );
}
