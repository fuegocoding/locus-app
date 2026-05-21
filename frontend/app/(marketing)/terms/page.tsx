import Link from 'next/link'
import { FileText, Calendar, Scale, HelpCircle } from 'lucide-react'

export const metadata = {
  title: 'Terms of Service - Locus',
  description: 'Terms of Service for the Locus proximity voice chat and convoy mobile application.',
}

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-background text-foreground pt-28 pb-20 px-6 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-convoy/5 blur-[120px] pointer-events-none" />

      <div className="max-w-3xl mx-auto space-y-12 relative">
        {/* Header */}
        <div className="space-y-4 border-b border-border/40 pb-8">
          <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center shadow-neon-sm">
            <Scale className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary-glow to-convoy bg-clip-text text-transparent">
            Terms of Service
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
              Acceptance of Terms
            </h2>
            <p>
              By installing the Locus mobile application or accessing our web services, you agree to comply with and be bound by these Terms of Service. If you do not accept these terms in full, please delete the application immediately and discontinue any use of our platform.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-surface border border-border text-primary font-mono text-sm">2</span>
              User Eligibility &amp; Account
            </h2>
            <p>
              To use Locus, you must be at least 13 years old. You are responsible for maintaining the confidentiality of your account credentials (phone number verification tokens) and all actions that occur under your account. You agree to provide accurate, up-to-date display name information when setting up your profile.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-surface border border-border text-primary font-mono text-sm">3</span>
              Acceptable Use Policy
            </h2>
            <div className="bg-surface/50 border border-border/50 rounded-2xl p-6 space-y-3 backdrop-blur-sm">
              <p className="font-semibold text-foreground">You agree NOT to use Locus to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Harass, stalk, abuse, intimidate, or spam other drivers.</li>
                <li>Transmit illegal, abusive, obscene, or threatening audio content.</li>
                <li>Spoof GPS coordinates or manipulate location data for malicious purposes.</li>
                <li>Attempt to intercept or record voice streams of other users without explicit consent.</li>
                <li>Violate any local traffic safety laws or operate the mobile application in a way that distracts you while driving.</li>
              </ul>
            </div>
            <p className="text-sm italic text-warning">
              Safety Warning: Never operate the Locus app in a way that compromises your safety or the safety of others on the road. Drive responsibly and obey all traffic regulations.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-surface border border-border text-primary font-mono text-sm">4</span>
              Intellectual Property Rights
            </h2>
            <p>
              The Locus name, logo, custom user interface components, and codebase are the proprietary property of Fuego Coding. You are granted a limited, non-exclusive, non-transferable, revocable license to use the app for personal, non-commercial purposes on compatible mobile devices.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-surface border border-border text-primary font-mono text-sm">5</span>
              Limitation of Liability
            </h2>
            <p>
              Locus is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis without warranties of any kind, express or implied. Under no circumstances shall Fuego Coding, Twilio, LiveKit, or Railway be held liable for any direct, indirect, incidental, or consequential damages resulting from your use or inability to use the platform (including driving incidents, location inaccuracies, or connection dropouts).
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-surface border border-border text-primary font-mono text-sm">6</span>
              Questions or Concerns
            </h2>
            <div className="bg-surface-raised border border-border rounded-2xl p-6 flex items-start gap-4">
              <div className="p-3 bg-primary/10 rounded-xl text-primary mt-1">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Need clarification on our terms?</p>
                <p className="text-sm">Our team is happy to answer any questions you have regarding acceptable use or license boundaries.</p>
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
