import Link from 'next/link'

export default function MapPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Link href="/settings" className="text-primary hover:underline">Go to Settings</Link>
    </div>
  )
}
