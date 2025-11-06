@echo off
echo Setting up Flight Reservation Database...
echo.

REM Change to the directory containing this script
cd /d "%~dp0"

REM Find MySQL executable
set "MYSQL_PATH="
for %%P in ("C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe" "C:\Program Files (x86)\MySQL\MySQL Server 8.0\bin\mysql.exe") do (
    if exist %%P (
        set "MYSQL_PATH=%%~P"
        goto :found
    )
)

:found
if "%MYSQL_PATH%"=="" (
    echo MySQL not found in default locations.
    echo Please run this manually in MySQL Workbench:
    echo   File: %~dp0schema.sql
    pause
    exit /b 1
)

echo Found MySQL at: %MYSQL_PATH%
echo.
echo Enter MySQL root password: 
set /p PASSWORD=

echo.
echo Creating database...
"%MYSQL_PATH%" -u root -p%PASSWORD% < schema.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo Database setup completed successfully!
    echo ========================================
    echo.
    echo Database: flight_reservation
    echo All tables created and sample data inserted
    echo.
) else (
    echo.
    echo Database setup failed!
    echo Please check your MySQL password and try again.
    echo.
)

pause
