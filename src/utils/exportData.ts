export const exportToCSV = (data: any[], filename: string) => {
  if (!data || data.length === 0) {
    console.error("No data to export");
    return;
  }

  // Get headers from first object
  const headers = Object.keys(data[0]);
  
  // Create CSV content
  const csvContent = [
    headers.join(","),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Handle values that contain commas or quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value ?? '';
      }).join(",")
    )
  ].join("\n");

  // Create blob and download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToPDF = async (elementId: string, filename: string) => {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      console.error("Element not found:", elementId);
      return;
    }
    const html2canvas = (await import("html2canvas")).default;
    const { jsPDF } = await import("jspdf");
    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(filename);
  } catch (error) {
    console.error("PDF export failed:", error);
  }
};

export const prepareBookingsForExport = (bookings: any[]) => {
  return bookings.map(booking => ({
    'Booking Reference': booking.booking_reference,
    'Passenger Name': booking.passenger_name,
    'Email': booking.passenger_email,
    'Phone': booking.passenger_phone,
    'Item Name': booking.item_name,
    'Date': booking.travel_date || booking.event_date,
    'Status': booking.status,
    'Payment Status': booking.payment_status,
    'Total Price': booking.total_price,
    'Created At': new Date(booking.created_at).toLocaleString(),
  }));
};

export const prepareRevenueForExport = (revenue: any[]) => {
  return revenue.map(item => ({
    'Date': item.date || item.travel_date || item.event_date,
    'Revenue': item.revenue || item.total_price,
    'Bookings': item.bookings || 1,
    'Payment Status': item.payment_status,
    'Status': item.status,
  }));
};

export const prepareCustomersForExport = (customers: any[]) => {
  return customers.map(customer => ({
    'Name': customer.name,
    'Email': customer.email,
    'Phone': customer.phone || 'N/A',
    'Total Bookings': customer.totalBookings,
    'Total Spent': customer.totalSpent,
    'Last Booking': new Date(customer.lastBooking).toLocaleDateString(),
  }));
};

export const prepareSchedulesForExport = (schedules: any[]) => {
  return schedules.map(schedule => ({
    'Route': `${schedule.from_location} → ${schedule.to_location}`,
    'Date': new Date(schedule.available_date).toLocaleDateString(),
    'Departure': schedule.departure_time,
    'Arrival': schedule.arrival_time,
    'Duration': schedule.duration,
    'Price': schedule.base_price,
    'Available Seats': schedule.available_seats,
  }));
};

export const prepareAttendeesForExport = (attendees: any[]) => {
  return attendees.map(attendee => ({
    'Booking Reference': attendee.booking_reference,
    'Name': attendee.passenger_name,
    'Email': attendee.passenger_email,
    'Event': attendee.item_name,
    'Date': new Date(attendee.event_date).toLocaleDateString(),
    'Time': attendee.event_time,
    'Tickets': attendee.ticket_quantity,
    'Status': attendee.status,
    'Checked In': attendee.checked_in ? 'Yes' : 'No',
  }));
};
