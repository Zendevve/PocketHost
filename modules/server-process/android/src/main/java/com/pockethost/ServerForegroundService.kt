package com.pockethost

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Intent
import android.os.Binder
import android.os.Build
import android.os.IBinder
import android.util.Log
import androidx.core.app.NotificationCompat
import java.io.BufferedReader
import java.io.File
import java.io.FileOutputStream
import java.io.InputStreamReader
import java.util.zip.ZipInputStream
import kotlin.concurrent.thread

class ServerForegroundService : Service() {
    private val binder = LocalBinder()
    
    var process: Process? = null
    var outputReader: Thread? = null

    // Callbacks for events
    var onLog: ((String) -> Unit)? = null
    var onStatusChange: ((String) -> Unit)? = null
    var onError: ((String) -> Unit)? = null

    inner class LocalBinder : Binder() {
        fun getService(): ServerForegroundService = this@ServerForegroundService
    }

    override fun onBind(intent: Intent): IBinder {
        return binder
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        createNotificationChannel()
        val notification = createNotification("Server is running")
        
        // Start foreground service
        startForeground(1, notification)

        return START_NOT_STICKY
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val serviceChannel = NotificationChannel(
                "PocketHostServerChannel",
                "Minecraft Server Service",
                NotificationManager.IMPORTANCE_LOW
            )
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(serviceChannel)
        }
    }

    private fun createNotification(contentText: String): Notification {
        return NotificationCompat.Builder(this, "PocketHostServerChannel")
            .setContentTitle("PocketHost Server")
            .setContentText(contentText)
            .setSmallIcon(android.R.drawable.ic_dialog_info) // Default icon for MVP
            .build()
    }

    private fun extractJreIfNeeded(): String {
        val jreDir = File(filesDir, "jre")
        val javaBin = File(jreDir, "bin/java")
        
        if (javaBin.exists() && javaBin.canExecute()) {
            return javaBin.absolutePath
        }
        
        onLog?.invoke("[System] Extracting JRE for the first time... This might take a moment.")
        
        try {
            val assetManager = assets
            val inputStream = assetManager.open("jre.zip")
            val zipInputStream = ZipInputStream(inputStream)
            
            var entry = zipInputStream.nextEntry
            val buffer = ByteArray(1024)
            
            while (entry != null) {
                val newFile = File(jreDir, entry.name)
                if (entry.isDirectory) {
                    newFile.mkdirs()
                } else {
                    File(newFile.parent).mkdirs()
                    val fos = FileOutputStream(newFile)
                    var len: Int
                    while (zipInputStream.read(buffer).also { len = it } > 0) {
                        fos.write(buffer, 0, len)
                    }
                    fos.close()
                }
                zipInputStream.closeEntry()
                entry = zipInputStream.nextEntry
            }
            zipInputStream.close()
            
            // Critical: make the binary executable
            javaBin.setExecutable(true)
            
            onLog?.invoke("[System] JRE extracted successfully.")
        } catch (e: Exception) {
            Log.e("PocketHost", "Failed to extract JRE", e)
            throw Exception("Failed to extract bundled JRE: ${e.message}")
        }
        
        return javaBin.absolutePath
    }

    fun startServer(jarPath: String, maxMem: Int, worldDir: String, jvmFlags: List<String> = emptyList()) {
        if (process?.isAlive == true) return

        thread {
            try {
                // 1. Extract JRE if necessary
                val javaBin = extractJreIfNeeded()
                
                // 2. Build the process command
                val cmd = mutableListOf(javaBin)
                cmd.add("-Xmx${maxMem}M")
                cmd.add("-Xms${maxMem / 2}M")
                for (flag in jvmFlags) {
                    cmd.add(flag)
                }
                cmd.addAll(listOf("-jar", jarPath, "--nogui", "--world", worldDir))

                val pb = ProcessBuilder(cmd)
                    .redirectErrorStream(true)
                    .directory(File(worldDir))

                // 3. Ensure the java binary is executable before launching
                val javaFile = File(javaBin)
                if (!javaFile.canExecute()) {
                    javaFile.setExecutable(true)
                }

                // Ensure the world directory exists
                val workDir = File(worldDir)
                if (!workDir.exists()) workDir.mkdirs()

                // Start the server
                process = pb.start()
                onStatusChange?.invoke("starting")

                outputReader = thread {
                    try {
                        val reader = BufferedReader(InputStreamReader(process!!.inputStream))
                        var line: String?
                        while (reader.readLine().also { line = it } != null) {
                            line?.let { logLine ->
                                onLog?.invoke(logLine)
                                if (logLine.contains("Done (") && logLine.contains(")! For help")) {
                                    onStatusChange?.invoke("running")
                                }
                            }
                        }
                    } catch (e: Exception) {
                        // stream closed
                    } finally {
                        onStatusChange?.invoke("idle")
                        stopSelf() // Stop service when process exits
                    }
                }
            } catch (e: Exception) {
                onError?.invoke(e.message ?: "Unknown error starting server")
                onStatusChange?.invoke("idle")
                stopSelf()
            }
        }
    }

    fun stopServer() {
        writeCommand("stop")
        thread {
            process?.waitFor()
            process = null
            stopSelf()
        }
    }

    fun writeCommand(command: String) {
        process?.outputStream?.let { out ->
            try {
                out.write("$command\n".toByteArray())
                out.flush()
            } catch (e: Exception) {
                onError?.invoke("CMD_FAILED: ${e.message}")
            }
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        process?.destroy()
        process = null
    }
}
