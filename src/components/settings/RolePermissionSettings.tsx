import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Shield, Plus, X, Users, Save } from 'lucide-react';
import { toast } from 'sonner';

interface Role {
  id: string;
  name: string;
  permissions: string[];
}

interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
}

const ALL_PERMISSIONS = [
  'appointments.view',
  'appointments.create',
  'appointments.edit',
  'appointments.delete',
  'prescriptions.view',
  'prescriptions.create',
  'prescriptions.edit',
  'billing.view',
  'billing.create',
  'billing.edit',
  'settings.view',
  'settings.edit',
  'reports.view',
  'reports.export',
];

const STORAGE_KEYS = {
  roles: 'app_roles',
  staff: 'app_staff',
};

export function RolePermissionSettings() {
  const [roles, setRoles] = useState<Role[]>([
    { id: '1', name: 'Admin', permissions: ALL_PERMISSIONS },
    { id: '2', name: 'Doctor', permissions: ALL_PERMISSIONS.filter(p => !p.startsWith('settings.edit')) },
    { id: '3', name: 'Receptionist', permissions: ['appointments.view', 'appointments.create', 'appointments.edit', 'billing.view', 'billing.create'] },
    { id: '4', name: 'Nurse', permissions: ['appointments.view', 'prescriptions.view'] },
  ]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [newRoleName, setNewRoleName] = useState('');
  const [newStaff, setNewStaff] = useState({ name: '', email: '', role: '' });
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);

  useEffect(() => {
    const storedRoles = localStorage.getItem(STORAGE_KEYS.roles);
    const storedStaff = localStorage.getItem(STORAGE_KEYS.staff);
    if (storedRoles) setRoles(JSON.parse(storedRoles));
    if (storedStaff) setStaff(JSON.parse(storedStaff));
  }, []);

  const saveAll = () => {
    localStorage.setItem(STORAGE_KEYS.roles, JSON.stringify(roles));
    localStorage.setItem(STORAGE_KEYS.staff, JSON.stringify(staff));
    toast.success('Roles & permissions saved!');
  };

  const addRole = () => {
    if (!newRoleName.trim()) return;
    const role: Role = { id: Date.now().toString(), name: newRoleName.trim(), permissions: [] };
    setRoles(prev => [...prev, role]);
    setNewRoleName('');
  };

  const deleteRole = (id: string) => {
    if (id === '1') { toast.error('Cannot delete Admin role'); return; }
    setRoles(prev => prev.filter(r => r.id !== id));
  };

  const togglePermission = (roleId: string, permission: string) => {
    setRoles(prev => prev.map(r => {
      if (r.id !== roleId) return r;
      const has = r.permissions.includes(permission);
      return { ...r, permissions: has ? r.permissions.filter(p => p !== permission) : [...r.permissions, permission] };
    }));
  };

  const addStaff = () => {
    if (!newStaff.name || !newStaff.email || !newStaff.role) {
      toast.error('Fill all fields');
      return;
    }
    const member: StaffMember = { id: Date.now().toString(), ...newStaff, isActive: true };
    setStaff(prev => [...prev, member]);
    setNewStaff({ name: '', email: '', role: '' });
  };

  const removeStaff = (id: string) => {
    setStaff(prev => prev.filter(s => s.id !== id));
  };

  const toggleStaffActive = (id: string) => {
    setStaff(prev => prev.map(s => s.id === id ? { ...s, isActive: !s.isActive } : s));
  };

  const formatPermission = (p: string) => {
    const [module, action] = p.split('.');
    return `${module.charAt(0).toUpperCase() + module.slice(1)} → ${action.charAt(0).toUpperCase() + action.slice(1)}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold font-display">Roles & Permissions</h2>
      </div>

      {/* Roles */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Manage Roles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="New role name..."
              value={newRoleName}
              onChange={e => setNewRoleName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addRole()}
            />
            <Button onClick={addRole} size="sm" className="gap-1">
              <Plus className="h-4 w-4" /> Add
            </Button>
          </div>

          <div className="space-y-3">
            {roles.map(role => (
              <div key={role.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant={role.id === '1' ? 'default' : 'secondary'}>{role.name}</Badge>
                    <span className="text-xs text-muted-foreground">{role.permissions.length} permissions</span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setEditingRoleId(editingRoleId === role.id ? null : role.id)}>
                      {editingRoleId === role.id ? 'Collapse' : 'Edit'}
                    </Button>
                    {role.id !== '1' && (
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteRole(role.id)}>
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {editingRoleId === role.id && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t">
                    {ALL_PERMISSIONS.map(perm => (
                      <div key={perm} className="flex items-center gap-2">
                        <Switch
                          checked={role.permissions.includes(perm)}
                          onCheckedChange={() => togglePermission(role.id, perm)}
                          disabled={role.id === '1'}
                        />
                        <Label className="text-sm cursor-pointer">{formatPermission(perm)}</Label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Staff */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            Staff Members
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
            <Input placeholder="Name" value={newStaff.name} onChange={e => setNewStaff(s => ({ ...s, name: e.target.value }))} />
            <Input placeholder="Email" value={newStaff.email} onChange={e => setNewStaff(s => ({ ...s, email: e.target.value }))} />
            <Input placeholder="Role" value={newStaff.role} onChange={e => setNewStaff(s => ({ ...s, role: e.target.value }))} />
            <Button onClick={addStaff} size="sm" className="gap-1">
              <Plus className="h-4 w-4" /> Add Staff
            </Button>
          </div>

          {staff.length > 0 ? (
            <div className="space-y-2">
              {staff.map(s => (
                <div key={s.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${s.isActive ? 'bg-success' : 'bg-muted-foreground'}`} />
                    <div>
                      <p className="font-medium text-sm">{s.name}</p>
                      <p className="text-xs text-muted-foreground">{s.email}</p>
                    </div>
                    <Badge variant="outline">{s.role}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={s.isActive} onCheckedChange={() => toggleStaffActive(s.id)} />
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => removeStaff(s.id)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No staff members added yet</p>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={saveAll} className="bg-gradient-primary shadow-glow gap-2">
          <Save className="h-4 w-4" /> Save Changes
        </Button>
      </div>
    </div>
  );
}
