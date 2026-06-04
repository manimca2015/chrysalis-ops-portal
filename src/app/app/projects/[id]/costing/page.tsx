"use client"

import React, { use, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getProjectById, 
  getCostingSets, 
  getCostingItems, 
  createCostingSet, 
  addCostingItem,
  deleteCostingItem,
  getSuppliers,
  duplicateCostingSet
} from '@/services/mgmt-service';
import { generateProjectInsights, type ProjectIntelligenceOutput } from '@/ai/flows/ai-project-intelligence';
import { CostingSet, CostingItem, Supplier } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/table';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Plus, 
  Trash2, 
  Calculator, 
  DollarSign, 
  ArrowLeft,
  Loader2,
  AlertTriangle,
  Copy,
  Receipt,
  CheckCircle2,
  Info,
  Sparkles,
  Zap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SupplierBillSection } from '@/components/projects/supplier-bill-section';

const EXCHANGE_RATE_BUFFER = 1.01; // 1% buffer

export default function ProjectCostingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedSetId, setSelectedSetId] = useState<string | null>(null);
  const [newSetName, setNewSetName] = useState('');

  const { data: project } = useQuery({
    queryKey: ['project', id],
    queryFn: () => getProjectById(id),
  });

  const { data: sets, isLoading: setsLoading } = useQuery({
    queryKey: ['costing-sets', id],
    queryFn: () => getCostingSets(id),
  });

  const createSetMutation = useMutation({
    mutationFn: (name: string) => createCostingSet(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['costing-sets', id] });
      setNewSetName('');
      toast({ title: 'Costing Set Created' });
    }
  });

  const duplicateSetMutation = useMutation({
    mutationFn: (setId: string) => duplicateCostingSet(setId, `Copy of ${sets?.find(s => s.id === setId)?.name}`),
    onSuccess: (newId) => {
      queryClient.invalidateQueries({ queryKey: ['costing-sets', id] });
      setSelectedSetId(newId);
      toast({ title: 'Set Duplicated' });
    }
  });

  if (!project) return null;

  const selectedSet = sets?.find(s => s.id === selectedSetId);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/app/projects/${id}`}><ArrowLeft size={18} /></Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">Costing Engine</h1>
          <p className="text-muted-foreground">{project.title}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Scenarios</CardTitle>
              <CardDescription>Select or create pricing sets</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {setsLoading ? (
                  <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>
                ) : sets?.map(set => (
                  <div key={set.id} className="relative group">
                    <button
                      onClick={() => setSelectedSetId(set.id)}
                      className={`w-full text-left p-3 rounded-md border transition-all ${
                        selectedSetId === set.id 
                          ? 'bg-primary text-primary-foreground border-primary' 
                          : 'hover:bg-muted border-transparent bg-white'
                      }`}
                    >
                      <div className="font-bold flex justify-between items-center text-sm">
                        <span>{set.name}</span>
                        {set.isWinningOption && <Badge className="bg-accent text-[8px]">WINNING</Badge>}
                      </div>
                      <div className="text-[10px] opacity-70 mt-1 uppercase font-bold tracking-widest">
                        Total: SGD {set.totalSellingSgd.toLocaleString()}
                      </div>
                    </button>
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => duplicateSetMutation.mutate(set.id)}>
                        <Copy size={12} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t space-y-2">
                <Label htmlFor="new-set" className="text-xs uppercase font-bold text-muted-foreground">New Option</Label>
                <div className="flex gap-2">
                  <Input 
                    id="new-set" 
                    placeholder="e.g. Budget" 
                    value={newSetName}
                    className="h-8 text-sm"
                    onChange={e => setNewSetName(e.target.value)}
                  />
                  <Button size="icon" className="h-8 w-8" onClick={() => createSetMutation.mutate(newSetName)} disabled={!newSetName}>
                    <Plus size={16} />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3">
          {selectedSet ? (
            <Tabs defaultValue="costing" className="space-y-6">
              <TabsList className="bg-muted/50 p-1">
                <TabsTrigger value="costing" className="gap-2"><Calculator size={14} /> Line Items</TabsTrigger>
                <TabsTrigger value="bills" className="gap-2"><Receipt size={14} /> Supplier Bills</TabsTrigger>
              </TabsList>

              <TabsContent value="costing">
                <CostingWorkspace set={selectedSet} project={project} />
              </TabsContent>

              <TabsContent value="bills">
                <SupplierBillSection projectId={id} />
              </TabsContent>
            </Tabs>
          ) : (
            <Card className="h-full flex flex-col items-center justify-center p-12 text-center border-dashed">
              <Calculator size={48} className="text-muted-foreground mb-4 opacity-20" />
              <h3 className="text-xl font-bold">Select a Scenario</h3>
              <p className="text-muted-foreground max-w-xs mx-auto">
                Select an existing scenario from the left or create a new one to manage costing line items.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function CostingWorkspace({ set, project }: { set: CostingSet, project: any }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isAdding, setIsAdding] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [aiAdvice, setAiAdvice] = useState<ProjectIntelligenceOutput | null>(null);
  
  const [formData, setFormData] = useState({
    description: '',
    supplierName: '',
    unitCost: 0,
    quantity: 1,
    currency: 'SGD',
    exchangeRate: 1,
    markupPercent: 15,
    isManualOverride: false
  });

  const { data: suppliers } = useQuery({
    queryKey: ['suppliers'],
    queryFn: getSuppliers,
  });

  const { data: items, isLoading } = useQuery({
    queryKey: ['costing-items', set.id],
    queryFn: () => getCostingItems(set.id),
  });

  const aiAdviceMutation = useMutation({
    mutationFn: () => generateProjectInsights({
      type: 'financial_advice',
      projectTitle: project.title,
      category: project.category,
      costingData: {
        totalCost: set.totalCostSgd,
        totalSelling: set.totalSellingSgd,
        margin: set.marginPercent,
        items: items?.map(i => ({ description: i.description, supplier: i.supplierName, cost: i.totalCostSgd }))
      }
    }),
    onSuccess: (data) => {
      setAiAdvice(data);
    },
    onError: (err: any) => {
      toast({ variant: 'destructive', title: 'Advisor Error', description: err.message });
    }
  });

  useEffect(() => {
    if (selectedSupplierId) {
      const supplier = suppliers?.find(s => s.id === selectedSupplierId);
      if (supplier) {
        setFormData(prev => ({ ...prev, supplierName: supplier.name }));
      }
    }
  }, [selectedSupplierId, suppliers]);

  useEffect(() => {
    if (selectedServiceId && selectedSupplierId) {
      const supplier = suppliers?.find(s => s.id === selectedSupplierId);
      const service = supplier?.services.find(s => s.id === selectedServiceId);
      if (service) {
        setFormData(prev => ({
          ...prev,
          description: service.name,
          unitCost: service.cost,
          currency: service.currency,
          isManualOverride: false
        }));
      }
    }
  }, [selectedServiceId, selectedSupplierId, suppliers]);

  const addItemMutation = useMutation({
    mutationFn: (data: any) => {
      const sellingExchangeRate = data.exchangeRate * EXCHANGE_RATE_BUFFER;
      const totalCostSgd = data.unitCost * data.quantity * data.exchangeRate;
      const sellingPriceSgd = (data.unitCost * data.quantity * (1 + data.markupPercent / 100)) * sellingExchangeRate;
      
      return addCostingItem(set.id, {
        ...data,
        totalCostSgd,
        sellingPriceSgd,
        exchangeRate: sellingExchangeRate
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['costing-items', set.id] });
      queryClient.invalidateQueries({ queryKey: ['costing-sets', project.id] });
      setIsAdding(false);
      resetForm();
      toast({ title: 'Line Item Added' });
    }
  });

  const deleteItemMutation = useMutation({
    mutationFn: (itemId: string) => deleteCostingItem(set.id, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['costing-items', set.id] });
      queryClient.invalidateQueries({ queryKey: ['costing-sets', project.id] });
      toast({ title: 'Item Removed' });
    }
  });

  const resetForm = () => {
    setFormData({
      description: '',
      supplierName: '',
      unitCost: 0,
      quantity: 1,
      currency: 'SGD',
      exchangeRate: 1,
      markupPercent: 15,
      isManualOverride: false
    });
    setSelectedSupplierId('');
    setSelectedServiceId('');
  };

  const currentSupplier = suppliers?.find(s => s.id === selectedSupplierId);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard title="Est. Cost (SGD)" value={set.totalCostSgd} prefix="$" />
        <StatsCard title="Selling Price (SGD)" value={set.totalSellingSgd} prefix="$" highlight />
        <StatsCard title="Total Profit (SGD)" value={set.profitSgd} prefix="$" />
        <Card className="border-none shadow-sm">
          <CardHeader className="p-4 pb-1">
            <CardTitle className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Margin %</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 flex items-center justify-between">
            <div className="text-2xl font-black">{set.marginPercent.toFixed(1)}%</div>
            {set.marginPercent < 15 && (
              <Badge variant="destructive" className="text-[8px] h-4 gap-1">
                <AlertTriangle size={10} /> LOW
              </Badge>
            )}
          </CardContent>
        </Card>
      </div>

      {aiAdvice && (
        <Card className="bg-primary text-primary-foreground border-none shadow-md overflow-hidden animate-in zoom-in-95 duration-300">
          <div className="h-1 bg-accent" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              <span className="flex items-center gap-2"><Sparkles size={16} className="text-accent" /> AI Financial Advisor</span>
              <Button variant="ghost" size="icon" onClick={() => setAiAdvice(null)} className="h-6 w-6 text-white/50 hover:text-white"><ChevronRight className="rotate-90" size={14} /></Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-xs leading-relaxed whitespace-pre-wrap text-white/90">
              {aiAdvice.content}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-white/10">
              <div>
                <p className="text-[10px] font-bold uppercase text-accent mb-1">Observation</p>
                <ul className="text-[10px] space-y-1 list-disc pl-4 text-white/80">
                  {aiAdvice.keyTakeaways.map((k, i) => <li key={i}>{k}</li>)}
                </ul>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-accent mb-1">Recommended Changes</p>
                <ul className="text-[10px] space-y-1 list-disc pl-4 text-white/80">
                  {aiAdvice.suggestedActions.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-none shadow-sm overflow-hidden">
        <CardHeader className="bg-white flex flex-row items-center justify-between py-4">
          <div>
            <CardTitle className="text-lg">Financial Breakdown: {set.name}</CardTitle>
            <CardDescription className="text-xs">Manage suppliers, variations, and markups.</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="gap-2 border-accent/30 text-accent hover:bg-accent/5" 
              size="sm"
              onClick={() => aiAdviceMutation.mutate()}
              disabled={aiAdviceMutation.isPending || !items?.length}
            >
              {aiAdviceMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : <Zap size={16} />}
              AI Advisor
            </Button>
            <Button onClick={() => setIsAdding(true)} className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90" size="sm">
              <Plus size={16} /> Add Service
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="text-[10px] uppercase font-bold">Service / Description</TableHead>
                <TableHead className="text-[10px] uppercase font-bold">Supplier</TableHead>
                <TableHead className="text-[10px] uppercase font-bold">Unit Cost</TableHead>
                <TableHead className="text-[10px] uppercase font-bold">Markup</TableHead>
                <TableHead className="text-[10px] uppercase font-bold">Total Cost (SGD)</TableHead>
                <TableHead className="text-[10px] uppercase font-bold text-accent">Selling (SGD)</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isAdding && (
                <TableRow className="bg-accent/5">
                  <TableCell className="min-w-[200px]">
                    <div className="space-y-2">
                      <Select value={selectedSupplierId} onValueChange={setSelectedSupplierId}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select Supplier" /></SelectTrigger>
                        <SelectContent>
                          {suppliers?.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      {selectedSupplierId && (
                        <Select value={selectedServiceId} onValueChange={setSelectedServiceId}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select Variation" /></SelectTrigger>
                          <SelectContent>
                            {currentSupplier?.services.map(ser => <SelectItem key={ser.id} value={ser.id}>{ser.name} ({ser.currency} {ser.cost})</SelectItem>)}
                          </SelectContent>
                        </Select>
                      )}
                      <Input 
                        placeholder="Manual Description" 
                        value={formData.description} 
                        className="h-8 text-xs"
                        onChange={e => setFormData({...formData, description: e.target.value})} 
                      />
                    </div>
                  </TableCell>
                  <TableCell className="text-xs font-bold text-muted-foreground">{formData.supplierName || '-'}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <Input 
                          type="number" 
                          value={formData.unitCost} 
                          className="h-8 w-20 text-xs"
                          onChange={e => setFormData({...formData, unitCost: Number(e.target.value), isManualOverride: true})} 
                        />
                        <span className="text-[10px] font-bold">{formData.currency}</span>
                      </div>
                      {formData.isManualOverride && (
                        <Badge variant="outline" className="text-[8px] text-orange-600 border-orange-200 h-4 gap-1">
                          <CheckCircle2 size={8} /> MANUAL
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Input 
                        type="number" 
                        value={formData.markupPercent} 
                        className="h-8 w-14 text-xs"
                        onChange={e => setFormData({...formData, markupPercent: Number(e.target.value)})} 
                      />
                      <span className="text-xs">%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs font-bold">
                    ${(formData.unitCost * formData.quantity).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-xs font-bold text-accent">
                    ${(formData.unitCost * formData.quantity * (1 + formData.markupPercent / 100)).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Button size="sm" className="h-7 text-[10px]" onClick={() => addItemMutation.mutate(formData)} disabled={!formData.description || addItemMutation.isPending}>Save</Button>
                      <Button size="sm" variant="ghost" className="h-7 text-[10px]" onClick={() => setIsAdding(false)}>Cancel</Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-12"><Loader2 className="animate-spin mx-auto text-primary" /></TableCell></TableRow>
              ) : items?.length === 0 && !isAdding ? (
                <TableRow><TableCell colSpan={7} className="text-center py-20 text-muted-foreground italic">No costing items added to this set yet.</TableCell></TableRow>
              ) : items?.map(item => (
                <TableRow key={item.id} className="group">
                  <TableCell className="font-bold text-sm">{item.description}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{item.supplierName}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-xs font-medium">{item.currency} {item.unitCost.toLocaleString()}</span>
                      {item.isManualOverride && (
                        <span className="text-[8px] text-orange-600 font-bold uppercase flex items-center gap-0.5 mt-0.5">
                          <Info size={8} /> Manual Entry
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs font-bold">{item.markupPercent}%</TableCell>
                  <TableCell className="text-xs font-bold">${item.totalCostSgd.toLocaleString()}</TableCell>
                  <TableCell className="text-sm font-black text-accent">${item.sellingPriceSgd.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => deleteItemMutation.mutate(item.id)}>
                      <Trash2 size={16} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function StatsCard({ title, value, prefix = "", highlight = false }: { title: string, value: number, prefix?: string, highlight?: boolean }) {
  return (
    <Card className={`border-none shadow-sm ${highlight ? 'bg-primary text-primary-foreground' : 'bg-white'}`}>
      <CardHeader className="p-4 pb-1">
        <CardTitle className={`text-[10px] uppercase font-bold tracking-widest ${highlight ? 'text-white/70' : 'text-muted-foreground'}`}>{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="text-2xl font-black">{prefix}{value.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
      </CardContent>
    </Card>
  );
}
