import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface TransferRatingModalProps {
  open: boolean;
  onClose: () => void;
  transferId: string;
  driverName: string;
  driverPhoto?: string | null;
  finalPrice: number;
}

export const TransferRatingModal = ({
  open,
  onClose,
  transferId,
  driverName,
  driverPhoto,
  finalPrice
}: TransferRatingModalProps) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [hoveredRating, setHoveredRating] = useState(0);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Use raw insert since the table was just created and types aren't updated yet
      const { error } = await supabase
        .from('transfer_ratings' as any)
        .insert({
          transfer_request_id: transferId,
          user_id: user?.id,
          rating,
          comment: comment.trim() || null,
          is_driver_rating: true
        });

      if (error) throw error;
      
      toast.success("Thank you for your feedback!");
      onClose();
    } catch (error) {
      console.error('Rating error:', error);
      toast.error("Failed to submit rating");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Rate your transfer</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Driver Avatar */}
          <div className="flex flex-col items-center">
            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center overflow-hidden mb-3">
              {driverPhoto ? (
                <img src={driverPhoto} alt={driverName} className="h-full w-full object-cover" />
              ) : (
                <User className="h-10 w-10 text-primary-foreground" />
              )}
            </div>
            <p className="font-semibold text-lg">{driverName}</p>
            <p className="text-sm text-muted-foreground">R{finalPrice.toFixed(0)} trip</p>
          </div>

          {/* Star Rating */}
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="focus:outline-none transition-transform hover:scale-110"
              >
                <Star
                  className={cn(
                    "h-10 w-10 transition-colors",
                    (hoveredRating || rating) >= star
                      ? "fill-primary text-primary"
                      : "text-muted-foreground"
                  )}
                />
              </button>
            ))}
          </div>

          {/* Comment */}
          <Textarea
            placeholder="Add a comment (optional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
          />

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Skip
            </Button>
            <Button className="flex-1" onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Submitting..." : "Submit"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
