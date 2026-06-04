
"use client"

import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Plus, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createProject, getStaffProfiles } from '@/services/mgmt-service';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';

export function QuickAddProjectModal() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: staff } = useQuery({
    queryKey: ['staff'],
    queryFn: getStaffProfiles,
    enabled: open
  });

  const [formData, setFormData] = useState({
    title: '',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    category: 'custom-tour' as any,
    provisionalPax: 20,
    summary: '',
    teamLeadId: '',
    assistingId: '',
  });

  const mutation = useMutation({
    mutationFn: (data: any) => {
      const assignments = [];
      if (formData.teamLeadId) assignments.push({ 
        staffId: formData.teamLeadId, 
        staffName: staff?.find(s => s.id === formData.teamLeadId)?.name || 'Unknown', 
        role: 'Team Lead' as any 
      });
      if (formData.assistingId) assignments.push({ 
        staffId: formData.assistingId, 
        staffName: staff?.find(s => s.id === formData.assistingId)?.name || 'Unknown', 
        role: 'Assisting Member' as any 
      });

      return createProject({
        ...data,
        status: 'enquiry',
        teamAssignments: assignments,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast({ title: 'Project Initiated', description: 'Draft project created and roles assigned.' });
      setOpen(false);
      resetForm();
    }
  });

  const resetForm = () => {
    setFormData({
      title: '',
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      category: 'custom-tour',
      provisionalPax: 20,
      summary: '',
      teamLeadId: '',
      assistingId: '',
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all">
          <Plus size={18} />
          <span>Quick Add Project</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl sm:max-w-[600px] overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-headline">New Tour Project</DialogTitle>
        </DialogHeader>

        <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(formData); }} className="space-y-6 py-4">
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label>Project Title</Label>
              <Input placeholder="e.g. 5D4N Singapore Explorer" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2"><Label>Customer Name</Label><Input value={formData.customerName} onChange={e => setFormData({...formData, customerName: e.target.value})} required /></div>
              <div className="grid gap-2"><Label>Email</Label><Input type="email" value={formData.customerEmail} onChange={e => setFormData({...formData, customerEmail: e.target.value})} required /></div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Category</Label>
                <Select value={formData.category} onValueChange={v => setFormData({...formData, category: v as any})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="custom-tour">Custom Tour</SelectItem>
                    <SelectItem value="corporate">Corporate Event</SelectItem>
                    <SelectItem value="education">Educational Tour</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2"><Label>Provisional Pax</Label><Input type="number" value={formData.provisionalPax} onChange={e => setFormData({...formData, provisionalPax: Number(e.target.value)})} /></div>
            </div>
          </div>

          <div className="p-4 bg-muted/20 rounded-lg border border-muted space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <UserPlus size={14} /> Project Roles (Requirement 1.2)
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="text-[10px]">Team Lead</Label>
                <Select value={formData.teamLeadId} onValueChange={v => setFormData({...formData, teamLeadId: v})}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select Staff" /></SelectTrigger>
                  <SelectContent>
                    {staff?.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label className="text-[10px]">Assisting Member</Label>
                <Select value={formData.assistingId} onValueChange={v => setFormData({...formData, assistingId: v})}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select Staff" /></SelectTrigger>
                  <SelectContent>
                    {staff?.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Initial Inquiry Notes</Label>
            <Textarea placeholder="Details from phone/whatsapp..." className="min-h-[100px]" value={formData.summary} onChange={e => setFormData({...formData, summary: e.target.value})} />
          </div>

          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Creating..." : "Initialize Project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
