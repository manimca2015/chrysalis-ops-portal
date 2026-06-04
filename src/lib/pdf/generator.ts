
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
  introduction?: string;
  terms?: string;
}

export const generateQuotationPDF = (data: PDFData) => {
  const { project, costingSet, items, installments, documentTitle, introduction, terms } = data;
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

  let currentY = 100;

  // Introduction
  if (introduction) {
    doc.setFontSize(12);
    doc.setTextColor(45, 90, 105);
    doc.text('INTRODUCTION', 15, currentY);
    currentY += 7;
    doc.setFontSize(10);
    doc.setTextColor(80);
    const splitIntro = doc.splitTextToSize(introduction, 180);
    doc.text(splitIntro, 15, currentY);
    currentY += (splitIntro.length * 5) + 10;
  }

  // Line Items Table
  autoTable(doc, {
    startY: currentY,
    head: [['Description', 'Qty', 'Unit Price (SGD)', 'Total (SGD)']],
    body: items.map(item => [
      item.description,
      item.quantity,
      (item.sellingPriceSgd / item.quantity).toLocaleString(undefined, { minimumFractionDigits: 2 }),
      item.sellingPriceSgd.toLocaleString(undefined, { minimumFractionDigits: 2 })
    ]),
    theme: 'grid',
    headStyles: { fillColor: [45, 90, 105] },
    styles: { fontSize: 9 }
  });

  currentY = (doc as any).lastAutoTable.finalY + 10;

  // Totals
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text(`TOTAL AGREED PRICE:`, 110, currentY);
  doc.setFontSize(14);
  doc.setTextColor(97, 204, 179); // --accent color
  doc.text(`SGD ${costingSet.totalSellingSgd.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 155, currentY);

  currentY += 15;

  // Payment Schedule
  if (installments.length > 0) {
    // Check for page overflow
    if (currentY > 230) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFontSize(12);
    doc.setTextColor(45, 90, 105);
    doc.text('PAYMENT SCHEDULE', 15, currentY);
    
    autoTable(doc, {
      startY: currentY + 5,
      head: [['Milestone', '%', 'Amount (SGD)']],
      body: installments.map(i => [
        i.label,
        `${i.percentage}%`,
        i.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })
      ]),
      theme: 'plain',
      styles: { fontSize: 8 }
    });
    
    currentY = (doc as any).lastAutoTable.finalY + 15;
  }

  // Terms & Conditions
  if (terms) {
    if (currentY > 230) {
      doc.addPage();
      currentY = 20;
    }
    doc.setFontSize(12);
    doc.setTextColor(45, 90, 105);
    doc.text('TERMS & CONDITIONS', 15, currentY);
    currentY += 7;
    doc.setFontSize(8);
    doc.setTextColor(120);
    const splitTerms = doc.splitTextToSize(terms, 180);
    doc.text(splitTerms, 15, currentY);
  }

  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Page ${i} of ${pageCount} | Chrysalis Tours Singapore`, 15, 285);
  }

  return doc;
};
