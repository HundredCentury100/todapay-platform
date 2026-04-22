import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { getMerchantOperatorNames } from "@/services/merchantService";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Star, MessageSquare, TrendingUp } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface Review {
  id: string;
  rating: number;
  title: string;
  comment: string;
  created_at: string;
  user_id: string;
  operator: string;
  booking_id: string | null;
  merchant_response?: string | null;
  responded_at?: string | null;
  [key: string]: any;
}

const ReviewsPage = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [response, setResponse] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      const operators = await getMerchantOperatorNames();

      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .in("operator", operators)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setReviews((data as Review[]) || []);
    } catch (error) {
      console.error("Error loading reviews:", error);
      toast({
        title: "Error",
        description: "Failed to load reviews",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = (review: Review) => {
    setSelectedReview(review);
    setResponse(review.merchant_response || "");
  };

  const submitResponse = async () => {
    if (!selectedReview || !response.trim()) return;

    setSubmitting(true);
    try {
      const { error } = await (supabase
        .from("reviews")
        .update({
          merchant_response: response.trim(),
          responded_at: new Date().toISOString(),
        } as any)
        .eq("id", selectedReview.id));

      if (error) throw error;

      toast({
        title: "Response Saved",
        description: "Your response has been published",
      });
      setSelectedReview(null);
      setResponse("");
      loadReviews();
    } catch (error) {
      console.error("Error saving response:", error);
      toast({
        title: "Error",
        description: "Failed to save response",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  const ratingDistribution = [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count: reviews.filter((r) => r.rating === rating).length,
    percentage: reviews.length > 0
      ? (reviews.filter((r) => r.rating === rating).length / reviews.length) * 100
      : 0,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Reviews & Ratings</h1>
        <p className="text-muted-foreground">Manage customer feedback and reviews</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <Star className="w-8 h-8 text-yellow-500 fill-yellow-500" />
            <div>
              <p className="text-sm text-muted-foreground">Average Rating</p>
              <p className="text-2xl font-bold">{avgRating.toFixed(1)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <MessageSquare className="w-8 h-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Total Reviews</p>
              <p className="text-2xl font-bold">{reviews.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <TrendingUp className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-sm text-muted-foreground">Positive Reviews</p>
              <p className="text-2xl font-bold">
                {reviews.filter((r) => r.rating >= 4).length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="p-6 md:col-span-2">
          <h2 className="text-xl font-semibold mb-4">Customer Reviews</h2>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : reviews.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No reviews yet</p>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < review.rating
                                ? "text-yellow-500 fill-yellow-500"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <h3 className="font-semibold">{review.title}</h3>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(review.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{review.comment}</p>
                  
                  {review.merchant_response ? (
                    <div className="bg-muted/50 p-3 rounded-lg mb-3 border-l-4 border-primary">
                      <p className="text-xs font-semibold text-primary mb-1">Your Response</p>
                      <p className="text-sm">{review.merchant_response}</p>
                      {review.responded_at && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(review.responded_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  ) : null}

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRespond(review)}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    {review.merchant_response ? "Edit Response" : "Respond"}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Rating Distribution</h2>
          <div className="space-y-3">
            {ratingDistribution.map((item) => (
              <div key={item.rating} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1">
                    <span>{item.rating}</span>
                    <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                  </div>
                  <span className="text-muted-foreground">{item.count}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-500"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Dialog open={!!selectedReview} onOpenChange={() => setSelectedReview(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Respond to Review</DialogTitle>
            <DialogDescription>
              Write a response to this customer's review
            </DialogDescription>
          </DialogHeader>
          {selectedReview && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < selectedReview.rating
                          ? "text-yellow-500 fill-yellow-500"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <h4 className="font-semibold">{selectedReview.title}</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedReview.comment}
                </p>
              </div>
              <Textarea
                placeholder="Write your response..."
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                rows={4}
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedReview(null)}>
              Cancel
            </Button>
            <Button onClick={submitResponse} disabled={!response.trim() || submitting}>
              {submitting ? "Saving..." : "Send Response"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReviewsPage;
