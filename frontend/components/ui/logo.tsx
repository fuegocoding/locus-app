import * as React from 'react'

interface LogoProps extends React.SVGProps<SVGSVGElement> {
  fillColor?: string
}

export function Logo({ className, fillColor, ...props }: LogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 150 150"
      className={className}
      {...props}
    >
      <g fill={fillColor || 'currentColor'}>
        <path d="M20,50 L20,130 L100,130 L100,50 L80,50 L80,110 L40,110 L40,50 Z" />
        <path d="M130,100 L130,20 L50,20 L50,100 L70,100 L70,40 L110,40 L110,100 Z" />
      </g>
    </svg>
  )
}
