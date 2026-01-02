package com.flashman.mobile

import android.content.Intent
import android.os.Build
import android.util.Log
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class TorchModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
  override fun getName(): String {
    return "TorchModule"
  }

  @ReactMethod
  fun startTorch(on: Boolean) {
    val ctx = reactApplicationContext
    val intent = Intent(ctx, TorchService::class.java)
    intent.putExtra(TorchService.EXTRA_STATE, on)
    intent.action = TorchService.ACTION_TOGGLE
    Log.d("TorchModule", "startTorch requested on=$on")
    try {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        ctx.startForegroundService(intent)
      } else {
        ctx.startService(intent)
      }
      Log.d("TorchModule", "startTorch service started")
    } catch (e: Exception) {
      Log.e("TorchModule", "Failed to start TorchService", e)
    }
  }
}
