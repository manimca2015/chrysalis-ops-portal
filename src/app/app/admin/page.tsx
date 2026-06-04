
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
  Save
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
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">System Administration</h1>
        <p className="text-muted-foreground">Manage templates, monitor audit logs, and control staff access.</p>
      </div>

      <Tabs defaultValue="audit" className="space-y-4">
        <TabsList className="bg-white/50 p-1">
          <TabsTrigger value="audit" className="gap-2"><Terminal size={14} /> Audit Trail</TabsTrigger>
          <TabsTrigger value="templates" className="gap-2"><Settings2 size={14} /> Templates</TabsTrigger>
          <TabsTrigger value="staff" className="gap-2"><Users size={14} /> Staff Access</TabsTrigger>
        </TabsList>

        <TabsContent value="audit">
           <div className="grid gap-6 md:grid-cols-3 mb-6">
              <Card className="bg-white border-none shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs uppercase font-bold tracking-widest text-muted-foreground flex items-center gap-2">
                    <ShieldAlert size={14} className="text-destructive" /> Critical Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-black text-destructive">{criticalEvents.length}</div>
                </CardContent>
              </Card>
              <Card className="bg-white border-none shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs uppercase font-bold tracking-widest text-muted-foreground flex items-center gap-2">
                    <AlertTriangle size={14} className="text-orange-500" /> Anomalies
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-black text-orange-500">{warningEvents.length}</div>
                </CardContent>
              </Card>
              <Card className="bg-white border-none shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs uppercase font-bold tracking-widest text-muted-foreground flex items-center gap-2">
                    <Activity size={14} className="text-primary" /> Total Logs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-black text-primary">{logs?.length || 0}</div>
                </CardContent>
              </Card>
            </div>

          <Card className="border-none shadow-sm overflow-hidden bg-white">
            <CardHeader>
              <CardTitle className="text-lg">Immutable Operations Log</CardTitle>
              <CardDescription>Real-time stream of administrative and security events.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead>Event</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>Initiated By</TableHead>
                    <TableHead>Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logsLoading ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8">Loading logs...</TableCell></TableRow>
                  ) : logs?.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground italic">No audit records found.</TableCell></TableRow>
                  ) : logs?.map((log) => (
                    <TableRow key={log.id} className="text-xs">
                      <TableCell className="font-bold uppercase tracking-tighter">
                        {log.event.replace('_', ' ')}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={log.severity === 'critical' ? 'destructive' : log.severity === 'warning' ? 'secondary' : 'outline'}
                          className="text-[8px] h-4"
                        >
                          {log.severity}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[300px] truncate font-medium text-muted-foreground">
                        {log.details}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold">{log.userName}</span>
                          <span className="text-[10px] text-muted-foreground">UID: {log.userId.slice(0, 8)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {log.timestamp ? format(log.timestamp.toDate(), 'dd MMM, HH:mm') : '-'}
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
                <CardTitle className="text-lg">Create Template</CardTitle>
                <CardDescription>Add new questionnaire templates by category.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Template Title</Label>
                  <Input value={newTpl.title} onChange={e => setNewTpl({...newTpl, title: e.target.value})} placeholder="e.g. Corporate Incentive Tour" />
                </div>
                <div className="space-y-2">
                  <Label>Category Slug</Label>
                  <Input value={newTpl.category} onChange={e => setNewTpl({...newTpl, category: e.target.value})} placeholder="e.g. corporate, education" />
                  <p className="text-[10px] text-muted-foreground">Use lowercase slugs for matching project categories.</p>
                </div>
                <div className="space-y-2">
                  <Label>Questions</Label>
                  {newTpl.questions.map((q, idx) => (
                    <div key={idx} className="flex gap-2 mb-2">
                      <Input value={q} onChange={e => {
                        const qs = [...newTpl.questions];
                        qs[idx] = e.target.value;
                        setNewTpl({...newTpl, questions: qs});
                      }} placeholder="e.g. What is your estimated budget?" />
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

            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground px-1">Existing Templates</h3>
              {questionnaireTemplates?.length === 0 ? (
                <div className="py-20 text-center bg-white rounded-lg border border-dashed text-muted-foreground">
                   No templates created yet.
                </div>
              ) : questionnaireTemplates?.map(tpl => (
                <Card key={tpl.id} className="bg-white border-none shadow-sm hover:shadow-md transition-shadow">
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
                      {tpl.questions.slice(0, 3).map((q, i) => <li key={i}>{q}</li>)}
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
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary text-lg font-bold">
                      {person.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold">{person.name}</h3>
                      <p className="text-xs text-muted-foreground">{person.email}</p>
                    </div>
                    <Badge variant="outline" className="capitalize text-[10px]">{person.role}</Badge>
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
