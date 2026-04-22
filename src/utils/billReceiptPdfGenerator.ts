import jsPDF from 'jspdf';

export interface BillReceiptData {
  reference: string;
  billerName: string;
  billerType: string;
  accountNumber: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  dateTime: string;
  status: string;
  // ZESA-specific
  tokens?: string[];
  kwh?: string;
  energyCharge?: string;
  debt?: string;
  reaLevy?: string;
  vat?: string;
}

const escapeHtml = (text: string): string => {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

export const generateBillReceiptPDF = async (data: BillReceiptData): Promise<jsPDF> => {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [80, 200] });

  const pageWidth = 80;
  const margin = 6;
  const cw = pageWidth - margin * 2;
  let y = 10;

  const text = (t: string, x: number, yp: number, size: number, style: 'normal' | 'bold' = 'normal', align: 'left' | 'center' | 'right' = 'left') => {
    pdf.setFontSize(size);
    pdf.setFont('helvetica', style);
    pdf.text(escapeHtml(t), x, yp, { align });
  };

  const line = (yp: number) => {
    pdf.setDrawColor(200);
    pdf.setLineWidth(0.2);
    pdf.line(margin, yp, pageWidth - margin, yp);
  };

  const row = (label: string, value: string, yp: number) => {
    text(label, margin, yp, 7, 'normal');
    text(value, pageWidth - margin, yp, 7, 'bold', 'right');
  };

  // Header
  pdf.setFillColor(82, 113, 255);
  pdf.rect(0, 0, pageWidth, 22, 'F');
  pdf.setTextColor(255);
  text('SUVAT PAY', pageWidth / 2, 8, 10, 'bold', 'center');
  text('Payment Receipt', pageWidth / 2, 14, 7, 'normal', 'center');
  text(`Ref: ${data.reference}`, pageWidth / 2, 19, 6, 'normal', 'center');
  pdf.setTextColor(0);

  y = 28;

  // Status badge
  text('✓ PAYMENT SUCCESSFUL', pageWidth / 2, y, 8, 'bold', 'center');
  y += 6;
  line(y); y += 4;

  // Merchant info
  text('MERCHANT', margin, y, 6, 'normal');
  y += 4;
  text(data.billerName, margin, y, 9, 'bold');
  y += 5;
  text(data.billerType, margin, y, 6, 'normal');
  y += 5;
  line(y); y += 4;

  // Account details
  row('Account', data.accountNumber, y); y += 5;
  row('Amount', `${data.currency} ${data.amount.toFixed(2)}`, y); y += 5;
  row('Payment', data.paymentMethod === 'suvat_pay' ? 'Suvat Pay' : data.paymentMethod, y); y += 5;
  row('Date', data.dateTime, y); y += 5;
  line(y); y += 4;

  // ZESA-specific token section
  if (data.tokens && data.tokens.length > 0) {
    text('TOKEN(S)', margin, y, 7, 'bold');
    y += 5;
    data.tokens.forEach((token, i) => {
      if (data.tokens!.length > 1) {
        text(`Token ${i + 1}:`, margin, y, 6, 'normal');
        y += 4;
      }
      text(token, pageWidth / 2, y, 9, 'bold', 'center');
      y += 6;
    });
    if (data.tokens.length > 1) {
      text('⚠ Enter tokens in order shown', pageWidth / 2, y, 5, 'normal', 'center');
      y += 4;
    }
    line(y); y += 4;

    if (data.kwh) { row('KwH', data.kwh, y); y += 5; }
    if (data.energyCharge) { row('Energy', data.energyCharge, y); y += 5; }
    if (data.debt) { row('Debt', data.debt, y); y += 5; }
    if (data.reaLevy) { row('REA Levy', data.reaLevy, y); y += 5; }
    if (data.vat) { row('VAT', data.vat, y); y += 5; }
    line(y); y += 4;
  }

  // Total
  pdf.setFillColor(245, 245, 245);
  pdf.rect(margin, y - 2, cw, 8, 'F');
  text('TOTAL', margin + 2, y + 3, 8, 'bold');
  text(`${data.currency} ${data.amount.toFixed(2)}`, pageWidth - margin - 2, y + 3, 8, 'bold', 'right');
  y += 12;

  // Footer
  line(y); y += 4;
  pdf.setTextColor(130);
  text('Powered by Suvat Pay', pageWidth / 2, y, 6, 'normal', 'center');
  y += 3;
  text('Suvat Group · suvat.co.zw', pageWidth / 2, y, 5, 'normal', 'center');
  y += 4;
  text('Thank you for your payment', pageWidth / 2, y, 5, 'normal', 'center');

  return pdf;
};

export const downloadBillReceipt = async (data: BillReceiptData) => {
  const pdf = await generateBillReceiptPDF(data);
  pdf.save(`receipt-${data.reference}.pdf`);
};

export const getBillReceiptBlob = async (data: BillReceiptData): Promise<Blob> => {
  const pdf = await generateBillReceiptPDF(data);
  return pdf.output('blob');
};
