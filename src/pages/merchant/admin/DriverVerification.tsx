import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { format } from "date-fns";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle, XCircle, Eye, FileText, Car, Shield, AlertCircle, Download } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface DriverDocument {
  id: string;
  driver_id: string;
  document_type: string;
  file_url: string;
  file_name: string;
  status: string;
  expires_at: string | null;
  rejection_reason: string | null;
  created_at: string;
}

interface Driver {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  vehicle_type: string;
  vehicle_make: string | null;
  vehicle_model: string | null;
  vehicle_color: string | null;
  license_plate: string;
  profile_photo_url: string | null;
  status: string;
  created_at: string;
}

const DOCUMENT_TYPES = [
  { key: 'drivers_license', label: "Driver's License", icon: FileText },
  { key: 'vehicle_registration', label: 'Vehicle Registration', icon: Car },
  { key: 'insurance', label: 'Insurance Certificate', icon: Shield },
  { key: 'id_document', label: 'ID Document', icon: FileText },
];

export default function DriverVerification() {
  const queryClient = useQueryClient();
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);

  const { data: pendingDrivers = [], isLoading } = useQuery({
    queryKey: ['pending-drivers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('drivers')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const { data: driverDocuments = [], refetch: refetchDocuments } = useQuery({
    queryKey: ['driver-documents', selectedDriver?.id],
    queryFn: async () => {
      if (!selectedDriver?.id) return [];
      
      const { data, error } = await supabase
        .from('driver_documents')
        .select('*')
        .eq('driver_id', selectedDriver.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedDriver?.id,
  });

  const approveDocumentMutation = useMutation({
    mutationFn: async (documentId: string) => {
      const { error } = await supabase
        .from('driver_documents')
        .update({
          status: 'verified',
          verified_at: new Date().toISOString(),
        })
        .eq('id', documentId);

      if (error) throw error;
    },
    onSuccess: () => {
      refetchDocuments();
      toast.success("Document approved");
      checkAndActivateDriver();
    },
    onError: () => {
      toast.error("Failed to approve document");
    },
  });

  const rejectDocumentMutation = useMutation({
    mutationFn: async ({ documentId, reason }: { documentId: string; reason: string }) => {
      const { error } = await supabase
        .from('driver_documents')
        .update({
          status: 'rejected',
          rejection_reason: reason,
        })
        .eq('id', documentId);

      if (error) throw error;
    },
    onSuccess: () => {
      refetchDocuments();
      toast.success("Document rejected");
      setRejectionReason("");
      setSelectedDocumentId(null);
    },
    onError: () => {
      toast.error("Failed to reject document");
    },
  });

  const activateDriverMutation = useMutation({
    mutationFn: async (driverId: string) => {
      const { error } = await supabase
        .from('drivers')
        .update({
          status: 'active',
          license_verified: true,
          insurance_verified: true,
          background_check_status: 'cleared',
        })
        .eq('id', driverId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-drivers'] });
      toast.success("Driver activated successfully!");
      setShowReviewDialog(false);
      setSelectedDriver(null);
    },
    onError: () => {
      toast.error("Failed to activate driver");
    },
  });

  const rejectDriverMutation = useMutation({
    mutationFn: async ({ driverId, reason }: { driverId: string; reason: string }) => {
      const { error } = await supabase
        .from('drivers')
        .update({
          status: 'rejected',
        })
        .eq('id', driverId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-drivers'] });
      toast.success("Driver rejected");
      setShowReviewDialog(false);
      setSelectedDriver(null);
    },
    onError: () => {
      toast.error("Failed to reject driver");
    },
  });

  const checkAndActivateDriver = async () => {
    if (!selectedDriver) return;

    // Check if all required documents are verified
    const requiredDocs = ['drivers_license', 'vehicle_registration', 'insurance'];
    const verifiedDocs = driverDocuments.filter(d => d.status === 'verified');
    const verifiedTypes = verifiedDocs.map(d => d.document_type);
    
    const allVerified = requiredDocs.every(type => verifiedTypes.includes(type));
    
    if (allVerified) {
      toast.info("All documents verified. You can now activate the driver.");
    }
  };

  const handleReview = (driver: Driver) => {
    setSelectedDriver(driver);
    setShowReviewDialog(true);
  };

  const getDocumentStatus = (type: string) => {
    const doc = driverDocuments.find(d => d.document_type === type);
    if (!doc) return { status: 'missing', doc: null };
    return { status: doc.status, doc };
  };

  const canActivate = () => {
    const requiredDocs = ['drivers_license', 'vehicle_registration', 'insurance'];
    return requiredDocs.every(type => {
      const { status } = getDocumentStatus(type);
      return status === 'verified';
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold">Driver Verification</h1>
        <p className="text-muted-foreground mt-1">
          Review and approve driver applications and documents
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Driver Applications</CardTitle>
          <CardDescription>
            {pendingDrivers.length} driver{pendingDrivers.length !== 1 ? 's' : ''} waiting for verification
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingDrivers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Car className="h-12 w-12 mx-auto mb-4 opacity-50" />
              No pending driver applications
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Driver</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>License Plate</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Applied</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingDrivers.map((driver) => (
                  <TableRow key={driver.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={driver.profile_photo_url || undefined} />
                          <AvatarFallback>
                            {driver.full_name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{driver.full_name}</p>
                          <p className="text-sm text-muted-foreground">{driver.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="capitalize">{driver.vehicle_type}</p>
                        {driver.vehicle_make && (
                          <p className="text-sm text-muted-foreground">
                            {driver.vehicle_color} {driver.vehicle_make} {driver.vehicle_model}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono">{driver.license_plate}</TableCell>
                    <TableCell>{driver.phone}</TableCell>
                    <TableCell>
                      {format(new Date(driver.created_at), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReview(driver)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review Driver Application</DialogTitle>
            <DialogDescription>
              Verify documents and approve or reject the driver
            </DialogDescription>
          </DialogHeader>

          {selectedDriver && (
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="info">Driver Info</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="space-y-4 mt-4">
                <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={selectedDriver.profile_photo_url || undefined} />
                    <AvatarFallback className="text-lg">
                      {selectedDriver.full_name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-semibold">{selectedDriver.full_name}</h3>
                    <p className="text-muted-foreground">{selectedDriver.email}</p>
                    <p className="text-sm">{selectedDriver.phone}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-muted-foreground">Vehicle Type</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="font-medium capitalize">{selectedDriver.vehicle_type}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-muted-foreground">License Plate</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="font-mono font-medium">{selectedDriver.license_plate}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-muted-foreground">Vehicle</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="font-medium">
                        {selectedDriver.vehicle_color} {selectedDriver.vehicle_make} {selectedDriver.vehicle_model}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-muted-foreground">Applied On</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="font-medium">
                        {format(new Date(selectedDriver.created_at), 'MMMM dd, yyyy')}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="documents" className="space-y-4 mt-4">
                {DOCUMENT_TYPES.map(({ key, label, icon: Icon }) => {
                  const { status, doc } = getDocumentStatus(key);
                  
                  return (
                    <Card key={key} className={status === 'verified' ? 'border-green-200' : status === 'rejected' ? 'border-red-200' : ''}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${
                              status === 'verified' ? 'bg-green-100' :
                              status === 'rejected' ? 'bg-red-100' :
                              status === 'pending' ? 'bg-yellow-100' :
                              'bg-muted'
                            }`}>
                              <Icon className={`h-5 w-5 ${
                                status === 'verified' ? 'text-green-600' :
                                status === 'rejected' ? 'text-red-600' :
                                status === 'pending' ? 'text-yellow-600' :
                                'text-muted-foreground'
                              }`} />
                            </div>
                            <div>
                              <p className="font-medium">{label}</p>
                              {doc ? (
                                <p className="text-sm text-muted-foreground">{doc.file_name}</p>
                              ) : (
                                <p className="text-sm text-muted-foreground">Not uploaded</p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Badge variant={
                              status === 'verified' ? 'default' :
                              status === 'rejected' ? 'destructive' :
                              status === 'pending' ? 'secondary' :
                              'outline'
                            }>
                              {status === 'missing' ? 'Missing' : status}
                            </Badge>

                            {doc && status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => window.open(doc.file_url, '_blank')}
                                >
                                  <Download className="h-3 w-3 mr-1" />
                                  View
                                </Button>
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => approveDocumentMutation.mutate(doc.id)}
                                  disabled={approveDocumentMutation.isPending}
                                >
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => setSelectedDocumentId(doc.id)}
                                >
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Reject
                                </Button>
                              </>
                            )}

                            {doc && status === 'verified' && (
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            )}

                            {doc && status === 'rejected' && (
                              <div className="text-sm text-red-600">
                                {doc.rejection_reason}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Rejection reason input */}
                        {selectedDocumentId === doc?.id && (
                          <div className="mt-4 space-y-2">
                            <Textarea
                              placeholder="Reason for rejection..."
                              value={rejectionReason}
                              onChange={(e) => setRejectionReason(e.target.value)}
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedDocumentId(null);
                                  setRejectionReason("");
                                }}
                              >
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => rejectDocumentMutation.mutate({
                                  documentId: doc!.id,
                                  reason: rejectionReason
                                })}
                                disabled={!rejectionReason.trim() || rejectDocumentMutation.isPending}
                              >
                                Confirm Rejection
                              </Button>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}

                {!canActivate() && (
                  <div className="flex items-center gap-2 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                    <p className="text-sm text-yellow-700 dark:text-yellow-400">
                      All required documents must be verified before activating the driver.
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}

          <div className="flex gap-2 justify-end mt-4 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setShowReviewDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => rejectDriverMutation.mutate({
                driverId: selectedDriver!.id,
                reason: "Application rejected"
              })}
              disabled={rejectDriverMutation.isPending}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Reject Application
            </Button>
            <Button
              onClick={() => activateDriverMutation.mutate(selectedDriver!.id)}
              disabled={!canActivate() || activateDriverMutation.isPending}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Activate Driver
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
