
"use client"

import React, { use, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getProjectById, 
  getCostingSets, 
  getCostingItems, 
  createCostingSet, 
  addCostingItem,
  deleteCostingItem,
  getSuppliers
} from '@/services/mgmt-service';
import { CostingSet, CostingItem } from '@/types';
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
} from '@/components/ui/table';
import { 
  Plus, 
  Trash2, 
  Calculator, 
  TrendingUp, 
  DollarSign, 
  ChevronRight,
  ArrowLeft,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

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

  if (!project) return null;

  const selectedSet = sets?.find(s => s.id === selectedSetId);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/app/projects/${id}`}><ArrowLeft size={18} /></Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">Project Costing</h1>
          <p className="text-muted-foreground">{project.title}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Costing Options Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Options</CardTitle>
              <CardDescription>Select a pricing scenario</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {setsLoading ? (
                  <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>
                ) : sets?.map(set => (
                  <button
                    key={set.id}
                    onClick={() => setSelectedSetId(set.id)}
                    className={`w-full text-left p-3 rounded-md border transition-all ${
                      selectedSetId === set.id 
                        ? 'bg-primary text-primary-foreground border-primary' 
                        : 'hover:bg-muted border-transparent'
                    }`}
                  >
                    <div className="font-bold flex justify-between items-center">
                      <span>{set.name}</span>
                      {set.isWinningOption && <Badge className="bg-accent text-[8px]">WINNING</Badge>}
                    </div>
                    <div className="text-xs opacity-70 mt-1">
                      Selling: ${set.totalSellingSgd.toLocaleString()}
                    </div>
                  </button>
                ))}
              </div>

              <div className="pt-4 border-t space-y-2">
                <Label htmlFor="new-set">New Option Name</Label>
                <div className="flex gap-2">
                  <Input 
                    id="new-set" 
                    placeholder="e.g. Premium" 
                    value={newSetName}
                    onChange={e => setNewSetName(e.target.value)}
                  />
                  <Button size="icon" onClick={() => createSetMutation.mutate(newSetName)} disabled={!newSetName}>
                    <Plus size={18} />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Costing Workspace */}
        <div className="lg:col-span-3">
          {selectedSet ? (
            <CostingWorkspace set={selectedSet} />
          ) : (
            <Card className="h-full flex flex-col items-center justify-center p-12 text-center border-dashed">
              <Calculator size={48} className="text-muted-foreground mb-4 opacity-20" />
              <h3 className="text-xl font-bold">Select a Costing Set</h3>
              <p className="text-muted-foreground max-w-xs mx-auto">
                Choose an existing option from the sidebar or create a new one to start adding items.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function CostingWorkspace({ set }: { set: CostingSet }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    supplierName: '',
    unitCost: 0,
    quantity: 1,
    currency: 'SGD',
    exchangeRate: 1,
    markupPercent: 15,
  });

  const { data: items, isLoading } = useQuery({
    queryKey: ['costing-items', set.id],
    queryFn: () => getCostingItems(set.id),
  });

  const addItemMutation = useMutation({
    mutationFn: (data: any) => {
      const totalCostSgd = data.unitCost * data.quantity * data.exchangeRate;
      const sellingPriceSgd = totalCostSgd * (1 + data.markupPercent / 100);
      return addCostingItem(set.id, {
        ...data,
        totalCostSgd,
        sellingPriceSgd,
        isManualOverride: false
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['costing-items', set.id] });
      queryClient.invalidateQueries({ queryKey: ['costing-sets'] });
      setIsAdding(false);
      toast({ title: 'Item Added' });
    }
  });

  const deleteItemMutation = useMutation({
    mutationFn: (itemId: string) => deleteCostingItem(set.id, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['costing-items', set.id] });
      queryClient.invalidateQueries({ queryKey: ['costing-sets'] });
      toast({ title: 'Item Removed' });
    }
  });

  return (
    <div className="space-y-6">
      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Total Cost (SGD)</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">${set.totalCostSgd.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
          </CardContent>
        </Card>
        <Card className="bg-accent/5 border-accent/20">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Selling Price (SGD)</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-accent">${set.totalSellingSgd.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Estimated Profit</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">${set.profitSgd.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Margin %</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold">{set.marginPercent.toFixed(1)}%</div>
              {set.marginPercent < 15 && (
                <Badge variant="destructive" className="h-5 text-[9px] gap-1">
                  <AlertTriangle size={10} /> LOW
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Items Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Line Items: {set.name}</CardTitle>
            <CardDescription>Breakdown of all costs for this option</CardDescription>
          </div>
          <Button onClick={() => setIsAdding(true)} className="gap-2">
            <Plus size={16} /> Add Item
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service / Description</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Unit Cost</TableHead>
                <TableHead>Total Cost (SGD)</TableHead>
                <TableHead>Markup</TableHead>
                <TableHead>Selling (SGD)</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isAdding && (
                <TableRow className="bg-muted/50">
                  <TableCell><Input placeholder="Description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} /></TableCell>
                  <TableCell><Input placeholder="Supplier" value={formData.supplierName} onChange={e => setFormData({...formData, supplierName: e.target.value})} /></TableCell>
                  <TableCell className="w-20"><Input type="number" value={formData.quantity} onChange={e => setFormData({...formData, quantity: Number(e.target.value)})} /></TableCell>
                  <TableCell>
                    <div className="flex gap-1 items-center">
                      <Input className="w-20" type="number" value={formData.unitCost} onChange={e => setFormData({...formData, unitCost: Number(e.target.value)})} />
                      <span className="text-[10px] font-bold">SGD</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    ${(formData.unitCost * formData.quantity).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Input className="w-16" type="number" value={formData.markupPercent} onChange={e => setFormData({...formData, markupPercent: Number(e.target.value)})} />
                      <span className="text-xs">%</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-bold text-accent">
                    ${(formData.unitCost * formData.quantity * (1 + formData.markupPercent / 100)).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => addItemMutation.mutate(formData)}>Save</Button>
                      <Button size="sm" variant="ghost" onClick={() => setIsAdding(false)}>Cancel</Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {isLoading ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8">Loading items...</TableCell></TableRow>
              ) : items?.length === 0 && !isAdding ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground italic">No items added yet.</TableCell></TableRow>
              ) : items?.map(item => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.description}</TableCell>
                  <TableCell className="text-xs">{item.supplierName}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>${item.unitCost.toLocaleString()} {item.currency}</TableCell>
                  <TableCell>${item.totalCostSgd.toLocaleString()}</TableCell>
                  <TableCell>{item.markupPercent}%</TableCell>
                  <TableCell className="font-bold text-accent">${item.sellingPriceSgd.toLocaleString()}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => deleteItemMutation.mutate(item.id)}>
                      <Trash2 size={16} className="text-destructive" />
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
