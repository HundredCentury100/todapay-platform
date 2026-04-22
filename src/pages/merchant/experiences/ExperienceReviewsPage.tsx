import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, MessageSquare, Compass, Reply } from "lucide-react";
import { useMerchantAuth } from "@/hooks/useMerchantAuth";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";

interface ExperienceReview {
  id: string;
  rating: number;
  title: string;
  comment: string;
  created_at: string;
  experience_name: string;
  guest_name: string;
  merchant_response?: string | null;
  responded_at?: string | null;
}

const ExperienceReviewsPage = () => {
  const { merchantProfile } = useMerchantAuth();
  const [reviews, setReviews] = useState<ExperienceReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [responseText, setResponseText] = useState("");

  useEffect(() => {
    if (merchantProfile?.id) fetchReviews();
  }, [merchantProfile?.id]);

  const fetchReviews = async () => {
    if (!merchantProfile?.id) return;

    try {
      const { data: experiences } = await supabase
        .from('experiences')
        .select('id, name')
        .eq('merchant_profile_id', merchantProfile.id);

      if (!experiences || experiences.length === 0) {
        setLoading(false);
        return;
      }

      const experienceIds = experiences.map(e => e.id);
      const experienceMap = Object.fromEntries(experiences.map(e => [e.id, e.name]));

      const { data: reviewsData } = await supabase
        .from('experience_reviews')
        .select('*')
        .in('experience_id', experienceIds)
        .order('created_at', { ascending: false });

      if (!reviewsData) {
        setLoading(false);
        return;
      }

      // Get user names
      const userIds = [...new Set(reviewsData.map(r => r.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);

      const profileMap = Object.fromEntries((profiles || []).map(p => [p.id, p.full_name || 'Guest']));

      const formattedReviews: ExperienceReview[] = reviewsData.map(r => ({
        id: r.id,
        rating: r.rating,
        title: r.title,
        comment: r.comment,
        created_at: r.created_at,
        experience_name: experienceMap[r.experience_id] || 'Unknown',
        guest_name: profileMap[r.user_id] || 'Guest',
        merchant_response: r.merchant_response,
        responded_at: r.responded_at,
      }));

      setReviews(formattedReviews);

      if (formattedReviews.length > 0) {
        const avg = formattedReviews.reduce((sum, r) => sum + r.rating, 0) / formattedReviews.length;
        setAverageRating(avg);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (reviewId: string) => {
    if (!responseText.trim()) return;

    try {
      const { error } = await supabase
        .from('experience_reviews')
        .update({
          merchant_response: responseText,
          responded_at: new Date().toISOString(),
        })
        .eq('id', reviewId);

      if (error) throw error;

      setReviews(reviews.map(r =>
        r.id === reviewId
          ? { ...r, merchant_response: responseText, responded_at: new Date().toISOString() }
          : r
      ));

      toast.success('Response posted successfully');
      setRespondingTo(null);
      setResponseText("");
    } catch (error) {
      toast.error('Failed to post response');
    }
  };

  const renderStars = (rating: number) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          className={`h-4 w-4 ${i <= rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`}
        />
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Guest Reviews</h1>
        <p className="text-muted-foreground">Manage reviews for your experiences</p>
      </div>

      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-4xl font-bold text-primary">
              {averageRating > 0 ? averageRating.toFixed(1) : '-'}
            </div>
            <div className="flex justify-center mt-2">{renderStars(Math.round(averageRating))}</div>
            <p className="text-sm text-muted-foreground mt-1">Average Rating</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-4xl font-bold">{reviews.length}</div>
            <p className="text-sm text-muted-foreground mt-1">Total Reviews</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-4xl font-bold">
              {reviews.filter(r => r.merchant_response).length}
            </div>
            <p className="text-sm text-muted-foreground mt-1">Responses</p>
          </CardContent>
        </Card>
      </div>

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Compass className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">No Reviews Yet</h3>
            <p className="text-muted-foreground">Guest reviews will appear here after experiences are completed</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews.map(review => (
            <Card key={review.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {renderStars(review.rating)}
                      <Badge variant="outline" className="text-xs">{review.experience_name}</Badge>
                    </div>
                    <CardTitle className="text-base">{review.title || 'No title'}</CardTitle>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {format(parseISO(review.created_at), 'MMM d, yyyy')}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm">{review.comment}</p>
                <p className="text-xs text-muted-foreground">— {review.guest_name}</p>

                {review.merchant_response ? (
                  <div className="bg-muted/50 p-3 rounded-lg border-l-2 border-primary mt-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Reply className="h-3 w-3 text-primary" />
                      <span className="text-xs font-medium text-primary">Your Response</span>
                      {review.responded_at && (
                        <span className="text-xs text-muted-foreground">
                          · {format(parseISO(review.responded_at), 'MMM d, yyyy')}
                        </span>
                      )}
                    </div>
                    <p className="text-sm">{review.merchant_response}</p>
                  </div>
                ) : respondingTo === review.id ? (
                  <div className="space-y-2 mt-3">
                    <Textarea
                      placeholder="Write your response..."
                      value={responseText}
                      onChange={e => setResponseText(e.target.value)}
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleRespond(review.id)} disabled={!responseText.trim()}>
                        Post Response
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => { setRespondingTo(null); setResponseText(""); }}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => setRespondingTo(review.id)}
                  >
                    <MessageSquare className="h-3 w-3 mr-1" />
                    Respond
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ExperienceReviewsPage;
