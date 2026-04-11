package com.pockethost

import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.ServiceConnection
import android.os.IBinder
import androidx.core.content.ContextCompat
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ServerProcessModule : Module() {
  private var serverService: ServerForegroundService? = null
  private var isBound = false

  private val connection = object : ServiceConnection {
    override fun onServiceConnected(className: ComponentName, service: IBinder) {
      val binder = service as ServerForegroundService.LocalBinder
      serverService = binder.getService()
      isBound = true

      // Forward events to Expo
      serverService?.onLog = { line ->
        sendEvent("onLog", mapOf("line" to line))
      }
      serverService?.onStatusChange = { status ->
        sendEvent("onStatusChange", mapOf("status" to status))
      }
      serverService?.onError = { error ->
        sendEvent("onError", mapOf("message" to error))
      }
    }

    override fun onServiceDisconnected(arg0: ComponentName) {
      isBound = false
      serverService = null
    }
  }

  override fun definition() = ModuleDefinition {
    Name("ServerProcess")

    Events("onLog", "onStatusChange", "onError")

    OnCreate {
      val context = appContext.reactContext ?: return@OnCreate
      val intent = Intent(context, ServerForegroundService::class.java)
      context.bindService(intent, connection, Context.BIND_AUTO_CREATE)
    }

    OnDestroy {
      if (isBound) {
        appContext.reactContext?.unbindService(connection)
        isBound = false
      }
    }

    AsyncFunction("startServer") { jarPath: String, maxMem: Int, worldDir: String ->
      try {
        val context = appContext.reactContext ?: throw Exception("No react context")
        
        // Start the foreground service explicitly
        val serviceIntent = Intent(context, ServerForegroundService::class.java)
        ContextCompat.startForegroundService(context, serviceIntent)

        // Command the service to start the Java process
        serverService?.startServer(jarPath, maxMem, worldDir)
          ?: throw Exception("Service not bound yet")
        true
      } catch (e: Exception) {
        sendEvent("onError", mapOf("message" to e.message))
        throw Exception("START_FAILED: ${e.message}", e)
      }
    }

    AsyncFunction("stopServer") {
      try {
        serverService?.stopServer()
        true
      } catch (e: Exception) {
        throw Exception("STOP_FAILED: ${e.message}", e)
      }
    }

    AsyncFunction("sendCommand") { command: String ->
      try {
        serverService?.writeCommand(command)
        true
      } catch (e: Exception) {
        throw Exception("CMD_FAILED: ${e.message}", e)
      }
    }

    Function("isRunning") { serverService?.process?.isAlive == true }
  }
}
