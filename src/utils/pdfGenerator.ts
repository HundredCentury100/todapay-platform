import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import QRCode from 'qrcode';
import Barcode from 'react-barcode';

// HTML escape function to prevent XSS attacks
const escapeHtml = (unsafe: string | null | undefined): string => {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

// Generate QR code as base64 image
const generateQRCodeImage = async (data: string): Promise<string> => {
  try {
    return await QRCode.toDataURL(data, {
      width: 250,
      margin: 2,
      errorCorrectionLevel: 'H',
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });
  } catch (error) {
    console.error('Error generating QR code:', error);
    return '';
  }
};

// Generate barcode as SVG data URL
const generateBarcodeImage = (value: string): string => {
  try {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="400" height="80">
        <rect width="400" height="80" fill="white"/>
        <text x="200" y="70" font-family="monospace" font-size="12" text-anchor="middle" fill="black">${value}</text>
      </svg>
    `;
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  } catch (error) {
    console.error('Error generating barcode:', error);
    return '';
  }
};

export const generateBookingPDF = async (bookingData: any, ticketNumber: string) => {
  try {
    const isEventBooking = bookingData.booking_type === 'event';
    
    // Create a temporary container for the ticket
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.width = '800px';
    container.style.padding = '40px';
    container.style.backgroundColor = 'white';
    container.style.fontFamily = 'Arial, sans-serif';
    
    // Generate QR code and barcode for event tickets
    let qrCodeImage = '';
    let barcodeImage = '';
    if (isEventBooking && bookingData.qr_code_data) {
      qrCodeImage = await generateQRCodeImage(bookingData.qr_code_data);
      barcodeImage = generateBarcodeImage(bookingData.ticket_number);
    }
    
    // Build the ticket HTML
    if (isEventBooking) {
      container.innerHTML = `
        <div style="border: 3px solid #333; padding: 30px; border-radius: 12px; background: linear-gradient(to bottom, #ffffff 0%, #f9f9f9 100%);">
          <!-- Header with Platform Branding -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; margin: -30px -30px 20px -30px; border-radius: 12px 12px 0 0; text-align: center; color: white;">
            <h1 style="margin: 0 0 5px 0; font-size: 28px;">fulticket.com</h1>
            <p style="margin: 0; font-size: 12px; opacity: 0.9;">Your Premium Event Platform</p>
          </div>
          
          <!-- Event Title -->
          <div style="text-align: center; margin-bottom: 25px;">
            <h2 style="color: #333; margin: 0 0 10px 0; font-size: 24px;">${escapeHtml(bookingData.item_name)}</h2>
            <div style="display: inline-block; background: #667eea; color: white; padding: 5px 15px; border-radius: 15px; font-size: 12px;">
              ADMIT ONE
            </div>
          </div>
          
          <!-- Event Details -->
          <div style="border: 2px dashed #ccc; padding: 20px; margin: 20px 0; border-radius: 8px; background: white;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
              <div style="padding: 10px; background: #f5f5f5; border-radius: 6px;">
                <strong style="color: #667eea; display: block; margin-bottom: 5px;">📅 Date</strong>
                <div style="font-size: 16px; font-weight: bold;">${new Date(bookingData.event_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
              </div>
              <div style="padding: 10px; background: #f5f5f5; border-radius: 6px;">
                <strong style="color: #667eea; display: block; margin-bottom: 5px;">🕐 Time</strong>
                <div style="font-size: 16px; font-weight: bold;">${escapeHtml(bookingData.event_time)}</div>
              </div>
              <div style="padding: 10px; background: #f5f5f5; border-radius: 6px; grid-column: span 2;">
                <strong style="color: #667eea; display: block; margin-bottom: 5px;">📍 Venue</strong>
                <div style="font-size: 14px;">${escapeHtml(bookingData.event_venue)}</div>
              </div>
              <div style="padding: 10px; background: #f5f5f5; border-radius: 6px;">
                <strong style="color: #667eea; display: block; margin-bottom: 5px;">🎟️ Tickets</strong>
                <div style="font-size: 16px; font-weight: bold;">${bookingData.ticket_quantity}</div>
              </div>
              ${bookingData.selected_seats && bookingData.selected_seats.length > 0 ? `
              <div style="padding: 10px; background: #667eea; color: white; border-radius: 6px;">
                <strong style="display: block; margin-bottom: 5px;">🪑 Seats</strong>
                <div style="font-size: 18px; font-weight: bold;">${bookingData.selected_seats.join(', ')}</div>
              </div>
              ` : ''}
            </div>
          </div>
          
          <!-- Attendee Information -->
          <div style="margin: 20px 0; padding: 15px; background: white; border-radius: 8px; border: 1px solid #e0e0e0;">
            <h3 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Attendee Information</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
              <div>
                <strong style="color: #666; font-size: 12px;">Name:</strong>
                <div style="margin-top: 3px; font-size: 14px;">${escapeHtml(bookingData.passenger_name)}</div>
              </div>
              <div>
                <strong style="color: #666; font-size: 12px;">Email:</strong>
                <div style="margin-top: 3px; font-size: 14px;">${escapeHtml(bookingData.passenger_email)}</div>
              </div>
              <div>
                <strong style="color: #666; font-size: 12px;">Phone:</strong>
                <div style="margin-top: 3px; font-size: 14px;">${escapeHtml(bookingData.passenger_phone)}</div>
              </div>
              <div>
                <strong style="color: #666; font-size: 12px;">Total Price:</strong>
                <div style="margin-top: 3px; font-size: 18px; font-weight: bold; color: #667eea;">
                  ${bookingData.total_price} KES
                </div>
              </div>
            </div>
          </div>
          
          <!-- QR Code & Barcode Section -->
          ${qrCodeImage ? `
          <div style="margin: 25px 0; text-align: center; padding: 25px; background: white; border-radius: 8px; border: 2px solid #667eea;">
            <h3 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">📱 Scan for Entry</h3>
            <div style="background: white; padding: 15px; display: inline-block; border-radius: 8px;">
              <img src="${qrCodeImage}" alt="QR Code" style="width: 250px; height: 250px; display: block; margin: 0 auto;" />
            </div>
            <p style="color: #666; font-size: 12px; margin-top: 15px;">
              Show this QR code at the venue entrance
            </p>
            ${barcodeImage ? `
            <div style="margin-top: 20px; padding: 15px; background: white; border-radius: 8px;">
              <div style="text-align: center; margin-bottom: 10px;">
                <strong style="color: #666; font-size: 12px;">TICKET NUMBER</strong>
              </div>
              <div style="font-family: monospace; font-size: 16px; font-weight: bold; color: #333; letter-spacing: 2px;">
                ${escapeHtml(bookingData.ticket_number)}
              </div>
            </div>
            ` : ''}
          </div>
          ` : ''}
          
          <!-- Security & Instructions -->
          <div style="border-top: 2px solid #e0e0e0; padding-top: 20px; margin-top: 25px; background: #f9f9f9; padding: 20px; border-radius: 8px;">
            <div style="text-align: center; margin-bottom: 15px;">
              <strong style="color: #667eea; font-size: 14px;">⚠️ Important Instructions</strong>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
              <p style="color: #666; font-size: 12px; margin: 5px 0;">
                ✓ Arrive 30 minutes early
              </p>
              <p style="color: #666; font-size: 12px; margin: 5px 0;">
                ✓ Carry valid ID proof
              </p>
              <p style="color: #666; font-size: 12px; margin: 5px 0;">
                ✓ Keep ticket secure
              </p>
              <p style="color: #666; font-size: 12px; margin: 5px 0;">
                ✓ No screenshots accepted
              </p>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="text-align: center; margin-top: 25px; padding-top: 20px; border-top: 2px solid #e0e0e0;">
            <div style="color: #667eea; font-weight: bold; font-size: 16px; margin-bottom: 5px;">
              fulticket.com
            </div>
            <div style="color: #999; font-size: 11px;">
              Booking Reference: ${escapeHtml(bookingData.booking_reference)} | Powered by fulticket.com
            </div>
            <div style="color: #999; font-size: 11px; margin-top: 5px;">
              Help: fulticket.com/help | Terms: fulticket.com/terms
            </div>
          </div>
        </div>
      `;
    } else {
      // Original bus ticket HTML
      container.innerHTML = `
        <div style="border: 2px solid #333; padding: 30px; border-radius: 8px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #333; margin: 0 0 10px 0;">Bus Ticket</h1>
            <p style="color: #666; margin: 0;">Booking Reference: ${escapeHtml(bookingData.booking_reference)}</p>
          </div>
          
          <div style="border-top: 2px dashed #ccc; border-bottom: 2px dashed #ccc; padding: 20px 0; margin: 20px 0;">
            <h2 style="color: #333; margin-bottom: 15px;">Journey Details</h2>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
              <div>
                <strong style="color: #666;">From:</strong>
                <div style="font-size: 18px; margin-top: 5px;">${escapeHtml(bookingData.from_location)}</div>
              </div>
              <div>
                <strong style="color: #666;">To:</strong>
                <div style="font-size: 18px; margin-top: 5px;">${escapeHtml(bookingData.to_location)}</div>
              </div>
              <div>
                <strong style="color: #666;">Departure:</strong>
                <div style="margin-top: 5px;">${escapeHtml(bookingData.departure_time)}</div>
              </div>
              <div>
                <strong style="color: #666;">Arrival:</strong>
                <div style="margin-top: 5px;">${escapeHtml(bookingData.arrival_time)}</div>
              </div>
              <div>
                <strong style="color: #666;">Date:</strong>
                <div style="margin-top: 5px;">${escapeHtml(bookingData.travel_date)}</div>
              </div>
              <div>
                <strong style="color: #666;">Operator:</strong>
                <div style="margin-top: 5px;">${escapeHtml(bookingData.operator)}</div>
              </div>
            </div>
          </div>
          
          <div style="margin: 20px 0;">
            <h2 style="color: #333; margin-bottom: 15px;">Passenger Information</h2>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
              <div>
                <strong style="color: #666;">Name:</strong>
                <div style="margin-top: 5px;">${escapeHtml(bookingData.passenger_name)}</div>
              </div>
              <div>
                <strong style="color: #666;">Email:</strong>
                <div style="margin-top: 5px;">${escapeHtml(bookingData.passenger_email)}</div>
              </div>
              <div>
                <strong style="color: #666;">Phone:</strong>
                <div style="margin-top: 5px;">${escapeHtml(bookingData.passenger_phone)}</div>
              </div>
              <div>
                <strong style="color: #666;">Seats:</strong>
                <div style="margin-top: 5px;">${bookingData.selected_seats?.join(', ') || 'N/A'}</div>
              </div>
            </div>
          </div>
          
          <div style="margin: 20px 0;">
            <h2 style="color: #333; margin-bottom: 15px;">Booking Details</h2>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
              <div>
                <strong style="color: #666;">Ticket Number:</strong>
                <div style="margin-top: 5px; font-family: monospace;">${ticketNumber}</div>
              </div>
              <div>
                <strong style="color: #666;">Total Price:</strong>
                <div style="margin-top: 5px; font-size: 18px; font-weight: bold; color: #333;">
                  ${bookingData.total_price} KES
                </div>
              </div>
              <div>
                <strong style="color: #666;">Status:</strong>
                <div style="margin-top: 5px; color: #22c55e; font-weight: bold;">${bookingData.status.toUpperCase()}</div>
              </div>
              <div>
                <strong style="color: #666;">Payment Status:</strong>
                <div style="margin-top: 5px; color: #22c55e;">${bookingData.payment_status.toUpperCase()}</div>
              </div>
            </div>
          </div>
          
          <div style="border-top: 2px solid #ccc; padding-top: 20px; margin-top: 30px;">
            <p style="color: #666; font-size: 12px; margin: 5px 0;">
              • Please arrive at the bus stop at least 15 minutes before departure
            </p>
            <p style="color: #666; font-size: 12px; margin: 5px 0;">
              • Carry a valid ID proof for verification
            </p>
            <p style="color: #666; font-size: 12px; margin: 5px 0;">
              • This ticket is non-transferable
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #999; font-size: 11px; margin: 0;">
              Generated on ${new Date().toLocaleString()}
            </p>
          </div>
        </div>
      `;
    }
    
    document.body.appendChild(container);
    
    // Generate canvas from HTML
    const canvas = await html2canvas(container, {
      scale: 2,
      backgroundColor: '#ffffff',
      logging: false,
    });
    
    // Remove temporary container
    document.body.removeChild(container);
    
    // Create PDF
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });
    
    const imgWidth = 210; // A4 width in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    
    // Download the PDF
    const fileName = `ticket-${ticketNumber}-${bookingData.booking_reference}.pdf`;
    pdf.save(fileName);
    
    return { success: true };
  } catch (error) {
    console.error('Error generating PDF:', error);
    return { success: false, error };
  }
};

export const printBooking = () => {
  window.print();
};

/**
 * Generate multi-ticket PDF for group bookings
 * Creates one PDF with separate pages for each ticket
 */
export const generateMultiTicketPDF = async (bookingData: any, ticketNumbers: string[]) => {
  try {
    const pdf = new jsPDF('p', 'mm', 'a4');
    let isFirstPage = true;

    // Generate a page for each ticket
    for (let i = 0; i < bookingData.ticket_quantity; i++) {
      if (!isFirstPage) {
        pdf.addPage();
      }

      // Create individual ticket data
      const individualTicket = {
        ...bookingData,
        ticket_quantity: 1,
        selected_seats: bookingData.selected_seats ? [bookingData.selected_seats[i]] : [],
        ticket_number: ticketNumbers[i] || `${bookingData.ticket_number}-${i + 1}`,
        qr_code_data: bookingData.qr_code_data ? `${bookingData.qr_code_data}-${i + 1}` : undefined,
        passenger_name: bookingData.additional_passengers?.[i]?.name || bookingData.passenger_name,
        passenger_email: bookingData.additional_passengers?.[i]?.email || bookingData.passenger_email,
        passenger_phone: bookingData.additional_passengers?.[i]?.phone || bookingData.passenger_phone,
      };

      // Generate ticket HTML
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.width = '800px';
      container.style.padding = '40px';
      container.style.backgroundColor = 'white';
      container.style.fontFamily = 'Arial, sans-serif';

      // Generate QR code for this specific ticket
      let qrCodeImage = '';
      if (individualTicket.qr_code_data) {
        qrCodeImage = await generateQRCodeImage(individualTicket.qr_code_data);
      }

      // Build ticket HTML (simplified version focusing on key info)
      container.innerHTML = `
        <div style="border: 3px solid #333; padding: 30px; border-radius: 12px; background: white;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; margin: -30px -30px 20px -30px; border-radius: 12px 12px 0 0; text-align: center; color: white;">
            <h1 style="margin: 0 0 5px 0; font-size: 28px;">fulticket.com</h1>
            <p style="margin: 0; font-size: 12px;">Ticket ${i + 1} of ${bookingData.ticket_quantity}</p>
          </div>
          
          <div style="text-align: center; margin-bottom: 25px;">
            <h2 style="color: #333; margin: 0 0 10px 0;">${individualTicket.item_name}</h2>
            <div style="display: inline-block; background: #667eea; color: white; padding: 5px 15px; border-radius: 15px; font-size: 12px;">
              ADMIT ONE
            </div>
          </div>
          
          <div style="border: 2px dashed #ccc; padding: 20px; margin: 20px 0; border-radius: 8px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
              <div style="padding: 10px; background: #f5f5f5; border-radius: 6px;">
                <strong style="color: #667eea;">Date</strong>
                <div style="font-size: 16px; font-weight: bold;">${new Date(individualTicket.event_date).toLocaleDateString()}</div>
              </div>
              <div style="padding: 10px; background: #f5f5f5; border-radius: 6px;">
                <strong style="color: #667eea;">Time</strong>
                <div style="font-size: 16px; font-weight: bold;">${individualTicket.event_time}</div>
              </div>
              ${individualTicket.selected_seats && individualTicket.selected_seats.length > 0 ? `
              <div style="padding: 10px; background: #667eea; color: white; border-radius: 6px; grid-column: span 2;">
                <strong>Seat</strong>
                <div style="font-size: 24px; font-weight: bold;">${individualTicket.selected_seats[0]}</div>
              </div>
              ` : ''}
            </div>
          </div>
          
          <div style="margin: 20px 0; padding: 15px; background: white; border-radius: 8px; border: 1px solid #e0e0e0;">
            <strong>Attendee:</strong> ${individualTicket.passenger_name}<br>
            <strong>Email:</strong> ${individualTicket.passenger_email}<br>
            <strong>Ticket #:</strong> ${individualTicket.ticket_number}
          </div>
          
          ${qrCodeImage ? `
          <div style="text-align: center; padding: 20px;">
            <img src="${qrCodeImage}" style="width: 200px; height: 200px;" />
            <p style="font-size: 12px; color: #666; margin-top: 10px;">Scan at venue entrance</p>
          </div>
          ` : ''}
          
          <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 2px solid #e0e0e0;">
            <div style="color: #667eea; font-weight: bold;">fulbooking.com</div>
            <div style="color: #999; font-size: 11px;">Ref: ${bookingData.booking_reference}</div>
          </div>
        </div>
      `;

      document.body.appendChild(container);
      const canvas = await html2canvas(container, { scale: 2, useCORS: true, logging: false });
      document.body.removeChild(container);

      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      isFirstPage = false;
    }

    pdf.save(`tickets-${bookingData.booking_reference}.pdf`);
    return { success: true };
  } catch (error) {
    console.error('Error generating multi-ticket PDF:', error);
    return { success: false, error };
  }
};
