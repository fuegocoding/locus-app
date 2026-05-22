import * as React from 'react'

export function Logo({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      className={className}
      {...props}
    >
      <defs>
        <linearGradient id="locus-wave-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ffffff"/>
          <stop offset="100%" stop-color="#b89fe8"/>
        </linearGradient>
        <linearGradient id="locus-core-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#cfaeff"/>
          <stop offset="100%" stop-color="#8b5de0"/>
        </linearGradient>
        <linearGradient id="locus-satellite-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#4c2585"/>
          <stop offset="100%" stop-color="#240752"/>
        </linearGradient>
      </defs>
      <g transform="translate(0, 60) scale(2)">
        <g transform="rotate(-10 95 145)" fill="none" stroke="url(#locus-wave-grad)" stroke-width="22" stroke-linecap="round" opacity="0.95">
          <path d="M95 75a70 70 0 0 1 70 70"/>
          <path d="M95 45a100 100 0 0 1 100 100"/>
          <path d="M95 15a130 130 0 0 1 130 130"/>
        </g>
        <circle cx="95" cy="145" r="48" fill="url(#locus-core-grad)"/>
        <ellipse cx="138" cy="168" rx="32" ry="22" transform="rotate(-35 138 168)" fill="url(#locus-satellite-grad)"/>
      </g>
    </svg>
  )
}
