import jsPDF from "jspdf";

interface PermissionSlipData {
  eventName: string;
  eventDate: string;
  eventTime: string;
  venue: string;
  studentName: string;
  grade?: string;
  guardianName: string;
  emergencyContact: string;
  emergencyPhone: string;
  medicalConditions?: string;
  allergies?: string;
  medications?: string;
  bookingReference: string;
  schoolName?: string;
  reportingTime?: string;
}

export const generatePermissionSlip = (data: PermissionSlipData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPosition = 20;

  // Header
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("Event Permission Slip", pageWidth / 2, yPosition, { align: "center" });
  
  yPosition += 15;
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(`Booking Reference: ${data.bookingReference}`, pageWidth / 2, yPosition, { align: "center" });

  yPosition += 15;

  // Event Details Section
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Event Information", 20, yPosition);
  yPosition += 8;

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  
  const eventDetails = [
    `Event: ${data.eventName}`,
    `Date: ${data.eventDate}`,
    `Time: ${data.eventTime}`,
    ...(data.reportingTime ? [`Reporting Time: ${data.reportingTime}`] : []),
    `Venue: ${data.venue}`,
    ...(data.schoolName ? [`School: ${data.schoolName}`] : [])
  ];

  eventDetails.forEach(detail => {
    doc.text(detail, 20, yPosition);
    yPosition += 6;
  });

  yPosition += 5;

  // Student Information Section
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Student Information", 20, yPosition);
  yPosition += 8;

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  
  doc.text(`Student Name: ${data.studentName}`, 20, yPosition);
  yPosition += 6;
  
  if (data.grade) {
    doc.text(`Grade/Year: ${data.grade}`, 20, yPosition);
    yPosition += 6;
  }

  yPosition += 5;

  // Emergency Contact Section
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Emergency Contact Information", 20, yPosition);
  yPosition += 8;

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  
  doc.text(`Guardian Name: ${data.guardianName}`, 20, yPosition);
  yPosition += 6;
  doc.text(`Emergency Contact: ${data.emergencyContact}`, 20, yPosition);
  yPosition += 6;
  doc.text(`Emergency Phone: ${data.emergencyPhone}`, 20, yPosition);
  yPosition += 8;

  // Medical Information Section
  if (data.medicalConditions || data.allergies || data.medications) {
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Medical Information", 20, yPosition);
    yPosition += 8;

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    
    if (data.medicalConditions) {
      doc.text("Medical Conditions:", 20, yPosition);
      yPosition += 6;
      const conditions = doc.splitTextToSize(data.medicalConditions, pageWidth - 40);
      doc.text(conditions, 25, yPosition);
      yPosition += conditions.length * 6 + 3;
    }

    if (data.allergies) {
      doc.text("Allergies:", 20, yPosition);
      yPosition += 6;
      const allergies = doc.splitTextToSize(data.allergies, pageWidth - 40);
      doc.text(allergies, 25, yPosition);
      yPosition += allergies.length * 6 + 3;
    }

    if (data.medications) {
      doc.text("Medications:", 20, yPosition);
      yPosition += 6;
      const medications = doc.splitTextToSize(data.medications, pageWidth - 40);
      doc.text(medications, 25, yPosition);
      yPosition += medications.length * 6 + 3;
    }

    yPosition += 5;
  }

  // Consent Section
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Parental Consent", 20, yPosition);
  yPosition += 10;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  
  const consentText = [
    "I hereby give permission for my child to participate in the above-mentioned event.",
    "I understand that reasonable care will be taken to ensure the safety of all participants.",
    "I authorize event staff to obtain emergency medical treatment if necessary.",
    "I have provided accurate medical information and emergency contact details."
  ];

  consentText.forEach(text => {
    const lines = doc.splitTextToSize(text, pageWidth - 40);
    doc.text(lines, 20, yPosition);
    yPosition += lines.length * 5 + 2;
  });

  yPosition += 10;

  // Signature Section
  doc.setFontSize(11);
  doc.text("Parent/Guardian Signature: _________________________", 20, yPosition);
  yPosition += 10;
  doc.text("Date: _____________", 20, yPosition);
  yPosition += 10;
  doc.text("Print Name: _________________________", 20, yPosition);

  // Footer
  yPosition = doc.internal.pageSize.getHeight() - 20;
  doc.setFontSize(9);
  doc.setFont("helvetica", "italic");
  doc.text("This permission slip must be signed and presented at event check-in.", pageWidth / 2, yPosition, { align: "center" });
  doc.text(`Generated on ${new Date().toLocaleDateString()}`, pageWidth / 2, yPosition + 5, { align: "center" });

  // Save the PDF
  doc.save(`Permission_Slip_${data.bookingReference}.pdf`);
};
