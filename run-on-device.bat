@echo off
echo ========================================
echo Run TodaPay on Connected Device
echo ========================================
echo.
echo Checking setup...
echo.

REM Set JAVA_HOME to Android Studio's bundled JDK
set "JAVA_HOME=C:\Program Files\Android\Android Studio\jbr"
set "PATH=%JAVA_HOME%\bin;%PATH%"

echo Java: %JAVA_HOME%
echo.

REM Set ANDROID_HOME
set "ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk"
set "PATH=%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\tools;%PATH%"

echo Android SDK: %ANDROID_HOME%
echo.

echo ========================================
echo Connected Devices:
echo ========================================
echo.

REM Check for connected devices
if exist "%ANDROID_HOME%\platform-tools\adb.exe" (
    "%ANDROID_HOME%\platform-tools\adb.exe" devices
) else (
    echo ADB not found. Using gradlew instead...
)

echo.
echo ========================================
echo.
echo Make sure your Samsung A06 is:
echo 1. Connected via USB
echo 2. USB Debugging enabled
echo 3. "Allow USB debugging" accepted on phone
echo.
echo If your device shows as "unauthorized" above,
echo check your phone for the USB debugging popup!
echo.
pause
echo.
echo ========================================
echo Building and Installing App...
echo ========================================
echo.
echo This will take 2-5 minutes on first run...
echo.

cd android
gradlew.bat installDebug

echo.
echo ========================================
echo Done!
echo ========================================
echo.
echo If successful, the TodaPay app should now be:
echo 1. Installed on your Samsung A06
echo 2. Check your phone's app drawer
echo 3. Or it might auto-launch
echo.
echo To launch the app manually:
echo - Find "TodaPay" icon on your phone
echo - Tap to open
echo.
pause
