package com.flashman.mobile

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.hardware.camera2.CameraCharacteristics
import android.hardware.camera2.CameraManager
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat

class TorchService : Service() {
  companion object {
    const val ACTION_TOGGLE = "com.flashman.mobile.ACTION_TOGGLE"
    const val EXTRA_STATE = "state"
    const val CHANNEL_ID = "TorchServiceChannel"
    const val NOTIF_ID = 4242
  }

  private lateinit var cameraManager: CameraManager
  private var cameraId: String? = null

  override fun onCreate() {
    super.onCreate()
    cameraManager = getSystemService(Context.CAMERA_SERVICE) as CameraManager
    try {
      for (id in cameraManager.cameraIdList) {
        val chars = cameraManager.getCameraCharacteristics(id)
        val hasFlash = chars.get(CameraCharacteristics.FLASH_INFO_AVAILABLE) ?: false
        val lensFacing = chars.get(CameraCharacteristics.LENS_FACING)
        if (hasFlash) {
          cameraId = id
          break
        }
      }
    } catch (e: Exception) {
      cameraId = null
    }
    createNotificationChannel()
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    val state = intent?.getBooleanExtra(EXTRA_STATE, true) ?: true

    if (state) {
      val notif = buildNotification()
      startForeground(NOTIF_ID, notif)
    }

    setTorch(state)

    if (!state) {
      stopForeground(true)
      stopSelf()
    }

    return START_STICKY
  }

  private fun createNotificationChannel() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val name = "Torch Service"
      val chan = NotificationChannel(CHANNEL_ID, name, NotificationManager.IMPORTANCE_LOW)
      val mgr = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
      mgr.createNotificationChannel(chan)
    }
  }

  private fun buildNotification(): Notification {
    val builder = NotificationCompat.Builder(this, CHANNEL_ID)
      .setContentTitle("FlashMan: Torch Active")
      .setContentText("Keeping flashlight on for show")
      .setSmallIcon(android.R.drawable.ic_lock_idle_charging)
      .setOngoing(true)
    return builder.build()
  }

  private fun setTorch(on: Boolean) {
    try {
      cameraId?.let { cameraManager.setTorchMode(it, on) }
    } catch (e: Exception) {
      // ignore
    }
  }

  override fun onBind(intent: Intent?): IBinder? {
    return null
  }
}
