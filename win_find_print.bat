@echo off

setlocal

pushd %1 2>nul
for /f %%S in ('dir /b %1') do (
  call :condprint "%%~fS" "%%~xS" 2>nul
)
popd

exit /b

:condprint
if ".coffee" == %2 goto printit
if ".js" == %2 goto printit
goto skipit
:printit
echo %1
:skipit