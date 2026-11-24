import React, { useState } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/shared/EmptyState';
import {
  Users,
  Shield,
  CheckCircle,
  AlertTriangle,
  ShieldCheck,
  UserPlus,
  Edit2,
  X,
  Loader2,
  Mail,
  User,
} from 'lucide-react';
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

  // Add Staff Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newStaff, setNewStaff] = useState<{
    fullName: string;
    email: string;
    role: UserRole;
  }>({
    fullName: '',
    email: '',
    role: 'admin',
  });

  // Edit Staff Modal State
  const [editingStaff, setEditingStaff] = useState<AdminStaffItem | null>(null);
  const [editFormData, setEditFormData] = useState<{
    fullName: string;
    email: string;
    role: UserRole;
  }>({
    fullName: '',
    email: '',
    role: 'admin',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSuperAdmin = currentUserRole === 'super_admin';

  const notifySuccess = (message: string) => {
    setActionNotice(message);
    setActionError(null);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const notifyError = (message: string) => {
    setActionError(message);
    setActionNotice(null);
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    if (!isSuperAdmin) {
      notifyError('Hanya Super Admin yang berhak mempromosikan atau mendemosikan role pengguna.');
      return;
    }

    if (!window.confirm(`Ubah role pengguna ini menjadi '${newRole}'?`)) return;

    try {
      await adminService.updateUserRole(userId, newRole);
      notifySuccess('Role pengguna berhasil diperbarui.');
      onRefresh();
    } catch (err: unknown) {
      notifyError(err instanceof Error ? err.message : 'Gagal memperbarui role');
    }
  };

  const handleOpenEdit = (staff: AdminStaffItem) => {
    setEditingStaff(staff);
    setEditFormData({
      fullName: staff.full_name,
      email: staff.email || '',
      role: staff.role,
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;

    if (!editFormData.fullName.trim()) {
      notifyError('Nama lengkap wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    try {
      await adminService.updateStaffMember({
        userId: editingStaff.user_id,
        fullName: editFormData.fullName.trim(),
        email: editFormData.email.trim() || undefined,
        newRole: isSuperAdmin ? editFormData.role : undefined,
      });

      notifySuccess(`Data staf "${editFormData.fullName}" berhasil diperbarui.`);
      setEditingStaff(null);
      onRefresh();
    } catch (err: unknown) {
      notifyError(err instanceof Error ? err.message : 'Gagal memperbarui data staf.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newStaff.fullName.trim() || !newStaff.email.trim()) {
      notifyError('Nama lengkap dan email staf wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    try {
      await adminService.addStaffMember({
        fullName: newStaff.fullName.trim(),
        email: newStaff.email.trim().toLowerCase(),
        role: newStaff.role,
      });

      notifySuccess(`Staf baru "${newStaff.fullName}" berhasil ditambahkan sebagai ${newStaff.role}.`);
      setIsAddModalOpen(false);
      setNewStaff({ fullName: '', email: '', role: 'admin' });
      onRefresh();
    } catch (err: unknown) {
      notifyError(err instanceof Error ? err.message : 'Gagal menambahkan staf baru.');
    } finally {
      setIsSubmitting(false);
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
        <div className="p-4 bg-emerald-50 text-emerald-800 text-xs sm:text-sm font-medium rounded-xl flex items-center gap-2 border border-emerald-200 shadow-sm animate-in fade-in duration-200">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {actionError && (
        <div className="p-4 bg-red-50 text-red-700 text-xs sm:text-sm font-medium rounded-xl flex items-center gap-2 border border-red-200 shadow-sm animate-in fade-in duration-200">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Super Admin Notice */}
      <div
        className={`p-4 rounded-2xl border text-xs flex items-start gap-3 ${
          isSuperAdmin
            ? 'bg-purple-50/70 border-purple-200 text-purple-900'
            : 'bg-amber-50 border-amber-200 text-amber-900'
        }`}
      >
        <Shield className="w-5 h-5 shrink-0 mt-0.5 text-purple-700" />
        <div className="space-y-1">
          <p className="font-bold">
            {isSuperAdmin
              ? 'Akses Otoritas Super Administrator Aktif'
              : 'Mode Terbatas: Hanya Super Admin yang Dapat Mengubah Role'}
          </p>
          <p className="leading-relaxed opacity-90">
            {isSuperAdmin
              ? 'Anda memiliki hak istimewa penuh untuk menetapkan hak akses staf, menambah anggota staf, operasional admin, dan akun psikolog klinis.'
              : 'Anda login sebagai Admin Operasional. Pengubahan otoritas role diproteksi di tingkat database RLS dan hanya dapat dilakukan oleh Super Admin.'}
          </p>
        </div>
      </div>

      <Card className="overflow-hidden border-slate-200 shadow-sm">
        <CardHeader className="p-4 bg-slate-50/50 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-4 h-4 text-plum-600" />
            <span>Manajemen Otorisasi Staf & Role Pengguna ({staffMembers.length})</span>
          </CardTitle>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-plum-600 hover:bg-plum-700 active:bg-plum-800 text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Tambah Staf Baru</span>
          </button>
        </CardHeader>

        {staffMembers.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="Tidak ada data staf"
              message="Daftar role pengguna terdaftar akan tampil di sini."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Nama Pengguna</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Terdaftar</th>
                  <th className="py-3 px-4 text-center">Role Saat Ini</th>
                  <th className="py-3 px-4 text-center">Ubah Otoritas</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
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
                    <td className="py-3.5 px-4 text-center">
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
                        <span className="text-[10px] text-slate-400 italic flex items-center justify-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-slate-300" />
                          Terkunci
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(staff)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-plum-700 bg-plum-50 hover:bg-plum-100 rounded-lg border border-plum-200 transition-colors"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Edit Staf</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* MODAL: Tambah Staf Baru */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-plum-600" />
                <h3 className="font-bold text-slate-900 text-sm">Tambah Staf Baru & Otoritas</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Lengkap Staf <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={newStaff.fullName}
                    onChange={(e) => setNewStaff({ ...newStaff, fullName: e.target.value })}
                    placeholder="Contoh: drg. Rina / Amanda Putri"
                    className="w-full text-xs pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-plum-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Alamat Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={newStaff.email}
                    onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                    placeholder="email.staf@soulaide.id"
                    className="w-full text-xs pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-plum-500 focus:outline-none"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Email ini digunakan staf untuk login ke sistem Soulaide.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Role / Tingkat Otoritas <span className="text-red-500">*</span>
                </label>
                <select
                  value={newStaff.role}
                  disabled={!isSuperAdmin}
                  onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value as UserRole })}
                  className="w-full text-xs p-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-plum-500 focus:outline-none bg-white disabled:bg-slate-100"
                >
                  <option value="admin">Admin Operasional (Kelola Konten & Booking)</option>
                  <option value="psychologist">Psikolog Klinis (Akses Sesi & Pasien)</option>
                  <option value="super_admin">Super Admin (Akses Penuh Seluruh Sistem)</option>
                  <option value="customer">Klien (Customer Biasa)</option>
                </select>
                {!isSuperAdmin && (
                  <p className="text-[10px] text-amber-600 mt-1">
                    * Hanya Super Admin yang berhak memilih otoritas selain role default.
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-xl transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-plum-600 hover:bg-plum-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3.5 h-3.5" />
                      Simpan & Tambahkan
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Full Edit Staf & Otoritas */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-plum-600" />
                <h3 className="font-bold text-slate-900 text-sm">Edit Data Staf & Otoritas</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingStaff(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Lengkap <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={editFormData.fullName}
                    onChange={(e) => setEditFormData({ ...editFormData, fullName: e.target.value })}
                    className="w-full text-xs pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-plum-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Alamat Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    className="w-full text-xs pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-plum-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Role / Otoritas Akses
                </label>
                <select
                  value={editFormData.role}
                  disabled={!isSuperAdmin}
                  onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value as UserRole })}
                  className="w-full text-xs p-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-plum-500 focus:outline-none bg-white disabled:bg-slate-100"
                >
                  <option value="customer">Klien (Customer)</option>
                  <option value="psychologist">Psikolog Klinis</option>
                  <option value="admin">Admin Operasional</option>
                  <option value="super_admin">Super Admin</option>
                </select>
                {!isSuperAdmin && (
                  <p className="text-[10px] text-amber-600 mt-1">
                    * Pengubahan wewenang role staf hanya dapat diubah oleh Super Admin.
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingStaff(null)}
                  disabled={isSubmitting}
                  className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-xl transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-plum-600 hover:bg-plum-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-3.5 h-3.5" />
                      Simpan Perubahan
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
