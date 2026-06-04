"use client"

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getAuditLogs, 
  getStaffProfiles, 
  getQuestionnaireTemplates, 
  saveQuestionnaireTemplate 
} from '@/services/mgmt-service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { 
  ShieldAlert, 
  Users, 
  AlertTriangle,
  Terminal,
  Activity,
  Settings2,
  FileQuestion,
  Plus,
  Trash2,
  Save,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

export default function AdminSecurityPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { data: logs, isLoading: logsLoading } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: () => getAuditLogs(100),
  });

  const { data: staff } = useQuery({
    queryKey: ['staff'],
    queryFn: getStaffProfiles,
  });

  const { data: questionnaireTemplates } = useQuery({
    queryKey: ['questionnaire-templates'],
    queryFn: getQuestionnaireTemplates,
  });

  // Template Form State
  const [newTpl, setNewTpl] = useState({ title: '', category: 'custom-tour', questions: [''] });

  const addTplMutation = useMutation({
    mutationFn: saveQuestionnaireTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questionnaire-templates'] });
      setNewTpl({ title: '', category: 'custom-tour', questions: [''] });
      toast({ title: 'Template Saved', description: 'Your questionnaire template is ready to use.' });
    }
  });

  const criticalEvents = logs?.filter(l => l.severity === 'critical') || [];
  const warningEvents = logs?.filter(l => l.severity === 'warning') || [];

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">System Administration</h1>
          <p className="text-muted-foreground">Manage system integrity, audit trails, and staff access.</p>
        </div>
        <div className="flex items-center gap-2">
           <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1 h-6">
              <ShieldCheck size={14} /> System Secure
           </Badge>
        </div>
      </div>

      <Tabs defaultValue="audit" className="space-y-4">
        <TabsList className="bg-white/50 p-1">
          <TabsTrigger value="audit" className="gap-2"><Terminal size={14} /> Audit Trail</TabsTrigger>
          <TabsTrigger value="templates" className="gap-2"><Settings2 size={14} /> Templates</TabsTrigger>
          <TabsTrigger value="staff" className="gap-2"><Users size={14} /> Staff Access</TabsTrigger>
        </TabsList>

        <TabsContent value="audit">
           <div className="grid gap-6 md:grid-cols-3 mb-6">
              <Card className="bg-white border-none shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-destructive" />
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs uppercase font-bold tracking-widest text-muted-foreground flex items-center gap-2">
                    <ShieldAlert size={14} className="text-destructive" /> Critical Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-black text-destructive">{criticalEvents.length}</div>
                  <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold">Unauthorized or risky attempts</p>
                </CardContent>
              </Card>
              <Card className="bg-white border-none shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-orange-500" />
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs uppercase font-bold tracking-widest text-muted-foreground flex items-center gap-2">
                    <AlertTriangle size={14} className="text-orange-500" /> System Warnings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-black text-orange-500">{warningEvents.length}</div>
                  <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold">Status jumps & financial overrides</p>
                </CardContent>
              </Card>
              <Card className="bg-white border-none shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs uppercase font-bold tracking-widest text-muted-foreground flex items-center gap-2">
                    <Zap size={14} className="text-primary" /> Operational Logs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-black text-primary">{logs?.length || 0}</div>
                  <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold">Total immutable records</p>
                </CardContent>
              </Card>
            </div>

          <Card className="border-none shadow-sm overflow-hidden bg-white">
            <CardHeader className="border-b bg-muted/20">
              <CardTitle className="text-lg">Immutable Operations Trail</CardTitle>
              <CardDescription>Comprehensive stream of system and security events.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 border-b">
                    <TableHead className="text-[10px] uppercase font-bold">Event</TableHead>
                    <TableHead className="text-[10px] uppercase font-bold">Severity</TableHead>
                    <TableHead className="text-[10px] uppercase font-bold">Details</TableHead>
                    <TableHead className="text-[10px] uppercase font-bold">Staff Member</TableHead>
                    <TableHead className="text-[10px] uppercase font-bold">Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logsLoading ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-12"><Activity className="animate-spin mx-auto text-primary" /></TableCell></TableRow>
                  ) : logs?.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-12 text-muted-foreground italic">No audit records found in the last 100 events.</TableCell></TableRow>
                  ) : logs?.map((log) => (
                    <TableRow key={log.id} className={log.severity === 'critical' ? 'bg-destructive/5' : log.severity === 'warning' ? 'bg-orange-50/50' : ''}>
                      <TableCell className="font-bold uppercase tracking-tighter text-[10px]">
                        {log.event.replace('_', ' ')}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={log.severity === 'critical' ? 'destructive' : log.severity === 'warning' ? 'secondary' : 'outline'}
                          className="text-[8px] h-4 font-black"
                        >
                          {log.severity.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[400px] text-xs font-medium text-foreground/80">
                        {log.details}
                        {log.projectId && <div className="text-[8px] text-muted-foreground mt-0.5">Project: {log.projectId.slice(0, 8)}...</div>}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold text-xs">{log.userName}</span>
                          <span className="text-[9px] text-muted-foreground font-mono">UID: {log.userId.slice(0, 6)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-[10px] font-medium">
                        {log.timestamp ? format(log.timestamp.toDate(), 'dd MMM yyyy, HH:mm') : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-1 border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Template Studio</CardTitle>
                <CardDescription>Design questionnaire sets for staff to use.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Template Title</Label>
                  <Input value={newTpl.title} onChange={e => setNewTpl({...newTpl, title: e.target.value})} placeholder="e.g. Corporate Incentive Tour" />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Input value={newTpl.category} onChange={e => setNewTpl({...newTpl, category: e.target.value})} placeholder="e.g. corporate" />
                </div>
                <div className="space-y-2">
                  <Label>Questions</Label>
                  {newTpl.questions.map((q, idx) => (
                    <div key={idx} className="flex gap-2 mb-2">
                      <Input value={q} onChange={e => {
                        const qs = [...newTpl.questions];
                        qs[idx] = e.target.value;
                        setNewTpl({...newTpl, questions: qs});
                      }} placeholder="Question text..." />
                      <Button variant="ghost" size="icon" onClick={() => setNewTpl({...newTpl, questions: newTpl.questions.filter((_, i) => i !== idx)})}>
                        <Trash2 size={14} className="text-destructive" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" className="w-full gap-2 border-dashed" onClick={() => setNewTpl({...newTpl, questions: [...newTpl.questions, '']})}>
                    <Plus size={14} /> Add Question
                  </Button>
                </div>
                <Button className="w-full gap-2" onClick={() => addTplMutation.mutate(newTpl as any)} disabled={!newTpl.title || addTplMutation.isPending}>
                  <Save size={16} /> Save Template
                </Button>
              </CardContent>
            </Card>

            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 h-fit">
              {questionnaireTemplates?.map(tpl => (
                <Card key={tpl.id} className="bg-white border-none shadow-sm hover:shadow-md transition-shadow h-fit">
                  <CardHeader className="flex flex-row items-center justify-between py-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="text-sm font-bold">{tpl.title}</CardTitle>
                        <Badge variant="secondary" className="text-[8px] h-4 uppercase">{tpl.category}</Badge>
                      </div>
                      <CardDescription className="text-xs">{tpl.questions.length} Questions</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <ul className="text-xs space-y-1 text-muted-foreground list-disc pl-4">
                      {tpl.questions.slice(0, 3).map((q, i) => <li key={i} className="line-clamp-1">{q}</li>)}
                      {tpl.questions.length > 3 && <li className="italic">+ {tpl.questions.length - 3} more</li>}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="staff">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {staff?.map(person => (
              <Card key={person.id} className="shadow-sm border-none bg-white">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary text-lg font-black uppercase">
                      {person.name.charAt(0)}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <h3 className="font-bold truncate">{person.name}</h3>
                      <p className="text-xs text-muted-foreground truncate">{person.email}</p>
                    </div>
                    <Badge variant="outline" className="capitalize text-[8px] font-black h-5">{person.role}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
