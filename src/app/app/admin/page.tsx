
"use client"

import { useQuery } from '@tanstack/react-query';
import { getAuditLogs, getStaffProfiles } from '@/services/mgmt-service';
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
import { 
  ShieldAlert, 
  ShieldCheck, 
  History, 
  Users, 
  Lock, 
  AlertTriangle,
  FileText,
  Activity,
  Terminal
} from 'lucide-react';
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function AdminSecurityPage() {
  const { data: logs, isLoading: logsLoading } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: () => getAuditLogs(100),
  });

  const { data: staff } = useQuery({
    queryKey: ['staff'],
    queryFn: getStaffProfiles,
  });

  const criticalEvents = logs?.filter(l => l.severity === 'critical') || [];
  const warningEvents = logs?.filter(l => l.severity === 'warning') || [];

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">Security & Administration</h1>
        <p className="text-muted-foreground">Immutable audit logs and system monitoring.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="bg-white border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase font-bold tracking-widest text-muted-foreground flex items-center gap-2">
              <ShieldAlert size={14} className="text-destructive" /> Critical Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-destructive">{criticalEvents.length}</div>
            <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold">Requiring immediate audit</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase font-bold tracking-widest text-muted-foreground flex items-center gap-2">
              <AlertTriangle size={14} className="text-orange-500" /> Anomalies Flagged
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-orange-500">{warningEvents.length}</div>
            <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold">Operational irregularities detected</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase font-bold tracking-widest text-muted-foreground flex items-center gap-2">
              <Users size={14} className="text-primary" /> Active Staff
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-primary">{staff?.length || 0}</div>
            <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold">Authorized portal users</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="audit" className="space-y-4">
        <TabsList className="bg-white/50 p-1">
          <TabsTrigger value="audit" className="gap-2"><Terminal size={14} /> System Audit Trail</TabsTrigger>
          <TabsTrigger value="staff" className="gap-2"><Users size={14} /> Staff Access Control</TabsTrigger>
        </TabsList>

        <TabsContent value="audit">
          <Card className="border-none shadow-sm overflow-hidden bg-white">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Immutable Operations Log</CardTitle>
                <CardDescription>Real-time stream of administrative and security events.</CardDescription>
              </div>
              <Badge variant="outline" className="gap-1 bg-primary/5">
                <Activity size={12} /> Live Monitoring
              </Badge>
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
                          <span className="text-[10px] text-muted-foreground opacity-70">UID: {log.userId.slice(0, 8)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {log.timestamp ? format(log.timestamp.toDate(), 'dd MMM, HH:mm:ss') : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="staff">
          <div className="grid gap-4 md:grid-cols-2">
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
                    <Badge variant="outline" className="capitalize">{person.role}</Badge>
                  </div>
                  <div className="mt-4 pt-4 border-t flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    <span>Joined: {person.createdAt ? format(person.createdAt.toDate(), 'dd MMM yyyy') : '-'}</span>
                    <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100">AUTHORIZED</Badge>
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
