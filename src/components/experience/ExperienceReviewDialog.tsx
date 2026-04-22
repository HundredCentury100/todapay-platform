import { useState } from "react";
import { ResponsiveModal, ResponsiveModalHeader, ResponsiveModalTitle, ResponsiveModalDescription } from "@/components/ui/responsive-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ExperienceReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  experienceId: string;
  onReviewSubmitted?: () => void;
}

export const ExperienceReviewDialog = ({
  open,
  onOpenChange,
  experienceId,
  onReviewSubmitted,
}: ExperienceReviewDialogProps) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }
    if (!comment.trim()) {
      toast.error("Please write a comment");
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to write a review");
        return;
      }

      const { error } = await supabase.from("experience_reviews").insert({
        experience_id: experienceId,
        user_id: user.id,
        rating,
        title: title.trim() || "Review",
        comment: comment.trim(),
      });

      if (error) throw error;

      toast.success("Review submitted successfully!");
      setRating(0);
      setTitle("");
      setComment("");
      onOpenChange(false);
      onReviewSubmitted?.();
    } catch (error: any) {
      console.error("Error submitting review:", error);
      toast.error(error.message || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ResponsiveModal open={open} onOpenChange={onOpenChange}>
      <div className="p-6 space-y-6">
        <ResponsiveModalHeader>
          <ResponsiveModalTitle>Write a Review</ResponsiveModalTitle>
          <ResponsiveModalDescription>Share your experience with others</ResponsiveModalDescription>
        </ResponsiveModalHeader>

        <div className="space-y-4">
          {/* Star Rating */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Rating</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                >
                  <Star
                    className={cn(
                      "w-8 h-8 transition-colors",
                      star <= (hoverRating || rating)
                        ? "fill-amber-400 text-amber-400"
                        : "text-muted-foreground/30"
                    )}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="review-title">Title (optional)</Label>
            <Input
              id="review-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Summarize your experience"
            />
          </div>

          <div>
            <Label htmlFor="review-comment">Your review</Label>
            <Textarea
              id="review-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell others about your experience..."
              rows={4}
            />
          </div>

          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={submitting || rating === 0}
          >
            {submitting ? "Submitting..." : "Submit Review"}
          </Button>
        </div>
      </div>
    </ResponsiveModal>
  );
};
