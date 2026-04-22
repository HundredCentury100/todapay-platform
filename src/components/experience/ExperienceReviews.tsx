import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Star, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Review {
  id: string;
  rating: number;
  title: string;
  comment: string;
  created_at: string;
  merchant_response: string | null;
  responded_at: string | null;
  profiles?: { full_name: string | null } | null;
}

interface ExperienceReviewsProps {
  experienceId: string;
  onWriteReview?: () => void;
  showWriteButton?: boolean;
}

export const ExperienceReviews = ({
  experienceId,
  onWriteReview,
  showWriteButton = false,
}: ExperienceReviewsProps) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    average: 0,
    total: 0,
    distribution: [0, 0, 0, 0, 0] as number[],
  });

  useEffect(() => {
    fetchReviews();
  }, [experienceId]);

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from("experience_reviews")
        .select("*")
        .eq("experience_id", experienceId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const reviewsWithProfiles = await Promise.all(
        (data || []).map(async (review) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", review.user_id)
            .maybeSingle();
          return { ...review, profiles: profile };
        })
      );

      setReviews(reviewsWithProfiles as Review[]);

      if (reviewsWithProfiles.length > 0) {
        const total = reviewsWithProfiles.length;
        const sumRating = reviewsWithProfiles.reduce((sum, r) => sum + r.rating, 0);
        const distribution = [0, 0, 0, 0, 0];
        reviewsWithProfiles.forEach((r) => {
          distribution[r.rating - 1]++;
        });
        setStats({ average: sumRating / total, total, distribution });
      }
    } catch (error) {
      console.error("Error fetching experience reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            "w-4 h-4",
            star <= Math.round(rating)
              ? "fill-amber-400 text-amber-400"
              : "text-muted-foreground/30"
          )}
        />
      ))}
    </div>
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (reviews.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Guest Reviews
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground mb-4">No reviews yet</p>
          {showWriteButton && onWriteReview && (
            <Button onClick={onWriteReview}>Be the first to review</Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Guest Reviews
        </CardTitle>
        {showWriteButton && onWriteReview && (
          <Button size="sm" onClick={onWriteReview}>
            Write Review
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="flex items-center gap-4">
            <div className="text-5xl font-bold text-primary">
              {stats.average.toFixed(1)}
            </div>
            <div>
              {renderStars(stats.average)}
              <p className="text-sm text-muted-foreground mt-1">
                Based on {stats.total} review{stats.total !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          <div className="space-y-1">
            {[5, 4, 3, 2, 1].map((star) => (
              <div key={star} className="flex items-center gap-2 text-sm">
                <span className="w-3">{star}</span>
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <Progress
                  value={(stats.distribution[star - 1] / stats.total) * 100}
                  className="h-2 flex-1"
                />
                <span className="w-8 text-muted-foreground text-right">
                  {stats.distribution[star - 1]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Reviews List */}
        <div className="space-y-4">
          {reviews.slice(0, 5).map((review) => (
            <div key={review.id} className="border-b pb-4 last:border-0">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {renderStars(review.rating)}
                  <span className="font-medium">
                    {review.profiles?.full_name || "Guest"}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(review.created_at), "MMM d, yyyy")}
                </span>
              </div>
              {review.title && <h4 className="font-medium mb-1">{review.title}</h4>}
              <p className="text-sm text-muted-foreground">{review.comment}</p>
              {review.merchant_response && (
                <div className="mt-3 ml-4 pl-3 border-l-2 border-primary/30">
                  <p className="text-xs font-medium text-primary mb-1">Host Response</p>
                  <p className="text-sm text-muted-foreground">{review.merchant_response}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
