
"use client"

import React, { use, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getProjectTasks, 
  createTask, 
  updateTask, 
  getProjectById,
  getStaffProfiles,
  getTaskTemplates,
  applyTaskTemplateToProject
} from '@/services/mgmt-service';
import { Task, SubTask, TaskTemplate } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogTrigger
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Plus, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft,
  User,
  MoreVertical,
  ChevronRight,
  MessageSquare,
  Workflow,
  Zap,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function ProjectTasksPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isAdding, setIsAdding] = useState(false);
  const [isApplyingTemplate, setIsApplyingTemplate] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    assignedToId: '',
  });

  const { data: project } = useQuery({
    queryKey: ['project', id],
    queryFn: () => getProjectById(id),
  });

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['tasks', id],
    queryFn: () => getProjectTasks(id),
  });

  const { data: staff } = useQuery({
    queryKey: ['staff'],
    queryFn: getStaffProfiles,
  });

  const { data: templates } = useQuery({
    queryKey: ['task-templates'],
    queryFn: getTaskTemplates
  });

  const createTaskMutation = useMutation({
    mutationFn: (data: any) => createTask({
      ...data,
      projectId: id,
      status: 'pending',
      subTasks: [],
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', id] });
      setIsAdding(false);
      setFormData({ title: '', priority: 'medium', assignedToId: '' });
      toast({ title: 'Task Created' });
    }
  });

  const applyTemplateMutation = useMutation({
    mutationFn: () => applyTaskTemplateToProject(id, selectedTemplateId, user?.uid || 'system', user?.email || 'System'),
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', id] });
      queryClient.invalidateQueries({ queryKey: ['project-activity', id] });
      setIsApplyingTemplate(false);
      setSelectedTemplateId('');
      toast({ title: 'Template Applied', description: `Successfully added ${count} standard tasks.` });
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ taskId, status }: { taskId: string, status: any }) => 
      updateTask(taskId, { status }, user?.uid || 'system', user?.email || 'System'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', id] });
      toast({ title: 'Task Updated' });
    }
  });

  if (!project) return null;

  const pendingTasks = tasks?.filter(t => t.status === 'pending') || [];
  const verificationTasks = tasks?.filter(t => t.status === 'ready_for_verification') || [];
  const completedTasks = tasks?.filter(t => t.status === 'completed') || [];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/app/projects/${id}`}><ArrowLeft size={18} /></Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-headline">Project Checklist</h1>
            <p className="text-muted-foreground">{project.title}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Dialog open={isApplyingTemplate} onOpenChange={setIsApplyingTemplate}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2 border-accent text-accent hover:bg-accent/5">
                <Workflow size={16} /> Apply Template
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Apply Task Template</DialogTitle>
                <DialogDescription>Choose a pre-defined checklist to populate your project tasks.</DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-4">
                <div className="space-y-2">
                  <Label>Standard Template</Label>
                  <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                    <SelectTrigger><SelectValue placeholder="Select a template..." /></SelectTrigger>
                    <SelectContent>
                      {templates?.map(tpl => (
                        <SelectItem key={tpl.id} value={tpl.id}>{tpl.title} ({tpl.tasks.length} tasks)</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {selectedTemplateId && (
                   <div className="p-3 bg-muted/30 rounded-md border space-y-2">
                      <p className="text-[10px] font-bold uppercase text-muted-foreground">Preview Tasks</p>
                      <ul className="text-xs space-y-1">
                        {templates?.find(t => t.id === selectedTemplateId)?.tasks.map((t, i) => (
                          <li key={i} className="flex items-center gap-2">
                            <Zap size={10} className="text-accent" /> {t.title}
                          </li>
                        ))}
                      </ul>
                   </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsApplyingTemplate(false)}>Cancel</Button>
                <Button onClick={() => applyTemplateMutation.mutate()} disabled={!selectedTemplateId || applyTemplateMutation.isPending}>
                  {applyTemplateMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : "Populate Checklist"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isAdding} onOpenChange={setIsAdding}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus size={16} /> Add Task
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New Task</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Task Title</Label>
                  <Input 
                    placeholder="What needs to be done?" 
                    value={formData.title} 
                    onChange={e => setFormData({...formData, title: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select 
                      value={formData.priority} 
                      onValueChange={v => setFormData({...formData, priority: v as any})}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Assign To</Label>
                    <Select 
                      value={formData.assignedToId} 
                      onValueChange={v => setFormData({...formData, assignedToId: v})}
                    >
                      <SelectTrigger><SelectValue placeholder="Select staff..." /></SelectTrigger>
                      <SelectContent>
                        {staff?.map(s => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAdding(false)}>Cancel</Button>
                <Button onClick={() => createTaskMutation.mutate({
                  ...formData,
                  assignedToName: staff?.find(s => s.id === formData.assignedToId)?.name
                })}>Create Task</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Column: Pending */}
        <TaskColumn 
          title="To Do" 
          tasks={pendingTasks} 
          onStatusChange={(taskId, status) => updateStatusMutation.mutate({ taskId, status })}
        />
        
        {/* Column: In Verification */}
        <TaskColumn 
          title="In Verification" 
          tasks={verificationTasks} 
          onStatusChange={(taskId, status) => updateStatusMutation.mutate({ taskId, status })}
          isVerification
        />

        {/* Column: Completed */}
        <TaskColumn 
          title="Completed" 
          tasks={completedTasks} 
          onStatusChange={(taskId, status) => updateStatusMutation.mutate({ taskId, status })}
        />
      </div>
    </div>
  );
}

function TaskColumn({ 
  title, 
  tasks, 
  onStatusChange, 
  isVerification = false 
}: { 
  title: string, 
  tasks: Task[], 
  onStatusChange: (id: string, status: string) => void,
  isVerification?: boolean
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          {title} <Badge variant="secondary" className="rounded-full px-2 py-0 h-5">{tasks.length}</Badge>
        </h3>
      </div>

      <div className="space-y-3">
        {tasks.map(task => (
          <Card key={task.id} className="shadow-sm hover:shadow-md transition-shadow group">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <PriorityBadge priority={task.priority} />
                    <span className="text-sm font-semibold">{task.title}</span>
                  </div>
                  {task.assignedToName && (
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <User size={10} /> {task.assignedToName}
                    </div>
                  )}
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100">
                  <MoreVertical size={14} />
                </Button>
              </div>

              {task.subTasks?.length > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>Sub-tasks</span>
                    <span>{task.subTasks.filter(s => s.isCompleted).length}/{task.subTasks.length}</span>
                  </div>
                  <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all" 
                      style={{ width: `${(task.subTasks.filter(s => s.isCompleted).length / task.subTasks.length) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t mt-2">
                <div className="flex items-center gap-3">
                   <Button variant="ghost" size="icon" className="h-7 w-7">
                      <MessageSquare size={14} className="text-muted-foreground" />
                   </Button>
                </div>
                
                {task.status === 'pending' && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="h-7 text-[10px] gap-1"
                    onClick={() => onStatusChange(task.id, 'ready_for_verification')}
                  >
                    Submit <ChevronRight size={12} />
                  </Button>
                )}

                {task.status === 'ready_for_verification' && (
                  <div className="flex gap-1">
                    <Button 
                      size="sm" 
                      variant="default" 
                      className="h-7 text-[10px] bg-emerald-600 hover:bg-emerald-700 gap-1"
                      onClick={() => onStatusChange(task.id, 'completed')}
                    >
                      <CheckCircle2 size={12} /> Approve
                    </Button>
                  </div>
                )}

                {task.status === 'completed' && (
                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 h-6 text-[10px] gap-1">
                    <CheckCircle2 size={10} /> DONE
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {tasks.length === 0 && (
          <div className="text-center py-8 border-2 border-dashed rounded-lg bg-muted/20">
            <p className="text-xs text-muted-foreground italic">No tasks in this column.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const variants = {
    high: 'bg-red-50 text-red-700 border-red-200',
    medium: 'bg-orange-50 text-orange-700 border-orange-200',
    low: 'bg-blue-50 text-blue-700 border-blue-200'
  };
  return (
    <Badge variant="outline" className={`h-4 text-[8px] uppercase font-bold tracking-tighter ${variants[priority as keyof typeof variants]}`}>
      {priority}
    </Badge>
  );
}
