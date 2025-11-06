@echo off
REM Flight Reservation System - Quick Setup Script (Windows)
REM This script automates the setup process

echo ==========================================
echo Flight Reservation System - Setup
echo ==========================================
echo.

REM Check Node.js
echo Checking Node.js...
where node >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [32m✓ Node.js installed[0m
    node --version
) else (
    echo [31m✗ Node.js not found. Please install Node.js 18+[0m
    exit /b 1
)

REM Check npm
where npm >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [32m✓ npm installed[0m
    npm --version
) else (
    echo [31m✗ npm not found[0m
    exit /b 1
)

REM Check MySQL
echo Checking MySQL...
where mysql >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [32m✓ MySQL installed[0m
) else (
    echo [31m✗ MySQL not found. Please install MySQL 8.0+[0m
    exit /b 1
)

echo.
echo ==========================================
echo Step 1: Database Setup
echo ==========================================
echo.
echo Please run the following in MySQL Workbench:
echo   1. Open db\schema-with-data.sql
echo   2. Execute the script
echo.
pause

echo.
echo ==========================================
echo Step 2: Backend Setup
echo ==========================================
echo.

cd backend

if not exist .env (
    echo Creating .env file...
    copy .env.example .env
    echo [32m✓ .env file created[0m
    echo [33m⚠ Please update .env with your MySQL password[0m
    pause
)

echo Installing backend dependencies...
call npm install
if %ERRORLEVEL% EQU 0 (
    echo [32m✓ Backend dependencies installed[0m
) else (
    echo [31m✗ Failed to install backend dependencies[0m
    exit /b 1
)

echo.
echo ==========================================
echo Step 3: Frontend Setup
echo ==========================================
echo.

cd ..\frontend

echo Installing frontend dependencies...
call npm install
if %ERRORLEVEL% EQU 0 (
    echo [32m✓ Frontend dependencies installed[0m
) else (
    echo [31m✗ Failed to install frontend dependencies[0m
    exit /b 1
)

cd ..

echo.
echo ==========================================
echo Setup Complete! 🎉
echo ==========================================
echo.
echo To start the application:
echo.
echo   Terminal 1 (Backend):
echo     cd backend
echo     npm run dev
echo.
echo   Terminal 2 (Frontend):
echo     cd frontend
echo     npm run dev
echo.
echo Then open: http://localhost:5174
echo.
echo Login with:
echo   Email: john.doe@email.com
echo   Password: password123
echo.
echo ==========================================
pause
