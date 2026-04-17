
"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  FolderKanban, 
  Users, 
  TrendingUp, 
  Clock, 
  AlertCircle, 
  ChevronRight,
  Database,
  ShieldCheck,
  Zap,
  ArrowUpRight,
  DollarSign
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { getProjects, getLowMarginSets } from '@/services/mgmt-service';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

export default function DashboardPage() {
  const { user, profile } = useAuth();
  
  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: getProjects,
  });

  const { data: lowMarginSets } = useQuery({
    queryKey: ['low-margin-insights'],
    queryFn: getLowMarginSets,
  });

  const activeProjects = projects?.filter(p => p.status !== 'completed' && p.status !== 'archived') || [];
  const enquiries = projects?.filter(p => p.status === 'enquiry') || [];
  
  const stats = [
    { name: 'Active Projects', value: activeProjects.length, icon: FolderKanban, color: 'text-blue-500', trend: '+12%' },
    { name: 'New Enquiries', value: enquiries.length, icon: Clock, color: 'text-orange-500', trend: '+5%' },
    { name: 'Total Revenue (Est)', value: '$124.5k', icon: DollarSign, color: 'text-emerald-500', trend: '+18%' },
    { name: 'Avg Margin', value: '22.4%', icon: TrendingUp, color: 'text-accent', trend: '-2%' },
  ];

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">Operations Hub</h1>
          <p className="text-muted-foreground">Welcome back, {profile?.name || 'Staff'}. Here's what needs attention today.</p>
        </div>
        <div className="flex items-center gap-3">
           <Button variant="outline" className="gap-2" asChild>
              <Link href="/app/projects">
                <FolderKanban size={16} /> All Projects
              </Link>
           </Button>
           <Button className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90" asChild>
              <Link href="/app/projects?action=new">
                <Zap size={16} /> New Project
              </Link>
           </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.name} className="shadow-sm border-none bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{stat.name}</CardTitle>
              <div className={`p-2 rounded-lg bg-muted/50 ${stat.color}`}>
                <stat.icon size={16} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className={`text-xs font-bold flex items-center gap-0.5 ${stat.trend.startsWith('+') ? 'text-emerald-500' : 'text-destructive'}`}>
                  {stat.trend} <ArrowUpRight size={10} className={stat.trend.startsWith('+') ? '' : 'rotate-90'} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Actionable Insights Panel */}
        <Card className="md:col-span-2 shadow-md border-none">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="text-accent" size={20} /> Actionable Insights
              </CardTitle>
              <CardDescription>Auto-flagged items requiring management review.</CardDescription>
            </div>
            <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20">
              {lowMarginSets?.length || 0} Alerts
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            {lowMarginSets && lowMarginSets.length > 0 ? (
              lowMarginSets.map(set => (
                <div key={set.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-transparent hover:border-accent/30 transition-all group">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 p-1.5 bg-destructive/10 text-destructive rounded-full">
                      <AlertCircle size={14} />
                    </div>
                    <div>
                      <p className="text-sm font-bold">Low Margin Warning: {set.name}</p>
                      <p className="text-xs text-muted-foreground">Margin is at {set.marginPercent.toFixed(1)}% (Threshold: 15%)</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="gap-1 opacity-0 group-hover:opacity-100 transition-opacity" asChild>
                    <Link href={`/app/projects/${set.projectId}/costing`}>
                      Review <ChevronRight size={14} />
                    </Link>
                  </Button>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Zap size={32} className="text-muted-foreground mb-2 opacity-20" />
                <p className="text-sm text-muted-foreground">All systems operational. No critical insights at this time.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Recent Activity / Recent Projects */}
        <Card className="shadow-sm border-none bg-white">
          <CardHeader>
            <CardTitle className="text-lg">Recent Projects</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {projectsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <div key={i} className="h-12 bg-muted animate-pulse rounded" />)}
              </div>
            ) : projects?.slice(0, 5).map(project => (
              <div key={project.id} className="flex items-center justify-between group">
                <div className="space-y-0.5">
                  <p className="text-sm font-bold leading-none">{project.title}</p>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">{project.status.replace('_', ' ')}</p>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                  <Link href={`/app/projects/${project.id}`}><ChevronRight size={16} /></Link>
                </Button>
              </div>
            ))}
            <Button variant="link" className="w-full text-xs text-primary" asChild>
              <Link href="/app/projects">View All Projects</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
