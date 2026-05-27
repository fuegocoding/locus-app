import { headers } from 'next/headers'
import Link from 'next/link'
import { Logo } from '@/components/ui/logo'
import { Download, Monitor, Smartphone, ArrowRight } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'

function isMobile(userAgent: string): boolean {
  return /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)
}

function isAndroid(userAgent: string): boolean {
  return /Android/i.test(userAgent)
}

export default function DownloadPage() {
  const headersList = headers()
  const ua = headersList.get('user-agent') || ''
  const mobile = isMobile(ua)
  const android = isAndroid(ua)

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50 h-14">
        <div className="max-w-6xl mx-auto px-6 h-full flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <Logo className="w-7 h-7 text-primary transition-transform duration-200 group-hover:scale-105" />
            <span className="text-lg font-bold text-foreground tracking-tight">Locus</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center pt-14 pb-16 px-6">
        <div className="max-w-md w-full text-center space-y-8">
          {mobile ? (
            <>
              <div className="space-y-4">
                <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center">
                  <Smartphone className="w-10 h-10 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">
                    Download Locus
                  </h1>
                  <p className="mt-2 text-muted text-sm leading-relaxed">
                    {android
                      ? 'Get the latest Android APK to start talking to who\'s near you.'
                      : 'Locus is available on Android. Download the APK to get started.'}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {android ? (
                  <div className="pt-4 border-t border-border/40">
                    <a
                      href="/app/download/file"
                      download="locus.apk"
                      className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-primary text-white rounded-xl text-base font-bold hover:bg-primary-dim transition-all duration-200 shadow-sm"
                    >
                      <Download className="w-4 h-4" />
                      Download APK
                    </a>
                    <p className="mt-3 text-xs text-muted">
                      Allow installation from unknown sources if prompted.
                    </p>
                  </div>
                ) : (
                  <div className="glass rounded-xl p-6 space-y-4 border border-border">
                    <p className="text-sm text-muted">
                      Locus is currently available on Android.
                    </p>
                    <p className="text-xs text-muted">
                      Scan the QR code with your Android phone to download.
                    </p>
                    <div className="flex justify-center">
                      <div className="bg-white p-3 rounded-xl shadow-lg inline-block">
                        <QRCodeSVG
                          value="https://locus.wtf/app/download"
                          size={160}
                          level="M"
                          fgColor="#0D1117"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-muted">Scan to download</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="space-y-4">
                <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center">
                  <Monitor className="w-10 h-10 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">
                    You&apos;re on desktop
                  </h1>
                  <p className="mt-2 text-muted text-sm leading-relaxed">
                    Locus is a mobile app. Scan the QR code with your phone to download, or visit this page on your phone.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-center">
                  <div className="bg-white p-4 rounded-2xl shadow-lg inline-block">
                    <QRCodeSVG
                      value="https://locus.wtf/app/download"
                      size={200}
                      level="M"
                      fgColor="#0D1117"
                    />
                  </div>
                </div>
                <p className="text-sm text-muted">Scan to download on your phone</p>
                <p className="text-xs text-muted">
                  or open <span className="font-mono text-foreground">locus.wtf/app/download</span> on your phone
                </p>
              </div>
            </>
          )}
        </div>
      </main>

      <footer className="text-center py-6 text-xs text-muted border-t border-border/40">
        <Link href="/" className="hover:text-foreground transition-colors">Locus</Link>
        {' '}&middot;{' '}
        <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
        {' '}&middot;{' '}
        <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
      </footer>
    </div>
  )
}
