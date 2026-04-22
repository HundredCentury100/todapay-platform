import { useState, useEffect } from "react";
import { CheckCircle2, XCircle, Users, Download, Eye, FileText, Plus } from "lucide-react";
import { toast } from "sonner";
import AdminCreateMerchantForm from "@/components/admin/AdminCreateMerchantForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDataFetching } from "@/hooks/useDataFetching";
import { useAdmin } from "@/hooks/useAdmin";
import { Navigate } from "react-router-dom";
import { getAllMerchantProfiles, updateMerchantVerificationStatus } from "@/services/adminService";
import { MerchantProfile } from "@/types/merchant";
import { exportToCSV } from "@/utils/exportData";
import { getKYCDocuments } from "@/services/kycService";

const MerchantVerification = () => {
  const { isAdminUser, loading: adminLoading } = useAdmin();
  const [selectedMerchants, setSelectedMerchants] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [bulkAction, setBulkAction] = useState<'approve' | 'reject' | null>(null);
  const [viewingMerchant, setViewingMerchant] = useState<MerchantProfile | null>(null);
  const [kycDocuments, setKycDocuments] = useState<any[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const { data: merchants, loading, refetch } = useDataFetching<MerchantProfile[]>({
    fetchFn: getAllMerchantProfiles,
    errorMessage: "Failed to load merchants",
  });

  const filteredMerchants = merchants?.filter(merchant => {
    const matchesStatus = statusFilter === "all" || merchant.verification_status === statusFilter;
    const matchesSearch = merchant.business_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         merchant.business_email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const toggleSelectAll = () => {
    if (selectedMerchants.size === filteredMerchants?.length) {
      setSelectedMerchants(new Set());
    } else {
      setSelectedMerchants(new Set(filteredMerchants?.map(m => m.id) || []));
    }
  };

  const toggleSelectMerchant = (merchantId: string) => {
    const newSelected = new Set(selectedMerchants);
    if (newSelected.has(merchantId)) {
      newSelected.delete(merchantId);
    } else {
      newSelected.add(merchantId);
    }
    setSelectedMerchants(newSelected);
  };

  const handleViewDetails = async (merchant: MerchantProfile) => {
    setViewingMerchant(merchant);
    try {
      const docs = await getKYCDocuments(merchant.user_id, 'merchant');
      setKycDocuments(docs);
    } catch (error) {
      console.error("Failed to load KYC documents:", error);
      setKycDocuments([]);
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedMerchants.size === 0) return;

    try {
      const promises = Array.from(selectedMerchants).map(merchantId =>
        updateMerchantVerificationStatus(merchantId, bulkAction === 'approve' ? 'verified' : 'rejected')
      );
      
      await Promise.all(promises);
      
      toast.success(`${selectedMerchants.size} merchant(s) ${bulkAction === 'approve' ? 'approved' : 'rejected'}`);
      setSelectedMerchants(new Set());
      setShowBulkDialog(false);
      setBulkAction(null);
      await refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to process bulk action");
    }
  };

  const handleExport = () => {
    if (selectedMerchants.size === 0) {
      toast.error("Please select merchants to export");
      return;
    }

    const selectedData = filteredMerchants?.filter(m => selectedMerchants.has(m.id)) || [];
    const exportableData = selectedData.map(m => ({
      business_name: m.business_name,
      business_email: m.business_email,
      role: m.role,
      verification_status: m.verification_status,
      created_at: new Date(m.created_at).toLocaleDateString(),
    }));

    exportToCSV(exportableData, `merchants_export_${new Date().toISOString().split('T')[0]}.csv`);
    toast.success(`Exported ${selectedMerchants.size} merchant(s)`);
  };

  if (adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdminUser) {
    return <Navigate to="/merchant/admin/auth" replace />;
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      verified: "default",
      pending: "secondary",
      rejected: "destructive",
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  return (
    <div className="min-h-screen bg-background p-3 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Merchant Verification</h1>
              <p className="text-muted-foreground text-sm">Review, approve, and create merchant accounts</p>
            </div>
          </div>
          
          <Button onClick={() => setShowCreateForm(true)} className="shrink-0">
            <Plus className="h-4 w-4 mr-2" />
            Create Merchant
          </Button>
        </div>

        {selectedMerchants.size > 0 && (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export Selected
            </Button>
            <Button
              variant="default"
              onClick={() => {
                setBulkAction('approve');
                setShowBulkDialog(true);
              }}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Approve ({selectedMerchants.size})
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setBulkAction('reject');
                setShowBulkDialog(true);
              }}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Reject ({selectedMerchants.size})
            </Button>
          </div>
        )}

        <Card>
          <CardHeader className="p-3 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:max-w-sm"
              />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedMerchants.size === filteredMerchants?.length && filteredMerchants?.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Business Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Applied</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMerchants?.map((merchant) => (
                    <TableRow key={merchant.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedMerchants.has(merchant.id)}
                          onCheckedChange={() => toggleSelectMerchant(merchant.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{merchant.business_name}</TableCell>
                      <TableCell>{merchant.business_email}</TableCell>
                      <TableCell className="capitalize">{merchant.role.replace('_', ' ')}</TableCell>
                      <TableCell>{getStatusBadge(merchant.verification_status)}</TableCell>
                      <TableCell>{new Date(merchant.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(merchant)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredMerchants?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        No merchants found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bulk Action Dialog */}
      <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {bulkAction === 'approve' ? 'Approve Merchants' : 'Reject Merchants'}
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to {bulkAction} {selectedMerchants.size} merchant(s)?
              {bulkAction === 'approve' && ' They will be notified via email.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkDialog(false)}>
              Cancel
            </Button>
            <Button
              variant={bulkAction === 'approve' ? 'default' : 'destructive'}
              onClick={handleBulkAction}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={!!viewingMerchant} onOpenChange={() => setViewingMerchant(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Merchant Details</DialogTitle>
          </DialogHeader>
          {viewingMerchant && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Business Name</p>
                  <p className="text-sm text-muted-foreground">{viewingMerchant.business_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">{viewingMerchant.business_email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Phone</p>
                  <p className="text-sm text-muted-foreground">{viewingMerchant.business_phone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Role</p>
                  <p className="text-sm text-muted-foreground capitalize">{viewingMerchant.role.replace('_', ' ')}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">KYC Documents</p>
                {kycDocuments.length > 0 ? (
                  <div className="space-y-2">
                    {kycDocuments.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span className="text-sm">{doc.document_type}</span>
                        </div>
                        <Button size="sm" variant="outline" asChild>
                          <a href={doc.document_url} target="_blank" rel="noopener noreferrer">
                            View
                          </a>
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No documents uploaded</p>
                )}
              </div>

              <DialogFooter>
                {viewingMerchant.verification_status === 'pending' && (
                  <>
                    <Button
                      variant="outline"
                      onClick={async () => {
                        await updateMerchantVerificationStatus(viewingMerchant.id, 'rejected');
                        toast.success("Merchant rejected");
                        setViewingMerchant(null);
                        refetch();
                      }}
                    >
                      Reject
                    </Button>
                    <Button
                      onClick={async () => {
                        await updateMerchantVerificationStatus(viewingMerchant.id, 'verified');
                        toast.success("Merchant approved");
                        setViewingMerchant(null);
                        refetch();
                      }}
                    >
                      Approve
                    </Button>
                  </>
                )}
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Merchant Form */}
      <AdminCreateMerchantForm
        open={showCreateForm}
        onOpenChange={setShowCreateForm}
        onSuccess={() => refetch()}
      />
    </div>
  );
};

export default MerchantVerification;