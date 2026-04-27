import jsPDF from 'jspdf';
import QRCode from 'qrcode';

interface TicketData {
  bookingReference: string;
  ticketNumber: string;
  itemName: string;
  passengerName: string;
  passengerEmail: string;
  passengerPhone: string;
  totalPrice: number;
  currency: string;
  type: 'bus' | 'event' | 'stay';
  // Bus specific
  from?: string;
  to?: string;
  date?: string;
  departureTime?: string;
  arrivalTime?: string;
  selectedSeats?: string[];
  operator?: string;
  // Event specific
  eventDate?: string;
  eventTime?: string;
  eventVenue?: string;
  ticketQuantity?: number;
  qrCodeData?: string;
  // Stay specific
  checkInDate?: string;
  checkOutDate?: string;
  propertyCity?: string;
  roomName?: string;
  numGuests?: number;
  numRooms?: number;
}

export const generateEnhancedPDF = async (ticketData: TicketData) => {
  try {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = 210;
    const margin = 15;
    const contentWidth = pageWidth - (2 * margin);
    let yPos = 20;

    // Helper function to add text
    const addText = (text: string, x: number, y: number, size: number, style: 'normal' | 'bold' = 'normal', align: 'left' | 'center' | 'right' = 'left') => {
      pdf.setFontSize(size);
      pdf.setFont('helvetica', style);
      if (align === 'center') {
        pdf.text(text, x, y, { align: 'center' });
      } else if (align === 'right') {
        pdf.text(text, x, y, { align: 'right' });
      } else {
        pdf.text(text, x, y);
      }
    };

    // Header - Premium gradient effect
    pdf.setFillColor(102, 126, 234); // Primary color
    pdf.rect(0, 0, pageWidth, 50, 'F');
    
    pdf.setTextColor(255, 255, 255);
    addText('TodaPay', pageWidth / 2, 20, 24, 'bold', 'center');
    addText('Premium Travel & Events Platform', pageWidth / 2, 28, 10, 'normal', 'center');
    addText(ticketData.type === 'bus' ? 'BUS TICKET' : 'EVENT TICKET', pageWidth / 2, 40, 16, 'bold', 'center');

    yPos = 65;
    pdf.setTextColor(0, 0, 0);

    // Booking Reference - Prominent
    pdf.setFillColor(248, 250, 252);
    pdf.roundedRect(margin, yPos, contentWidth, 20, 3, 3, 'F');
    addText('BOOKING REFERENCE', margin + 5, yPos + 7, 8, 'normal');
    addText(ticketData.bookingReference, margin + 5, yPos + 15, 18, 'bold');
    yPos += 30;

    // Main Content Area
    if (ticketData.type === 'bus') {
      // Bus Journey Details
      pdf.setDrawColor(200, 200, 200);
      pdf.setLineWidth(0.5);
      pdf.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 10;

      addText('JOURNEY DETAILS', margin, yPos, 12, 'bold');
      yPos += 10;

      // Route
      pdf.setFillColor(102, 126, 234);
      pdf.setTextColor(255, 255, 255);
      pdf.roundedRect(margin, yPos, (contentWidth / 2) - 2, 25, 2, 2, 'F');
      addText('FROM', margin + 5, yPos + 8, 8);
      addText(ticketData.from || '', margin + 5, yPos + 18, 14, 'bold');

      pdf.roundedRect(margin + (contentWidth / 2) + 2, yPos, (contentWidth / 2) - 2, 25, 2, 2, 'F');
      addText('TO', margin + (contentWidth / 2) + 7, yPos + 8, 8);
      addText(ticketData.to || '', margin + (contentWidth / 2) + 7, yPos + 18, 14, 'bold');
      
      yPos += 35;
      pdf.setTextColor(0, 0, 0);

      // Time & Date
      pdf.setFillColor(248, 250, 252);
      pdf.roundedRect(margin, yPos, contentWidth, 30, 2, 2, 'F');
      
      addText('DATE', margin + 5, yPos + 8, 8);
      addText(ticketData.date || '', margin + 5, yPos + 16, 11, 'bold');
      
      addText('DEPARTURE', margin + 70, yPos + 8, 8);
      addText(ticketData.departureTime || '', margin + 70, yPos + 16, 11, 'bold');
      
      addText('ARRIVAL', margin + 130, yPos + 8, 8);
      addText(ticketData.arrivalTime || '', margin + 130, yPos + 16, 11, 'bold');

      yPos += 40;

      // Seats
      if (ticketData.selectedSeats && ticketData.selectedSeats.length > 0) {
        pdf.setFillColor(240, 253, 244);
        pdf.roundedRect(margin, yPos, contentWidth, 18, 2, 2, 'F');
        addText('SEAT(S)', margin + 5, yPos + 7, 8);
        pdf.setTextColor(34, 197, 94);
        addText(ticketData.selectedSeats.join(', '), margin + 5, yPos + 14, 16, 'bold');
        pdf.setTextColor(0, 0, 0);
        yPos += 25;
      }
    } else if (ticketData.type === 'stay') {
      // Stay/Hotel Details
      pdf.setDrawColor(200, 200, 200);
      pdf.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 10;

      addText('STAY DETAILS', margin, yPos, 12, 'bold');
      yPos += 10;

      // Check-in/Check-out
      pdf.setFillColor(217, 119, 6); // Amber color
      pdf.setTextColor(255, 255, 255);
      pdf.roundedRect(margin, yPos, (contentWidth / 2) - 2, 25, 2, 2, 'F');
      addText('CHECK-IN', margin + 5, yPos + 8, 8);
      addText(ticketData.checkInDate || '', margin + 5, yPos + 18, 11, 'bold');

      pdf.roundedRect(margin + (contentWidth / 2) + 2, yPos, (contentWidth / 2) - 2, 25, 2, 2, 'F');
      addText('CHECK-OUT', margin + (contentWidth / 2) + 7, yPos + 8, 8);
      addText(ticketData.checkOutDate || '', margin + (contentWidth / 2) + 7, yPos + 18, 11, 'bold');
      
      yPos += 35;
      pdf.setTextColor(0, 0, 0);

      // Property & Room Details
      pdf.setFillColor(248, 250, 252);
      pdf.roundedRect(margin, yPos, contentWidth, 40, 2, 2, 'F');
      
      addText('LOCATION', margin + 5, yPos + 8, 8);
      addText(ticketData.propertyCity || '', margin + 5, yPos + 16, 11, 'bold');
      
      addText('ROOM', margin + 100, yPos + 8, 8);
      addText(ticketData.roomName || '', margin + 100, yPos + 16, 11, 'bold');
      
      addText('GUESTS', margin + 5, yPos + 26, 8);
      addText(String(ticketData.numGuests || 1), margin + 5, yPos + 34, 11, 'bold');
      
      addText('ROOMS', margin + 100, yPos + 26, 8);
      addText(String(ticketData.numRooms || 1), margin + 100, yPos + 34, 11, 'bold');

      yPos += 50;
    } else {
      // Event Details
      pdf.setDrawColor(200, 200, 200);
      pdf.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 10;

      addText('EVENT DETAILS', margin, yPos, 12, 'bold');
      yPos += 10;

      pdf.setFillColor(248, 250, 252);
      pdf.roundedRect(margin, yPos, contentWidth, 40, 2, 2, 'F');
      
      addText('DATE', margin + 5, yPos + 8, 8);
      addText(ticketData.eventDate || '', margin + 5, yPos + 16, 11, 'bold');
      
      addText('TIME', margin + 70, yPos + 8, 8);
      addText(ticketData.eventTime || '', margin + 70, yPos + 16, 11, 'bold');
      
      addText('VENUE', margin + 5, yPos + 26, 8);
      addText(ticketData.eventVenue || '', margin + 5, yPos + 34, 10, 'bold');

      yPos += 50;

      if (ticketData.selectedSeats && ticketData.selectedSeats.length > 0) {
        pdf.setFillColor(240, 253, 244);
        pdf.roundedRect(margin, yPos, contentWidth, 18, 2, 2, 'F');
        addText('SEAT(S)', margin + 5, yPos + 7, 8);
        pdf.setTextColor(34, 197, 94);
        addText(ticketData.selectedSeats.join(', '), margin + 5, yPos + 14, 16, 'bold');
        pdf.setTextColor(0, 0, 0);
        yPos += 25;
      }
    }

    // Guest/Passenger Information
    pdf.setDrawColor(200, 200, 200);
    pdf.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;

    addText(ticketData.type === 'stay' ? 'GUEST INFORMATION' : 'PASSENGER INFORMATION', margin, yPos, 12, 'bold');
    yPos += 10;

    pdf.setFillColor(248, 250, 252);
    pdf.roundedRect(margin, yPos, contentWidth, 35, 2, 2, 'F');
    
    addText('NAME', margin + 5, yPos + 8, 8);
    addText(ticketData.passengerName, margin + 5, yPos + 16, 11, 'bold');
    
    addText('EMAIL', margin + 100, yPos + 8, 8);
    addText(ticketData.passengerEmail, margin + 100, yPos + 16, 9);
    
    addText('PHONE', margin + 5, yPos + 26, 8);
    addText(ticketData.passengerPhone || 'N/A', margin + 5, yPos + 33, 10, 'bold');

    yPos += 45;

    // QR Code - Enhanced quality
    const qrCodeDataUrl = await QRCode.toDataURL(
      ticketData.qrCodeData || JSON.stringify({
        ref: ticketData.bookingReference,
        ticket: ticketData.ticketNumber,
        type: ticketData.type.toUpperCase(),
        passenger: ticketData.passengerName,
        phone: ticketData.passengerPhone,
        verified: true
      }),
      { width: 600, margin: 2, errorCorrectionLevel: 'H' }
    );

    const qrSize = 55;
    const qrX = (pageWidth - qrSize) / 2;
    pdf.addImage(qrCodeDataUrl, 'PNG', qrX, yPos, qrSize, qrSize);
    
    yPos += qrSize + 5;
    const scanText = ticketData.type === 'bus' ? 'boarding gate' : ticketData.type === 'stay' ? 'check-in desk' : 'venue entrance';
    addText('Scan at ' + scanText, pageWidth / 2, yPos, 9, 'normal', 'center');
    yPos += 6;
    pdf.setTextColor(80, 80, 80);
    addText(ticketData.ticketNumber, pageWidth / 2, yPos, 8, 'bold', 'center');
    pdf.setTextColor(0, 0, 0);
    yPos += 12;

    // Price
    pdf.setFillColor(102, 126, 234);
    pdf.setTextColor(255, 255, 255);
    pdf.roundedRect(margin, yPos, contentWidth, 15, 2, 2, 'F');
    addText('TOTAL AMOUNT', margin + 5, yPos + 6, 8);
    addText(`${ticketData.currency} ${ticketData.totalPrice.toFixed(2)}`, pageWidth - margin - 5, yPos + 10, 14, 'bold', 'right');
    yPos += 20;
    pdf.setTextColor(0, 0, 0);

    // Footer
    pdf.setDrawColor(200, 200, 200);
    pdf.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 8;

    pdf.setFontSize(8);
    pdf.setTextColor(100, 100, 100);
    addText('⚠ Important: Arrive 30 minutes early • Keep this ticket secure • Valid ID required', margin, yPos, 8);
    yPos += 5;
    addText('Help: todapayments.com/help • Terms: todapayments.com/terms', margin, yPos, 7);
    yPos += 10;
    pdf.setDrawColor(200, 200, 200);
    pdf.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 5;
    addText(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, yPos, 7, 'normal', 'center');

    // Save PDF
    const fileName = `TodaPay-${ticketData.type}-${ticketData.bookingReference}.pdf`;
    pdf.save(fileName);

    return { success: true, fileName };
  } catch (error) {
    console.error('Error generating PDF:', error);
    return { success: false, error };
  }
};
