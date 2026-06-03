import React from 'react';
import { ChevronRight } from 'lucide-react';

export default function ActionRow({ icon, title, desc, onClick, isDelete }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-between rounded-2xl border px-5 py-4 min-h-[72px] text-left transition-colors duration-200 ${
        isDelete
          ? 'border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950 text-rose-600 dark:text-red-300'
          : 'border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white'
      }`}
    >
      <div className="flex items-center gap-4">
        <div className={`grid h-11 w-11 place-items-center rounded-xl ${
          isDelete
            ? 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300'
            : 'bg-gray-100 dark:bg-slate-600 text-slate-600 dark:text-slate-300'
        }`}>
          {icon}
        </div>
        <div>
          <p className={`text-sm font-semibold ${
            isDelete
              ? 'text-rose-600 dark:text-red-300'
              : 'text-slate-900 dark:text-white'
          }`}>
            {title}
          </p>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">{desc}</p>
        </div>
      </div>
      <ChevronRight className={`h-4 w-4 ${
        isDelete
          ? 'text-rose-400 dark:text-red-400'
          : 'text-slate-400 dark:text-slate-500'
      }`} />
    </button>
  );
}
