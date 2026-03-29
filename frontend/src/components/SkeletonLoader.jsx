import React from 'react';

const Shimmer = ({ className }) => (
  <div className={`bg-border-subtle animate-pulse rounded ${className}`} />
);

export const SignalSkeleton = () => (
  <div className="card p-5 flex flex-col gap-4">
    <div className="flex justify-between items-start">
      <div className="flex flex-col gap-2 w-1/2">
        <Shimmer className="h-6 w-24" />
        <Shimmer className="h-3.5 w-40" />
      </div>
      <Shimmer className="h-6 w-20 rounded-full" />
    </div>
    <Shimmer className="h-8 w-28 mt-1" />
    <div className="w-full h-px bg-border-subtle" />
    <Shimmer className="h-16 w-full" />
    <Shimmer className="h-10 w-full mt-1" />
  </div>
);

export const ChartSkeleton = () => (
  <div className="card h-80 flex items-end justify-between p-6 gap-3">
    {[...Array(10)].map((_, i) => (
      <div key={i} className="flex-1 flex flex-col gap-1 justify-end items-center h-full">
        <Shimmer className="w-full rounded-t" style={{ height: `${25 + Math.floor(i * 5.5) % 40}%` }} />
        <Shimmer className="w-2/3 rounded-t" style={{ height: `${15 + Math.floor(i * 3) % 30}%` }} />
      </div>
    ))}
  </div>
);

export const TableSkeleton = ({ rows = 5 }) => (
  <div className="card overflow-hidden">
    <div className="h-11 bg-bg-elevated border-b border-border-subtle" />
    {[...Array(rows)].map((_, i) => (
      <div key={i} className="h-12 border-b border-border-subtle/50 flex items-center px-5 gap-5">
        <Shimmer className="h-3 w-16" />
        <Shimmer className="h-3 w-28" />
        <Shimmer className="h-3 w-12 ml-auto" />
      </div>
    ))}
  </div>
);

export const StatCardSkeleton = () => (
  <Shimmer className="h-28 w-full rounded-xl" />
);

export const CardSkeleton = ({ className }) => (
  <Shimmer className={`rounded-xl ${className}`} />
);

