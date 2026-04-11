# JRE Dependency

To run the Minecraft Java server on an Android device, a Linux ARM64 (aarch64) Java Runtime Environment is required because Android runs on ARM hardware and does not natively provide a standard JVM.

**Instructions for Building:**

1. Download a lightweight `aarch64` Linux JRE (e.g., from Adoptium or Alpine Linux packages) targeting OpenJDK 17 or 21 (depending on the target Minecraft server versions).
2. Archive the JRE folder structure into a zip file named **`jre.zip`**. Ensure that the `bin/java` executable is directly accessible within this structure (e.g., `bin/java` and not `my-jre-folder/bin/java`).
3. Place `jre.zip` in this directory (`modules/server-process/android/src/main/assets/`).

When the Android Foreground Service launches for the first time, it will:
1. Extract `jre.zip` into the app's internal `filesDir/jre/`.
2. Apply `chmod +x` to the `bin/java` file.
3. Use the absolute path to this binary to execute the Minecraft server `.jar`.
