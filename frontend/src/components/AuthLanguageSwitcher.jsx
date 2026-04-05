import React from 'react';
import LanguageSwitcher from './LanguageSwitcher';

export default function AuthLanguageSwitcher() {
  return (
    <div className="fixed right-4 top-4 z-[9999] rounded-2xl border border-slate-200 bg-white/95 p-2 shadow-lg backdrop-blur" data-no-auto-translate>
      <LanguageSwitcher />
    </div>
  );
}
