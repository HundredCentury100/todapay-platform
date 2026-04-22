import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, MessageSquare, Building2, Reply } from "lucide-react";
import { useMerchantAuth } from "@/hooks/useMerchantAuth";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";

interface PropertyReview {
  id: string;
  rating: number;
  title: string;
  comment: string;
  created_at: string;
  property_name: string;
  guest_name: string;
  merchant_response?: string | null;
  responded_at?: string | null;
}

const ReviewsPage = () => {
  const { merchantProfile } = useMerchantAuth();
  const [reviews, setReviews] = useState<PropertyReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [responseText, setResponseText] = useState("");

  useEffect(() => {
    if (merchantProfile?.id) {
      fetchReviews();
    }
  }, [merchantProfile?.id]);

  const fetchReviews = async () => {
    if (!merchantProfile?.id) return;

    try {
      // Get properties for this merchant
      const { data: properties } = await supabase
        .from('properties')
        .select('id, name')
        .eq('merchant_profile_id', merchantProfile.id);

      if (!properties || properties.length === 0) {
        setLoading(false);
        return;
      }

      const propertyIds = properties.map(p => p.id);
      const propertyMap = new Map(properties.map(p => [p.id, p.name]));

      // Get stay bookings for those properties
      const { data: stayBookings } = await supabase
        .from('stay_bookings')
        .select('booking_id, property_id')
        .in('property_id', propertyIds);

      if (!stayBookings || stayBookings.length === 0) {
        setLoading(false);
        return;
      }

      const bookingIds = stayBookings.map(sb => sb.booking_id);
      const bookingPropertyMap = new Map(stayBookings.map(sb => [sb.booking_id, sb.property_id]));

      // Get reviews for those bookings
      const { data: reviewsData } = await supabase
        .from('reviews')
        .select('*')
        .in('booking_id', bookingIds)
        .order('created_at', { ascending: false });

      if (reviewsData) {
        const mappedReviews = reviewsData.map(r => {
          const propertyId = bookingPropertyMap.get(r.booking_id || '');
          return {
            id: r.id,
            rating: r.rating,
            title: r.title,
            comment: r.comment,
            created_at: r.created_at,
            property_name: propertyId ? propertyMap.get(propertyId) || 'Unknown Property' : 'Unknown Property',
            guest_name: 'Guest',
            merchant_response: (r as any).merchant_response || null,
            responded_at: (r as any).responded_at || null,
          };
        });

        setReviews(mappedReviews);
        
        if (mappedReviews.length > 0) {
          const avg = mappedReviews.reduce((sum, r) => sum + r.rating, 0) / mappedReviews.length;
          setAverageRating(avg);
        }
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitResponse = async (reviewId: string) => {
    if (!responseText.trim()) return;
    try {
      const { error } = await supabase
        .from('reviews')
        .update({ 
          merchant_response: responseText.trim(),
          responded_at: new Date().toISOString() 
        } as any)
        .eq('id', reviewId);

      if (error) throw error;
      toast.success('Response submitted');
      setRespondingTo(null);
      setResponseText('');
      fetchReviews();
    } catch (error) {
      console.error('Error responding:', error);
      toast.error('Failed to submit response');
    }
  };

  const renderStars = (rating: number) => (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <Star
          key={star}
          className={`h-4 w-4 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`}
        />
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reviews</h1>
        <p className="text-muted-foreground">Guest feedback for your properties</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reviews.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Average Rating</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{averageRating.toFixed(1)}</span>
              {renderStars(Math.round(averageRating))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">5-Star Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reviews.filter(r => r.rating === 5).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {reviews.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Reviews Yet</h3>
            <p className="text-muted-foreground">Reviews from guests will appear here after their stay</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews.map(review => (
            <Card key={review.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      {renderStars(review.rating)}
                      <Badge variant="secondary">{review.property_name}</Badge>
                    </div>
                    <h4 className="font-semibold">{review.title}</h4>
                    <p className="text-muted-foreground">{review.comment}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(parseISO(review.created_at), 'MMM d, yyyy')}
                    </p>

                    {review.merchant_response ? (
                      <div className="mt-3 p-3 bg-muted/50 rounded-lg border">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Your response</p>
                        <p className="text-sm">{review.merchant_response}</p>
                        {review.responded_at && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(parseISO(review.responded_at), 'MMM d, yyyy')}
                          </p>
                        )}
                      </div>
                    ) : respondingTo === review.id ? (
                      <div className="mt-3 space-y-2">
                        <Textarea
                          value={responseText}
                          onChange={(e) => setResponseText(e.target.value)}
                          placeholder="Write your response..."
                          rows={3}
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => submitResponse(review.id)}>Submit</Button>
                          <Button size="sm" variant="outline" onClick={() => { setRespondingTo(null); setResponseText(''); }}>Cancel</Button>
                        </div>
                      </div>
                    ) : (
                      <Button 
                        size="sm" variant="outline" className="mt-2"
                        onClick={() => setRespondingTo(review.id)}
                      >
                        <Reply className="h-3 w-3 mr-1" /> Respond
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReviewsPage;
