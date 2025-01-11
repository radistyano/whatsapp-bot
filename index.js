const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const Logger = require('./utils/logger');

// Inisialisasi client
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox']
    }
});

// Event ketika QR code perlu di scan
client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
    Logger.info('QR Code telah digenerate, silakan scan menggunakan WhatsApp');
});

// Event untuk status koneksi
client.on('loading_screen', (percent, message) => {
    Logger.info(`Loading ${percent}% - ${message}`);
});

client.on('authenticated', () => {
    Logger.info('WhatsApp berhasil diautentikasi!');
});

client.on('auth_failure', msg => {
    Logger.error('Autentikasi gagal!', msg);
});

// Event ketika client sudah siap
client.on('ready', () => {
    Logger.info('WhatsApp Bot sudah siap dan terhubung!');
    Logger.info('----------------------------------------');
    Logger.info('Silakan kirim !ping untuk test bot');
});

// Event ketika client terputus
client.on('disconnected', (reason) => {
    Logger.warning('WhatsApp terputus! Alasan:', reason);
});

// Event ketika pesan masuk
client.on('message', async msg => {
    try {
        const content = msg.body.toLowerCase();

        // Command handler sederhana
        if (content === '!ping') {
            msg.reply('pong');
            Logger.info(`Responded to ping command from ${msg.from}`);
        }

        // Tambahkan command lain di sini

    } catch (error) {
        Logger.error(`Error handling message: ${error.message}`);
    }
});

// Inisialisasi client
console.log('Menginisialisasi WhatsApp Bot...');
client.initialize();