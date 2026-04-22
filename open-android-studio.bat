@echo off
echo ========================================
echo Opening TodaPay Android Project
echo ========================================
echo.
echo Project Location: %~dp0android
echo.
echo IMPORTANT:
echo 1. Android Studio will open
echo 2. Click "Trust Project" if prompted
echo 3. Wait for Gradle sync to complete (5-10 min)
echo.
pause
echo.
echo Opening Android Studio...
start "" "C:\Program Files\Android\Android Studio\bin\studio64.exe" "%~dp0android"
echo.
echo Android Studio should open shortly...
echo If it opens in Light Edit mode:
echo   - Look for "Load Project" or "Import Project" banner at the top
echo   - Click it to import as Gradle project
echo.
pause
