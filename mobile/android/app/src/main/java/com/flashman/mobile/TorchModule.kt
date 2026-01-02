package com.flashman.mobile

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import android.content.Intent
import android.os.Build

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
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      ctx.startForegroundService(intent)
    } else {
      ctx.startService(intent)
    }
  }
}
