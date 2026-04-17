
"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  Briefcase, 
  DollarSign, 
  Download,
  Calendar,
  Filter,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const PERFORMANCE_DATA = [
  { month: 'Jan', revenue: 45000, projects: 12 },
  { month: 'Feb', revenue: 52000, projects: 15 },
  { month: 'Mar', revenue: 48000, projects: 10 },
  { month: 'Apr', revenue: 61000, projects: 18 },
  { month: 'May', revenue: 55000, projects: 14 },
  { month: 'Jun', revenue: 67000, projects: 22 },
];

const CATEGORY_DATA = [
  { name: 'Custom Tours', value: 40, color: '#2D5A69' },
  { name: 'Corporate', value: 30, color: '#61CCB3' },
  { name: 'Educational', value: 20, color: '#FFA500' },
  { name: 'Transport', value: 10, color: '#94a3b8' },
];

export default function ReportsPage() {
  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">Business Insights</h1>
          <p className="text-muted-foreground">Strategic reporting and performance analysis.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Filter size={14} /> Filter Period
          </Button>
          <Button size="sm" className="gap-2 bg-primary text-primary-foreground">
            <Download size={14} /> Export Report
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Total Revenue" value="$328,000" subValue="+12.5% vs last qtr" icon={DollarSign} />
        <StatsCard title="Active Projects" value="84" subValue="14 new this month" icon={Briefcase} />
        <StatsCard title="Client Satisfaction" value="4.8/5" subValue="Based on 156 reviews" icon={Users} />
        <StatsCard title="Avg Project Cycle" value="22 Days" subValue="-2 days improvement" icon={Calendar} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Revenue vs Projects Trend</CardTitle>
            <CardDescription>Monthly performance overview</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={PERFORMANCE_DATA}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `$${val/1000}k`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                />
                <Bar dataKey="revenue" fill="#2D5A69" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Project Distribution</CardTitle>
            <CardDescription>Volume by category</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center">
             <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={CATEGORY_DATA}
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {CATEGORY_DATA.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
             </ResponsiveContainer>
             <div className="space-y-2 min-w-[140px]">
               {CATEGORY_DATA.map(item => (
                 <div key={item.name} className="flex items-center gap-2">
                   <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                   <span className="text-xs font-medium">{item.name}</span>
                 </div>
               ))}
             </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Scheduled Reports</CardTitle>
          <CardDescription>Automated operational summaries sent to management.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {[
              { name: 'Weekly Operational Health', freq: 'Every Monday', recipients: '3 Admins' },
              { name: 'Monthly Financial Summary', freq: '1st of Month', recipients: 'Financial Lead' },
              { name: 'Quarterly Supplier Audit', freq: 'Every Quarter', recipients: 'Procurement Team' }
            ].map((report, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 px-6 hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/5 text-primary rounded-lg">
                    <FileText size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold">{report.name}</p>
                    <p className="text-xs text-muted-foreground">{report.freq} • {report.recipients}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm">Edit Schedule</Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatsCard({ title, value, subValue, icon: Icon }: any) {
  return (
    <Card className="border-none shadow-sm bg-white">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{title}</CardTitle>
        <div className="p-2 bg-muted/50 text-primary rounded-lg">
          <Icon size={16} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold mb-1">{value}</div>
        <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-tighter">{subValue}</p>
      </CardContent>
    </Card>
  );
}
