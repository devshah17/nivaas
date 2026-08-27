import React from "react";

export default function NivaasLogo({ className = "", size = 32 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Nivaas logo"
    >
      <rect width="40" height="40" rx="10" fill="url(#grad)" />
      {/* House roof */}
      <path d="M20 8L8 18h4v14h16V18h4L20 8z" fill="none" stroke="white" strokeWidth="2" strokeLinejoin="round" />
      {/* Tiffin container - 3 stacked segments */}
      <rect x="14" y="19" width="12" height="3.5" rx="1" fill="white" fillOpacity="0.9" />
      <rect x="14" y="23.5" width="12" height="3.5" rx="1" fill="white" fillOpacity="0.7" />
      <rect x="15" y="27" width="10" height="2" rx="1" fill="white" fillOpacity="0.5" />
      <defs>
        <linearGradient id="grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#4338ca" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
      </defs>
    </svg>
  );
}
