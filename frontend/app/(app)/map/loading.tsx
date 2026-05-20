export default function Loading() {
  return (
    <div className="w-full h-screen bg-background flex items-center justify-center">
      <div className="space-y-3 text-center">
        <div className="w-12 h-12 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" />
        <p className="text-sm text-muted">Loading map…</p>
      </div>
    </div>
  )
}
