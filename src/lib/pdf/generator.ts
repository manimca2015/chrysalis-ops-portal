
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Project, CostingSet, CostingItem, Installment } from '@/types';
import { format } from 'date-fns';

export interface PDFData {
  project: Project;
  costingSet: CostingSet;
  items: CostingItem[];
  installments: Installment[];
  documentTitle: string;
}

export const generateQuotationPDF = (data: PDFData) => {
  const { project, costingSet, items, installments, documentTitle } = data;
  const doc = new jsPDF();

  // Header
  doc.setFontSize(22);
  doc.setTextColor(45, 90, 105); // --primary color
  doc.text('CHRYSALIS TOURS', 15, 20);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text('Singapore Explorer Specialist', 15, 26);

  doc.setFontSize(16);
  doc.setTextColor(0);
  doc.text(documentTitle.toUpperCase(), 15, 45);

  // Project Info
  doc.setFontSize(10);
  doc.text(`QUOTATION ID: ${project.id.slice(0, 8).toUpperCase()}`, 140, 45);
  doc.text(`DATE: ${format(new Date(), 'dd MMM yyyy')}`, 140, 50);

  // Client Info
  doc.setFontSize(11);
  doc.setTextColor(45, 90, 105);
  doc.text('PREPARED FOR:', 15, 65);
  doc.setTextColor(0);
  doc.setFontSize(10);
  doc.text(project.customerDetails.name, 15, 72);
  doc.text(project.customerDetails.email, 15, 77);
  if (project.customerDetails.phone) doc.text(project.customerDetails.phone, 15, 82);

  // Project Description
  doc.setFontSize(12);
  doc.text('TOUR SUMMARY', 15, 95);
  doc.setFontSize(10);
  doc.setTextColor(80);
  const splitTitle = doc.splitTextToSize(project.title, 180);
  doc.text(splitTitle, 15, 102);

  // Line Items Table
  autoTable(doc, {
    startY: 115,
    head: [['Description', 'Qty', 'Unit Price (SGD)', 'Total (SGD)']],
    body: items.map(item => [
      item.description,
      item.quantity,
      item.sellingPriceSgd / item.quantity,
      item.sellingPriceSgd.toLocaleString(undefined, { minimumFractionDigits: 2 })
    ]),
    theme: 'grid',
    headStyles: { fillColor: [45, 90, 105] },
    styles: { fontSize: 9 }
  });

  // Totals
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text(`TOTAL AGREED PRICE:`, 110, finalY);
  doc.setFontSize(14);
  doc.setTextColor(97, 204, 179); // --accent color
  doc.text(`SGD ${costingSet.totalSellingSgd.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 155, finalY);

  // Payment Schedule
  if (installments.length > 0) {
    doc.setFontSize(12);
    doc.setTextColor(45, 90, 105);
    doc.text('PAYMENT SCHEDULE', 15, finalY + 15);
    
    autoTable(doc, {
      startY: finalY + 20,
      head: [['Milestone', '%', 'Amount (SGD)', 'Due Date']],
      body: installments.map(i => [
        i.label,
        `${i.percentage}%`,
        i.amount.toLocaleString(undefined, { minimumFractionDigits: 2 }),
        i.dueDate ? format(new Date(i.dueDate.toDate ? i.dueDate.toDate() : i.dueDate), 'dd MMM yyyy') : 'TBD'
      ]),
      theme: 'plain',
      styles: { fontSize: 8 }
    });
  }

  // Footer / Terms
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text('Thank you for choosing Chrysalis Tours. This quotation is valid for 14 days.', 15, pageHeight - 20);
  doc.text('Subject to availability at time of booking.', 15, pageHeight - 15);

  return doc;
};
