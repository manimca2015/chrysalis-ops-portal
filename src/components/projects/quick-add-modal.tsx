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
import { Plus, Sparkles, Loader2 } from 'lucide-react';
import { initiateProjectFromEmail } from '@/ai/flows/ai-email-project-initiation';
import { useToast } from '@/hooks/use-toast';
import { createProject } from '@/services/mgmt-service';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function QuickAddProjectModal() {
  const [open, setOpen] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    title: '',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    category: 'custom-tour',
    summary: '',
  });

  const mutation = useMutation({
    mutationFn: createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast({ title: 'Success', description: 'Project created successfully.' });
      setOpen(false);
      resetForm();
    },
    onError: () => {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to create project.' });
    }
  });

  const resetForm = () => {
    setFormData({
      title: '',
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      category: 'custom-tour',
      summary: '',
    });
    setEmailInput('');
  };

  const handleAiExtraction = async () => {
    if (!emailInput.trim()) {
      toast({ title: 'Validation', description: 'Please paste email content first.' });
      return;
    }

    setIsAiProcessing(true);
    try {
      const result = await initiateProjectFromEmail({ emailContent: emailInput });
      setFormData({
        ...formData,
        customerName: result.customerName,
        customerEmail: result.customerEmail,
        customerPhone: result.customerPhone || '',
        summary: result.projectSummary,
        title: `Project: ${result.customerName}`,
      });
      toast({ title: 'AI Extraction Complete', description: 'Form fields have been pre-filled.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'AI Error', description: 'Failed to extract details from email.' });
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      title: formData.title,
      customerDetails: {
        name: formData.customerName,
        email: formData.customerEmail,
        phone: formData.customerPhone,
      },
      status: 'enquiry',
      teamAssignments: [],
      category: formData.category,
      notes: formData.summary,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus size={18} />
          <span>Quick Add Project</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl sm:max-w-[600px] overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Add New Project</DialogTitle>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="space-y-2 rounded-lg border bg-muted/30 p-4">
            <Label className="flex items-center gap-2 text-primary font-bold">
              <Sparkles size={16} className="text-accent" />
              AI Project Initiation
            </Label>
            <p className="text-xs text-muted-foreground">Paste inquiry email content below to auto-fill the form.</p>
            <Textarea 
              placeholder="Paste email content here..." 
              className="mt-2 min-h-[100px] bg-background"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
            />
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2 w-full gap-2 border-accent text-accent hover:bg-accent hover:text-white"
              onClick={handleAiExtraction}
              disabled={isAiProcessing}
            >
              {isAiProcessing ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
              Process with AI
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Project Title</Label>
              <Input 
                id="title" 
                placeholder="e.g. 5D4N Singapore Explorer" 
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="customerName">Customer Name</Label>
                <Input 
                  id="customerName" 
                  value={formData.customerName}
                  onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="customerEmail">Customer Email</Label>
                <Input 
                  id="customerEmail" 
                  type="email"
                  value={formData.customerEmail}
                  onChange={(e) => setFormData({...formData, customerEmail: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="customerPhone">Phone Number</Label>
                <Input 
                  id="customerPhone" 
                  value={formData.customerPhone}
                  onChange={(e) => setFormData({...formData, customerPhone: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(v) => setFormData({...formData, category: v})}
                >
                  <SelectTrigger id="category">
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
              <Label htmlFor="summary">Project Summary / Notes</Label>
              <Textarea 
                id="summary" 
                placeholder="Details of the inquiry..." 
                className="min-h-[80px]"
                value={formData.summary}
                onChange={(e) => setFormData({...formData, summary: e.target.value})}
              />
            </div>

            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Creating..." : "Create Project"}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}