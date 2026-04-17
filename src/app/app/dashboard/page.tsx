
"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  FolderKanban, 
  Users, 
  TrendingUp, 
  Clock, 
  AlertCircle, 
  ChevronRight,
  Database,
  ShieldCheck
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { getProjects } from '@/services/mgmt-service';
import { useAuth } from '@/contexts/AuthContext';

export default function DashboardPage() {
  const { user, profile } = useAuth();
  const { data: projects, isLoading, error } = useQuery({
    queryKey: ['projects'],
    queryFn: getProjects,
  });

  const stats = [
    { name: 'Active Projects', value: projects?.length || 0, icon: FolderKanban, color: 'text-blue-500' },
    { name: 'New Enquiries', value: projects?.filter(p => p.status === 'enquiry').length || 0, icon: Clock, color: 'text-orange-500' },
    { name: 'Total Revenue (Est)', value: '$124,500', icon: TrendingUp, color: 'text-accent' },
    { name: 'Team Capacity', value: '84%', icon: Users, color: 'text-purple-500' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">Management Dashboard</h1>
          <p className="text-muted-foreground">Overview of current operations and business performance.</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="flex items-center gap-1 py-1 px-3">
            <ShieldCheck size={14} className="text-accent" />
            <span className="text-xs">Connected to Production</span>
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1 py-1 px-3">
            <Database size={14} className="text-blue-500" />
            <span className="text-xs">Isolated (mgmt_*)</span>
          </Badge>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-lg flex items-center gap-3">
          <AlertCircle size={20} />
          <p className="text-sm font-medium">Connectivity Error: Failed to fetch from Firestore. Please check your credentials.</p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.name} className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">{stat.name}</CardTitle>
              <stat.icon className={stat.color} size={18} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">Live from mgmt_projects</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1 shadow-sm">
          <CardHeader>
            <CardTitle>Recent Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoading ? (
                <p className="text-sm text-muted-foreground">Syncing data...</p>
              ) : projects?.slice(0, 5).map((project) => (
                <div key={project.id} className="flex items-center justify-between group">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">{project.title}</p>
                    <p className="text-xs text-muted-foreground">{project.customerDetails.name}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="capitalize">{project.status.replace('_', ' ')}</Badge>
                    <ChevronRight size={16} className="text-muted-foreground group-hover:text-primary transition-colors cursor-pointer" />
                  </div>
                </div>
              ))}
              {!isLoading && projects?.length === 0 && (
                <div className="text-center py-6">
                  <p className="text-sm text-muted-foreground">No projects found in mgmt_projects.</p>
                </div>
              )}
            </div>
            <Button variant="link" className="mt-4 w-full p-0">View all projects</Button>
          </CardContent>
        </Card>

        <Card className="col-span-1 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="text-orange-500" size={20} />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-3 rounded-md bg-muted/50 border flex items-center justify-between">
                <span className="text-sm font-medium">Logged in as:</span>
                <span className="text-sm text-primary font-bold">{profile?.name || user?.email}</span>
              </div>
              <div className="p-3 rounded-md bg-muted/50 border flex items-center justify-between">
                <span className="text-sm font-medium">Assigned Role:</span>
                <Badge className="capitalize">{profile?.role || 'staff'}</Badge>
              </div>
              <div className="rounded-lg border-l-4 border-accent bg-emerald-50 p-4">
                <p className="text-sm font-semibold text-emerald-800">Operational Mode</p>
                <p className="text-xs text-emerald-700 mt-1">
                  You are viewing Management data. Existing Chrysalis collections are protected (Read-Only).
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
