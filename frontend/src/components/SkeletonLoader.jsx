import React from 'react';

export function TableSkeleton({ rows = 5, cols = 5 }) {
  return (
    <div className="w-full animate-pulse">
      <div className="h-10 bg-slate-100/80 rounded-xl mb-3" />
      <div className="space-y-2.5">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-3.5 bg-slate-50/60 rounded-xl">
            {Array.from({ length: cols }).map((_, j) => (
              <div
                key={j}
                className="h-4 bg-slate-200/70 rounded"
                style={{ width: `${Math.floor(100 / cols)}%` }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function CardSkeleton({ count = 4 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-20 h-4 bg-slate-200 rounded" />
            <div className="w-9 h-9 bg-slate-200 rounded-xl" />
          </div>
          <div className="w-28 h-7 bg-slate-300 rounded" />
          <div className="w-36 h-3 bg-slate-100 rounded" />
        </div>
      ))}
    </div>
  );
}
