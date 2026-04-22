import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, ThumbsUp, Loader2 } from "lucide-react";
import { rateRide, tipDriver } from "@/services/rideService";
import { useUserWallet } from "@/hooks/useUserWallet";
import { toast } from "sonner";

interface RideRatingModalProps {
  open: boolean;
  onClose: () => void;
  rideId: string;
  driverName: string;
  driverPhoto?: string;
  finalPrice: number;
}

const RATING_TAGS = [
  'Great conversation',
  'Safe driving',
  'Clean car',
  'Knew the way',
  'Smooth ride',
  'On time',
];

export const RideRatingModal = ({
  open,
  onClose,
  rideId,
  driverName,
  driverPhoto,
  finalPrice,
}: RideRatingModalProps) => {
  const { balance } = useUserWallet();
  const [rating, setRating] = useState(5);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [review, setReview] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tipAmount, setTipAmount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canTip = balance >= tipAmount;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    const { error } = await rateRide(rideId, rating, true, review, selectedTags);
    
    if (error) {
      toast.error("Failed to submit rating");
      setIsSubmitting(false);
      return;
    }

    // Process tip if selected and user has enough balance
    if (tipAmount > 0) {
      if (!canTip) {
        toast.error("Insufficient wallet balance for tip");
      } else {
        const tipResult = await tipDriver(rideId, tipAmount);
        if (tipResult.success) {
          toast.success(`Tip of $${tipAmount} sent to ${driverName.split(' ')[0]}!`);
        } else {
          toast.error("Tip failed, but rating was submitted");
        }
      }
    }

    setIsSubmitting(false);
    toast.success("Thanks for your feedback!");
    onClose();
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">How was your ride?</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Driver Avatar */}
          <div className="flex flex-col items-center">
            <Avatar className="h-20 w-20 mb-3">
              <AvatarImage src={driverPhoto} />
              <AvatarFallback className="text-2xl">
                {driverName?.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <span className="font-semibold text-lg">{driverName}</span>
            <span className="text-sm text-muted-foreground">${finalPrice}</span>
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
                  className={`h-10 w-10 ${
                    star <= (hoveredRating || rating)
                      ? 'text-amber-400 fill-amber-400'
                      : 'text-muted-foreground'
                  }`}
                />
              </button>
            ))}
          </div>

          {/* Quick Tags */}
          {rating >= 4 && (
            <div className="flex flex-wrap gap-2 justify-center">
              {RATING_TAGS.map((tag) => (
                <Button
                  key={tag}
                  variant={selectedTags.includes(tag) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleTag(tag)}
                  className="rounded-full"
                >
                  {selectedTags.includes(tag) && <ThumbsUp className="h-3 w-3 mr-1" />}
                  {tag}
                </Button>
              ))}
            </div>
          )}

          {/* Review Text */}
          <Textarea
            placeholder="Add a comment (optional)"
            value={review}
            onChange={(e) => setReview(e.target.value)}
            rows={3}
          />

          {/* Tip Options */}
          <div className="space-y-2">
            <p className="text-sm text-center text-muted-foreground">Add a tip for {driverName.split(' ')[0]}?</p>
            <div className="flex justify-center gap-2">
              {[0, 10, 20, 50].map((amount) => (
                <Button
                  key={amount}
                  variant={tipAmount === amount ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTipAmount(amount)}
                  className={amount > 0 && balance < amount ? "opacity-50" : ""}
                >
                  {amount === 0 ? 'No tip' : `$${amount}`}
                </Button>
              ))}
            </div>
            {tipAmount > 0 && balance < tipAmount && (
              <p className="text-xs text-center text-destructive">
                Insufficient wallet balance (${balance.toFixed(2)} available)
              </p>
            )}
          </div>

          {/* Submit */}
          <div className="space-y-2">
            <Button 
              className="w-full" 
              onClick={handleSubmit}
              disabled={isSubmitting || (tipAmount > 0 && !canTip)}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Submitting...
                </>
              ) : tipAmount > 0 ? (
                `Submit & Tip $${tipAmount}`
              ) : (
                "Submit Rating"
              )}
            </Button>
            <Button variant="ghost" className="w-full" onClick={onClose}>
              Skip
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RideRatingModal;
