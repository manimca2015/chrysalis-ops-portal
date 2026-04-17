
"use client"

import React, { use, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getProjectById, 
  getCostingSets, 
  getCostingItems, 
  savePaymentPlan, 
  getPaymentPlan,
  logDocumentCreation
} from '@/services/mgmt-service';
import { CostingSet, Installment } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { generateQuotationPDF } from '@/lib/pdf/generator';

export default function QuotationBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [selectedSetId, setSelectedSetId] = useState<string>('');
  const [installments, setInstallments] = useState<Installment[]>([]);
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

  const handlePreviewPDF = () => {
    if (!project || !selectedSet || !items) return;
    
    if (totalPercentage !== 100) {
      toast({ 
        variant: "destructive", 
        title: "Invalid Payment Plan", 
        description: "Installment percentages must sum to exactly 100%." 
      });
      return;
    }

    const doc = generateQuotationPDF({
      project,
      costingSet: selectedSet,
      items,
      installments,
      documentTitle: `Quotation: ${project.title}`
    });
    
    doc.save(`Quotation_${project.id.slice(0, 8)}.pdf`);
    
    // Log the creation
    logDocumentCreation({
      projectId: id,
      type: 'quotation',
      title: `Quotation - ${selectedSet.name}`,
      status: 'draft',
      recipientEmail: project.customerDetails.email,
      version: 1
    });

    toast({ title: "PDF Generated Successfully" });
  };

  if (!project) return null;

  return (
    <div className="space-y-8">
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
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">1. Select Costing Option</CardTitle>
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

          {/* Step 2: Payment Plan */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">2. Payment Schedule</CardTitle>
                <CardDescription>Define how the client will pay for this project</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={calculateAmounts} disabled={!selectedSet}>
                Auto-Calculate Amounts
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {installments.map((inst, idx) => (
                  <div key={idx} className="flex items-end gap-3 p-3 bg-muted/30 rounded-lg">
                    <div className="flex-1">
                      <Label className="text-[10px] uppercase text-muted-foreground">Milestone</Label>
                      <Input 
                        value={inst.label} 
                        onChange={e => handleUpdateInstallment(idx, 'label', e.target.value)} 
                      />
                    </div>
                    <div className="w-24">
                      <Label className="text-[10px] uppercase text-muted-foreground">Percent (%)</Label>
                      <Input 
                        type="number" 
                        value={inst.percentage} 
                        onChange={e => handleUpdateInstallment(idx, 'percentage', Number(e.target.value))} 
                      />
                    </div>
                    <div className="w-32">
                      <Label className="text-[10px] uppercase text-muted-foreground">Amount (SGD)</Label>
                      <Input 
                        disabled 
                        value={inst.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} 
                      />
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleRemoveInstallment(idx)}>
                      <Trash2 size={16} className="text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <Button variant="outline" className="gap-2" onClick={handleAddInstallment}>
                  <Plus size={16} /> Add Installment
                </Button>
                <div className={`text-sm font-bold flex items-center gap-2 ${totalPercentage === 100 ? 'text-emerald-600' : 'text-destructive'}`}>
                  Total: {totalPercentage}% {totalPercentage === 100 ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar: Preview & Actions */}
        <div className="space-y-6">
          <Card className="bg-primary text-primary-foreground">
            <CardHeader>
              <CardTitle className="text-lg">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground gap-2"
                onClick={handlePreviewPDF}
                disabled={!selectedSetId || isGenerating}
              >
                <Download size={16} /> Download Quotation PDF
              </Button>
              <Button variant="outline" className="w-full gap-2 text-white border-white/20 hover:bg-white/10" disabled>
                <Mail size={16} /> Send via Email (Soon)
              </Button>
            </CardContent>
          </Card>

          {selectedSet && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Quick Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Base Price</span>
                  <span className="font-bold">SGD {selectedSet.totalSellingSgd.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Line Items</span>
                  <span className="font-bold">{items?.length || 0} items</span>
                </div>
                <div className="flex justify-between text-xs">
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
