import React from 'react';
import { Sparkles, Plus } from 'lucide-react';

export default function EmptyState({
  title = 'Tidak Ada Data',
  description = 'Belum ada catatan data yang tersedia untuk saat ini.',
  icon: Icon = Sparkles,
  actionText,
  onAction,
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-beauty-600 mb-4 shadow-sm">
        <Icon className="w-8 h-8" />
      </div>
      <h4 className="text-base font-bold text-slate-800 mb-1">{title}</h4>
      <p className="text-sm text-slate-500 max-w-sm mb-6 leading-relaxed">{description}</p>
      {actionText && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-beauty-600 hover:bg-beauty-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-beauty-200 active:scale-[0.98] transition-all"
        >
          <Plus className="w-4 h-4" />
          {actionText}
        </button>
      )}
    </div>
  );
}
