import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { respondToWorkspaceReview, WorkspaceReview } from "@/services/workspaceReviewService";
import { Star } from "lucide-react";
import { format, parseISO } from "date-fns";

interface MerchantWorkspaceReviewResponseDialogProps {
  review: WorkspaceReview;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResponseSubmitted: () => void;
}

export const MerchantWorkspaceReviewResponseDialog = ({
  review,
  open,
  onOpenChange,
  onResponseSubmitted
}: MerchantWorkspaceReviewResponseDialogProps) => {
  const { toast } = useToast();
  const [response, setResponse] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (response.trim().length < 10) {
      toast({
        title: "Response too short",
        description: "Please write at least 10 characters",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await respondToWorkspaceReview(review.id, response.trim());
      
      if (result.success) {
        toast({
          title: "Response submitted",
          description: "Your response has been added to the review"
        });
        setResponse("");
        onResponseSubmitted();
      } else {
        throw new Error("Failed to submit response");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit response. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (rating: number) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${
            star <= rating
              ? "fill-yellow-400 text-yellow-400"
              : "text-muted-foreground"
          }`}
        />
      ))}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Respond to Review</DialogTitle>
          <DialogDescription>
            Your response will be publicly visible
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Original Review */}
          <div className="p-4 rounded-lg bg-muted/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">
                {review.profiles?.full_name || "Customer"}
              </span>
              <div className="flex items-center gap-2">
                {renderStars(review.rating)}
                <span className="text-xs text-muted-foreground">
                  {format(parseISO(review.created_at), 'MMM d, yyyy')}
                </span>
              </div>
            </div>
            {review.title && (
              <p className="font-medium text-sm">{review.title}</p>
            )}
            <p className="text-sm text-muted-foreground">{review.comment}</p>
          </div>

          {/* Response Input */}
          <div className="space-y-2">
            <Label htmlFor="response">Your Response</Label>
            <Textarea
              id="response"
              placeholder="Thank you for your feedback..."
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">
              {response.length}/500 characters
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Response"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
