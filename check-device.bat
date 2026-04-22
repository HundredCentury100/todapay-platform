@echo off
echo ========================================
echo Check Connected Android Devices
echo ========================================
echo.
echo Make sure your Samsung A06 is:
echo 1. Connected via USB cable
echo 2. USB Debugging is enabled
echo 3. You've allowed USB debugging on the phone
echo.
pause
echo.
echo Checking for connected devices...
echo.

REM Check if Android SDK platform-tools exists
if exist "%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe" (
    echo Found ADB in Android SDK
    "%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe" devices
) else if exist "C:\Program Files\Android\Android Studio\jbr\bin\adb.exe" (
    echo Found ADB in Android Studio
    "C:\Program Files\Android\Android Studio\jbr\bin\adb.exe" devices
) else (
    echo ADB not found. Please make sure Android Studio is installed.
    echo.
    echo You can also check in Android Studio:
    echo 1. Open Android Studio
    echo 2. Top toolbar - look for device dropdown
    echo 3. Your Samsung A06 should appear there
)

echo.
echo ========================================
echo.
echo If you see your device listed above, you're ready to run the app!
echo.
echo If "unauthorized", go to your phone and allow USB debugging.
echo If no devices listed, try:
echo   - Different USB cable
echo   - Different USB port
echo   - Restart phone
echo   - Reinstall Samsung USB drivers
echo.
pause
