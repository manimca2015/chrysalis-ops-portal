"use client"

import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
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
import { useToast } from '@/hooks/use-toast';
import { updateProject } from '@/services/mgmt-service';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Project } from '@/types';

interface EditProjectModalProps {
  project: Project | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditProjectModal({ project, open, onOpenChange }: EditProjectModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    title: '',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    category: 'custom-tour' as any,
    summary: '',
  });

  // ROOT CAUSE FIX: Defensive cleanup for Radix UI interaction lock
  useEffect(() => {
    if (!open) {
      // We use a small timeout to ensure we run AFTER Radix UI's own cleanup attempt
      const timer = setTimeout(() => {
        const body = document.body;
        // Restore interaction
        body.style.pointerEvents = 'auto';
        body.style.overflow = 'auto';
        // Remove Radix-specific locking attributes that might have been orphaned
        body.removeAttribute('data-radix-scroll-lock');
        // Clear aria-hidden if it was left on siblings (common blocker)
        const main = document.querySelector('main');
        if (main) main.removeAttribute('aria-hidden');
        const sidebar = document.querySelector('aside');
        if (sidebar) sidebar.removeAttribute('aria-hidden');
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [open]);

  useEffect(() => {
    if (project) {
      setFormData({
        title: project.title || '',
        customerName: project.customerDetails?.name || '',
        customerEmail: project.customerDetails?.email || '',
        customerPhone: project.customerDetails?.phone || '',
        category: project.category || 'custom-tour',
        summary: project.notes || '',
      });
    }
  }, [project]);

  const mutation = useMutation({
    mutationFn: (data: any) => {
      if (!project) throw new Error("No project selected");
      return updateProject(project.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      if (project) {
        queryClient.invalidateQueries({ queryKey: ['project', project.id] });
      }
      toast({ title: 'Success', description: 'Project updated successfully.' });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({ 
        variant: 'destructive', 
        title: 'Error', 
        description: error.message || 'Failed to update project.' 
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      title: formData.title,
      customerDetails: {
        name: formData.customerName,
        email: formData.customerEmail,
        phone: formData.customerPhone,
      },
      category: formData.category,
      notes: formData.summary,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-2xl sm:max-w-[600px] overflow-y-auto max-h-[90vh]"
      >
        <DialogHeader>
          <DialogTitle>Edit Project Details</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-6 py-4">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-title">Project Title</Label>
              <Input 
                id="edit-title" 
                placeholder="e.g. 5D4N Singapore Explorer" 
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-customerName">Customer Name</Label>
                <Input 
                  id="edit-customerName" 
                  value={formData.customerName}
                  onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-customerEmail">Customer Email</Label>
                <Input 
                  id="edit-customerEmail" 
                  type="email"
                  value={formData.customerEmail}
                  onChange={(e) => setFormData({...formData, customerEmail: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-customerPhone">Phone Number</Label>
                <Input 
                  id="edit-customerPhone" 
                  value={formData.customerPhone}
                  onChange={(e) => setFormData({...formData, customerPhone: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-category">Category</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(v) => setFormData({...formData, category: v as any})}
                >
                  <SelectTrigger id="edit-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="custom-tour">Custom Tour</SelectItem>
                    <SelectItem value="corporate">Corporate Event</SelectItem>
                    <SelectItem value="transport">Transportation</SelectItem>
                    <SelectItem value="education">Educational Tour</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-summary">Project Summary / Notes</Label>
              <Textarea 
                id="edit-summary" 
                placeholder="Details of the inquiry..." 
                className="min-h-[80px]"
                value={formData.summary}
                onChange={(e) => setFormData({...formData, summary: e.target.value})}
              />
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
