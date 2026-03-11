

echo.

REM Check if git is installed
where git >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Git belum terinstall!
    echo Silakan install Git terlebih dahulu:
    echo https://git-scm.com/download/win
    pause
    exit /b 1
)

REM Initialize git if not already
if not exist ".git" (
    echo [1/5] Menginisialisasi Git...
    git init
    git branch -M main
)

echo [2/5] Menambahkan file...
git add .

echo.
echo [3/5] Membuat commit...
set /p commit_msg="Masukkan pesan commit: "
if "%commit_msg%"=="" set commit_msg=Update GuruDesk App
git commit -m "%commit_msg%"

echo.
echo [4/5] Menambahkan remote origin...
git remote remove origin 2>nul
git remote add origin https://github.com/sulthoni122/DeskSchool.git

echo.
echo [5/5] Push ke GitHub...
git push -u origin main

echo.
echo ========================================
echo   Selesai!
echo ========================================
pause

