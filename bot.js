const { default: makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys");
const axios = require("axios");
const http = require("http");
const qrcode = require("qrcode"); // Certifique-se de ter instalado esta biblioteca

// Servidor para manter o Render ativo
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Bot online');
}).listen(process.env.PORT || 8080);

async function iniciarBot() {
    const { state, saveCreds } = await useMultiFileAuthState("./auth");
    const sock = makeWASocket({ auth: state, printQRInTerminal: false });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async (update) => {
        const { connection, qr } = update;
        
        if (qr) {
            console.log("--- QR CODE ABAIXO ---");
            // Gera o QR Code em formato de texto para aparecer no log
            const qrText = await qrcode.toString(qr, { type: 'terminal', small: true });
            console.log(qrText);
            console.log("--- ESCANEIE EM ATÉ 30 SEGUNDOS ---");
        }
        
        if (connection === "open") console.log("BOT ONLINE");
    });

    // ... (restante do seu código da API Groq)
}
iniciarBot();
