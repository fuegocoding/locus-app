import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background grid-bg flex items-center justify-center px-4">
      <div className="text-center space-y-6">
        <p className="text-8xl font-black neon-text">404</p>
        <h1 className="text-2xl font-bold text-foreground">Page not found</h1>
        <p className="text-muted">This road doesn&apos;t go anywhere.</p>
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-primary text-white rounded-xl font-semibold shadow-neon hover:shadow-neon-lg transition-all"
        >
          Back to Locus
        </Link>
      </div>
    </div>
  )
}
