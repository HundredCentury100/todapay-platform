import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { createWorkspaceReview } from "@/services/workspaceReviewService";
import { Star, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface WorkspaceReviewDialogProps {
  workspaceId: string;
  workspaceName: string;
  bookingId?: string;
  onReviewSubmitted?: () => void;
  trigger?: React.ReactNode;
}

export const WorkspaceReviewDialog = ({
  workspaceId,
  workspaceName,
  bookingId,
  onReviewSubmitted,
  trigger
}: WorkspaceReviewDialogProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [spaceRating, setSpaceRating] = useState(0);
  const [serviceRating, setServiceRating] = useState(0);
  const [valueRating, setValueRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to leave a review",
        variant: "destructive"
      });
      return;
    }

    if (rating === 0) {
      toast({
        title: "Rating required",
        description: "Please select an overall rating",
        variant: "destructive"
      });
      return;
    }

    if (comment.trim().length < 10) {
      toast({
        title: "Review too short",
        description: "Please write at least 10 characters",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createWorkspaceReview({
        workspace_id: workspaceId,
        booking_id: bookingId,
        rating,
        space_rating: spaceRating || undefined,
        service_rating: serviceRating || undefined,
        value_rating: valueRating || undefined,
        title: `Review for ${workspaceName}`,
        comment
      });
      
      if (result.data) {
        toast({
          title: "Review submitted",
          description: "Thank you for your feedback!"
        });
        setOpen(false);
        setRating(0);
        setSpaceRating(0);
        setServiceRating(0);
        setValueRating(0);
        setComment("");
        onReviewSubmitted?.();
      } else {
        throw new Error("Failed to submit review");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit review. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStarInput = (
    value: number,
    setValue: (val: number) => void,
    size: "sm" | "lg" = "sm"
  ) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => setValue(star)}
          className="p-0.5 transition-transform hover:scale-110"
        >
          <Star
            className={cn(
              size === "lg" ? "h-8 w-8" : "h-5 w-5",
              "transition-colors",
              star <= value
                ? "fill-yellow-400 text-yellow-400"
                : "text-muted-foreground"
            )}
          />
        </button>
      ))}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <MessageSquare className="h-4 w-4 mr-2" />
            Write Review
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Review Your Experience</DialogTitle>
          <DialogDescription>
            Share your thoughts about {workspaceName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Overall Rating */}
          <div className="space-y-2">
            <Label>Overall Rating *</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={cn(
                      "h-8 w-8 transition-colors",
                      (hoveredRating || rating) >= star
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground"
                    )}
                  />
                </button>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              {rating === 1 && "Poor"}
              {rating === 2 && "Fair"}
              {rating === 3 && "Good"}
              {rating === 4 && "Very Good"}
              {rating === 5 && "Excellent"}
            </p>
          </div>

          {/* Category Ratings */}
          <div className="space-y-3 border-t pt-4">
            <p className="text-sm font-medium text-muted-foreground">Rate specific aspects (optional)</p>
            
            <div className="flex items-center justify-between">
              <Label className="text-sm">Space Quality</Label>
              {renderStarInput(spaceRating, setSpaceRating)}
            </div>
            
            <div className="flex items-center justify-between">
              <Label className="text-sm">Service</Label>
              {renderStarInput(serviceRating, setServiceRating)}
            </div>
            
            <div className="flex items-center justify-between">
              <Label className="text-sm">Value for Money</Label>
              {renderStarInput(valueRating, setValueRating)}
            </div>
          </div>

          {/* Review Comment */}
          <div className="space-y-2">
            <Label htmlFor="comment">Your Review *</Label>
            <Textarea
              id="comment"
              placeholder="Tell us about your experience..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              {comment.length}/500 characters
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Review"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
