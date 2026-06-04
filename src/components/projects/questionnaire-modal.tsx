
"use client"

import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { MessageSquarePlus, Mail, MessageCircle, Copy, Check, Settings } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getQuestionnaireTemplates, addProjectActivity } from '@/services/mgmt-service';
import { Project } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export function QuestionnaireModal({ project }: { project: Project }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [draftMessage, setDraftMessage] = useState('');
  const [channel, setChannel] = useState<'email' | 'whatsapp'>('email');

  const { data: templates } = useQuery({
    queryKey: ['questionnaire-templates'],
    queryFn: getQuestionnaireTemplates
  });

  const activityMutation = useMutation({
    mutationFn: (content: string) => addProjectActivity(project.id, {
      type: 'questionnaire_sent',
      content,
      authorId: user?.uid || 'system',
      authorName: user?.email?.split('@')[0] || 'System'
    })
  });

  const selectedTemplate = templates?.find(t => t.id === selectedTemplateId);

  const handleGenerateDraft = () => {
    const questionsList = selectedQuestions.map(q => `• ${q}`).join('\n');
    const greeting = channel === 'email' 
      ? `Subject: Regarding your ${project.category.replace('-', ' ')} Inquiry\n\nHi ${project.customerDetails.name},\n\nThank you for reaching out to Chrysalis! To help us design the perfect itinerary for you, could you please provide a few more details?\n\n`
      : `Hi ${project.customerDetails.name}, this is ${user?.email?.split('@')[0] || 'Chrysalis Team'}. Regarding your tour enquiry, could you help us with these details?\n\n`;
    
    const closing = `\n\nOnce we have this information, we'll start preparing a detailed proposal for you.\n\nBest regards,\n${user?.email?.split('@')[0] || 'Chrysalis Team'}`;
    
    setDraftMessage(greeting + questionsList + closing);
    setStep(2);
  };

  const handleSend = () => {
    activityMutation.mutate(`Sent ${channel.toUpperCase()} questionnaire with ${selectedQuestions.length} questions.`);
    toast({ title: 'Activity Logged', description: 'Questionnaire dispatch recorded in project history.' });
    setOpen(false);
    setStep(1);
  };

  const hasTemplates = templates && templates.length > 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full justify-between group">
          Send Questionnaire <MessageSquarePlus size={14} className="group-hover:translate-x-1 transition-transform" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Clarification Questionnaire</DialogTitle>
          <DialogDescription>Select template questions and draft a message for the client.</DialogDescription>
        </DialogHeader>

        {!hasTemplates ? (
          <div className="py-12 text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <Settings className="text-muted-foreground" size={24} />
            </div>
            <div className="space-y-1">
              <p className="font-bold">No templates found</p>
              <p className="text-sm text-muted-foreground">You need to create a questionnaire template in the Admin panel first.</p>
            </div>
            <Button asChild variant="outline">
              <Link href="/app/admin">Go to Admin Settings</Link>
            </Button>
          </div>
        ) : step === 1 ? (
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label>Select Template</Label>
              <Select value={selectedTemplateId} onValueChange={(v) => {
                setSelectedTemplateId(v);
                const tpl = templates?.find(t => t.id === v);
                if (tpl) setSelectedQuestions(tpl.questions);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a questionnaire template..." />
                </SelectTrigger>
                <SelectContent>
                  {templates?.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.title} ({t.category})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedTemplate && (
              <div className="space-y-3">
                <Label>Select Questions to Include</Label>
                <div className="max-h-[300px] overflow-y-auto space-y-2 border rounded-md p-3 bg-muted/10">
                  {selectedTemplate.questions.map((q, i) => (
                    <div key={i} className="flex items-start gap-3 p-2 hover:bg-muted/50 rounded transition-colors">
                      <Checkbox 
                        id={`q-${i}`} 
                        checked={selectedQuestions.includes(q)} 
                        onCheckedChange={(checked) => {
                          if (checked) setSelectedQuestions([...selectedQuestions, q]);
                          else setSelectedQuestions(selectedQuestions.filter(sq => sq !== q));
                        }}
                      />
                      <label htmlFor={`q-${i}`} className="text-sm leading-tight cursor-pointer py-0.5">{q}</label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6 py-4">
            <div className="flex gap-4">
              <Button 
                variant={channel === 'email' ? 'default' : 'outline'} 
                className="flex-1 gap-2" 
                onClick={() => setChannel('email')}
              >
                <Mail size={16} /> Email
              </Button>
              <Button 
                variant={channel === 'whatsapp' ? 'default' : 'outline'} 
                className="flex-1 gap-2" 
                onClick={() => setChannel('whatsapp')}
              >
                <MessageCircle size={16} /> WhatsApp
              </Button>
            </div>

            <div className="space-y-2">
              <Label>Message Draft</Label>
              <Textarea 
                value={draftMessage} 
                onChange={(e) => setDraftMessage(e.target.value)} 
                className="min-h-[250px] text-xs leading-relaxed font-mono bg-muted/5"
              />
            </div>
          </div>
        )}

        {hasTemplates && (
          <DialogFooter className="flex justify-between sm:justify-between w-full">
            {step === 2 ? (
              <Button variant="ghost" onClick={() => setStep(1)}>Back to Selection</Button>
            ) : <div />}
            <div className="flex gap-2">
              {step === 1 ? (
                <Button onClick={handleGenerateDraft} disabled={!selectedTemplateId || selectedQuestions.length === 0}>
                  Next: Draft Message
                </Button>
              ) : (
                <>
                  <Button variant="outline" className="gap-2" onClick={() => {
                     navigator.clipboard.writeText(draftMessage);
                     toast({ title: 'Copied', description: 'Draft copied to clipboard.' });
                  }}>
                    <Copy size={14} /> Copy
                  </Button>
                  <Button className="gap-2" onClick={handleSend}>
                    Mark as Sent <Check size={14} />
                  </Button>
                </>
              )}
            </div>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
