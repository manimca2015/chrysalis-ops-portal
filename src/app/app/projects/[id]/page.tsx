
"use client"

import React, { use } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProjectById, updateProjectStatus, getProjectActivity, getStaffProfiles, assignStaffToProject } from '@/services/mgmt-service';
import { ProjectStatus, ProjectAssignment } from '@/types';
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
  UserPlus, 
  CheckCircle2, 
  Clock, 
  Mail, 
  Phone, 
  Calendar,
  History,
  Info,
  Users as UsersIcon,
  ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

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
  const queryClient = useQueryClient();

  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: () => getProjectById(id),
  });

  const { data: activities, isLoading: activitiesLoading } = useQuery({
    queryKey: ['project-activity', id],
    queryFn: () => getProjectActivity(id),
  });

  const { data: staffList } = useQuery({
    queryKey: ['staff'],
    queryFn: getStaffProfiles,
  });

  const statusMutation = useMutation({
    mutationFn: (status: ProjectStatus) => 
      updateProjectStatus(id, status, user?.uid || 'unknown', user?.email || 'System'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      queryClient.invalidateQueries({ queryKey: ['project-activity', id] });
      toast({ title: 'Status Updated', description: 'Project status has been changed successfully.' });
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

  if (!project) {
    return <div className="p-8 text-center">Project not found.</div>;
  }

  const currentStatusIndex = STATUS_STEPS.indexOf(project.status);

  return (
    <div className="space-y-8">
      {/* Header Section */}
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
          <Button variant="default" className="gap-2">
            <Mail size={16} /> Send Email
          </Button>
        </div>
      </div>

      {/* Status Progress Stepper */}
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
        {/* Main Content (Left) */}
        <div className="lg:col-span-2 space-y-8">
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="bg-muted/50 p-1">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="details">Project Details</TabsTrigger>
              <TabsTrigger value="team">Team Assignments</TabsTrigger>
              <TabsTrigger value="activity">Activity Log</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
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
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Phone size={12} /> {project.customerDetails.phone}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Info className="text-primary" size={16} /> Quick Stats
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Created On</span>
                      <span className="font-medium">
                        {project.createdAt ? format(project.createdAt.toDate(), 'dd MMM yyyy') : '-'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Last Updated</span>
                      <span className="font-medium text-accent">
                        {project.updatedAt ? format(project.updatedAt.toDate(), 'dd MMM yyyy HH:mm') : '-'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Assigned Members</span>
                      <span className="font-medium">{project.teamAssignments?.length || 0}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {project.notes && (
                <Card className="mt-6 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-sm">Enquiry Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                      {project.notes}
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="team">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Project Team</CardTitle>
                    <CardDescription>Assign roles for this specific project.</CardDescription>
                  </div>
                  <Button size="sm" variant="outline" className="gap-2">
                    <UserPlus size={16} /> Manage Team
                  </Button>
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
                        <div key={item.id} className="p-4 px-6 flex gap-4">
                          <div className="mt-1">
                            {item.type === 'status_change' ? <Clock size={16} className="text-blue-500" /> : 
                             item.type === 'assignment' ? <UsersIcon size={16} className="text-purple-500" /> : 
                             <Info size={16} className="text-muted-foreground" />}
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-medium">{item.content}</p>
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

        {/* Sidebar Content (Right) */}
        <div className="space-y-6">
          <Card className="shadow-md border-none overflow-hidden">
            <div className="h-2 bg-accent" />
            <CardHeader>
              <CardTitle className="text-lg">Next Steps</CardTitle>
              <CardDescription>Required actions for current phase</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-between group" asChild>
                <a href={`/app/projects/${id}/costing`}>
                  Prepare Costing Options <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </a>
              </Button>
              <Button variant="outline" className="w-full justify-between group">
                Review Checklist <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm">External Reference</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-muted/50 rounded-md">
                <p className="text-xs text-muted-foreground mb-1">Chrysalis Booking Link</p>
                {project.chrysalisBookingId ? (
                  <Button variant="link" className="p-0 h-auto text-sm">View Linked Booking</Button>
                ) : (
                  <p className="text-sm font-medium">Not Linked</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
