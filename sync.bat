@echo off
echo ======================================================
echo    Sincronizando Oficios Ahome con GitHub...
echo ======================================================
git add .
set /p msg="Mensaje de actualizacion (presiona Enter para 'update'): "
if "%msg%"=="" set msg=update: mejoras y ajustes en Oficios Ahome
git commit -m "%msg%"
git push origin main
echo ======================================================
echo    Listo! Cambios subidos y desplegados en vivo.
echo ======================================================
pause
