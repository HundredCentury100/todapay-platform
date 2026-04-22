import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Star, MessageSquare, TrendingUp, User, Reply } from "lucide-react";
import { useMerchantAuth } from "@/hooks/useMerchantAuth";
import { getMerchantVenueReviews, getMerchantReviewStats, VenueReview, VenueReviewStats } from "@/services/venueReviewService";
import { getMerchantVenues } from "@/services/venueService";
import { Venue } from "@/types/venue";
import MerchantReviewResponseDialog from "@/components/merchant/venue-owner/MerchantReviewResponseDialog";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const ReviewsPage = () => {
  const { merchantProfile } = useMerchantAuth("venue_owner");
  const [reviews, setReviews] = useState<VenueReview[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<VenueReview[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [stats, setStats] = useState<VenueReviewStats>({
    average: 0,
    total: 0,
    venue: 0,
    service: 0,
    value: 0,
    distribution: [0, 0, 0, 0, 0],
    responseRate: 0,
    respondedCount: 0,
  });
  const [selectedVenueId, setSelectedVenueId] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState<VenueReview | null>(null);
  const [responseDialogOpen, setResponseDialogOpen] = useState(false);

  useEffect(() => {
    if (merchantProfile?.id) {
      fetchData();
    }
  }, [merchantProfile?.id]);

  useEffect(() => {
    if (selectedVenueId === "all") {
      setFilteredReviews(reviews);
    } else {
      setFilteredReviews(reviews.filter(r => r.venue_id === selectedVenueId));
    }
  }, [selectedVenueId, reviews]);

  const fetchData = async () => {
    if (!merchantProfile?.id) return;
    
    setLoading(true);
    try {
      const [reviewsData, statsData, venuesData] = await Promise.all([
        getMerchantVenueReviews(merchantProfile.id),
        getMerchantReviewStats(merchantProfile.id),
        getMerchantVenues(merchantProfile.id),
      ]);
      
      setReviews(reviewsData);
      setFilteredReviews(reviewsData);
      setStats(statsData);
      setVenues(venuesData);
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenResponseDialog = (review: VenueReview) => {
    setSelectedReview(review);
    setResponseDialogOpen(true);
  };

  const handleResponseSubmitted = () => {
    fetchData();
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
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Reviews</h1>
          <p className="text-muted-foreground">Customer feedback for your venues</p>
        </div>
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reviews</h1>
        <p className="text-muted-foreground">Customer feedback for your venues</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Average Rating</CardTitle>
            <Star className="h-5 w-5 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold">
                {stats.total > 0 ? stats.average.toFixed(1) : "—"}
              </div>
              {stats.total > 0 && renderStars(stats.average)}
            </div>
            <p className="text-xs text-muted-foreground">
              Based on {stats.total} review{stats.total !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Reviews</CardTitle>
            <MessageSquare className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Response Rate</CardTitle>
            <TrendingUp className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.total > 0 ? `${Math.round(stats.responseRate)}%` : "—"}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.respondedCount} of {stats.total} responded
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Reviews List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle>Recent Reviews</CardTitle>
            {venues.length > 1 && (
              <Select value={selectedVenueId} onValueChange={setSelectedVenueId}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Filter by venue" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Venues</SelectItem>
                  {venues.map((venue) => (
                    <SelectItem key={venue.id} value={venue.id}>
                      {venue.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {filteredReviews.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {reviews.length === 0 
                ? "No reviews yet. Reviews will appear here when customers rate your venues after their events."
                : "No reviews match the selected filter."}
            </p>
          ) : (
            <div className="space-y-6">
              {filteredReviews.map((review) => (
                <div key={review.id} className="border-b pb-6 last:border-0 last:pb-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <User className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">
                            {review.profiles?.full_name || 'Anonymous Guest'}
                          </span>
                          {review.venue && (
                            <Badge variant="secondary" className="text-xs">
                              {review.venue.name}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {renderStars(review.rating)}
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(review.created_at), 'MMM d, yyyy')}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {!review.merchant_response && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleOpenResponseDialog(review)}
                      >
                        <Reply className="h-4 w-4 mr-1" />
                        Respond
                      </Button>
                    )}
                  </div>

                  <div className="mt-3 ml-13">
                    <h4 className="font-medium">{review.title}</h4>
                    <p className="text-muted-foreground mt-1">{review.comment}</p>
                  </div>

                  {/* Category Ratings */}
                  <div className="mt-3 ml-13 flex flex-wrap gap-4 text-sm">
                    {review.venue_rating && (
                      <div className="flex items-center gap-1">
                        <span className="text-muted-foreground">Venue:</span>
                        <span className="font-medium">{review.venue_rating}/5</span>
                      </div>
                    )}
                    {review.service_rating && (
                      <div className="flex items-center gap-1">
                        <span className="text-muted-foreground">Service:</span>
                        <span className="font-medium">{review.service_rating}/5</span>
                      </div>
                    )}
                    {review.value_rating && (
                      <div className="flex items-center gap-1">
                        <span className="text-muted-foreground">Value:</span>
                        <span className="font-medium">{review.value_rating}/5</span>
                      </div>
                    )}
                  </div>

                  {/* Merchant Response */}
                  {review.merchant_response && (
                    <div className="mt-3 ml-13 p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <Reply className="h-4 w-4" />
                          Your response
                          {review.responded_at && (
                            <span className="text-muted-foreground font-normal">
                              • {format(new Date(review.responded_at), 'MMM d, yyyy')}
                            </span>
                          )}
                        </div>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => handleOpenResponseDialog(review)}
                        >
                          Edit
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {review.merchant_response}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Response Dialog */}
      <MerchantReviewResponseDialog
        open={responseDialogOpen}
        onOpenChange={setResponseDialogOpen}
        review={selectedReview}
        onResponseSubmitted={handleResponseSubmitted}
      />
    </div>
  );
};

export default ReviewsPage;
