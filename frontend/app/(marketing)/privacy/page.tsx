import Link from 'next/link'
import { Shield, Eye, Calendar, Mail } from 'lucide-react'

export const metadata = {
  title: 'Privacy Policy - Locus',
  description: 'Privacy Policy for the Locus proximity voice chat and convoy mobile application.',
}

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background text-foreground pt-28 pb-20 px-6 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-convoy/5 blur-[120px] pointer-events-none" />

      <div className="max-w-3xl mx-auto space-y-12 relative">
        {/* Header */}
        <div className="space-y-4 border-b border-border/40 pb-8">
          <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center shadow-neon-sm">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary-glow to-convoy bg-clip-text text-transparent">
            Privacy Policy
          </h1>
          <p className="text-muted flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4" /> Last updated: May 2026
          </p>
        </div>

        {/* Content sections */}
        <div className="space-y-10 prose prose-invert max-w-none text-muted-bright leading-relaxed">
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-surface border border-border text-primary font-mono text-sm">1</span>
              Information We Collect
            </h2>
            <div className="bg-surface/50 border border-border/50 rounded-2xl p-6 space-y-4 backdrop-blur-sm">
              <p>
                <strong>Account Data:</strong> We collect your phone number (verified via Twilio Verify), your chosen display name, and avatar configurations when you register.
              </p>
              <p>
                <strong>Location Data:</strong> To provide proximity-based voice chat and convoy tracking, the app accesses your device GPS coordinates in real-time while active (both in the foreground and optionally in the background if permitted).
              </p>
              <p>
                <strong>Audio Data:</strong> Real-time voice audio is transmitted directly over encrypted WebRTC connections via LiveKit Cloud. We do not store, log, or inspect voice conversation audio.
              </p>
              <p>
                <strong>Device Data:</strong> Push tokens, device models, operating systems, and performance logs for troubleshooting.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-surface border border-border text-primary font-mono text-sm">2</span>
              How We Use Information
            </h2>
            <p>
              We process location and audio data solely to deliver the proximity radar voice chat, manage your group convoys, and route push notifications. Location updates are shared in real-time ONLY with verified friends or members of active convoys you join. <strong>We never sell, rent, or monetize your location or profile data.</strong>
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-surface border border-border text-primary font-mono text-sm">3</span>
              Data Retention &amp; Safety
            </h2>
            <p>
              Location coordinates are stored purely in memory and are discarded as soon as you go offline or exit a convoy. Personal profile details are kept securely in our database until you delete your account. You can trigger permanent account deletion instantly at any time via the settings panel in the mobile app.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-surface border border-border text-primary font-mono text-sm">4</span>
              Third-Party Services
            </h2>
            <p>
              We integrate trusted sub-processors to power the core app infrastructure:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Twilio Verify:</strong> Secure phone-based verification.</li>
              <li><strong>LiveKit Cloud:</strong> Real-time voice signaling and media transport.</li>
              <li><strong>Railway:</strong> Secure cloud infrastructure and server hosting.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-surface border border-border text-primary font-mono text-sm">5</span>
              Contact Us
            </h2>
            <div className="bg-surface-raised border border-border rounded-2xl p-6 flex items-start gap-4">
              <div className="p-3 bg-primary/10 rounded-xl text-primary mt-1">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Have questions about your data?</p>
                <p className="text-sm">Reach out to us directly, and we will get back to you within 48 hours.</p>
                <a href="mailto:locus@fuegocoding.com" className="text-primary hover:text-primary-glow font-medium text-sm mt-2 block">
                  locus@fuegocoding.com
                </a>
              </div>
            </div>
          </section>
        </div>

        {/* Footer Link */}
        <div className="pt-8 border-t border-border/40 text-center">
          <Link href="/" className="text-primary hover:text-primary-glow text-sm font-semibold transition-colors">
            ← Back to Home
          </Link>
        </div>
      </div>
    </main>
  )
}
