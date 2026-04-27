import { WorldClassRideTicket } from "@/components/tickets/WorldClassRideTicket";
import type { RideReceipt } from "@/services/rideReceiptService";
import jsPDF from "jspdf";
import { toast } from "sonner";
import { format } from "date-fns";

interface RideReceiptCardProps {
  receipt: RideReceipt;
}

export const RideReceiptCard = ({ receipt }: RideReceiptCardProps) => {
  const handleDownloadPDF = async () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(16, 185, 129); // Emerald color
    doc.text("RIDE RECEIPT", 105, 20, { align: "center" });
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("todapayments.com", 105, 27, { align: "center" });
    
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text(`Receipt: ${receipt.receipt_number}`, 20, 40);
    doc.text(`Date: ${format(new Date(receipt.created_at), 'PPP')}`, 20, 48);
    
    // Route
    doc.setFontSize(14);
    doc.setTextColor(16, 185, 129);
    doc.text("Trip Details", 20, 62);
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.text(`From: ${receipt.pickup_address}`, 20, 72);
    doc.text(`To: ${receipt.dropoff_address}`, 20, 80);
    
    if (receipt.pickup_time) {
      doc.text(`Pickup: ${format(new Date(receipt.pickup_time), 'p')}`, 20, 90);
    }
    if (receipt.dropoff_time) {
      doc.text(`Dropoff: ${format(new Date(receipt.dropoff_time), 'p')}`, 100, 90);
    }
    
    // Trip Stats
    doc.text(`Distance: ${receipt.distance_km?.toFixed(1) || 0} km`, 20, 100);
    doc.text(`Duration: ${receipt.duration_mins || 0} min`, 100, 100);
    
    // Driver
    doc.setFontSize(14);
    doc.setTextColor(16, 185, 129);
    doc.text("Driver", 20, 115);
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.text(receipt.driver_name, 20, 125);
    
    // Fare breakdown
    doc.setFontSize(14);
    doc.setTextColor(16, 185, 129);
    doc.text("Fare Breakdown", 20, 140);
    doc.setFontSize(10);
    doc.setTextColor(0);
    
    const fareY = 150;
    doc.text("Base fare", 20, fareY);
    doc.text(`$${receipt.base_fare.toFixed(2)}`, 170, fareY, { align: "right" });
    
    doc.text(`Distance (${receipt.distance_km?.toFixed(1) || 0} km)`, 20, fareY + 8);
    doc.text(`$${receipt.distance_fare.toFixed(2)}`, 170, fareY + 8, { align: "right" });
    
    doc.text(`Time (${receipt.duration_mins || 0} min)`, 20, fareY + 16);
    doc.text(`$${receipt.time_fare.toFixed(2)}`, 170, fareY + 16, { align: "right" });
    
    let offsetY = 24;
    if (receipt.surge_amount > 0) {
      doc.setTextColor(234, 88, 12); // Orange
      doc.text("Surge", 20, fareY + offsetY);
      doc.text(`$${receipt.surge_amount.toFixed(2)}`, 170, fareY + offsetY, { align: "right" });
      offsetY += 8;
    }
    
    if (receipt.tip_amount > 0) {
      doc.setTextColor(16, 185, 129); // Green
      doc.text("Tip", 20, fareY + offsetY);
      doc.text(`$${receipt.tip_amount.toFixed(2)}`, 170, fareY + offsetY, { align: "right" });
      offsetY += 8;
    }
    
    // Line
    doc.setDrawColor(200);
    doc.line(20, fareY + offsetY + 2, 190, fareY + offsetY + 2);
    
    // Total
    doc.setFontSize(14);
    doc.setTextColor(16, 185, 129);
    doc.text("Total", 20, fareY + offsetY + 12);
    doc.text(`$${receipt.total_amount.toFixed(2)}`, 170, fareY + offsetY + 12, { align: "right" });
    
    // Payment
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.text(`Payment: ${receipt.payment_method.charAt(0).toUpperCase() + receipt.payment_method.slice(1)} - ${receipt.payment_status}`, 20, fareY + offsetY + 24);
    
    // Footer
    doc.setFontSize(9);
    doc.setTextColor(150);
    doc.text("Thank you for riding with us! • todapayments.com", 105, 280, { align: "center" });
    
    // Save
    doc.save(`ride-receipt-${receipt.receipt_number}.pdf`);
    toast.success("Receipt downloaded!");
  };

  // Transform receipt to ride details format
  const rideDetails = {
    id: receipt.id,
    receipt_number: receipt.receipt_number,
    pickup_address: receipt.pickup_address,
    dropoff_address: receipt.dropoff_address,
    pickup_time: receipt.pickup_time,
    dropoff_time: receipt.dropoff_time,
    distance_km: receipt.distance_km,
    duration_mins: receipt.duration_mins,
    driver_name: receipt.driver_name,
    driver_photo: receipt.driver_photo,
    driver_rating: receipt.driver_rating,
    vehicle_type: receipt.vehicle_type,
    vehicle_plate: receipt.vehicle_plate,
    base_fare: receipt.base_fare,
    distance_fare: receipt.distance_fare,
    time_fare: receipt.time_fare,
    surge_amount: receipt.surge_amount,
    tip_amount: receipt.tip_amount,
    total_amount: receipt.total_amount,
    payment_method: receipt.payment_method,
    payment_status: receipt.payment_status,
    passenger_name: receipt.passenger_name,
    passenger_email: receipt.passenger_email || undefined,
    created_at: receipt.created_at,
  };

  return (
    <WorldClassRideTicket
      ride={rideDetails}
      onDownloadPDF={handleDownloadPDF}
    />
  );
};

export default RideReceiptCard;
