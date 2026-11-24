import React, { useState } from 'react';
import type { PresenceStatus } from './types';
import { Circle, ChevronDown, Check } from 'lucide-react';

interface PsychologistPresenceControlProps {
  currentStatus: PresenceStatus;
  onStatusChange: (newStatus: PresenceStatus) => void;
  disabled?: boolean;
}

const STATUS_CONFIG: Record<
  PresenceStatus,
  { label: string; dotColor: string; bgColor: string; textColor: string; desc: string }
> = {
  available: {
    label: 'Tersedia (Available)',
    dotColor: 'bg-emerald-500 animate-pulse',
    bgColor: 'bg-emerald-50 border-emerald-200',
    textColor: 'text-emerald-800',
    desc: 'Online & bersedia menerima konsultasi atau chat langsung',
  },
  busy: {
    label: 'Sedang Sesi (Busy)',
    dotColor: 'bg-amber-500',
    bgColor: 'bg-amber-50 border-amber-200',
    textColor: 'text-amber-800',
    desc: 'Sedang melayani sesi konseling klien',
  },
  away: {
    label: 'Istirahat (Away)',
    dotColor: 'bg-orange-500',
    bgColor: 'bg-orange-50 border-orange-200',
    textColor: 'text-orange-800',
    desc: 'Sementara tidak di tempat / jeda antar sesi',
  },
  online: {
    label: 'Aktif (Online)',
    dotColor: 'bg-sky-500',
    bgColor: 'bg-sky-50 border-sky-200',
    textColor: 'text-sky-800',
    desc: 'Online di sistem',
  },
  offline: {
    label: 'Tidak Aktif (Offline)',
    dotColor: 'bg-slate-400',
    bgColor: 'bg-slate-100 border-slate-200',
    textColor: 'text-slate-700',
    desc: 'Tidak terhubung',
  },
};

export const PsychologistPresenceControl: React.FC<PsychologistPresenceControlProps> = ({
  currentStatus,
  onStatusChange,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const current = STATUS_CONFIG[currentStatus] || STATUS_CONFIG.offline;

  const handleSelect = (status: PresenceStatus) => {
    onStatusChange(status);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${current.bgColor} ${current.textColor} hover:shadow-sm`}
      >
        <span className={`w-2 h-2 rounded-full ${current.dotColor}`} />
        <span>{current.label}</span>
        <ChevronDown className="w-3.5 h-3.5 opacity-70" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-[90]"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 py-1.5 z-[100] animate-in fade-in zoom-in-95 duration-150">
            <div className="px-3 py-1.5 border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Ubah Status Kehadiran
            </div>
            {(Object.keys(STATUS_CONFIG) as PresenceStatus[]).map((statusKey) => {
              const cfg = STATUS_CONFIG[statusKey];
              const isSelected = statusKey === currentStatus;
              return (
                <button
                  key={statusKey}
                  type="button"
                  onClick={() => handleSelect(statusKey)}
                  className={`w-full text-left px-3 py-2 flex items-start gap-2.5 text-xs hover:bg-slate-50 transition-colors ${
                    isSelected ? 'bg-slate-50 font-semibold' : 'text-slate-700'
                  }`}
                >
                  <Circle className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${cfg.dotColor}`} />
                  <div className="flex-1">
                    <p className={`text-xs ${cfg.textColor}`}>{cfg.label}</p>
                    <p className="text-[10px] text-slate-400 leading-tight">{cfg.desc}</p>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-plum-600 shrink-0 mt-0.5" />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
