
"use client"

import React, { use, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getProjectById, 
  getCostingSets, 
  getCostingItems, 
  savePaymentPlan, 
  getPaymentPlan,
  logDocumentCreation,
  addProjectActivity
} from '@/services/mgmt-service';
import { CostingSet, Installment } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { 
  FileText, 
  Download, 
  Mail, 
  Plus, 
  Trash2, 
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  History,
  FileCheck
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { generateQuotationPDF } from '@/lib/pdf/generator';

const DEFAULT_TERMS = `1. Validity: This quotation is valid for 14 days from the date of issue.
2. Booking: Services are subject to availability at the time of firm booking.
3. Payment: A non-refundable deposit is required to secure the booking as per the schedule below.
4. Cancellation: Cancellations made within 7 days of the tour date are subject to a 100% charge.
5. Liability: Chrysalis Tours is not liable for delays caused by traffic or weather conditions.`;

export default function QuotationBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [selectedSetId, setSelectedSetId] = useState<string>('');
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [introduction, setIntroduction] = useState('');
  const [terms, setTerms] = useState(DEFAULT_TERMS);
  const [isGenerating, setIsGenerating] = useState(false);

  // Queries
  const { data: project } = useQuery({
    queryKey: ['project', id],
    queryFn: () => getProjectById(id),
  });

  const { data: sets } = useQuery({
    queryKey: ['costing-sets', id],
    queryFn: () => getCostingSets(id),
  });

  const { data: items } = useQuery({
    queryKey: ['costing-items', selectedSetId],
    queryFn: () => getCostingItems(selectedSetId),
    enabled: !!selectedSetId,
  });

  const { data: existingPlan } = useQuery({
    queryKey: ['payment-plan', id],
    queryFn: () => getPaymentPlan(id),
  });

  useEffect(() => {
    if (existingPlan) {
      setInstallments(existingPlan.installments);
    } else if (installments.length === 0) {
      setInstallments([{ label: 'Deposit', percentage: 50, amount: 0, status: 'pending' }]);
    }
  }, [existingPlan]);

  useEffect(() => {
    if (project && !introduction) {
      setIntroduction(`We are pleased to provide a proposal for your upcoming ${project.category.replace('-', ' ')}: "${project.title}". Our team has carefully selected the following services to ensure an exceptional experience for your group.`);
    }
  }, [project]);

  const selectedSet = sets?.find(s => s.id === selectedSetId);

  const calculateAmounts = () => {
    if (!selectedSet) return;
    const updated = installments.map(inst => ({
      ...inst,
      amount: (selectedSet.totalSellingSgd * inst.percentage) / 100
    }));
    setInstallments(updated);
  };

  const handleAddInstallment = () => {
    setInstallments([...installments, { label: 'Final Payment', percentage: 0, amount: 0, status: 'pending' }]);
  };

  const handleRemoveInstallment = (idx: number) => {
    setInstallments(installments.filter((_, i) => i !== idx));
  };

  const handleUpdateInstallment = (idx: number, field: string, value: any) => {
    const updated = [...installments];
    (updated[idx] as any)[field] = value;
    setInstallments(updated);
  };

  const totalPercentage = installments.reduce((sum, i) => sum + Number(i.percentage), 0);

  const handlePreviewPDF = async () => {
    if (!project || !selectedSet || !items) return;
    
    if (totalPercentage !== 100) {
      toast({ 
        variant: "destructive", 
        title: "Invalid Payment Plan", 
        description: "Installment percentages must sum to exactly 100%." 
      });
      return;
    }

    setIsGenerating(true);
    try {
      const doc = generateQuotationPDF({
        project,
        costingSet: selectedSet,
        items,
        installments,
        documentTitle: `Quotation: ${project.title}`,
        introduction,
        terms
      });
      
      doc.save(`Quotation_${project.id.slice(0, 8)}.pdf`);
      
      // Save Payment Plan
      await savePaymentPlan(id, {
        projectId: id,
        totalAmount: selectedSet.totalSellingSgd,
        currency: 'SGD',
        installments
      });

      // Log the creation
      await logDocumentCreation({
        projectId: id,
        type: 'quotation',
        title: `Quotation - ${selectedSet.name}`,
        status: 'draft',
        recipientEmail: project.customerDetails.email,
        version: 1
      });

      await addProjectActivity(id, {
        type: 'document_sent',
        content: `Generated Quotation PDF: ${selectedSet.name}`,
        authorId: user?.uid || 'system',
        authorName: user?.email?.split('@')[0] || 'System'
      });

      queryClient.invalidateQueries({ queryKey: ['documents', id] });
      queryClient.invalidateQueries({ queryKey: ['project-activity', id] });

      toast({ title: "Quotation Generated & Saved" });
    } finally {
      setIsGenerating(false);
    }
  };

  if (!project) return null;

  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/app/projects/${id}`}><ArrowLeft size={18} /></Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">Quotation Builder</h1>
          <p className="text-muted-foreground">Draft professional quotations for {project.customerDetails.name}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Step 1: Scenario Selection */}
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2"><CheckCircle2 className="text-emerald-500" size={18} /> 1. Select Costing Option</CardTitle>
              <CardDescription>Choose which pricing scenario to present to the client</CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={selectedSetId} onValueChange={setSelectedSetId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a costing set..." />
                </SelectTrigger>
                <SelectContent>
                  {sets?.map(set => (
                    <SelectItem key={set.id} value={set.id}>
                      {set.name} - SGD {set.totalSellingSgd.toLocaleString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Step 2: Content Templates */}
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2"><FileText className="text-blue-500" size={18} /> 2. Document Content</CardTitle>
              <CardDescription>Customize the introduction and terms for this client</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Introduction / Summary</Label>
                <Textarea 
                  value={introduction} 
                  onChange={e => setIntroduction(e.target.value)}
                  placeholder="Welcome message or itinerary summary..."
                  className="min-h-[100px] text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label>Terms & Conditions</Label>
                <Textarea 
                  value={terms} 
                  onChange={e => setTerms(e.target.value)}
                  placeholder="Booking policies, cancellation terms, etc."
                  className="min-h-[150px] text-xs font-mono"
                />
              </div>
            </CardContent>
          </Card>

          {/* Step 3: Payment Plan */}
          <Card className="border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2"><History className="text-orange-500" size={18} /> 3. Payment Schedule</CardTitle>
                <CardDescription>Define the installment milestones</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={calculateAmounts} disabled={!selectedSet}>
                Recalculate Amounts
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {installments.map((inst, idx) => (
                  <div key={idx} className="flex items-end gap-3 p-3 bg-muted/30 rounded-lg border border-transparent hover:border-muted-foreground/10 transition-colors">
                    <div className="flex-1">
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground">Milestone</Label>
                      <Input 
                        value={inst.label} 
                        onChange={e => handleUpdateInstallment(idx, 'label', e.target.value)} 
                        className="h-9"
                      />
                    </div>
                    <div className="w-24">
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground">Percent (%)</Label>
                      <Input 
                        type="number" 
                        value={inst.percentage} 
                        onChange={e => handleUpdateInstallment(idx, 'percentage', Number(e.target.value))} 
                        className="h-9"
                      />
                    </div>
                    <div className="w-32">
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground">Amount (SGD)</Label>
                      <Input 
                        disabled 
                        value={inst.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} 
                        className="h-9 bg-muted/50"
                      />
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleRemoveInstallment(idx)} className="h-9 w-9 text-destructive hover:bg-destructive/10">
                      <Trash2 size={16} />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <Button variant="outline" className="gap-2" onClick={handleAddInstallment}>
                  <Plus size={16} /> Add Installment
                </Button>
                <div className={`text-sm font-bold flex items-center gap-2 p-2 px-4 rounded-full ${totalPercentage === 100 ? 'bg-emerald-50 text-emerald-600' : 'bg-destructive/10 text-destructive'}`}>
                  Total Allocation: {totalPercentage}% {totalPercentage === 100 ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar: Preview & Actions */}
        <div className="space-y-6">
          <Card className="bg-primary text-primary-foreground border-none shadow-lg overflow-hidden">
            <div className="h-1 bg-accent" />
            <CardHeader>
              <CardTitle className="text-lg">Generation Console</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground gap-2 font-bold py-6"
                onClick={handlePreviewPDF}
                disabled={!selectedSetId || isGenerating || totalPercentage !== 100}
              >
                {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
                Finalize & Download PDF
              </Button>
              <Button variant="outline" className="w-full gap-2 text-white border-white/20 hover:bg-white/10" disabled>
                <Mail size={16} /> Email to Client (Soon)
              </Button>
              <div className="pt-4 border-t border-white/10 text-[10px] uppercase tracking-widest text-center opacity-60">
                Authorized: {user?.email?.split('@')[0]}
              </div>
            </CardContent>
          </Card>

          {selectedSet && (
            <Card className="border-none shadow-sm bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <FileCheck size={14} className="text-primary" /> Review Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-xs items-center p-2 rounded bg-muted/20">
                  <span className="text-muted-foreground">Scenario</span>
                  <span className="font-bold">{selectedSet.name}</span>
                </div>
                <div className="flex justify-between text-xs items-center p-2 rounded bg-muted/20">
                  <span className="text-muted-foreground">Total Value</span>
                  <span className="font-bold text-accent">SGD {selectedSet.totalSellingSgd.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs items-center p-2 rounded bg-muted/20">
                  <span className="text-muted-foreground">Line Items</span>
                  <span className="font-bold">{items?.length || 0}</span>
                </div>
                <div className="flex justify-between text-xs items-center p-2 rounded bg-muted/20">
                  <span className="text-muted-foreground">Recipient</span>
                  <span className="font-bold truncate max-w-[120px]">{project.customerDetails.email}</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
