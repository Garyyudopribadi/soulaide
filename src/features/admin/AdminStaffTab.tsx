import React, { useState } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/shared/EmptyState';
import { Users, Shield, CheckCircle, AlertTriangle, ShieldCheck } from 'lucide-react';
import type { AdminStaffItem } from './types';
import type { UserRole } from '@/types';
import { adminService } from './adminService';

interface AdminStaffTabProps {
  staffMembers: AdminStaffItem[];
  currentUserRole: UserRole | string;
  onRefresh: () => void;
}

export const AdminStaffTab: React.FC<AdminStaffTabProps> = ({
  staffMembers,
  currentUserRole,
  onRefresh,
}) => {
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const isSuperAdmin = currentUserRole === 'super_admin';

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    if (!isSuperAdmin) {
      setActionError('Hanya Super Admin yang berhak mempromosikan atau mendemosikan role pengguna.');
      return;
    }

    if (!window.confirm(`Ubah role pengguna ini menjadi '${newRole}'?`)) return;

    try {
      await adminService.updateUserRole(userId, newRole);
      setActionNotice('Role pengguna berhasil diperbarui.');
      onRefresh();
      setTimeout(() => setActionNotice(null), 3000);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Gagal memperbarui role');
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'super_admin':
        return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Super Admin</Badge>;
      case 'admin':
        return <Badge className="bg-plum-100 text-plum-800 border-plum-200">Admin Operasional</Badge>;
      case 'psychologist':
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Psikolog Klinis</Badge>;
      default:
        return <Badge variant="secondary">Klien (Customer)</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {actionNotice && (
        <div className="p-4 bg-emerald-50 text-emerald-800 text-xs sm:text-sm font-medium rounded-xl flex items-center gap-2 border border-emerald-200">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {actionError && (
        <div className="p-4 bg-red-50 text-red-700 text-xs sm:text-sm font-medium rounded-xl flex items-center gap-2 border border-red-200">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Super Admin Notice */}
      <div className={`p-4 rounded-2xl border text-xs flex items-start gap-3 ${
        isSuperAdmin
          ? 'bg-purple-50/70 border-purple-200 text-purple-900'
          : 'bg-amber-50 border-amber-200 text-amber-900'
      }`}>
        <Shield className="w-5 h-5 shrink-0 mt-0.5 text-purple-700" />
        <div className="space-y-1">
          <p className="font-bold">
            {isSuperAdmin
              ? 'Akses Otoritas Super Administrator Aktif'
              : 'Mode Terbatas: Hanya Super Admin yang Dapat Mengubah Role'}
          </p>
          <p className="leading-relaxed opacity-90">
            {isSuperAdmin
              ? 'Anda memiliki hak istimewa penuh untuk menetapkan hak akses staf, operasional admin, dan akun psikolog klinis.'
              : 'Anda login sebagai Admin Operasional. Pengubahan role staf diproteksi di tingkat database RLS dan hanya dapat dilakukan oleh Super Admin.'}
          </p>
        </div>
      </div>

      {staffMembers.length === 0 ? (
        <EmptyState
          title="Tidak ada data staf"
          message="Daftar role pengguna terdaftar akan tampil di sini."
        />
      ) : (
        <Card className="overflow-hidden border-slate-200 shadow-sm">
          <CardHeader className="p-4 bg-slate-50/50 border-b border-slate-100 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Users className="w-4 h-4 text-plum-600" />
              <span>Manajemen Otorisasi Staf & Role Pengguna ({staffMembers.length})</span>
            </CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Nama Pengguna</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Terdaftar</th>
                  <th className="py-3 px-4 text-center">Role Saat Ini</th>
                  <th className="py-3 px-4 text-right">Ubah Otoritas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {staffMembers.map((staff) => (
                  <tr key={staff.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">{staff.full_name}</td>
                    <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">
                      {staff.email || '-'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {new Date(staff.created_at).toLocaleDateString('id-ID')}
                    </td>
                    <td className="py-3.5 px-4 text-center">{getRoleBadge(staff.role)}</td>
                    <td className="py-3.5 px-4 text-right">
                      {isSuperAdmin ? (
                        <select
                          value={staff.role}
                          onChange={(e) => handleRoleChange(staff.user_id, e.target.value as UserRole)}
                          className="text-xs p-1.5 border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-plum-500 font-medium"
                        >
                          <option value="customer">Klien (Customer)</option>
                          <option value="psychologist">Psikolog Klinis</option>
                          <option value="admin">Admin Operasional</option>
                          <option value="super_admin">Super Admin</option>
                        </select>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic flex items-center justify-end gap-1">
                          <ShieldCheck className="w-3 h-3 text-slate-300" />
                          Terkunci
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};
