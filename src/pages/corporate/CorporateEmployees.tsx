import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Trash2, Users } from 'lucide-react';
import { 
  getCurrentEmployeeAccount, 
  getEmployees, 
  createEmployee, 
  updateEmployee, 
  deleteEmployee 
} from '@/services/corporateService';
import type { CorporateAccount, CorporateEmployee } from '@/types/corporate';
import { toast } from 'sonner';

const CorporateEmployees = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [account, setAccount] = useState<CorporateAccount | null>(null);
  const [currentEmployee, setCurrentEmployee] = useState<CorporateEmployee | null>(null);
  const [employees, setEmployees] = useState<CorporateEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<CorporateEmployee | null>(null);
  const [formData, setFormData] = useState({
    employee_name: '',
    employee_email: '',
    employee_phone: '',
    department: '',
    job_title: '',
    travel_tier: 'standard' as 'standard' | 'executive' | 'vip',
    is_admin: false
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth?redirect=/corporate/employees');
      return;
    }
    const loadData = async () => {
      try {
        const result = await getCurrentEmployeeAccount();
        if (!result || !result.employee.is_admin) { navigate('/corporate'); return; }
        setAccount(result.account);
        setCurrentEmployee(result.employee);
        setEmployees(await getEmployees(result.account.id));
      } catch (error) {
        console.error('Error loading employees:', error);
        toast.error('Failed to load employees');
      } finally { setLoading(false); }
    };
    if (user) loadData();
  }, [user, authLoading, navigate]);

  const handleSubmit = async () => {
    if (!account) return;
    try {
      if (editingEmployee) {
        const updated = await updateEmployee(editingEmployee.id, formData);
        setEmployees(employees.map(e => e.id === updated.id ? updated : e));
        toast.success('Employee updated successfully');
      } else {
        const created = await createEmployee({ ...formData, corporate_account_id: account.id, is_active: true });
        setEmployees([...employees, created]);
        toast.success('Employee added successfully');
      }
      setDialogOpen(false);
      resetForm();
    } catch (error: any) { toast.error(error.message || 'Failed to save employee'); }
  };

  const handleEdit = (employee: CorporateEmployee) => {
    setEditingEmployee(employee);
    setFormData({
      employee_name: employee.employee_name, employee_email: employee.employee_email,
      employee_phone: employee.employee_phone || '', department: employee.department || '',
      job_title: employee.job_title || '', travel_tier: employee.travel_tier, is_admin: employee.is_admin
    });
    setDialogOpen(true);
  };

  const handleDelete = async (employeeId: string) => {
    if (!confirm('Are you sure you want to remove this employee?')) return;
    try { await deleteEmployee(employeeId); setEmployees(employees.filter(e => e.id !== employeeId)); toast.success('Employee removed'); }
    catch { toast.error('Failed to remove employee'); }
  };

  const resetForm = () => {
    setEditingEmployee(null);
    setFormData({ employee_name: '', employee_email: '', employee_phone: '', department: '', job_title: '', travel_tier: 'standard', is_admin: false });
  };

  if (authLoading || loading) {
    return <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" /></div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Employee Management</h1>
          <p className="text-muted-foreground">Manage employee access and travel tiers</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Add Employee</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingEmployee ? 'Edit Employee' : 'Add New Employee'}</DialogTitle>
              <DialogDescription>{editingEmployee ? 'Update employee details' : 'Add a new employee to your corporate account'}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2"><Label htmlFor="employee_name">Full Name *</Label><Input id="employee_name" value={formData.employee_name} onChange={(e) => setFormData({ ...formData, employee_name: e.target.value })} placeholder="John Doe" /></div>
              <div className="space-y-2"><Label htmlFor="employee_email">Email *</Label><Input id="employee_email" type="email" value={formData.employee_email} onChange={(e) => setFormData({ ...formData, employee_email: e.target.value })} placeholder="john@company.com" /></div>
              <div className="space-y-2"><Label htmlFor="employee_phone">Phone</Label><Input id="employee_phone" value={formData.employee_phone} onChange={(e) => setFormData({ ...formData, employee_phone: e.target.value })} placeholder="+27 82 123 4567" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label htmlFor="department">Department</Label><Input id="department" value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} placeholder="Sales" /></div>
                <div className="space-y-2"><Label htmlFor="job_title">Job Title</Label><Input id="job_title" value={formData.job_title} onChange={(e) => setFormData({ ...formData, job_title: e.target.value })} placeholder="Sales Manager" /></div>
              </div>
              <div className="space-y-2">
                <Label>Travel Tier</Label>
                <Select value={formData.travel_tier} onValueChange={(value: 'standard' | 'executive' | 'vip') => setFormData({ ...formData, travel_tier: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="executive">Executive</SelectItem>
                    <SelectItem value="vip">VIP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <div><Label>Admin Access</Label><p className="text-xs text-muted-foreground">Can manage employees and policies</p></div>
                <Switch checked={formData.is_admin} onCheckedChange={(checked) => setFormData({ ...formData, is_admin: checked })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={!formData.employee_name || !formData.employee_email}>{editingEmployee ? 'Update' : 'Add'} Employee</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" />Employees ({employees.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {employees.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No employees yet</p>
              <Button variant="link" onClick={() => setDialogOpen(true)}>Add your first employee</Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Department</TableHead>
                  <TableHead>Travel Tier</TableHead><TableHead>Role</TableHead><TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell className="font-medium">{employee.employee_name}</TableCell>
                    <TableCell>{employee.employee_email}</TableCell>
                    <TableCell>{employee.department || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={employee.travel_tier === 'vip' ? 'default' : employee.travel_tier === 'executive' ? 'secondary' : 'outline'}>
                        {employee.travel_tier.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>{employee.is_admin ? <Badge className="bg-purple-100 text-purple-800">Admin</Badge> : <Badge variant="outline">Employee</Badge>}</TableCell>
                    <TableCell><Badge variant={employee.is_active ? 'default' : 'secondary'}>{employee.is_active ? 'Active' : 'Inactive'}</Badge></TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(employee)}><Edit className="h-4 w-4" /></Button>
                        {employee.id !== currentEmployee?.id && (
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(employee.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CorporateEmployees;
