import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { CheckCircle, XCircle, ExternalLink } from "lucide-react";
import { ENTITY_TYPE_LABELS, EntityType } from "./KYCDocumentRequirements";

interface KYCDocument {
  id: string;
  user_id: string;
  entity_type: string;
  document_type: string;
  document_label: string;
  document_url: string;
  status: string;
  rejection_reason?: string | null;
  uploaded_at: string;
  expires_at?: string | null;
  submitter_name?: string;
  submitter_email?: string;
}

interface KYCReviewDialogProps {
  document: KYCDocument | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReviewed: () => void;
}

const KYCReviewDialog = ({ document, open, onOpenChange, onReviewed }: KYCReviewDialogProps) => {
  const { user } = useAuth();
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState(false);

  if (!document) return null;

  const isImage = document.document_url.match(/\.(jpg|jpeg|png|gif|webp)/i);

  const handleAction = async (action: 'verified' | 'rejected') => {
    if (!user) return;
    if (action === 'rejected' && !rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }

    setProcessing(true);
    try {
      const { error } = await supabase
        .from('user_kyc_documents')
        .update({
          status: action,
          rejection_reason: action === 'rejected' ? rejectionReason : null,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', document.id);

      if (error) throw error;

      toast.success(action === 'verified' ? 'Document approved' : 'Document rejected');
      setRejectionReason("");
      onOpenChange(false);
      onReviewed();
    } catch (err: any) {
      toast.error("Failed to update", { description: err.message });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Review Document</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Meta */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Submitter</p>
              <p className="font-medium">{document.submitter_name || 'Unknown'}</p>
              <p className="text-xs text-muted-foreground">{document.submitter_email}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Entity Type</p>
              <Badge variant="outline">
                {ENTITY_TYPE_LABELS[document.entity_type as EntityType] || document.entity_type}
              </Badge>
            </div>
            <div>
              <p className="text-muted-foreground">Document</p>
              <p className="font-medium">{document.document_label}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Uploaded</p>
              <p className="font-medium">{new Date(document.uploaded_at).toLocaleDateString()}</p>
            </div>
            {document.expires_at && (
              <div>
                <p className="text-muted-foreground">Expires</p>
                <p className="font-medium">{new Date(document.expires_at).toLocaleDateString()}</p>
              </div>
            )}
          </div>

          {/* Preview */}
          <div className="border rounded-lg p-2">
            {isImage ? (
              <img
                src={document.document_url}
                alt={document.document_label}
                className="max-h-96 w-full object-contain rounded"
              />
            ) : (
              <div className="flex items-center justify-center py-12">
                <a
                  href={document.document_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-primary hover:underline"
                >
                  <ExternalLink className="h-5 w-5" />
                  Open Document (PDF)
                </a>
              </div>
            )}
          </div>

          {/* Rejection reason */}
          {document.status !== 'verified' && (
            <div>
              <label className="text-sm font-medium">Rejection Reason (required to reject)</label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Provide a reason for rejection..."
                className="mt-1"
              />
            </div>
          )}
        </div>

        {document.status === 'pending' && (
          <DialogFooter className="gap-2">
            <Button
              variant="destructive"
              onClick={() => handleAction('rejected')}
              disabled={processing}
            >
              <XCircle className="h-4 w-4 mr-1" />
              Reject
            </Button>
            <Button
              onClick={() => handleAction('verified')}
              disabled={processing}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Approve
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default KYCReviewDialog;
