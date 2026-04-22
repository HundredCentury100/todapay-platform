import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Shield, Car, CheckCircle, XCircle, Clock, Upload, Eye } from "lucide-react";
import { DriverProfile } from "@/hooks/useDriverProfile";
import { DocumentUploadDialog } from "./DocumentUploadDialog";
import { useDriverDocuments, DocumentType, DOCUMENT_LABELS } from "@/hooks/useDriverDocuments";

interface DocumentsCardProps {
  driver: DriverProfile;
}

export function DocumentsCard({ driver }: DocumentsCardProps) {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState<DocumentType>('drivers_license');

  const { 
    documents: uploadedDocs, 
    isLoading,
    getDocumentByType,
    completionPercentage,
    allApproved,
    requiredTypes,
  } = useDriverDocuments({ driverId: driver.id });

  const documentConfigs = [
    {
      type: 'drivers_license' as DocumentType,
      label: 'Driver License',
      icon: FileText,
      description: 'Valid driver license',
    },
    {
      type: 'insurance' as DocumentType,
      label: 'Vehicle Insurance',
      icon: Shield,
      description: 'Comprehensive insurance',
    },
    {
      type: 'vehicle_registration' as DocumentType,
      label: 'Vehicle Registration',
      icon: Car,
      description: 'Proof of ownership',
    },
    {
      type: 'id_document' as DocumentType,
      label: 'ID Document',
      icon: FileText,
      description: 'National ID or Passport',
    },
  ];

  const getStatusBadge = (docType: DocumentType) => {
    const doc = getDocumentByType(docType);
    
    if (!doc) {
      return (
        <Badge variant="outline" className="text-xs">
          <Upload className="h-3 w-3 mr-1" />
          Not Uploaded
        </Badge>
      );
    }
    
    if (doc.status === 'pending') {
      return (
        <Badge variant="secondary" className="text-xs">
          <Clock className="h-3 w-3 mr-1" />
          Pending Review
        </Badge>
      );
    }
    if (doc.status === 'approved') {
      return (
        <Badge className="text-xs bg-green-600">
          <CheckCircle className="h-3 w-3 mr-1" />
          Verified
        </Badge>
      );
    }
    if (doc.status === 'rejected') {
      return (
        <Badge variant="destructive" className="text-xs">
          <XCircle className="h-3 w-3 mr-1" />
          Rejected
        </Badge>
      );
    }
    if (doc.status === 'expired') {
      return (
        <Badge variant="destructive" className="text-xs">
          <Clock className="h-3 w-3 mr-1" />
          Expired
        </Badge>
      );
    }
    return null;
  };

  const handleUploadClick = (docType: DocumentType) => {
    setSelectedDocType(docType);
    setUploadDialogOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Documents & Verification
            </CardTitle>
            {allApproved ? (
              <Badge className="bg-green-600">All Verified</Badge>
            ) : (
              <Badge variant="secondary">{completionPercentage}% Complete</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {documentConfigs.map((config) => {
            const Icon = config.icon;
            const doc = getDocumentByType(config.type);
            const isVerified = doc?.status === 'approved';
            
            return (
              <div
                key={config.type}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`h-10 w-10 rounded-full flex items-center justify-center ${
                      isVerified
                        ? 'bg-green-100 dark:bg-green-900/30'
                        : 'bg-muted'
                    }`}
                  >
                    <Icon
                      className={`h-5 w-5 ${
                        isVerified
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-muted-foreground'
                      }`}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{config.label}</p>
                    <p className="text-xs text-muted-foreground">{config.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(config.type)}
                  {doc?.file_url && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => window.open(doc.file_url, '_blank')}
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleUploadClick(config.type)}
                  >
                    <Upload className="h-3 w-3 mr-1" />
                    {doc ? 'Replace' : 'Upload'}
                  </Button>
                </div>
              </div>
            );
          })}

          {!allApproved && (
            <div className="mt-4 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800">
              <p className="text-sm text-yellow-700 dark:text-yellow-400">
                Complete your verification to start accepting rides and unlock full earning potential.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <DocumentUploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        driverId={driver.id}
        documentType={selectedDocType}
      />
    </>
  );
}
