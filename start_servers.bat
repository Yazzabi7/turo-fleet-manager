@echo off
echo Demarrage des serveurs...

:: Tuer les processus Python existants (serveur Flask)
taskkill /F /IM python.exe >nul 2>&1

:: Tuer les processus Node existants (serveur React)
taskkill /F /IM node.exe >nul 2>&1

:: Vérifier si node_modules existe
cd /d %~dp0frontend-new
if not exist "node_modules\" (
    echo Installation des dependances frontend...
    call npm install
) else (
    echo Les dependances sont deja installees
)
cd /d %~dp0

:: Démarrer le serveur backend (Flask)
start cmd /k "cd /d %~dp0 && python run.py"

:: Attendre 2 secondes pour que le serveur Flask démarre
timeout /t 2 /nobreak >nul

:: Démarrer le serveur frontend (Vite)
start cmd /k "cd /d %~dp0frontend-new && npm run dev"

echo Les serveurs ont ete demarres !
echo Backend: http://localhost:5000
echo Frontend: http://localhost:5173
