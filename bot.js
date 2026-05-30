const {
    default: makeWASocket,
    useMultiFileAuthState
} = require("@whiskeysockets/baileys")

const qrcode = require("qrcode-terminal")
const axios = require("axios")
const http = require("http")

// Mantém a conexão segura
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Servidor "fantasma" para o Render não encerrar o bot por inatividade
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Bot ativo');
}).listen(process.env.PORT || 8080);

async function iniciarBot() {
    const { state, saveCreds } = await useMultiFileAuthState("./auth")

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        connectTimeoutMs: 60000,
        defaultQueryTimeoutMs: 60000,
        keepAliveIntervalMs: 10000,
        retryRequestDelayMs: 500,
    })

    sock.ev.on("creds.update", saveCreds)

    sock.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
            console.log("--- QR CODE ABAIXO ---");
            qrcode.generate(qr, { small: true });
            console.log("--- ESCANEIE EM ATÉ 30 SEGUNDOS ---");
        }
        
        if (connection === "close") {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== 401;
            console.log("Conexão fechada, reconectando...");
            if (shouldReconnect) iniciarBot();
        } else if (connection === "open") {
            console.log("BOT ONLINE COM SUCESSO");
        }
    })

    sock.ev.on("messages.upsert", async ({ messages }) => {
        const msg = messages[0]
        if (!msg.message || msg.key.fromMe) return

        const texto = msg.message.conversation || msg.message.extendedTextMessage?.text
        if (!texto) return

        const numero = msg.key.remoteJid

        try {
            const resposta = await axios.post(
                "https://api.groq.com/openai/v1/chat/completions",
                {
                    model: "llama3-70b-8192",
                    messages: [{ role: "user", content: texto }]
                },
                {
                    headers: {
                        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
                        "Content-Type": "application/json"
                    }
                }
            )
            await sock.sendMessage(numero, { text: resposta.data.choices[0].message.content })
        } catch (erro) {
            console.log("Erro na API:", erro.message)
        }
    })
}

iniciarBot()
