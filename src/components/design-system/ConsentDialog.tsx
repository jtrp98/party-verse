'use client';

import React from 'react';
import { HandHeart, Check, X } from 'lucide-react';
import { PrimaryActionButton } from './PrimaryActionButton';
import { SecondaryActionButton } from './SecondaryActionButton';

export interface ConsentDialogProps {
  isOpen: boolean;
  onAccept: () => void;
  onDecline: () => void;
  title?: string;
  description?: string;
}

export const ConsentDialog: React.FC<ConsentDialogProps> = ({
  isOpen,
  onAccept,
  onDecline,
  title = 'ภารกิจนี้มีสัมผัสทางกาย (สกินชิพ)',
  description = 'ภารกิจนี้ต้องได้รับความยินยอมพร้อมใจ (Affirmative Consent) จากผู้เล่นที่เกี่ยวข้องทุกคน หากใครคนใดคนหนึ่งไม่สะดวก สามารถข้ามข้อนี้ได้ทันทีโดยไม่มีบทลงโทษใดๆ ครับ',
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="consent-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in"
    >
      <div className="w-full max-w-sm rounded-3xl bg-zinc-900 border-2 border-amber-500/50 p-6 space-y-5 shadow-2xl">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mx-auto flex items-center justify-center">
            <HandHeart className="w-7 h-7" />
          </div>
          <h3 id="consent-title" className="text-xl font-black text-white">
            {title}
          </h3>
          <p className="text-sm text-zinc-300 leading-relaxed">
            {description}
          </p>
        </div>

        <div className="space-y-2.5 pt-1">
          <PrimaryActionButton
            variant="emerald"
            icon={<Check className="w-5 h-5" />}
            onClick={onAccept}
          >
            ทุกคนโอเค พร้อมเล่น
          </PrimaryActionButton>

          <SecondaryActionButton
            icon={<X className="w-5 h-5 text-zinc-400" />}
            onClick={onDecline}
          >
            ข้ามข้อนี้ (เปลี่ยนข้อใหม่)
          </SecondaryActionButton>
        </div>
      </div>
    </div>
  );
};
