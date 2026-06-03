import React from 'react';

export default function ToggleRow({ title, desc, checked, onChange }) {
  return (
    <div className="w-full flex items-center justify-between p-3.5 rounded-2xl hover:bg-gray-100/60 dark:hover:bg-gray-800/40 transition-all duration-300 ease-out">
      <div className="flex flex-col gap-1 pr-6 select-none">
        <span className="text-sm font-semibold text-gray-900 dark:text-white transition-colors duration-200">
          {title}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400 transition-colors duration-200">
          {desc}
        </span>
      </div>
      
      {/* Width-wise Wide Premium Outer Track */}
      <button
        type="button"
        onClick={onChange}
        className={`relative inline-flex h-6.5 w-14 flex-shrink-0 items-center rounded-full border-2 border-transparent cursor-pointer outline-none focus:outline-none transition-colors duration-500 will-change-colors ${
          checked ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
        }`}
      >
        {/* Dynamic Fluid Swiping Knob with Spring Easing */}
        <span
          className={`pointer-events-none inline-block h-5.5 w-5.5 rounded-full bg-white shadow-md ring-0 will-change-transform ${
            checked ? 'translate-x-7' : 'translate-x-0.5'
          }`}
          style={{
            // Premium fluid custom spring easing logic for organic inertia
            transition: 'transform 500ms cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}
        />
      </button>
    </div>
  );
}
