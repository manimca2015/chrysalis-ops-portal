"use client"

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getProjects, getStaffProfiles, getSuppliers } from '@/services/mgmt-service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Users, 
  UserCircle, 
  Mail, 
  Search, 
  Filter, 
  ShieldCheck,
  Briefcase,
  History,
  MessageSquare,
  Truck,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { format } from 'date-fns';

export default function CRMPage() {
  const [searchTerm, setSearchTerm] = useState('');
  
  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: getProjects,
  });

  const { data: suppliers, isLoading: suppliersLoading } = useQuery({
    queryKey: ['suppliers'],
    queryFn: getSuppliers,
  });

  const { data: staff } = useQuery({
    queryKey: ['staff'],
    queryFn: getStaffProfiles,
  });

  const customers = React.useMemo(() => {
    if (!projects) return [];
    const customerMap = new Map();
    
    projects.forEach(project => {
      if (!project.customerDetails?.email) return;
      
      const email = project.customerDetails.email.toLowerCase();
      if (!customerMap.has(email)) {
        customerMap.set(email, {
          ...project.customerDetails,
          lastProject: project.title,
          projectId: project.id,
          projectCount: 1,
          history: [project]
        });
      } else {
        const existing = customerMap.get(email);
        existing.projectCount += 1;
        existing.history.push(project);
      }
    });
    
    return Array.from(customerMap.values()).filter(c => 
      (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
      (c.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [projects, searchTerm]);

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">Chrysalis CRM</h1>
        <p className="text-muted-foreground">The central memory of our clients, suppliers, and team.</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input 
            placeholder="Search CRM..." 
            className="pl-10" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" className="gap-2">
          <Filter size={18} /> Filters
        </Button>
      </div>

      <Tabs defaultValue="customers" className="space-y-6">
        <TabsList className="bg-white/50 p-1">
          <TabsTrigger value="customers" className="gap-2"><UserCircle size={16} /> Customers</TabsTrigger>
          <TabsTrigger value="suppliers" className="gap-2"><Truck size={16} /> Suppliers</TabsTrigger>
          <TabsTrigger value="staff" className="gap-2"><Users size={16} /> Internal Staff</TabsTrigger>
        </TabsList>

        <TabsContent value="customers">
          <div className="grid gap-6">
            {customers.map((customer, idx) => (
              <Card key={idx} className="border-none shadow-sm overflow-hidden bg-white group hover:shadow-md transition-all">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="md:w-1/3 space-y-4">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16 border-4 border-primary/5">
                          <AvatarFallback className="bg-primary/5 text-primary text-xl font-black">
                            {(customer.name || 'U').charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="text-xl font-bold">{customer.name || 'Unknown Customer'}</h3>
                          <p className="text-sm text-muted-foreground">{customer.email}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-100">
                          {customer.projectCount} Projects
                        </Badge>
                      </div>
                      <div className="p-3 bg-muted/30 rounded-lg space-y-1">
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Recent Preferences</p>
                        <p className="text-xs italic text-muted-foreground">
                          {customer.preferences?.[0] || 'No specific preferences recorded yet.'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex-1 space-y-4 border-l pl-6 border-muted">
                      <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <History size={14} /> Project History
                      </h4>
                      <div className="space-y-2">
                        {customer.history.slice(0, 3).map((p: any) => (
                          <div key={p.id} className="flex items-center justify-between p-2 rounded hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="h-2 w-2 rounded-full bg-primary" />
                              <span className="text-sm font-medium">{p.title || 'Untitled'}</span>
                              <Badge variant="secondary" className="text-[8px] h-4 uppercase">{p.status || 'draft'}</Badge>
                            </div>
                            <span className="text-[10px] text-muted-foreground">
                              {p.createdAt ? format(p.createdAt.toDate(), 'MMM yyyy') : '-'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="suppliers">
          <div className="grid gap-6 md:grid-cols-2">
            {suppliers?.map(supplier => (
              <Card key={supplier.id} className="border-none shadow-sm hover:shadow-md transition-all bg-white overflow-hidden">
                <CardHeader className="bg-muted/10 pb-4">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{supplier.name}</CardTitle>
                    <Badge className="text-[9px] uppercase font-bold">{supplier.location}</Badge>
                  </div>
                  <CardDescription className="flex items-center gap-2">
                    <Mail size={12} /> {supplier.email}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                   <div className="space-y-2">
                     <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Operational Memory</p>
                     {supplier.operationalNotes && supplier.operationalNotes.length > 0 ? (
                       supplier.operationalNotes.map((note, i) => (
                         <div key={i} className="text-xs p-2 bg-accent/5 border-l-2 border-accent rounded-r italic">
                           "{note.content}"
                         </div>
                       ))
                     ) : (
                       <p className="text-xs text-muted-foreground italic">No operational notes yet.</p>
                     )}
                   </div>
                   <div className="flex flex-wrap gap-1">
                     {supplier.tags?.map(t => <Badge key={t} variant="secondary" className="text-[9px]">{t}</Badge>)}
                   </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="staff">
          <div className="grid gap-6 md:grid-cols-3">
            {staff?.map(person => (
              <Card key={person.id} className="border-none shadow-sm hover:shadow-md transition-all group bg-white overflow-hidden">
                <div className="h-1 bg-primary" />
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-14 w-14 border-2 border-primary/10">
                      <AvatarImage src={person.avatarUrl} />
                      <AvatarFallback className="bg-primary/5 text-primary text-lg font-bold">
                        {person.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-lg">{person.name}</h3>
                        {person.role === 'admin' && <ShieldCheck size={16} className="text-emerald-500" />}
                      </div>
                      <p className="text-xs text-muted-foreground">{person.email}</p>
                      <Badge variant="secondary" className="mt-2 text-[10px] uppercase font-bold tracking-wider bg-primary/5 text-primary">
                        {person.role}
                      </Badge>
                    </div>
                  </div>
                  <div className="mt-6 pt-4 border-t flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    <span className="flex items-center gap-1"><Briefcase size={12} /> Internal</span>
                    <span className={person.status === 'active' ? 'text-emerald-600' : 'text-destructive'}>
                      {person.status}
                    </span>
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