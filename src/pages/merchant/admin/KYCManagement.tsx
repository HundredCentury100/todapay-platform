import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Search,
  FileText,
} from "lucide-react";
import KYCReviewDialog from "@/components/kyc/KYCReviewDialog";
import { ENTITY_TYPE_LABELS, EntityType } from "@/components/kyc/KYCDocumentRequirements";

interface KYCDoc {
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
  reviewed_at?: string | null;
  submitter_name?: string;
  submitter_email?: string;
}

const KYCManagement = () => {
  const [documents, setDocuments] = useState<KYCDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [entityFilter, setEntityFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDoc, setSelectedDoc] = useState<KYCDoc | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_kyc_documents')
        .select('*')
        .order('uploaded_at', { ascending: false });

      if (error) throw error;

      // Fetch submitter profiles
      const userIds = [...new Set((data || []).map((d: any) => d.user_id))];
      let profileMap: Record<string, { full_name: string; email: string }> = {};

      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', userIds);

        (profiles || []).forEach((p: any) => {
          profileMap[p.id] = { full_name: p.full_name || 'Unknown', email: p.email || '' };
        });
      }

      setDocuments(
        (data || []).map((d: any) => ({
          ...d,
          submitter_name: profileMap[d.user_id]?.full_name || 'Unknown',
          submitter_email: profileMap[d.user_id]?.email || '',
        }))
      );
    } catch (err) {
      console.error('Error loading KYC documents:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = documents.filter(d => {
    if (statusFilter !== 'all' && d.status !== statusFilter) return false;
    if (entityFilter !== 'all' && d.entity_type !== entityFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        d.submitter_name?.toLowerCase().includes(q) ||
        d.submitter_email?.toLowerCase().includes(q) ||
        d.document_label.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const pendingCount = documents.filter(d => d.status === 'pending').length;
  const verifiedCount = documents.filter(d => d.status === 'verified').length;
  const rejectedCount = documents.filter(d => d.status === 'rejected').length;
  const expiringCount = documents.filter(d => {
    if (!d.expires_at) return false;
    const diff = new Date(d.expires_at).getTime() - Date.now();
    return diff > 0 && diff < 30 * 24 * 60 * 60 * 1000;
  }).length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-green-500/10 text-green-600"><CheckCircle className="h-3 w-3 mr-1" />Verified</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold">KYC Document Management</h1>
        <p className="text-sm text-muted-foreground">Review and manage identity verification documents</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('pending')}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{pendingCount}</p>
                <p className="text-xs text-muted-foreground">Pending Review</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('verified')}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{verifiedCount}</p>
                <p className="text-xs text-muted-foreground">Verified</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('rejected')}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <XCircle className="h-8 w-8 text-destructive" />
              <div>
                <p className="text-2xl font-bold">{rejectedCount}</p>
                <p className="text-xs text-muted-foreground">Rejected</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{expiringCount}</p>
                <p className="text-xs text-muted-foreground">Expiring Soon</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <Select value={entityFilter} onValueChange={setEntityFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Entity Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="user">Users</SelectItem>
            <SelectItem value="merchant">Merchants</SelectItem>
            <SelectItem value="agent">Agents</SelectItem>
            <SelectItem value="corporate">Corporates</SelectItem>
            <SelectItem value="driver">Drivers</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {/* Desktop */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Submitter</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Document</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Expiry</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                      <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      No documents found
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map(doc => (
                    <TableRow
                      key={doc.id}
                      className="cursor-pointer hover:bg-muted/80"
                      onClick={() => { setSelectedDoc(doc); setReviewOpen(true); }}
                    >
                      <TableCell>
                        <p className="font-medium text-sm">{doc.submitter_name}</p>
                        <p className="text-xs text-muted-foreground">{doc.submitter_email}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {ENTITY_TYPE_LABELS[doc.entity_type as EntityType] || doc.entity_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{doc.document_label}</TableCell>
                      <TableCell>{getStatusBadge(doc.status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(doc.uploaded_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {doc.expires_at ? new Date(doc.expires_at).toLocaleDateString() : '—'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile */}
          <div className="md:hidden divide-y">
            {filtered.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                No documents found
              </div>
            ) : (
              filtered.map(doc => (
                <div
                  key={doc.id}
                  className="p-4 cursor-pointer hover:bg-muted/50"
                  onClick={() => { setSelectedDoc(doc); setReviewOpen(true); }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-sm">{doc.submitter_name}</p>
                    {getStatusBadge(doc.status)}
                  </div>
                  <p className="text-sm text-muted-foreground">{doc.document_label}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {ENTITY_TYPE_LABELS[doc.entity_type as EntityType] || doc.entity_type}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(doc.uploaded_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <KYCReviewDialog
        document={selectedDoc}
        open={reviewOpen}
        onOpenChange={setReviewOpen}
        onReviewed={loadDocuments}
      />
    </div>
  );
};

export default KYCManagement;
