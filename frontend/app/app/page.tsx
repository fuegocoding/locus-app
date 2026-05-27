import Link from 'next/link'

export default function AppPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Link href="/" className="text-primary hover:underline">Go to Locus</Link>
    </div>
  )
}
