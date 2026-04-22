import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMerchantAuth } from "@/hooks/useMerchantAuth";
import { getMerchantWorkspaceReviews, getMerchantReviewStats, WorkspaceReview } from "@/services/workspaceReviewService";
import { getMerchantWorkspaces } from "@/services/workspaceService";
import { Star, MessageSquare, TrendingUp, Reply } from "lucide-react";
import { format, parseISO } from "date-fns";
import { MerchantWorkspaceReviewResponseDialog } from "@/components/merchant/workspace/MerchantWorkspaceReviewResponseDialog";

const WorkspaceReviewsPage = () => {
  const { merchantProfile } = useMerchantAuth();
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>("all");
  const [selectedReview, setSelectedReview] = useState<WorkspaceReview | null>(null);
  const [responseDialogOpen, setResponseDialogOpen] = useState(false);

  const { data: workspaces } = useQuery({
    queryKey: ['merchant-workspaces', merchantProfile?.id],
    queryFn: () => getMerchantWorkspaces(merchantProfile!.id),
    enabled: !!merchantProfile?.id,
  });

  const { data: reviews, isLoading: reviewsLoading, refetch: refetchReviews } = useQuery({
    queryKey: ['merchant-workspace-reviews', merchantProfile?.id],
    queryFn: () => getMerchantWorkspaceReviews(merchantProfile!.id),
    enabled: !!merchantProfile?.id,
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['merchant-workspace-review-stats', merchantProfile?.id],
    queryFn: () => getMerchantReviewStats(merchantProfile!.id),
    enabled: !!merchantProfile?.id,
  });

  const filteredReviews = selectedWorkspace === "all" 
    ? reviews 
    : reviews?.filter(r => r.workspace_id === selectedWorkspace);

  const renderStars = (rating: number) => (
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

  const handleRespondClick = (review: WorkspaceReview) => {
    setSelectedReview(review);
    setResponseDialogOpen(true);
  };

  const handleResponseSubmitted = () => {
    refetchReviews();
    setResponseDialogOpen(false);
    setSelectedReview(null);
  };

  if (reviewsLoading || statsLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reviews</h1>
        <p className="text-muted-foreground">Manage and respond to customer feedback</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold">{stats?.average.toFixed(1) || '0.0'}</span>
              {renderStars(Math.round(stats?.average || 0))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Based on {stats?.total || 0} reviews
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.total || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all workspaces
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.responseRate.toFixed(0) || 0}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.respondedCount || 0} of {stats?.total || 0} responded
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      {stats && stats.total > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Rating Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Space Quality</span>
                <div className="flex items-center gap-2">
                  {renderStars(Math.round(stats.space))}
                  <span className="font-medium">{stats.space.toFixed(1)}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Service</span>
                <div className="flex items-center gap-2">
                  {renderStars(Math.round(stats.service))}
                  <span className="font-medium">{stats.service.toFixed(1)}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Value</span>
                <div className="flex items-center gap-2">
                  {renderStars(Math.round(stats.value))}
                  <span className="font-medium">{stats.value.toFixed(1)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reviews List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Reviews</CardTitle>
            {workspaces && workspaces.length > 1 && (
              <Select value={selectedWorkspace} onValueChange={setSelectedWorkspace}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by workspace" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Workspaces</SelectItem>
                  {workspaces.map(ws => (
                    <SelectItem key={ws.id} value={ws.id}>{ws.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!filteredReviews || filteredReviews.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-4" />
              <h3 className="text-lg font-semibold">No reviews yet</h3>
              <p className="text-sm text-muted-foreground">
                Reviews from customers will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReviews.map((review) => (
                <div
                  key={review.id}
                  className="p-4 rounded-lg border bg-card space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>
                          {(review.profiles?.full_name || "U")[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">
                          {review.profiles?.full_name || "Anonymous"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(parseISO(review.created_at), 'MMM d, yyyy')}
                          {review.workspace?.name && (
                            <> • {review.workspace.name}</>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {renderStars(review.rating)}
                      {!review.merchant_response && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleRespondClick(review)}
                        >
                          <Reply className="h-3 w-3 mr-1" />
                          Respond
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Category ratings if available */}
                  {(review.space_rating || review.service_rating || review.value_rating) && (
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      {review.space_rating && (
                        <span>Space: {review.space_rating}/5</span>
                      )}
                      {review.service_rating && (
                        <span>Service: {review.service_rating}/5</span>
                      )}
                      {review.value_rating && (
                        <span>Value: {review.value_rating}/5</span>
                      )}
                    </div>
                  )}

                  {review.title && (
                    <p className="font-medium text-sm">{review.title}</p>
                  )}
                  <p className="text-sm text-muted-foreground">{review.comment}</p>

                  {/* Merchant Response */}
                  {review.merchant_response && (
                    <div className="mt-3 p-3 rounded-lg bg-muted/50 border-l-2 border-primary">
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

      {/* Response Dialog */}
      {selectedReview && (
        <MerchantWorkspaceReviewResponseDialog
          review={selectedReview}
          open={responseDialogOpen}
          onOpenChange={setResponseDialogOpen}
          onResponseSubmitted={handleResponseSubmitted}
        />
      )}
    </div>
  );
};

export default WorkspaceReviewsPage;
