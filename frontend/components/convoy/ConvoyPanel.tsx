'use client'

import { useState } from 'react'
import { Copy, QrCode, Share2, Video, VideoOff, LogOut, Users } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { useAppStore } from '@/lib/store'
import { socketActions } from '@/lib/socket'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export function ConvoyPanel() {
  const [showQr, setShowQr] = useState(false)
  const [copied, setCopied] = useState(false)
  const { currentConvoy, videoEnabled, setVideoEnabled, nearbyUsers, mode } = useAppStore()

  if (!currentConvoy) return null

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''
  const inviteUrl = `${appUrl}/join/${currentConvoy.inviteCode}`

  function copyCode() {
    navigator.clipboard.writeText(currentConvoy!.inviteCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function copyLink() {
    navigator.clipboard.writeText(inviteUrl)
  }

  function handleLeave() {
    socketActions.leaveConvoy()
  }

  function toggleVideo() {
    const next = !videoEnabled
    setVideoEnabled(next)
    if (next) socketActions.startVideo()
    else socketActions.stopVideo()
  }

  return (
    <div className="absolute top-16 left-4 right-4 animate-slide-up z-20">
      <div className="glass-bright rounded-card p-4 border border-convoy/30 shadow-neon-blue space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-convoy/20 border border-convoy/40 flex items-center justify-center">
              <Users className="w-4 h-4 text-convoy" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">{currentConvoy.name}</h3>
              <p className="text-xs text-muted">
                {currentConvoy.members.length} member{currentConvoy.members.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="convoy">Convoy</Badge>
            <button
              onClick={handleLeave}
              className="text-xs text-muted hover:text-error transition-colors flex items-center gap-1"
            >
              <LogOut className="w-3.5 h-3.5" />
              Leave
            </button>
          </div>
        </div>

        {/* Invite code row */}
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 bg-surface rounded-xl px-3 py-2 border border-border">
            <span className="font-mono text-lg font-bold tracking-widest text-foreground flex-1">
              {currentConvoy.inviteCode}
            </span>
            <button
              onClick={copyCode}
              className="text-muted hover:text-primary transition-colors p-1"
              title="Copy code"
            >
              {copied ? (
                <span className="text-proximity text-xs font-semibold">Copied!</span>
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>

          <button
            onClick={() => setShowQr((v) => !v)}
            className={cn(
              'p-2.5 rounded-xl border transition-all duration-200',
              showQr
                ? 'bg-primary/20 border-primary text-primary'
                : 'bg-surface border-border text-muted hover:border-primary hover:text-primary'
            )}
            title="Show QR code"
          >
            <QrCode className="w-4 h-4" />
          </button>

          <button
            onClick={copyLink}
            className="p-2.5 rounded-xl bg-surface border border-border text-muted hover:border-primary hover:text-primary transition-all duration-200"
            title="Copy invite link"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>

        {/* QR Code */}
        {showQr && (
          <div className="flex flex-col items-center gap-2 py-2 animate-fade-in">
            <div className="bg-white p-3 rounded-xl">
              <QRCodeSVG value={inviteUrl} size={160} bgColor="#ffffff" fgColor="#080810" />
            </div>
            <p className="text-xs text-muted">{inviteUrl}</p>
          </div>
        )}

        {/* Video toggle */}
        <Button
          variant={videoEnabled ? 'danger' : 'neon-cyan'}
          size="sm"
          className="w-full"
          onClick={toggleVideo}
        >
          {videoEnabled ? (
            <><VideoOff className="w-4 h-4" /> Stop Video</>
          ) : (
            <><Video className="w-4 h-4" /> Start Video</>
          )}
        </Button>
      </div>
    </div>
  )
}
