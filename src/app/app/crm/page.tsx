
"use client"

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getProjects, getStaffProfiles } from '@/services/mgmt-service';
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
  Phone, 
  Search, 
  Filter, 
  ShieldCheck,
  Briefcase,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function CRMPage() {
  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: getProjects,
  });

  const { data: staff, isLoading: staffLoading } = useQuery({
    queryKey: ['staff'],
    queryFn: getStaffProfiles,
  });

  // Extract unique customers from projects
  const customers = React.useMemo(() => {
    if (!projects) return [];
    const customerMap = new Map();
    
    projects.forEach(project => {
      const email = project.customerDetails.email.toLowerCase();
      if (!customerMap.has(email)) {
        customerMap.set(email, {
          ...project.customerDetails,
          lastProject: project.title,
          projectId: project.id,
          projectCount: 1
        });
      } else {
        const existing = customerMap.get(email);
        existing.projectCount += 1;
      }
    });
    
    return Array.from(customerMap.values());
  }, [projects]);

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">CRM & Directory</h1>
          <p className="text-muted-foreground">Manage relationships with clients and internal team members.</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input placeholder="Search names, emails, or roles..." className="pl-10" />
        </div>
        <Button variant="outline" className="gap-2">
          <Filter size={18} />
          Filters
        </Button>
      </div>

      <Tabs defaultValue="customers" className="space-y-6">
        <TabsList className="bg-white/50 p-1">
          <TabsTrigger value="customers" className="gap-2">
            <UserCircle size={16} /> Customers ({customers.length})
          </TabsTrigger>
          <TabsTrigger value="staff" className="gap-2">
            <Users size={16} /> Internal Staff ({staff?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="customers">
          <Card className="border-none shadow-sm overflow-hidden bg-white">
            <CardHeader>
              <CardTitle className="text-lg">Customer Directory</CardTitle>
              <CardDescription>Consolidated list of all clients from active and past projects.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead>Customer</TableHead>
                    <TableHead>Contact Info</TableHead>
                    <TableHead>Activity</TableHead>
                    <TableHead>Latest Project</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projectsLoading ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-12"><Loader2 className="animate-spin mx-auto text-primary" /></TableCell></TableRow>
                  ) : customers.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-12 text-muted-foreground italic">No customers found.</TableCell></TableRow>
                  ) : customers.map((customer, idx) => (
                    <TableRow key={idx}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold">
                              {customer.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-bold">{customer.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Mail size={12} className="text-accent" /> {customer.email}
                          </div>
                          {customer.phone && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Phone size={12} className="text-accent" /> {customer.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] font-bold">
                          {customer.projectCount} PROJECT{customer.projectCount > 1 ? 'S' : ''}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        <span className="text-sm">{customer.lastProject}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/app/projects/${customer.projectId}`} className="gap-2">
                            View <ExternalLink size={14} />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="staff">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {staffLoading ? (
              <div className="col-span-full py-20 text-center"><Loader2 className="animate-spin mx-auto text-primary" /></div>
            ) : staff?.map(person => (
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
                        <h3 className="font-bold text-lg group-hover:text-primary transition-colors">{person.name}</h3>
                        {person.role === 'admin' && (
                          <ShieldCheck size={16} className="text-emerald-500" title="Administrator" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Mail size={12} /> {person.email}
                      </p>
                      <Badge variant="secondary" className="mt-2 text-[10px] uppercase font-bold tracking-wider bg-primary/5 text-primary">
                        {person.role}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="mt-6 pt-4 border-t flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Briefcase size={12} /> Internal User
                    </span>
                    <span className="text-emerald-600">Active</span>
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
