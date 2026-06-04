
"use client"

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getSupplierBills, 
  createSupplierBill, 
  recordSupplierPayment,
  getCostingItems,
  getCostingSets,
  getSuppliers
} from '@/services/mgmt-service';
import { SupplierBill, SupplierPayment, CostingItem } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
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
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Plus, 
  Receipt, 
  CreditCard, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  Upload,
  Calendar,
  Loader2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export function SupplierBillSection({ projectId }: { projectId: string }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [isPaying, setIsPaying] = useState<SupplierBill | null>(null);

  const [formData, setFormData] = useState({
    costingItemId: '',
    invoiceNumber: '',
    amount: 0,
    currency: 'SGD',
    issueDate: '',
    dueDate: '',
  });

  const [paymentData, setPaymentData] = useState({
    amount: 0,
    date: '',
    method: 'bank_transfer',
  });

  const { data: bills, isLoading } = useQuery({
    queryKey: ['supplier-bills', projectId],
    queryFn: () => getSupplierBills(projectId),
  });

  const { data: costingSets } = useQuery({
    queryKey: ['costing-sets', projectId],
    queryFn: () => getCostingSets(projectId),
  });

  const [selectedSetId, setSelectedSetId] = useState<string>('');
  const { data: costingItems } = useQuery({
    queryKey: ['costing-items', selectedSetId],
    queryFn: () => getCostingItems(selectedSetId),
    enabled: !!selectedSetId,
  });

  const addBillMutation = useMutation({
    mutationFn: (data: any) => {
      const item = costingItems?.find(i => i.id === data.costingItemId);
      return createSupplierBill(projectId, {
        ...data,
        projectId,
        supplierId: item?.supplierId || 'manual',
        supplierName: item?.supplierName || 'Manual Entry',
        status: 'awaiting_payment',
        issueDate: TimestampFromStr(data.issueDate),
        dueDate: TimestampFromStr(data.dueDate),
      }, user?.uid || 'system', user?.email || 'System');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-bills', projectId] });
      setIsAdding(false);
      resetForm();
      toast({ title: 'Supplier Bill Logged' });
    }
  });

  const payBillMutation = useMutation({
    mutationFn: (data: any) => recordSupplierPayment(isPaying!.id, {
      ...data,
      billId: isPaying!.id,
      date: TimestampFromStr(data.date),
    }, user?.uid || 'system', user?.email || 'System'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-bills', projectId] });
      setIsPaying(null);
      toast({ title: 'Payment Recorded' });
    }
  });

  const resetForm = () => {
    setFormData({
      costingItemId: '',
      invoiceNumber: '',
      amount: 0,
      currency: 'SGD',
      issueDate: '',
      dueDate: '',
    });
    setSelectedSetId('');
  };

  const TimestampFromStr = (dateStr: string) => {
    return dateStr ? new Date(dateStr) : new Date();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold">Supplier Invoices</h3>
          <p className="text-xs text-muted-foreground">Track outgoing payments to project vendors.</p>
        </div>
        <Dialog open={isAdding} onOpenChange={setIsAdding}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus size={16} /> Add Supplier Bill</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Log Supplier Invoice</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Costing Scenario</Label>
                  <Select value={selectedSetId} onValueChange={setSelectedSetId}>
                    <SelectTrigger><SelectValue placeholder="Select scenario" /></SelectTrigger>
                    <SelectContent>
                      {costingSets?.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Service Line Item</Label>
                  <Select value={formData.costingItemId} onValueChange={v => setFormData({...formData, costingItemId: v})}>
                    <SelectTrigger><SelectValue placeholder="Select item" /></SelectTrigger>
                    <SelectContent>
                      {costingItems?.map(i => <SelectItem key={i.id} value={i.id}>{i.supplierName}: {i.description}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Invoice Number</Label>
                  <Input placeholder="INV-001" value={formData.invoiceNumber} onChange={e => setFormData({...formData, invoiceNumber: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Total Amount</Label>
                  <div className="flex gap-2">
                    <Input type="number" value={formData.amount} onChange={e => setFormData({...formData, amount: Number(e.target.value)})} />
                    <Select value={formData.currency} onValueChange={v => setFormData({...formData, currency: v})}>
                      <SelectTrigger className="w-[80px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SGD">SGD</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="MYR">MYR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Issue Date</Label>
                  <Input type="date" value={formData.issueDate} onChange={e => setFormData({...formData, issueDate: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <Input type="date" value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAdding(false)}>Cancel</Button>
              <Button onClick={() => addBillMutation.mutate(formData)}>Record Bill</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="text-[10px] uppercase font-bold">Supplier</TableHead>
              <TableHead className="text-[10px] uppercase font-bold">Invoice #</TableHead>
              <TableHead className="text-[10px] uppercase font-bold">Amount</TableHead>
              <TableHead className="text-[10px] uppercase font-bold">Due Date</TableHead>
              <TableHead className="text-[10px] uppercase font-bold">Status</TableHead>
              <TableHead className="text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-12"><Loader2 className="animate-spin mx-auto text-primary" /></TableCell></TableRow>
            ) : bills?.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-20 text-muted-foreground italic">No supplier bills recorded for this project.</TableCell></TableRow>
            ) : bills?.map(bill => (
              <TableRow key={bill.id}>
                <TableCell>
                  <div className="font-bold text-sm">{bill.supplierName}</div>
                </TableCell>
                <TableCell className="text-xs">{bill.invoiceNumber}</TableCell>
                <TableCell className="font-bold text-sm">{bill.currency} {bill.amount.toLocaleString()}</TableCell>
                <TableCell className="text-xs">
                   <div className="flex items-center gap-1">
                     <Calendar size={12} className="text-muted-foreground" />
                     {format(bill.dueDate.toDate(), 'dd MMM yyyy')}
                   </div>
                </TableCell>
                <TableCell>
                  <Badge variant={bill.status === 'paid' ? 'default' : bill.status === 'overdue' ? 'destructive' : 'secondary'} className="text-[9px] uppercase font-bold">
                    {bill.status.replace('_', ' ')}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {bill.status !== 'paid' && (
                    <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1" onClick={() => {
                      setIsPaying(bill);
                      setPaymentData({...paymentData, amount: bill.amount});
                    }}>
                      <CreditCard size={12} /> Record Payment
                    </Button>
                  )}
                  {bill.status === 'paid' && (
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] gap-1">
                      <CheckCircle2 size={12} /> SETTLED
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!isPaying} onOpenChange={() => setIsPaying(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Supplier Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-3 bg-muted rounded-md flex justify-between items-center">
              <span className="text-sm font-bold">{isPaying?.supplierName}</span>
              <span className="text-sm font-black text-primary">{isPaying?.currency} {isPaying?.amount.toLocaleString()}</span>
            </div>
            <div className="space-y-2">
              <Label>Amount Paid</Label>
              <Input type="number" value={paymentData.amount} onChange={e => setPaymentData({...paymentData, amount: Number(e.target.value)})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Payment Date</Label>
                <Input type="date" value={paymentData.date} onChange={e => setPaymentData({...paymentData, date: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Method</Label>
                <Select value={paymentData.method} onValueChange={v => setPaymentData({...paymentData, method: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPaying(null)}>Cancel</Button>
            <Button onClick={() => payBillMutation.mutate(paymentData)} disabled={payBillMutation.isPending}>
              {payBillMutation.isPending ? "Recording..." : "Confirm Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
