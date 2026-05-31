import React from 'react';

export default function Card({ children, className = '', header, icon }) {
  return (
    <div className={`overflow-hidden rounded-[28px] border border-slate-100 bg-white p-6 shadow-sm ${className}`}>
      {header ? (
        <div className="mb-4 flex items-start gap-4">
          {icon ? <div className="grid h-12 w-12 place-items-center rounded-3xl bg-slate-100 text-slate-700">{icon}</div> : null}
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{header}</h3>
          </div>
        </div>
      ) : null}
      {children}
    </div>
  );
}
