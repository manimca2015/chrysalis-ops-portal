"use client"

import { useQuery } from '@tanstack/react-query';
import { getProjects } from '@/services/mgmt-service';
import { QuickAddProjectModal } from '@/components/projects/quick-add-modal';
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
  ExternalLink 
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

export default function ProjectsPage() {
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

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">Projects</h1>
          <p className="text-muted-foreground">Manage tour projects from enquiry to completion.</p>
        </div>
        <QuickAddProjectModal />
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input placeholder="Search projects, customers..." className="pl-10" />
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
            ) : projects?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">No projects found. Create your first project using Quick Add.</TableCell>
              </TableRow>
            ) : projects?.map((project) => (
              <TableRow key={project.id} className="hover:bg-muted/10 transition-colors">
                <TableCell className="font-medium">
                  <div className="flex flex-col">
                    <span>{project.title}</span>
                    <span className="text-xs text-muted-foreground font-normal">ID: {project.id.slice(0, 8)}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span>{project.customerDetails.name}</span>
                    <span className="text-xs text-muted-foreground font-normal">{project.customerDetails.email}</span>
                  </div>
                </TableCell>
                <TableCell className="capitalize">{project.category.replace('-', ' ')}</TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(project.status)} className="capitalize">
                    {project.status.replace('_', ' ')}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
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
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem asChild>
                        <Link href={`/app/projects/${project.id}`} className="flex items-center gap-2">
                          <ExternalLink size={14} /> View Details
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem>Edit Details</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive">Archive Project</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}