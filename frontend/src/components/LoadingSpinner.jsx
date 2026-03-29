import React from 'react';

const LoadingSpinner = ({ message = "Analyzing with AI..." }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 min-h-[400px] w-full rounded-xl bg-gray-900 border border-gray-800 shadow-xl">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-t-2 border-emerald-500 animate-spin"></div>
        <div className="absolute inset-2 rounded-full border-t-2 border-emerald-400 animate-spin" style={{ animationDelay: '150ms' }}></div>
        <div className="absolute inset-4 rounded-full border-t-2 border-emerald-300 animate-spin" style={{ animationDelay: '300ms' }}></div>
      </div>
      <p className="mt-6 text-sm font-medium text-gray-300 animate-pulse">{message}</p>
    </div>
  );
};

export default LoadingSpinner;
