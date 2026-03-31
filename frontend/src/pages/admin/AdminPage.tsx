import { useState, type FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { UserPlus, Shield, ShieldAlert, UserX, Users } from 'lucide-react';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { GlassCard } from '@/components/ui/GlassCard';
import { GradientButton } from '@/components/ui/GradientButton';
import { AnimatedInput } from '@/components/ui/AnimatedInput';
import api from '@/services/api';

interface Employee {
  id: number;
  email: string;
  full_name: string;
  company_name: string | null;
  role: string;
  is_active: boolean;
}

export default function AdminPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');

  const { data: employees, isLoading } = useQuery<Employee[]>({
    queryKey: ['admin', 'employees'],
    queryFn: async () => (await api.get('/admin/employees')).data,
  });

  const createMutation = useMutation({
    mutationFn: async (data: { email: string; password: string; full_name: string; role: string }) =>
      (await api.post('/admin/employees', data)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin'] });
      setShowForm(false);
      setFullName('');
      setEmail('');
      setPassword('');
      setRole('user');
    },
  });

  const toggleRole = useMutation({
    mutationFn: async ({ id, newRole }: { id: number; newRole: string }) =>
      (await api.put(`/admin/employees/${id}`, { role: newRole })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin'] }),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) =>
      (await api.put(`/admin/employees/${id}`, { is_active: isActive })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin'] }),
  });

  const handleCreate = (e: FormEvent) => {
    e.preventDefault();
    createMutation.mutate({ email, password, full_name: fullName, role });
  };

  return (
    <PageWrapper>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-gray-500 text-sm">Manage team members and their access</p>
        </div>
        <GradientButton onClick={() => setShowForm(!showForm)}>
          <UserPlus size={18} /> Add Employee
        </GradientButton>
      </div>

      {/* Add Employee Form */}
      {showForm && (
        <GlassCard className="mb-6">
          <h3 className="font-semibold mb-4">New Employee</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AnimatedInput label="Full Name *" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              <AnimatedInput label="Email *" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <AnimatedInput label="Password *" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Min 8 chars, uppercase, lowercase, number" />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Role</label>
                <select className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 outline-none text-sm bg-white" value={role} onChange={(e) => setRole(e.target.value)}>
                  <option value="user">Employee</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <GradientButton type="submit" isLoading={createMutation.isPending}>Create</GradientButton>
              <GradientButton variant="secondary" type="button" onClick={() => setShowForm(false)}>Cancel</GradientButton>
            </div>
            {createMutation.isError && <p className="text-red-500 text-sm">Failed to create employee. Email may already exist.</p>}
          </form>
        </GlassCard>
      )}

      {/* Employee List */}
      {isLoading ? (
        <div className="flex justify-center py-12"><span className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" /></div>
      ) : (
        <div className="space-y-3">
          {employees?.map((emp) => (
            <motion.div
              key={emp.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-white border rounded-xl p-4 flex items-center justify-between ${!emp.is_active ? 'opacity-50 border-gray-200' : 'border-gray-200'}`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${emp.role === 'admin' ? 'bg-purple-100' : 'bg-blue-100'}`}>
                  {emp.role === 'admin' ? <ShieldAlert className="w-5 h-5 text-purple-600" /> : <Users className="w-5 h-5 text-blue-600" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{emp.full_name}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${emp.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                      {emp.role === 'admin' ? 'Admin' : 'Employee'}
                    </span>
                    {!emp.is_active && <span className="px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-600">Inactive</span>}
                  </div>
                  <p className="text-sm text-gray-500">{emp.email}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <GradientButton variant="ghost" size="sm" onClick={() => toggleRole.mutate({ id: emp.id, newRole: emp.role === 'admin' ? 'user' : 'admin' })}>
                  <Shield size={14} /> {emp.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                </GradientButton>
                <GradientButton variant={emp.is_active ? 'danger' : 'secondary'} size="sm" onClick={() => toggleActive.mutate({ id: emp.id, isActive: !emp.is_active })}>
                  <UserX size={14} /> {emp.is_active ? 'Deactivate' : 'Activate'}
                </GradientButton>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </PageWrapper>
  );
}
