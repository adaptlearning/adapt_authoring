@echo off

setlocal

set FTEST="%CD%\win_find_tests.bat"
set PFILES="%CD%\win_find_print.bat"

set TMP=%CD%\tmp.txt

if exist "%TMP%" goto RMTEMP
goto SKIPRM
:RMTEMP
echo "Deleting"
del "%TMP%"
:SKIPRM

for /f "tokens=*" %%a in ('%FTEST% %1') do (
  if not [%%a] == [] (
    call %PFILES% %%a 2>nul
  )
)

exit /b
echo "Write to"
call %FTEST% %1 > "%TMP%"

for /f %%i in ("%TMP%") do echo. > %%i

for /f %%R in ("%TMP%") do (
  echo %%R
)
