import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, X, Clock, Eye } from "lucide-react";

interface AdminMerchantApplicationsProps {
  merchants: any[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  onVerify: (merchantId: string, status: "verified" | "rejected") => void;
  onImpersonate: (merchant: any) => void;
  getRoleLabel: (role: string) => string;
}

const getStatusBadge = (status: string) => {
  const variants: Record<string, { variant: any; icon: any; label: string }> = {
    pending: { variant: "secondary", icon: Clock, label: "Pending" },
    verified: { variant: "default", icon: Check, label: "Verified" },
    rejected: { variant: "destructive", icon: X, label: "Rejected" },
  };
  const config = variants[status] || variants.pending;
  const Icon = config.icon;
  return <Badge variant={config.variant}><Icon className="w-3 h-3 mr-1" />{config.label}</Badge>;
};

export const AdminMerchantApplications = ({
  merchants, activeTab, onTabChange, onVerify, onImpersonate, getRoleLabel,
}: AdminMerchantApplicationsProps) => {
  const filtered = merchants.filter((m) => m.verification_status === activeTab);

  return (
    <Card>
      <CardHeader className="px-4 sm:px-6">
        <CardTitle className="text-base sm:text-lg">Merchant Applications</CardTitle>
      </CardHeader>
      <CardContent className="px-0 sm:px-6">
        <Tabs value={activeTab} onValueChange={onTabChange}>
          <div className="px-4 sm:px-0">
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="pending" className="flex-1 sm:flex-none text-xs sm:text-sm">Pending</TabsTrigger>
              <TabsTrigger value="verified" className="flex-1 sm:flex-none text-xs sm:text-sm">Verified</TabsTrigger>
              <TabsTrigger value="rejected" className="flex-1 sm:flex-none text-xs sm:text-sm">Rejected</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value={activeTab} className="mt-4">
            {filtered.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No {activeTab} merchants found</p>
            ) : (
              <>
                <div className="sm:hidden space-y-3 px-4">
                  {filtered.map((merchant) => (
                    <Card key={merchant.id} className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate">{merchant.business_name}</p>
                          <p className="text-sm text-muted-foreground truncate">{merchant.business_email}</p>
                        </div>
                        {getStatusBadge(merchant.verification_status)}
                      </div>
                      <div className="flex flex-wrap gap-1 mb-3">
                        <Badge variant="outline" className="text-xs">{getRoleLabel(merchant.role)}</Badge>
                        {merchant.operator_associations?.slice(0, 2).map((op: any) => (
                          <Badge key={op.id} variant="secondary" className="text-xs">{op.operator_name}</Badge>
                        ))}
                      </div>
                      {merchant.verification_status === "pending" && (
                        <div className="flex gap-2">
                          <Button size="sm" className="flex-1" onClick={() => onVerify(merchant.id, "verified")}><Check className="w-4 h-4 mr-1" /> Approve</Button>
                          <Button size="sm" variant="destructive" className="flex-1" onClick={() => onVerify(merchant.id, "rejected")}><X className="w-4 h-4 mr-1" /> Reject</Button>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
                <div className="hidden sm:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Business Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="hidden lg:table-cell">Email</TableHead>
                        <TableHead className="hidden md:table-cell">Operators</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((merchant) => (
                        <TableRow key={merchant.id}>
                          <TableCell className="font-medium">{merchant.business_name}</TableCell>
                          <TableCell><Badge variant="outline">{getRoleLabel(merchant.role)}</Badge></TableCell>
                          <TableCell className="hidden lg:table-cell">{merchant.business_email}</TableCell>
                          <TableCell className="hidden md:table-cell">
                            {merchant.operator_associations?.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {merchant.operator_associations.map((op: any) => (
                                  <Badge key={op.id} variant="secondary" className="text-xs">{op.operator_name}</Badge>
                                ))}
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">None</span>
                            )}
                          </TableCell>
                          <TableCell>{getStatusBadge(merchant.verification_status)}</TableCell>
                          <TableCell>
                            {merchant.verification_status === "pending" && (
                              <div className="flex gap-2">
                                <Button size="sm" onClick={() => onVerify(merchant.id, "verified")}><Check className="w-4 h-4 mr-1" /> Approve</Button>
                                <Button size="sm" variant="destructive" onClick={() => onVerify(merchant.id, "rejected")}><X className="w-4 h-4 mr-1" /> Reject</Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
