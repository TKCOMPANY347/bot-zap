const { default: makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys");
const axios = require("axios");
const http = require("http");

// Servidor para manter o Render ativo
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Bot online');
}).listen(process.env.PORT || 8080);

async function iniciarBot() {
    const { state, saveCreds } = await useMultiFileAuthState("./auth");
    const sock = makeWASocket({ auth: state, printQRInTerminal: false });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", (update) => {
        const { connection, qr } = update;
        
        // Esta parte gera o link para o QR Code
        if (qr) {
            console.log("--- QR CODE ABAIXO (COPIE O LINK ABAIXO E COLE NO NAVEGADOR) ---");
            console.log(`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qr)}`);
        }
        
        if (connection === "open") console.log("BOT ONLINE");
    });

    // ... (restante do código da API Groq)
}
iniciarBot();
