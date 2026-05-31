import React from 'react';
import { ChevronRight } from 'lucide-react';

export default function ActionRow({ icon, title, desc, onClick, isDelete }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left transition ${isDelete ? 'border-[#fee2e2] bg-[#fff1f2] text-rose-600' : 'border-[#eef2f6] bg-white'}`}
    >
      <div className="flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-md bg-[#f3f4f6]">{icon}</div>
        <div>
          <p className={`text-sm font-semibold ${isDelete ? 'text-rose-600' : 'text-slate-900'}`}>{title}</p>
          <p className="mt-1 text-xs text-[#64748b]">{desc}</p>
        </div>
      </div>
      <ChevronRight className={`h-4 w-4 ${isDelete ? 'text-rose-400' : 'text-slate-400'}`} />
    </button>
  );
}
