"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  FolderKanban, 
  Users, 
  TrendingUp, 
  Clock, 
  AlertCircle, 
  ChevronRight 
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { getProjects } from '@/services/mgmt-service';

export default function DashboardPage() {
  const { data: projects, isLoading } = useQuery({
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
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">Management Dashboard</h1>
        <p className="text-muted-foreground">Overview of current operations and business performance.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.name} className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">{stat.name}</CardTitle>
              <stat.icon className={stat.color} size={18} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">+2 from last week</p>
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
                <p>Loading projects...</p>
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
              {projects?.length === 0 && <p className="text-sm text-muted-foreground">No projects found.</p>}
            </div>
            <Button variant="link" className="mt-4 w-full p-0">View all projects</Button>
          </CardContent>
        </Card>

        <Card className="col-span-1 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="text-orange-500" size={20} />
              Actionable Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="rounded-lg border-l-4 border-orange-500 bg-orange-50 p-4">
                <p className="text-sm font-semibold text-orange-800">Delayed Quotations</p>
                <p className="text-xs text-orange-700 mt-1">3 projects have been in 'costing' status for over 48 hours.</p>
              </div>
              <div className="rounded-lg border-l-4 border-accent bg-emerald-50 p-4">
                <p className="text-sm font-semibold text-emerald-800">Approvals Needed</p>
                <p className="text-xs text-emerald-700 mt-1">Senior Staff approval required for 1 low-margin quotation.</p>
              </div>
              <div className="rounded-lg border-l-4 border-blue-500 bg-blue-50 p-4">
                <p className="text-sm font-semibold text-blue-800">Task Deadlines</p>
                <p className="text-xs text-blue-700 mt-1">5 tasks are due today across your assigned projects.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}