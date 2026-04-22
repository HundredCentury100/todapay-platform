import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface Review {
  id: string;
  author: string;
  avatar?: string;
  rating: number;
  date: string;
  text: string;
}

interface PremiumReviewCardProps {
  review: Review;
  index?: number;
  className?: string;
}

export const PremiumReviewCard = ({ review, index = 0, className }: PremiumReviewCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
    >
      <Card className={cn(
        "overflow-hidden group hover:shadow-lg transition-all duration-300",
        "bg-gradient-to-br from-card to-primary/5 border-primary/10",
        className
      )}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Avatar className="h-10 w-10 ring-2 ring-primary/20">
              <AvatarImage src={review.avatar} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {review.author.charAt(0)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <div>
                  <p className="font-semibold text-sm">{review.author}</p>
                  <p className="text-xs text-muted-foreground">{review.date}</p>
                </div>
                <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/10">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  <span className="text-sm font-semibold text-amber-600">{review.rating}</span>
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground leading-relaxed mt-2">
                {review.text}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

interface PremiumReviewListProps {
  reviews: Review[];
  maxVisible?: number;
  onShowMore?: () => void;
  className?: string;
}

export const PremiumReviewList = ({
  reviews,
  maxVisible = 3,
  onShowMore,
  className,
}: PremiumReviewListProps) => {
  const visibleReviews = reviews.slice(0, maxVisible);
  
  return (
    <div className={cn("space-y-3", className)}>
      {visibleReviews.map((review, idx) => (
        <PremiumReviewCard key={review.id} review={review} index={idx} />
      ))}
      
      {reviews.length > maxVisible && onShowMore && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          onClick={onShowMore}
          className="w-full py-3 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
        >
          Show all {reviews.length} reviews
        </motion.button>
      )}
    </div>
  );
};

interface PremiumRatingSummaryProps {
  rating: number;
  reviewCount: number;
  className?: string;
}

export const PremiumRatingSummary = ({ rating, reviewCount, className }: PremiumRatingSummaryProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "flex items-center gap-3 p-4 rounded-2xl",
        "bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20",
        className
      )}
    >
      <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-amber-500/20">
        <Star className="h-7 w-7 fill-amber-400 text-amber-400" />
      </div>
      <div>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold">{rating.toFixed(1)}</span>
          <span className="text-sm text-muted-foreground">/5</span>
        </div>
        <p className="text-sm text-muted-foreground">{reviewCount} reviews</p>
      </div>
    </motion.div>
  );
};
