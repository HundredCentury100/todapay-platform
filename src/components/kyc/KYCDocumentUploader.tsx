import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import {
  Upload,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  X,
  Banknote,
  ArrowRight,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { KYCRequirement, EntityType } from "./KYCDocumentRequirements";

interface UploadedDoc {
  id: string;
  document_type: string;
  document_url: string;
  status: string;
  rejection_reason?: string | null;
  uploaded_at: string;
  expires_at?: string | null;
}

interface KYCDocumentUploaderProps {
  entityType: EntityType;
  entityId?: string;
  requirements: KYCRequirement[];
  payoutSettingsLink?: string;
}

const KYCDocumentUploader = ({ entityType, entityId, requirements, payoutSettingsLink }: KYCDocumentUploaderProps) => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<UploadedDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    if (user) loadDocuments();
  }, [user]);

  const loadDocuments = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('user_kyc_documents')
        .select('*')
        .eq('user_id', user.id)
        .eq('entity_type', entityType);

      if (error) throw error;
      setDocuments((data as UploadedDoc[]) || []);
    } catch (err) {
      console.error('Error loading KYC documents:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (docType: string, docLabel: string, file: File) => {
    if (!user) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File too large", { description: "Maximum file size is 5MB" });
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Invalid file type", { description: "Only JPG, PNG, and PDF files are accepted" });
      return;
    }

    setUploading(docType);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${docType}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('kyc_documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('kyc_documents')
        .getPublicUrl(fileName);

      // Delete existing pending/rejected doc of same type before inserting new one
      const existing = documents.find(d => d.document_type === docType && d.status !== 'verified');
      if (existing) {
        await supabase.from('user_kyc_documents').delete().eq('id', existing.id);
      }

      const { error: insertError } = await supabase
        .from('user_kyc_documents')
        .insert({
          user_id: user.id,
          entity_type: entityType,
          entity_id: entityId || null,
          document_type: docType,
          document_label: docLabel,
          document_url: publicUrl,
          status: 'pending',
        });

      if (insertError) throw insertError;

      toast.success("Document uploaded", { description: "Your document is now pending review." });
      await loadDocuments();
    } catch (err: any) {
      console.error('Upload error:', err);
      toast.error("Upload failed", { description: err.message });
    } finally {
      setUploading(null);
    }
  };

  const getDocStatus = (docType: string) => {
    const doc = documents.find(d => d.document_type === docType);
    if (!doc) return 'missing';
    return doc.status;
  };

  const getDocInfo = (docType: string) => {
    return documents.find(d => d.document_type === docType);
  };

  const verifiedCount = requirements.filter(r => getDocStatus(r.type) === 'verified').length;
  const requiredCount = requirements.filter(r => r.required).length;
  const requiredVerified = requirements.filter(r => r.required && getDocStatus(r.type) === 'verified').length;
  const progress = requiredCount > 0 ? (requiredVerified / requiredCount) * 100 : 0;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-green-500/10 text-green-600"><CheckCircle className="h-3 w-3 mr-1" />Verified</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending Review</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline"><Upload className="h-3 w-3 mr-1" />Required</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-full" />
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">Verification Progress</span>
            <span className="text-sm text-muted-foreground">
              {requiredVerified}/{requiredCount} required documents verified
            </span>
          </div>
          <Progress value={progress} className="h-2" />
          {progress === 100 && (
            <p className="text-sm text-green-600 mt-3 flex items-center gap-1">
              <CheckCircle className="h-4 w-4" />
              All required documents verified!
            </p>
          )}
        </CardContent>
      </Card>

      {/* Document List */}
      <div className="space-y-3">
        {requirements.map(req => {
          const status = getDocStatus(req.type);
          const docInfo = getDocInfo(req.type);
          return (
            <Card key={req.type}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-muted">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{req.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {req.required ? 'Required' : 'Optional'}
                      </p>
                      {status === 'rejected' && docInfo?.rejection_reason && (
                        <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                          <X className="h-3 w-3" />
                          {docInfo.rejection_reason}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(status)}
                    {status !== 'verified' && (
                      <>
                        <input
                          type="file"
                          accept=".jpg,.jpeg,.png,.pdf"
                          className="hidden"
                          ref={(el) => { fileInputRefs.current[req.type] = el; }}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleUpload(req.type, req.label, file);
                            e.target.value = '';
                          }}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={uploading === req.type}
                          onClick={() => fileInputRefs.current[req.type]?.click()}
                        >
                          {uploading === req.type ? (
                            <Clock className="h-4 w-4 animate-spin" />
                          ) : (
                            <Upload className="h-4 w-4" />
                          )}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Payout Banking Link */}
      {payoutSettingsLink && (
        <Card className="border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10">
                  <Banknote className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">Payout Banking Details</p>
                  <p className="text-xs text-muted-foreground">
                    Set up where your earnings will be sent
                  </p>
                </div>
              </div>
              <Link to={payoutSettingsLink}>
                <Button variant="outline" size="sm">
                  Configure <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Help */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <h3 className="font-medium text-sm mb-2">Document Requirements</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• All documents must be clear and legible</li>
            <li>• Files should be JPG, PNG, or PDF format</li>
            <li>• Maximum file size: 5MB</li>
            <li>• Documents are reviewed within 24-48 hours</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default KYCDocumentUploader;
