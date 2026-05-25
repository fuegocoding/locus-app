package com.fuegocoding.locus

import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel

class MainActivity : FlutterActivity() {
    private val OVERLAY_CHANNEL = "com.fuegocoding.locus/overlay"

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)

        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, OVERLAY_CHANNEL).setMethodCallHandler { call, result ->
            when (call.method) {
                "canDrawOverlays" -> {
                    result.success(
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                            Settings.canDrawOverlays(this)
                        } else {
                            true
                        }
                    )
                }
                "requestOverlayPermission" -> {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M &&
                        !Settings.canDrawOverlays(this)) {
                        val intent = Intent(
                            Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                            Uri.parse("package:$packageName")
                        )
                        startActivity(intent)
                    }
                    result.success(true)
                }
                "startOverlay" -> {
                    startOverlay()
                    result.success(true)
                }
                "stopOverlay" -> {
                    stopOverlay()
                    result.success(true)
                }
                "isOverlayRunning" -> {
                    result.success(OverlayService.isRunning)
                }
                "setOverlayMuted" -> {
                    val muted = call.argument<Boolean>("muted") ?: false
                    OverlayService.onToggleMic?.invoke(muted)
                    result.success(true)
                }
                else -> result.notImplemented()
            }
        }

        OverlayService.onToggleMic = { muted ->
            MethodChannel(flutterEngine.dartExecutor.binaryMessenger, OVERLAY_CHANNEL)
                .invokeMethod("onMicToggled", mapOf("muted" to muted))
        }

        OverlayService.onTapOpen = {
            val launchIntent = packageManager.getLaunchIntentForPackage(packageName)
            if (launchIntent != null) {
                launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_REORDER_TO_FRONT)
                startActivity(launchIntent)
            }
        }
    }

    private fun startOverlay() {
        if (!OverlayService.isRunning) {
            val intent = Intent(this, OverlayService::class.java)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                startForegroundService(intent)
            } else {
                startService(intent)
            }
        }
    }

    private fun stopOverlay() {
        val intent = Intent(this, OverlayService::class.java)
        stopService(intent)
    }
}
