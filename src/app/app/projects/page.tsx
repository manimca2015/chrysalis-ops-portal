"use client"

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getProjects } from '@/services/mgmt-service';
import { QuickAddProjectModal } from '@/components/projects/quick-add-modal';
import { EditProjectModal } from '@/components/projects/edit-project-modal';
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
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  ExternalLink,
  Edit2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import { format } from 'date-fns';
import { Project } from '@/types';

export default function ProjectsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: getProjects,
  });

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'completed': return 'default';
      case 'enquiry': return 'outline';
      case 'costing': return 'secondary';
      case 'draft': return 'outline';
      default: return 'outline';
    }
  };

  const filteredProjects = projects?.filter(p => {
    const search = searchTerm.toLowerCase();
    const titleMatch = p.title?.toLowerCase().includes(search);
    const customerNameMatch = p.customerDetails?.name?.toLowerCase().includes(search);
    const customerEmailMatch = p.customerDetails?.email?.toLowerCase().includes(search);
    return titleMatch || customerNameMatch || customerEmailMatch;
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline text-primary">Projects</h1>
          <p className="text-muted-foreground">Manage tour projects from enquiry to completion.</p>
        </div>
        <QuickAddProjectModal />
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input 
            placeholder="Search projects, customers..." 
            className="pl-10" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" className="gap-2">
          <Filter size={18} />
          Filters
        </Button>
      </div>

      <div className="rounded-md border bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="w-[300px]">Project Name</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">Loading projects...</TableCell>
              </TableRow>
            ) : filteredProjects?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">No projects found.</TableCell>
              </TableRow>
            ) : filteredProjects?.map((project) => (
              <TableRow key={project.id} className="hover:bg-muted/10 transition-colors">
                <TableCell className="font-medium">
                  <div className="flex flex-col">
                    <span className="font-bold">{project.title || 'Untitled Project'}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">ID: {project.id.slice(0, 8)}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold">{project.customerDetails?.name || 'Unknown Customer'}</span>
                    <span className="text-xs text-muted-foreground">{project.customerDetails?.email || 'No Email'}</span>
                  </div>
                </TableCell>
                <TableCell className="capitalize text-xs font-medium">{(project.category || 'custom-tour').replace('-', ' ')}</TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(project.status)} className="capitalize text-[10px] h-5">
                    {(project.status || 'draft').replace('_', ' ')}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-xs">
                  {project.createdAt ? format(project.createdAt.toDate(), 'dd MMM yyyy') : '-'}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Actions</DropdownMenuLabel>
                      <DropdownMenuItem asChild>
                        <Link href={`/app/projects/${project.id}`} className="flex items-center gap-2 cursor-pointer">
                          <ExternalLink size={14} /> View Details
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        // ROOT CAUSE FIX: Using onSelect with preventDefault ensures Dropdown cleanup doesn't clash with Dialog opening
                        onSelect={(e) => {
                          e.preventDefault();
                          setEditingProject(project);
                        }} 
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <Edit2 size={14} /> Edit Details
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive flex items-center gap-2 cursor-pointer">
                        Archive Project
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <EditProjectModal 
        project={editingProject} 
        open={!!editingProject} 
        onOpenChange={(open) => !open && setEditingProject(null)} 
      />
    </div>
  );
}
