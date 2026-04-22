import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface Review {
  id: string;
  rating: number;
  title: string;
  comment: string;
  created_at: string;
  profiles: {
    full_name: string | null;
  } | null;
}

interface OperatorReviewsProps {
  operator: string;
  maxReviews?: number;
}

const OperatorReviews = ({ operator, maxReviews = 3 }: OperatorReviewsProps) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);

  useEffect(() => {
    loadReviews();
  }, [operator]);

  const loadReviews = async () => {
    try {
      const { data, error } = await supabase
        .from("reviews")
        .select(`
          id,
          rating,
          title,
          comment,
          created_at,
          profiles:user_id (
            full_name
          )
        `)
        .eq("operator", operator)
        .order("created_at", { ascending: false })
        .limit(maxReviews);

      if (error) throw error;

      const typedData = data as unknown as Review[];
      setReviews(typedData);
      setTotalReviews(typedData.length);

      if (typedData.length > 0) {
        const avg = typedData.reduce((sum, review) => sum + review.rating, 0) / typedData.length;
        setAverageRating(avg);
      }
    } catch (error) {
      console.error("Error loading reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return null;
  }

  if (reviews.length === 0) {
    return null;
  }

  const renderStars = (rating: number) => {
    return (
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
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Customer Reviews</CardTitle>
          <div className="flex items-center gap-2">
            {renderStars(Math.round(averageRating))}
            <span className="text-sm font-semibold">
              {averageRating.toFixed(1)} ({totalReviews})
            </span>
          </div>
        </div>
        <CardDescription>What travelers are saying</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {reviews.map((review) => (
          <div
            key={review.id}
            className="border-b pb-4 last:border-0 last:pb-0"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">
                    {review.profiles?.full_name || "Anonymous"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(review.created_at), "MMM d, yyyy")}
                  </p>
                </div>
              </div>
              {renderStars(review.rating)}
            </div>
            <h4 className="font-medium mb-1">{review.title}</h4>
            <p className="text-sm text-muted-foreground">{review.comment}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default OperatorReviews;
