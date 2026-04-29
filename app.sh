#!/bin/bash
# MenuApp startup script
# Uso: bash /home/mugg_server_1/appmenu/app.sh

APP_DIR="/home/mugg_server_1/appmenu"

echo "=============================="
echo "  MenuApp - Iniciando..."
echo "=============================="

# Asegurar que PM2 esté disponible
export PATH="$HOME/.nvm/versions/node/$(ls $HOME/.nvm/versions/node 2>/dev/null | tail -1)/bin:$PATH:/usr/local/bin:/usr/bin"

cd "$APP_DIR"

# Si PM2 ya tiene la app corriendo, solo muestra el estado
if pm2 list 2>/dev/null | grep -q "menuapp-backend.*online"; then
    echo "[OK] menuapp-backend ya está corriendo."
    pm2 list
else
    echo "[INFO] Levantando menuapp-backend con PM2..."

    # Intentar restaurar sesión guardada primero
    pm2 resurrect 2>/dev/null

    # Si después del resurrect no está corriendo, arrancarlo manualmente
    if ! pm2 list 2>/dev/null | grep -q "menuapp-backend.*online"; then
        cd "$APP_DIR/MenuApp-Backend"
        pm2 start dist/index.js --name menuapp-backend
        pm2 save
    fi
fi

echo ""
echo "=============================="
echo "  Estado final:"
pm2 list
echo ""
echo "  App disponible en:"
echo "  → Local:    http://localhost:3001"
echo "  → Red:      http://$(hostname -I | awk '{print $1}'):3001"
echo "  → Público:  http://179.41.8.247  (vía Apache24)"
echo "=============================="
