import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, Phone, ShieldCheck, HeartHandshake, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import type { ClientProfileData, CustomerConsentRecord } from './types';
import { customerService } from './customerService';

interface CustomerProfileTabProps {
  userId: string;
  initialFullName: string;
  initialPhone: string;
  userEmail: string;
  clientProfile: ClientProfileData | null;
  consents: CustomerConsentRecord[];
  onProfileUpdated: () => void;
}

export const CustomerProfileTab: React.FC<CustomerProfileTabProps> = ({
  userId,
  initialFullName,
  initialPhone,
  userEmail,
  clientProfile,
  consents,
  onProfileUpdated,
}) => {
  const [fullName, setFullName] = useState(initialFullName);
  const [phone, setPhone] = useState(initialPhone);
  const [dob, setDob] = useState(clientProfile?.date_of_birth || '');
  const [gender, setGender] = useState(clientProfile?.gender || 'Laki-laki');
  const [occupation, setOccupation] = useState(clientProfile?.occupation || '');
  const [emergencyName, setEmergencyName] = useState(clientProfile?.emergency_contact_name || '');
  const [emergencyPhone, setEmergencyPhone] = useState(clientProfile?.emergency_contact_phone || '');
  const [emergencyRelation, setEmergencyRelation] = useState(clientProfile?.emergency_contact_relation || '');

  const [saving, setSaving] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessNotice(null);
    setErrorNotice(null);

    try {
      // 1. Update base user profile
      await customerService.updateUserProfile(userId, {
        full_name: fullName,
        phone_number: phone,
      });

      // 2. Update client intake & emergency contact
      await customerService.updateCustomerClientProfile(userId, {
        date_of_birth: dob || null,
        gender: gender || null,
        occupation: occupation || null,
        emergency_contact_name: emergencyName || null,
        emergency_contact_phone: emergencyPhone || null,
        emergency_contact_relation: emergencyRelation || null,
      });

      setSuccessNotice('Data profil dan kontak darurat berhasil diperbarui.');
      onProfileUpdated();
    } catch (err: unknown) {
      setErrorNotice(err instanceof Error ? err.message : 'Gagal memperbarui profil.');
    } finally {
      setSaving(false);
      setTimeout(() => setSuccessNotice(null), 4000);
    }
  };

  return (
    <div className="space-y-8">
      {successNotice && (
        <div className="p-4 bg-emerald-50 text-emerald-800 text-xs sm:text-sm font-medium rounded-xl flex items-center gap-2 border border-emerald-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}

      {errorNotice && (
        <div className="p-4 bg-red-50 text-red-700 text-xs sm:text-sm font-medium rounded-xl flex items-center gap-2 border border-red-200">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{errorNotice}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Data Akun & Pribadi */}
        <Card className="border-slate-200">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
            <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
              <User className="w-4 h-4 text-plum-600" />
              <span>Data Identitas Klien</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-5 space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-plum-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Email (Akun)</label>
                <input
                  type="email"
                  value={userEmail}
                  disabled
                  className="w-full px-3.5 py-2 border border-slate-200 bg-slate-100 text-slate-500 rounded-xl cursor-not-allowed"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Nomor WhatsApp / HP</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="08xxxxxxxxxx"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-plum-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Tanggal Lahir</label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-plum-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Jenis Kelamin</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-plum-500 focus:outline-none bg-white"
                >
                  <option value="Laki-laki">Laki-laki</option>
                  <option value="Perempuan">Perempuan</option>
                  <option value="Lainnya">Lainnya / Tidak ingin menyebutkan</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Pekerjaan / Aktivitas</label>
                <input
                  type="text"
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                  placeholder="Contoh: Karyawan Swasta, Mahasiswa"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-plum-500 focus:outline-none"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Kontak Darurat (Emergency Contact) */}
        <Card className="border-slate-200">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
            <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Phone className="w-4 h-4 text-rose-600" />
              <span>Kontak Darurat (Emergency Contact)</span>
            </CardTitle>
            <p className="text-xs text-slate-500">
              Diperlukan demi keselamatan Anda apabila terjadi situasi darurat medis selama periode konseling.
            </p>
          </CardHeader>
          <CardContent className="pt-5 space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Nama Kontak Darurat</label>
                <input
                  type="text"
                  value={emergencyName}
                  onChange={(e) => setEmergencyName(e.target.value)}
                  placeholder="Nama orang terdekat"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-plum-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Nomor Telepon Darurat</label>
                <input
                  type="tel"
                  value={emergencyPhone}
                  onChange={(e) => setEmergencyPhone(e.target.value)}
                  placeholder="08xxxxxxxxxx"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-plum-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Hubungan</label>
                <input
                  type="text"
                  value={emergencyRelation}
                  onChange={(e) => setEmergencyRelation(e.target.value)}
                  placeholder="Contoh: Orang Tua, Pasangan, Saudara"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-plum-500 focus:outline-none"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-slate-50 border-t border-slate-100 p-4 flex justify-end">
            <Button
              type="submit"
              disabled={saving}
              className="bg-plum-600 hover:bg-plum-700 text-white text-xs px-5 font-semibold"
            >
              {saving ? 'Menyimpan...' : 'Simpan Perubahan Profil'}
            </Button>
          </CardFooter>
        </Card>
      </form>

      {/* Informed Consent & Perlindungan Data Medis */}
      <Card className="border-slate-200">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
          <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Persetujuan Layanan (Informed Consent) & Kerahasiaan Data</span>
          </CardTitle>
          <p className="text-xs text-slate-500">
            Hak dan perlindungan kerahasiaan Anda sesuai Kode Etik Psikologi Indonesia (HIMPSI).
          </p>
        </CardHeader>
        <CardContent className="pt-5 space-y-4 text-xs">
          <div className="p-4 bg-plum-50/60 border border-plum-100 rounded-xl space-y-2 text-slate-700">
            <h4 className="font-bold text-plum-900 flex items-center gap-1.5">
              <HeartHandshake className="w-4 h-4 text-plum-600" />
              Prinsip Perlindungan Privasi Klinis Soulaide
            </h4>
            <p className="leading-relaxed text-[11px]">
              Setiap catatan observasi dan laporan klinis yang dibuat oleh psikolog pendamping disimpan dengan enkripsi tingkat basis data dan isolasi RLS (Row Level Security).
              Hanya psikolog yang Anda pilih yang memiliki wewenang untuk membaca catatan klinis Anda. Tim operasional umum tidak memiliki akses ke rekaman psikologis Anda.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-slate-800 mb-2 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>Arsip Dokumen Persetujuan yang Telah Ditandatangani</span>
            </h4>
            {consents.length === 0 ? (
              <p className="text-slate-400 italic">
                Persetujuan layanan otomatis tercatat saat Anda menyelesaikan reservasi sesi pertama kali.
              </p>
            ) : (
              <div className="space-y-2">
                {consents.map((consent) => (
                  <div
                    key={consent.id}
                    className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <div>
                      <span className="font-semibold text-slate-800 block capitalize">
                        {consent.consent_type.replace('_', ' ')}
                      </span>
                      <span className="text-[11px] text-slate-500">Versi: {consent.version}</span>
                    </div>
                    <div className="text-right">
                      <Badge variant="success" className="text-[10px]">
                        Disetujui
                      </Badge>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {new Date(consent.agreed_at).toLocaleDateString('id-ID')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
