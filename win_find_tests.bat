@echo off
setlocal
set currentLevel=0
set maxLevel=3
set spc= 
set qte="

:procFolder
pushd %1 2>nul || exit /b
if %currentLevel% lss %maxLevel% (
  set tDir="%CD%\test"
  IF not exist "%tDir%\NUL" GOTO :notest
      echo %tDir%
  :notest
  for /d %%F in (*) do (
    set /a currentLevel+=1
    call :procFolder "%%F" 2>nul
    set /a currentLevel-=1
  )
)
popd
exit /b