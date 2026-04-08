const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors({ origin: '*' }));

// Il server Node ora fa solo da vigile urbano per i segnali Socket.io
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

io.on('connection', (socket) => {
    console.log(`Socket attivo su Aruba: ${socket.id}`);

    // Quando il soccorritore preme il tasto emergenza
    socket.on('soccorritore-avvia', (data) => {
        console.log('🚨 Emergenza attivata dal soccorritore');
        socket.broadcast.emit('notifica-emergenza', data);
    });
});

// Porta 3001 (è stata aperta nel firewall)
const PORT = 3001;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 BACKEND TELEEXPERT ONLINE SU ARUBA PORTA ${PORT}`);
});
