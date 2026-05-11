@REM ----------------------------------------------------------------------------
@REM Licensed to the Apache Software Foundation (ASF)
@REM Maven Wrapper startup batch script for Windows
@REM ----------------------------------------------------------------------------

@echo off
@setlocal

set WRAPPER_JAR="%~dp0\.mvn\wrapper\maven-wrapper.jar"
set WRAPPER_PROPERTIES="%~dp0\.mvn\wrapper\maven-wrapper.properties"

@REM Find java.exe
set JAVA_EXE=java.exe
%JAVA_EXE% -version >NUL 2>&1
if "%ERRORLEVEL%" == "0" goto findMvnDir

echo. ERROR: JAVA_HOME is not set and no 'java' command could be found in your PATH.
goto error

:findMvnDir
set MAVEN_PROJECTBASEDIR=%~dp0

@REM Use the wrapper
%JAVA_EXE% ^
  -jar %WRAPPER_JAR% ^
  %*

if ERRORLEVEL 1 goto error
goto end

:error
set ERROR_CODE=1

:end
@endlocal & set ERROR_CODE=%ERROR_CODE%
exit /B %ERROR_CODE%
