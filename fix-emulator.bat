@echo off
echo ========================================
echo Fix Android Emulator Hypervisor Issue
echo ========================================
echo.
echo This script will enable Windows features needed for Android Emulator
echo.
echo Please run this as Administrator:
echo 1. Right-click this file
echo 2. Select "Run as Administrator"
echo.
pause
echo.
echo Checking current status...
powershell -Command "Get-WindowsOptionalFeature -Online | Where-Object {$_.FeatureName -like '*Hyper*'} | Select-Object FeatureName, State"
echo.
echo Enabling Windows Hypervisor Platform...
DISM.exe /Online /Enable-Feature /FeatureName:HypervisorPlatform /All /NoRestart
echo.
echo.
echo Enabling Virtual Machine Platform...
DISM.exe /Online /Enable-Feature /FeatureName:VirtualMachinePlatform /All /NoRestart
echo.
echo.
echo ========================================
echo Done!
echo ========================================
echo.
echo IMPORTANT: You may need to RESTART your computer for changes to take effect.
echo.
echo After restart:
echo 1. Open Android Studio
echo 2. Create a new emulator (AVD Manager)
echo 3. The emulator should now work properly
echo.
pause
