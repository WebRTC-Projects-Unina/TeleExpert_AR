#!/bin/bash

# 1. Entra nella cartella del frontend
cd ~/frontend

# 2. Genera la nuova cartella dist
echo "🚀 Building del frontend in corso..."
npm run build

# 3. Pulizia e copia verso il Server Node.js
# Nota: Assumendo che il tuo server sia in ~/TeleExpert-AR/
echo "📦 Copia verso il server Node..."
rm -rf ~/TeleExpert-AR/dist
cp -r dist ~/TeleExpert-AR/

# 4. Pulizia e copia verso Janus (richiede sudo perché è in /usr/local)
echo "🧞 Copia verso Janus Media Server..."
sudo rm -rf /usr/local/janus/share/janus/html/*
sudo cp -r dist/* /usr/local/janus/share/janus/html/

echo "✅ Aggiornamento completato con successo!"
