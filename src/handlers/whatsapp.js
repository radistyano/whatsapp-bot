const qrcode = require('qrcode');
const fs = require('fs').promises;

const setupWhatsAppClient = (whatsapp, bot) => {
    whatsapp.on('qr', async (qr) => {
        try {
            if (!global.loginChatId) {
                console.log('No login chat ID available');
                return;
            }

            const qrPath = './temp/qr.png';
            
            // Generate QR code
            await qrcode.toFile(qrPath, qr, {
                errorCorrectionLevel: 'H',
                margin: 1,
                scale: 8
            });

            // Send instructions and QR code
            await bot.sendMessage(global.loginChatId, 
                '📱 *SCAN QR CODE*\n\n' +
                '1. Buka WhatsApp di HP\n' +
                '2. Ketuk Menu > Perangkat Tertaut\n' +
                '3. Ketuk "Hubungkan Perangkat"\n' +
                '4. Scan QR Code ini',
                { parse_mode: 'Markdown' }
            );

            // Send QR code image
            await bot.sendPhoto(global.loginChatId, qrPath);
            
            // Clean up
            await fs.unlink(qrPath).catch(console.error);

        } catch (error) {
            console.error('QR code error:', error);
            if (global.loginChatId) {
                bot.sendMessage(global.loginChatId, '❌ Gagal membuat QR Code. Silakan coba /login lagi');
            }
        }
    });

    // Other event handlers
    whatsapp.on('ready', async () => {
        if (global.loginChatId) {
            bot.sendMessage(global.loginChatId, '✅ WhatsApp berhasil terhubung!');
        }
    });

    whatsapp.on('authenticated', () => {
        if (global.loginChatId) {
            bot.sendMessage(global.loginChatId, '✅ Autentikasi berhasil!');
        }
    });

    whatsapp.on('auth_failure', () => {
        if (global.loginChatId) {
            bot.sendMessage(global.loginChatId, '❌ Autentikasi gagal. Silakan coba /login lagi');
        }
    });
};

module.exports = { setupWhatsAppClient };