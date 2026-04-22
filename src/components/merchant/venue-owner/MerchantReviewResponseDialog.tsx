import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Star, User } from "lucide-react";
import { respondToVenueReview, VenueReview } from "@/services/venueReviewService";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface MerchantReviewResponseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  review: VenueReview | null;
  onResponseSubmitted?: () => void;
}

const MerchantReviewResponseDialog = ({
  open,
  onOpenChange,
  review,
  onResponseSubmitted,
}: MerchantReviewResponseDialogProps) => {
  const [response, setResponse] = useState(review?.merchant_response || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!review) return;

    if (!response.trim()) {
      toast({
        title: "Response required",
        description: "Please enter a response",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    const { success, error } = await respondToVenueReview(review.id, response.trim());

    setIsSubmitting(false);

    if (!success || error) {
      toast({
        title: "Error",
        description: "Failed to submit response. Please try again.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Response submitted",
      description: "Your response has been added to the review.",
    });

    setResponse("");
    onOpenChange(false);
    onResponseSubmitted?.();
  };

  const renderStars = (rating: number) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            "w-4 h-4",
            star <= rating
              ? "fill-amber-400 text-amber-400"
              : "text-muted-foreground/30"
          )}
        />
      ))}
    </div>
  );

  if (!review) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Respond to Review</DialogTitle>
          <DialogDescription>
            Your response will be visible to all visitors
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Original Review */}
          <div className="p-4 bg-muted/50 rounded-lg space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <User className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {review.profiles?.full_name || 'Anonymous Guest'}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(review.created_at), 'MMM d, yyyy')}
                  </span>
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  {renderStars(review.rating)}
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium">{review.title}</h4>
              <p className="text-sm text-muted-foreground mt-1">{review.comment}</p>
            </div>

            {review.venue && (
              <div className="text-xs text-muted-foreground">
                Venue: {review.venue.name}
              </div>
            )}
          </div>

          {/* Response Input */}
          <div>
            <Label htmlFor="response">Your Response</Label>
            <Textarea
              id="response"
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder="Thank the guest for their feedback and address any concerns..."
              rows={4}
              maxLength={500}
              className="mt-1.5"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {response.length}/500 characters
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? "Submitting..." : review.merchant_response ? "Update Response" : "Submit Response"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MerchantReviewResponseDialog;
