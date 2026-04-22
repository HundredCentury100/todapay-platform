import { useState } from "react";
import { Shield, ShieldOff, Users } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useDataFetching } from "@/hooks/useDataFetching";
import { useAdmin } from "@/hooks/useAdmin";
import { Navigate } from "react-router-dom";
import {
  getAllUsersWithRoles,
  grantAdminRole,
  revokeAdminRole,
  UserWithRoles,
} from "@/services/userRoleService";

const UserManagement = () => {
  const { isAdminUser, loading: adminLoading } = useAdmin();
  const [selectedUser, setSelectedUser] = useState<UserWithRoles | null>(null);
  const [actionType, setActionType] = useState<'grant' | 'revoke' | null>(null);

  const { data: users, loading, refetch } = useDataFetching<UserWithRoles[]>({
    fetchFn: getAllUsersWithRoles,
    errorMessage: "Failed to load users",
  });

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

  const handleGrantAdmin = (user: UserWithRoles) => {
    setSelectedUser(user);
    setActionType('grant');
  };

  const handleRevokeAdmin = (user: UserWithRoles) => {
    setSelectedUser(user);
    setActionType('revoke');
  };

  const confirmAction = async () => {
    if (!selectedUser || !actionType) return;

    try {
      if (actionType === 'grant') {
        await grantAdminRole(selectedUser.id);
        toast.success(`Admin privileges granted to ${selectedUser.email}`);
      } else {
        await revokeAdminRole(selectedUser.id);
        toast.success(`Admin privileges revoked from ${selectedUser.email}`);
      }
      await refetch();
    } catch (error: any) {
      toast.error(error.message || `Failed to ${actionType} admin role`);
    } finally {
      setSelectedUser(null);
      setActionType(null);
    }
  };

  const isAdmin = (roles: string[]) => roles.includes('admin');

  return (
    <div className="min-h-screen bg-background p-3 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Users className="h-6 w-6 sm:h-8 sm:w-8 text-primary shrink-0" />
          <div className="min-w-0">
            <h1 className="text-xl sm:text-3xl font-bold">User Management</h1>
            <p className="text-xs sm:text-sm text-muted-foreground truncate">Manage user accounts and admin privileges</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Users</CardTitle>
            <CardDescription>
              View all registered users and manage their administrative privileges
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-4 sm:mx-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Full Name</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users?.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.email}</TableCell>
                      <TableCell>{user.full_name || 'N/A'}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {user.roles.map((role) => (
                            <Badge
                              key={role}
                              variant={role === 'admin' ? 'default' : 'secondary'}
                            >
                              {role}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(user.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {isAdmin(user.roles) ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRevokeAdmin(user)}
                            className="gap-2"
                          >
                            <ShieldOff className="h-4 w-4" />
                            Revoke Admin
                          </Button>
                        ) : (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleGrantAdmin(user)}
                            className="gap-2"
                          >
                            <Shield className="h-4 w-4" />
                            Grant Admin
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {users?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No users found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={!!actionType} onOpenChange={() => setActionType(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === 'grant' ? 'Grant Admin Privileges' : 'Revoke Admin Privileges'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === 'grant' ? (
                <>
                  Are you sure you want to grant admin privileges to{' '}
                  <span className="font-semibold">{selectedUser?.email}</span>? This will give
                  them full access to all administrative features.
                </>
              ) : (
                <>
                  Are you sure you want to revoke admin privileges from{' '}
                  <span className="font-semibold">{selectedUser?.email}</span>? They will lose
                  access to all administrative features.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmAction}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default UserManagement;
