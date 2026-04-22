import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface PropertyReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
  bookingId?: string;
  propertyName: string;
  onReviewSubmitted: () => void;
}

const RatingInput = ({ 
  label, 
  value, 
  onChange 
}: { 
  label: string; 
  value: number; 
  onChange: (val: number) => void 
}) => (
  <div className="flex items-center justify-between">
    <span className="text-sm text-muted-foreground">{label}</span>
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className="p-1 hover:scale-110 transition-transform"
        >
          <Star
            className={cn(
              "w-5 h-5 transition-colors",
              star <= value 
                ? "fill-amber-400 text-amber-400" 
                : "text-muted-foreground/40"
            )}
          />
        </button>
      ))}
    </div>
  </div>
);

export const PropertyReviewDialog = ({
  open,
  onOpenChange,
  propertyId,
  bookingId,
  propertyName,
  onReviewSubmitted,
}: PropertyReviewDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [rating, setRating] = useState(5);
  const [cleanlinessRating, setCleanlinessRating] = useState(5);
  const [locationRating, setLocationRating] = useState(5);
  const [serviceRating, setServiceRating] = useState(5);
  const [valueRating, setValueRating] = useState(5);

  const handleSubmit = async () => {
    if (!title.trim() || !comment.trim()) {
      toast.error("Please fill in title and comment");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Please sign in to submit a review");
        return;
      }

      const { error } = await supabase
        .from('property_reviews')
        .insert({
          property_id: propertyId,
          booking_id: bookingId,
          user_id: user.id,
          rating,
          cleanliness_rating: cleanlinessRating,
          location_rating: locationRating,
          service_rating: serviceRating,
          value_rating: valueRating,
          title,
          comment,
        });

      if (error) throw error;

      toast.success("Review submitted successfully!");
      onReviewSubmitted();
      onOpenChange(false);
      
      // Reset form
      setTitle("");
      setComment("");
      setRating(5);
      setCleanlinessRating(5);
      setLocationRating(5);
      setServiceRating(5);
      setValueRating(5);
    } catch (error) {
      console.error("Error submitting review:", error);
      toast.error("Failed to submit review");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Review your stay</DialogTitle>
          <DialogDescription>
            Share your experience at {propertyName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Overall Rating */}
          <div className="space-y-2">
            <Label>Overall Rating</Label>
            <div className="flex gap-1 justify-center py-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1 hover:scale-110 transition-transform"
                >
                  <Star
                    className={cn(
                      "w-8 h-8 transition-colors",
                      star <= rating 
                        ? "fill-amber-400 text-amber-400" 
                        : "text-muted-foreground/40"
                    )}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Category Ratings */}
          <div className="space-y-3 p-4 bg-muted rounded-lg">
            <RatingInput 
              label="Cleanliness" 
              value={cleanlinessRating} 
              onChange={setCleanlinessRating} 
            />
            <RatingInput 
              label="Location" 
              value={locationRating} 
              onChange={setLocationRating} 
            />
            <RatingInput 
              label="Service" 
              value={serviceRating} 
              onChange={setServiceRating} 
            />
            <RatingInput 
              label="Value for money" 
              value={valueRating} 
              onChange={setValueRating} 
            />
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="review-title">Title</Label>
            <Input
              id="review-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Summarize your experience"
            />
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <Label htmlFor="review-comment">Your Review</Label>
            <Textarea
              id="review-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell us about your stay..."
              rows={4}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button 
              className="flex-1"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? "Submitting..." : "Submit Review"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
