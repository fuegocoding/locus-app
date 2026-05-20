'use client'

import { useState, useRef } from 'react'
import { Mic, MicOff } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { socketActions } from '@/lib/socket'
import { cn } from '@/lib/utils'

export function MicButton() {
  const { micMuted, pushToTalk, setMicMuted, speaking } = useAppStore()
  const [isHolding, setIsHolding] = useState(false)
  const holdRef = useRef(false)

  const isSpeaking = pushToTalk ? isHolding : !micMuted

  function handlePttStart() {
    if (!pushToTalk) return
    holdRef.current = true
    setIsHolding(true)
    socketActions.pushToTalk(true)
  }

  function handlePttEnd() {
    if (!pushToTalk) return
    holdRef.current = false
    setIsHolding(false)
    socketActions.pushToTalk(false)
  }

  function handleToggle() {
    if (pushToTalk) return
    const next = !micMuted
    setMicMuted(next)
    socketActions.toggleMic(next)
  }

  return (
    <div className="relative flex items-center justify-center">
      {/* Outer glow ring when speaking */}
      {isSpeaking && (
        <>
          <div className="mic-ring" />
          <div className="mic-ring" style={{ animationDelay: '0.5s' }} />
        </>
      )}

      <button
        className={cn(
          'relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-200 select-none touch-none',
          isSpeaking
            ? 'bg-primary shadow-neon-lg scale-110'
            : micMuted && !pushToTalk
            ? 'bg-error/20 border-2 border-error shadow-[0_0_16px_rgba(255,68,102,0.4)]'
            : 'bg-surface-high border-2 border-border hover:border-primary hover:shadow-neon-sm',
          'active:scale-95'
        )}
        onMouseDown={pushToTalk ? handlePttStart : undefined}
        onMouseUp={pushToTalk ? handlePttEnd : undefined}
        onMouseLeave={pushToTalk ? handlePttEnd : undefined}
        onTouchStart={pushToTalk ? (e) => { e.preventDefault(); handlePttStart() } : undefined}
        onTouchEnd={pushToTalk ? (e) => { e.preventDefault(); handlePttEnd() } : undefined}
        onClick={!pushToTalk ? handleToggle : undefined}
        aria-label={pushToTalk ? 'Push to talk' : micMuted ? 'Unmute mic' : 'Mute mic'}
      >
        {micMuted && !pushToTalk ? (
          <MicOff className="w-8 h-8 text-error" />
        ) : (
          <Mic
            className={cn(
              'w-8 h-8 transition-colors',
              isSpeaking ? 'text-white' : 'text-muted-bright'
            )}
          />
        )}
      </button>

      {/* PTT label */}
      {pushToTalk && (
        <div className="absolute -bottom-6 text-[10px] text-muted font-medium whitespace-nowrap">
          {isHolding ? 'Speaking...' : 'Hold to talk'}
        </div>
      )}
    </div>
  )
}
