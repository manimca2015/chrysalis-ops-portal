"use client"

import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getProjects, getAllCostingSets } from '@/services/mgmt-service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { 
  Briefcase, 
  DollarSign, 
  Download,
  Calendar,
  Filter,
  FileText,
  Loader2,
  TrendingUp,
  PieChart as PieChartIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format, startOfMonth, endOfMonth, isWithinInterval, subMonths } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function ReportsPage() {
  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: getProjects,
  });

  const { data: costingSets, isLoading: costingLoading } = useQuery({
    queryKey: ['all-costing-sets'],
    queryFn: getAllCostingSets,
  });

  // Derived Analytics
  const analytics = useMemo(() => {
    if (!projects || !costingSets) return null;

    const totalRevenue = costingSets.reduce((sum, set) => sum + set.totalSellingSgd, 0);
    const totalProfit = costingSets.reduce((sum, set) => sum + set.profitSgd, 0);
    const avgMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    const categories: Record<string, number> = {};
    projects.forEach(p => {
      const cat = p.category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
      categories[cat] = (categories[cat] || 0) + 1;
    });

    const categoryData = Object.entries(categories).map(([name, value], idx) => ({
      name,
      value,
      color: ['#2D5A69', '#61CCB3', '#FFA500', '#94a3b8', '#F43F5E'][idx % 5]
    }));

    const now = new Date();
    const performanceData = Array.from({ length: 6 }).map((_, i) => {
      const date = subMonths(now, 5 - i);
      const start = startOfMonth(date);
      const end = endOfMonth(date);
      
      const monthRevenue = costingSets
        .filter(set => {
          const createdAt = set.createdAt?.toDate();
          return createdAt && isWithinInterval(createdAt, { start, end });
        })
        .reduce((sum, set) => sum + set.totalSellingSgd, 0);

      return {
        month: format(date, 'MMM'),
        revenue: monthRevenue,
        projects: projects.filter(p => {
          const createdAt = p.createdAt?.toDate();
          return createdAt && isWithinInterval(createdAt, { start, end });
        }).length
      };
    });

    return {
      totalRevenue,
      totalProfit,
      avgMargin,
      categoryData,
      performanceData,
      totalProjects: projects.length,
      activeProjects: projects.filter(p => !['completed', 'archived'].includes(p.status)).length
    };
  }, [projects, costingSets]);

  const handleExportCSV = () => {
    if (!projects) return;
    
    const headers = ['ID', 'Title', 'Customer', 'Category', 'Status', 'Created At'];
    const rows = projects.map(p => [
      p.id,
      p.title,
      p.customerDetails.name,
      p.category,
      p.status,
      p.createdAt ? format(p.createdAt.toDate(), 'yyyy-MM-dd') : 'N/A'
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `chrysalis_projects_export_${format(new Date(), 'yyyyMMdd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadReport = (reportName: string) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(45, 90, 105);
    doc.text('CHRYSALIS TOURS SINGAPORE', 15, 20);
    
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text(reportName.toUpperCase(), 15, 30);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${format(new Date(), 'dd MMM yyyy, HH:mm')}`, 15, 38);
    
    // Summary Section
    if (analytics) {
      doc.setFontSize(12);
      doc.setTextColor(45, 90, 105);
      doc.text('EXECUTIVE SUMMARY', 15, 55);
      
      autoTable(doc, {
        startY: 60,
        head: [['Metric', 'Value']],
        body: [
          ['Total Portfolio Value', `SGD ${analytics.totalRevenue.toLocaleString()}`],
          ['Net Profit (Est)', `SGD ${analytics.totalProfit.toLocaleString()}`],
          ['Average Margin', `${analytics.avgMargin.toFixed(2)}%`],
          ['Total Projects', analytics.totalProjects.toString()],
          ['Active Projects', analytics.activeProjects.toString()],
        ],
        theme: 'striped',
        headStyles: { fillColor: [45, 90, 105] }
      });
    }

    // Footnote
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Internal Management Report | Page ${i} of ${pageCount}`, 15, 285);
    }

    doc.save(`${reportName.toLowerCase().replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd')}.pdf`);
  };

  if (projectsLoading || costingLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">Business Intelligence</h1>
          <p className="text-muted-foreground">Real-time portfolio performance and financial monitoring.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Filter size={14} /> Filter Period
          </Button>
          <Button size="sm" className="gap-2 bg-primary text-primary-foreground" onClick={handleExportCSV}>
            <Download size={14} /> Export CSV
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard 
          title="Total Portfolio Value" 
          value={`$${(analytics?.totalRevenue || 0).toLocaleString()}`} 
          subValue="Revenue across all scenarios" 
          icon={DollarSign} 
        />
        <StatsCard 
          title="Active Projects" 
          value={analytics?.activeProjects || 0} 
          subValue={`${analytics?.totalProjects} total in database`} 
          icon={Briefcase} 
        />
        <StatsCard 
          title="Net Profit (Est)" 
          value={`$${(analytics?.totalProfit || 0).toLocaleString()}`} 
          subValue="Projected earnings" 
          icon={TrendingUp} 
        />
        <StatsCard 
          title="Avg Margin" 
          value={`${(analytics?.avgMargin || 0).toFixed(1)}%`} 
          subValue="Target: 15%+" 
          icon={PieChartIcon} 
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-none shadow-sm bg-white">
          <CardHeader>
            <CardTitle className="text-lg">Revenue Pipeline</CardTitle>
            <CardDescription>Monthly revenue trends for the last 6 months</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics?.performanceData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `$${(val/1000).toFixed(0)}k`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                />
                <Bar dataKey="revenue" fill="#2D5A69" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white">
          <CardHeader>
            <CardTitle className="text-lg">Project Distribution</CardTitle>
            <CardDescription>Breakdown by service category</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center">
             <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics?.categoryData}
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {analytics?.categoryData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
             </ResponsiveContainer>
             <div className="space-y-2 min-w-[140px]">
               {analytics?.categoryData.map((item: any) => (
                 <div key={item.name} className="flex items-center justify-between gap-2">
                   <div className="flex items-center gap-2">
                     <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                     <span className="text-xs font-medium">{item.name}</span>
                   </div>
                   <span className="text-xs font-bold">{item.value}</span>
                 </div>
               ))}
             </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm bg-white">
        <CardHeader>
          <CardTitle className="text-lg">Recent System Reports</CardTitle>
          <CardDescription>Automated operational summaries and export history.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {[
              { name: 'Monthly Financial Summary', freq: 'Aug 2024', recipients: 'Admin Team' },
              { name: 'Supplier Costing Audit', freq: 'Jul 2024', recipients: 'Staff' },
              { name: 'Annual Performance Review', freq: '2023 FY', recipients: 'Management' }
            ].map((report, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 px-6 hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/5 text-primary rounded-lg">
                    <FileText size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold">{report.name}</p>
                    <p className="text-xs text-muted-foreground">{report.freq} • Shared with {report.recipients}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="gap-2" onClick={() => handleDownloadReport(report.name)}>
                   <Download size={14} /> Download
                </Button>
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
        <p className="text-[10px] text-accent font-bold uppercase tracking-tighter">{subValue}</p>
      </CardContent>
    </Card>
  );
}