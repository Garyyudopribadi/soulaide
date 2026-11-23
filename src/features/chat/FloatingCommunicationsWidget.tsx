import React, { useState } from 'react'
import { ShieldAlert, ChevronUp, ChevronDown } from 'lucide-react'
import { WhatsAppButton } from './WhatsAppButton.tsx'
import { CrisisEscalationModal } from './CrisisEscalationModal.tsx'

export const FloatingCommunicationsWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true)
  const [showCrisisModal, setShowCrisisModal] = useState(false)

  return (
    <>
      <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-2.5 print:hidden">
        {isOpen && (
          <div className="flex flex-col items-end gap-2.5">
            {/* Crisis Quick Help Button */}
            <button
              type="button"
              onClick={() => setShowCrisisModal(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/95 hover:bg-champagne-50 text-champagne-700 shadow-[0_8px_24px_-8px_rgba(41,23,56,0.22)] text-xs font-semibold transition-all hover:-translate-y-0.5 border border-champagne-200 backdrop-blur-md cursor-pointer"
            >
              <span className="w-2 h-2 rounded-full bg-champagne-500 animate-pulse" />
              <ShieldAlert className="w-3.5 h-3.5 text-champagne-600" />
              <span>Bantuan Krisis 119</span>
            </button>

            {/* WhatsApp Quick Chat */}
            <div className="flex items-center gap-2">
              <WhatsAppButton variant="icon" />
            </div>
          </div>
        )}

        {/* Toggle Widget Button */}
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="w-9 h-9 rounded-full bg-plum-900/90 hover:bg-plum-800 text-plum-100 flex items-center justify-center shadow-lg border border-white/15 backdrop-blur-md transition-all cursor-pointer"
          title={isOpen ? 'Sembunyikan bantuan' : 'Tampilkan bantuan komunikasi'}
          aria-label={isOpen ? 'Sembunyikan bantuan' : 'Tampilkan bantuan komunikasi'}
        >
          {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>
      </div>

      {showCrisisModal && <CrisisEscalationModal onClose={() => setShowCrisisModal(false)} />}
    </>
  )
}
