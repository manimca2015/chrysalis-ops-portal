
"use client"

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getEnquiries, createEnquiry, createProject, updateEnquiryStatus } from '@/services/mgmt-service';
import { initiateProjectFromEmail } from '@/ai/flows/ai-email-project-initiation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Mail, 
  Sparkles, 
  Loader2, 
  User, 
  Phone, 
  ArrowRight, 
  CheckCircle2, 
  Trash2,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export default function EnquiriesPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [emailInput, setEmailInput] = useState('');

  const { data: enquiries, isLoading } = useQuery({
    queryKey: ['enquiries'],
    queryFn: getEnquiries,
  });

  const processEmailMutation = useMutation({
    mutationFn: async (text: string) => {
      try {
        const parsed = await initiateProjectFromEmail({ emailContent: text });
        return await createEnquiry({
          rawText: text,
          parsedDetails: parsed,
          status: 'pending'
        });
      } catch (err: any) {
        console.error('AI Extraction Error:', err);
        
        // Detailed error messages for the user
        let friendlyMessage = 'The AI could not process this email. Please check your configuration.';
        
        if (err.message?.includes('404')) {
          friendlyMessage = 'AI Model not found (404). This usually means the model ID is incorrect or not available for your API key.';
        } else if (err.message?.includes('429')) {
          friendlyMessage = 'AI Quota Exceeded (429). Please wait a minute before trying again.';
        } else if (err.message?.includes('API_KEY_INVALID')) {
          friendlyMessage = 'Invalid API Key. Please check your GOOGLE_GENAI_API_KEY in .env.';
        }

        throw new Error(friendlyMessage);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enquiries'] });
      setEmailInput('');
      toast({ 
        title: "Success", 
        description: "AI has successfully extracted project details and added it to your inbox." 
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "AI Processing Failed",
        description: error.message
      });
    }
  });

  const convertMutation = useMutation({
    mutationFn: async (enquiry: any) => {
      if (!enquiry.parsedDetails) return;
      
      await createProject({
        title: enquiry.parsedDetails.projectSummary.slice(0, 50),
        customerDetails: {
          name: enquiry.parsedDetails.customerName,
          email: enquiry.parsedDetails.customerEmail,
          phone: enquiry.parsedDetails.customerPhone || '',
        },
        status: 'enquiry',
        teamAssignments: [],
        category: 'custom-tour',
        notes: enquiry.parsedDetails.projectSummary,
      });

      return updateEnquiryStatus(enquiry.id, 'converted');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enquiries'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast({ title: "Project Created", description: "Enquiry successfully converted to project." });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Conversion Failed",
        description: error.message
      });
    }
  });

  const handleProcess = () => {
    if (!emailInput.trim()) {
      toast({
        variant: "destructive",
        title: "Input Empty",
        description: "Please paste an email content before processing."
      });
      return;
    }
    processEmailMutation.mutate(emailInput);
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline text-primary">AI Enquiry Inbox</h1>
          <p className="text-muted-foreground">Paste raw inquiry emails to instantly extract project details using Gemini AI.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Input Section */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-none shadow-md overflow-hidden bg-white">
            <div className="h-1 bg-accent" />
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Mail size={20} className="text-accent" /> Raw Email Ingest
              </CardTitle>
              <CardDescription>Paste the full content of the customer's email here for AI analysis.</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea 
                placeholder="Example: Dear Chrysalis, I am planning a 3-day school trip for 40 students next month..."
                className="min-h-[300px] text-xs leading-relaxed border-muted focus-visible:ring-accent"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                disabled={processEmailMutation.isPending}
              />
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full gap-2 bg-accent text-accent-foreground hover:bg-accent/90" 
                onClick={handleProcess}
                disabled={processEmailMutation.isPending || !emailInput.trim()}
              >
                {processEmailMutation.isPending ? (
                  <><Loader2 className="animate-spin" size={16} /> Analyzing...</>
                ) : (
                  <><Sparkles size={16} /> Extract with AI</>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Inbox Section */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
              Pending Conversions ({enquiries?.filter(e => e.status === 'pending').length || 0})
            </h2>
          </div>

          <div className="space-y-4">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white rounded-lg border">
                <Loader2 className="animate-spin text-primary mb-2" />
                <p className="text-sm text-muted-foreground">Loading inbox...</p>
              </div>
            ) : enquiries?.filter(e => e.status === 'pending').length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white rounded-lg border border-dashed text-center px-4">
                <Mail size={40} className="text-muted-foreground mb-4 opacity-20" />
                <h3 className="text-lg font-bold">Inbox is empty</h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                  Paste an inquiry email on the left and click "Extract with AI" to start your intelligent onboarding process.
                </p>
              </div>
            ) : enquiries?.filter(e => e.status === 'pending').map((enquiry) => (
              <Card key={enquiry.id} className="shadow-sm border-none bg-white hover:shadow-md transition-all overflow-hidden group">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start mb-6">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-primary/5 text-primary h-5 text-[9px] uppercase font-bold tracking-tighter border-primary/20">AI PARSED</Badge>
                        <span className="text-[10px] text-muted-foreground font-bold">
                          RECEIVED: {enquiry.receivedAt ? format(enquiry.receivedAt.toDate(), 'dd MMM, HH:mm') : '-'}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold leading-tight group-hover:text-primary transition-colors">
                        {enquiry.parsedDetails?.customerName || 'Unknown Customer'}
                      </h3>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail size={14} className="text-primary" />
                        <span className="font-medium truncate">{enquiry.parsedDetails?.customerEmail}</span>
                      </div>
                      {enquiry.parsedDetails?.customerPhone && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone size={14} className="text-primary" />
                          <span className="font-medium">{enquiry.parsedDetails.customerPhone}</span>
                        </div>
                      )}
                    </div>
                    <div className="p-3 bg-muted/30 rounded-lg border border-muted">
                      <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Extracted Summary</p>
                      <p className="text-xs italic text-foreground/80 line-clamp-3">
                        "{enquiry.parsedDetails?.projectSummary}"
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-muted">
                    <Button variant="link" className="text-xs h-auto p-0 font-bold text-accent" onClick={() => {
                      toast({
                        title: "Source Email",
                        description: enquiry.rawText.slice(0, 200) + "..."
                      });
                    }}>
                      View Raw Source
                    </Button>
                    <Button 
                      className="gap-2 bg-primary text-primary-foreground"
                      onClick={() => convertMutation.mutate(enquiry)}
                      disabled={convertMutation.isPending}
                    >
                      {convertMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : <ArrowRight size={16} />}
                      Convert to Project
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
