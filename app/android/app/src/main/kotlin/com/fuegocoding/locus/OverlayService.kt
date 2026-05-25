package com.fuegocoding.locus

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.graphics.PixelFormat
import android.os.Build
import android.os.IBinder
import android.view.Gravity
import android.view.LayoutInflater
import android.view.View
import android.view.WindowManager
import android.widget.FrameLayout
import android.widget.ImageView
import androidx.core.app.NotificationCompat

class OverlayService : Service() {

    private var windowManager: WindowManager? = null
    private var overlayView: View? = null
    private var isMicMuted = false

    companion object {
        const val CHANNEL_ID = "locus_overlay"
        const val NOTIFICATION_ID = 1001
        var isRunning = false
        var onToggleMic: ((Boolean) -> Unit)? = null
        var onTapOpen: (() -> Unit)? = null
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        isRunning = true
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val notification = buildNotification()
        startForeground(NOTIFICATION_ID, notification)

        windowManager = getSystemService(WINDOW_SERVICE) as WindowManager
        showOverlay()

        return START_STICKY
    }

    override fun onDestroy() {
        removeOverlay()
        isRunning = false
        super.onDestroy()
    }

    private fun showOverlay() {
        val inflater = getSystemService(LAYOUT_INFLATER_SERVICE) as LayoutInflater
        overlayView = inflater.inflate(R.layout.overlay_bubble, null) as FrameLayout

        val bubbleIcon = overlayView!!.findViewById<ImageView>(R.id.bubble_icon)
        updateBubbleIcon(bubbleIcon)

        bubbleIcon.setOnClickListener {
            isMicMuted = !isMicMuted
            updateBubbleIcon(bubbleIcon)
            onToggleMic?.invoke(isMicMuted)
        }

        bubbleIcon.setOnLongClickListener {
            onTapOpen?.invoke()
            true
        }

        val params = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            WindowManager.LayoutParams(
                WindowManager.LayoutParams.WRAP_CONTENT,
                WindowManager.LayoutParams.WRAP_CONTENT,
                WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
                        WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL or
                        WindowManager.LayoutParams.FLAG_WATCH_OUTSIDE_TOUCH,
                PixelFormat.TRANSLUCENT
            )
        } else {
            @Suppress("DEPRECATION")
            WindowManager.LayoutParams(
                WindowManager.LayoutParams.WRAP_CONTENT,
                WindowManager.LayoutParams.WRAP_CONTENT,
                WindowManager.LayoutParams.TYPE_PHONE,
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
                        WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL or
                        WindowManager.LayoutParams.FLAG_WATCH_OUTSIDE_TOUCH,
                PixelFormat.TRANSLUCENT
            )
        }

        params.gravity = Gravity.TOP or Gravity.START
        params.x = 16
        params.y = 300

        windowManager?.addView(overlayView, params)
    }

    private fun updateBubbleIcon(bubbleIcon: ImageView) {
        if (isMicMuted) {
            bubbleIcon.setImageResource(R.drawable.ic_mic_off_overlay)
            bubbleIcon.setColorFilter(Color.parseColor("#EF4444"))
        } else {
            bubbleIcon.setImageResource(R.drawable.ic_mic_overlay)
            bubbleIcon.setColorFilter(Color.parseColor("#C4B5FD"))
        }
    }

    fun updateMicMuted(muted: Boolean) {
        isMicMuted = muted
        overlayView?.let {
            val icon = it.findViewById<ImageView>(R.id.bubble_icon)
            updateBubbleIcon(icon)
        }
    }

    private fun removeOverlay() {
        if (overlayView != null) {
            try {
                windowManager?.removeView(overlayView)
            } catch (_: Exception) {}
            overlayView = null
        }
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Locus Voice Overlay",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Keeps Locus voice accessible while using other apps"
                setShowBadge(false)
            }
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }
    }

    private fun buildNotification(): Notification {
        val openIntent = packageManager.getLaunchIntentForPackage(packageName)
        val pendingIntent = PendingIntent.getActivity(
            this, 0, openIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Locus Voice")
            .setContentText(if (isMicMuted) "Mic muted" else "Connected — listening nearby")
            .setSmallIcon(R.drawable.ic_mic_overlay)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setContentIntent(pendingIntent)
            .build()
    }
}
