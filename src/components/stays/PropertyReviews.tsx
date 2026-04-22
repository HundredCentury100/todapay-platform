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
  cleanliness_rating: number | null;
  location_rating: number | null;
  service_rating: number | null;
  value_rating: number | null;
  title: string;
  comment: string;
  created_at: string;
  profiles?: { full_name: string | null } | null;
}

interface PropertyReviewsProps {
  propertyId: string;
  onWriteReview?: () => void;
  showWriteButton?: boolean;
}

export const PropertyReviews = ({ 
  propertyId, 
  onWriteReview,
  showWriteButton = false
}: PropertyReviewsProps) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    average: 0,
    total: 0,
    cleanliness: 0,
    location: 0,
    service: 0,
    value: 0,
    distribution: [0, 0, 0, 0, 0] as number[],
  });

  useEffect(() => {
    fetchReviews();
  }, [propertyId]);

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('property_reviews')
        .select('*')
        .eq('property_id', propertyId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch profiles separately for each review
      const reviewsWithProfiles = await Promise.all(
        (data || []).map(async (review) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', review.user_id)
            .maybeSingle();
          return { ...review, profiles: profile };
        })
      );

      setReviews(reviewsWithProfiles as Review[]);

      // Calculate stats
      if (reviewsWithProfiles.length > 0) {
        const total = reviewsWithProfiles.length;
        const sumRating = reviewsWithProfiles.reduce((sum, r) => sum + r.rating, 0);
        const sumCleanliness = reviewsWithProfiles.reduce((sum, r) => sum + (r.cleanliness_rating || r.rating), 0);
        const sumLocation = reviewsWithProfiles.reduce((sum, r) => sum + (r.location_rating || r.rating), 0);
        const sumService = reviewsWithProfiles.reduce((sum, r) => sum + (r.service_rating || r.rating), 0);
        const sumValue = reviewsWithProfiles.reduce((sum, r) => sum + (r.value_rating || r.rating), 0);

        const distribution = [0, 0, 0, 0, 0];
        reviewsWithProfiles.forEach(r => {
          distribution[r.rating - 1]++;
        });

        setStats({
          average: sumRating / total,
          total,
          cleanliness: sumCleanliness / total,
          location: sumLocation / total,
          service: sumService / total,
          value: sumValue / total,
          distribution,
        });
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
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
          <Button size="sm" onClick={onWriteReview}>Write Review</Button>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Overall Score */}
          <div className="flex items-center gap-4">
            <div className="text-5xl font-bold text-primary">
              {stats.average.toFixed(1)}
            </div>
            <div>
              {renderStars(stats.average)}
              <p className="text-sm text-muted-foreground mt-1">
                Based on {stats.total} review{stats.total !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Rating Distribution */}
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

        {/* Category Breakdown */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted rounded-lg">
          <div className="text-center">
            <p className="text-2xl font-semibold">{stats.cleanliness.toFixed(1)}</p>
            <p className="text-xs text-muted-foreground">Cleanliness</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-semibold">{stats.location.toFixed(1)}</p>
            <p className="text-xs text-muted-foreground">Location</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-semibold">{stats.service.toFixed(1)}</p>
            <p className="text-xs text-muted-foreground">Service</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-semibold">{stats.value.toFixed(1)}</p>
            <p className="text-xs text-muted-foreground">Value</p>
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
              <h4 className="font-medium mb-1">{review.title}</h4>
              <p className="text-sm text-muted-foreground">{review.comment}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
