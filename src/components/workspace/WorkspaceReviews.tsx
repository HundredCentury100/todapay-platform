import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { getWorkspaceReviews, getWorkspaceReviewStats, WorkspaceReview, WorkspaceReviewStats } from "@/services/workspaceReviewService";
import { Star, MessageSquare } from "lucide-react";
import { format, parseISO } from "date-fns";

interface WorkspaceReviewsProps {
  workspaceId: string;
}

export const WorkspaceReviews = ({ workspaceId }: WorkspaceReviewsProps) => {
  const [reviews, setReviews] = useState<WorkspaceReview[]>([]);
  const [stats, setStats] = useState<WorkspaceReviewStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReviews();
  }, [workspaceId]);

  const loadReviews = async () => {
    try {
      const [reviewsData, statsData] = await Promise.all([
        getWorkspaceReviews(workspaceId),
        getWorkspaceReviewStats(workspaceId)
      ]);
      setReviews(reviewsData);
      setStats(statsData);
    } catch (error) {
      console.error("Error loading reviews:", error);
    } finally {
      setLoading(false);
    }
  };

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

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Reviews
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Reviews
          </CardTitle>
          {stats && stats.total > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold">{stats.average.toFixed(1)}</span>
              </div>
              <Badge variant="secondary">{stats.total} reviews</Badge>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Category Breakdown */}
        {stats && stats.total > 0 && (
          <div className="mb-6 p-4 rounded-lg bg-muted/50">
            <h4 className="text-sm font-medium mb-3">Rating Breakdown</h4>
            <div className="grid gap-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Space Quality</span>
                <div className="flex items-center gap-2">
                  {renderStars(Math.round(stats.space))}
                  <span className="w-8">{stats.space.toFixed(1)}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Service</span>
                <div className="flex items-center gap-2">
                  {renderStars(Math.round(stats.service))}
                  <span className="w-8">{stats.service.toFixed(1)}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Value</span>
                <div className="flex items-center gap-2">
                  {renderStars(Math.round(stats.value))}
                  <span className="w-8">{stats.value.toFixed(1)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {reviews.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-sm text-muted-foreground">
              No reviews yet. Be the first to review!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="p-4 rounded-lg bg-muted/50 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {(review.profiles?.full_name || "User")[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">
                        {review.profiles?.full_name || "Anonymous"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(parseISO(review.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  {renderStars(review.rating)}
                </div>

                {/* Category ratings if available */}
                {(review.space_rating || review.service_rating || review.value_rating) && (
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    {review.space_rating && <span>Space: {review.space_rating}/5</span>}
                    {review.service_rating && <span>Service: {review.service_rating}/5</span>}
                    {review.value_rating && <span>Value: {review.value_rating}/5</span>}
                  </div>
                )}

                <p className="text-sm text-muted-foreground">{review.comment}</p>

                {/* Merchant Response */}
                {review.merchant_response && (
                  <div className="mt-3 p-3 rounded-lg bg-background border-l-2 border-primary">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">Owner Response</Badge>
                      {review.responded_at && (
                        <span className="text-xs text-muted-foreground">
                          {format(parseISO(review.responded_at), 'MMM d, yyyy')}
                        </span>
                      )}
                    </div>
                    <p className="text-sm">{review.merchant_response}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
