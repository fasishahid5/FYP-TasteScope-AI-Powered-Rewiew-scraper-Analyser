import React from 'react';

export default function ToggleRow({ title, desc, checked, onChange }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-white px-4 py-3 border border-[#eef2f6]">
      <div>
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <p className="mt-1 text-xs text-[#64748b]">{desc}</p>
      </div>

      <button
        type="button"
        onClick={onChange}
        className={`flex h-6 w-11 items-center rounded-full p-1 transition duration-300 ${checked ? 'justify-end bg-[#0284c7]' : 'justify-start bg-[#e6edf3]'}`}
        aria-pressed={checked}
      >
        <span className="h-4 w-4 rounded-full bg-white shadow-sm" />
      </button>
    </div>
  );
}
