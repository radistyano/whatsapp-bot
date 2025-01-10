const { MESSAGES } = require('../config/constants');

class TelegramHandler {
    constructor(bot, whatsappService) {
        this.bot = bot;
        this.whatsapp = whatsappService;
        this.sessions = new Map();
        this.loginChatId = null;
    }

    // Initialize all handlers
    init() {
        this.handleStart();
        this.handleLogin();
        this.handleHelp();
        this.handleCreateGroup();
        this.handleVCard();
    }

    // Handler for /start command
    handleStart() {
        this.bot.onText(/\/start/, (msg) => {
            const chatId = msg.chat.id;
            this.bot.sendMessage(chatId, MESSAGES.welcome, {
                parse_mode: 'Markdown',
                reply_markup: {
                    keyboard: [['/login'], ['/help']],
                    resize_keyboard: true
                }
            });
        });
    }

    // Handler for /login command
    handleLogin() {
        this.bot.onText(/\/login/, async (msg) => {
            const chatId = msg.chat.id;
            this.loginChatId = chatId;

            await this.bot.sendMessage(chatId, 
                '📱 *Mempersiapkan Login WhatsApp*\nMohon tunggu...',
                { parse_mode: 'Markdown' }
            );

            try {
                await this.whatsapp.initializeClient();
            } catch (error) {
                await this.bot.sendMessage(chatId, 
                    '❌ Gagal memulai sesi WhatsApp.\nSilakan coba lagi.',
                    { parse_mode: 'Markdown' }
                );
            }
        });
    }

    // Handler for /creategroup command
    handleCreateGroup() {
        this.bot.onText(/\/creategroup (.+)/, async (msg, match) => {
            const chatId = msg.chat.id;
            try {
                const params = match[1].split(' ');
                const groupName = params[0];
                let participants;

                if (this.sessions.has(chatId)) {
                    participants = this.sessions.get(chatId);
                } else {
                    if (params.length < 2) {
                        throw new Error('Format: /creategroup nama_grup nomor1,nomor2,...');
                    }
                    participants = params[1].split(',');
                }

                await this.bot.sendMessage(chatId, '⏳ Sedang membuat grup...');
                const result = await this.whatsapp.createGroup(groupName, participants);
                
                await this.bot.sendMessage(chatId,
                    `✅ Grup "${groupName}" berhasil dibuat!\n` +
                    `🆔 ID Grup: ${result.groupId}`,
                    { parse_mode: 'Markdown' }
                );

                this.sessions.delete(chatId);

            } catch (error) {
                await this.bot.sendMessage(chatId,
                    `❌ Error: ${error.message}`,
                    { parse_mode: 'Markdown' }
                );
            }
        });
    }

    // Handler for vCard files
    handleVCard() {
        this.bot.on('document', async (msg) => {
            const chatId = msg.chat.id;
            const file = msg.document;

            if (file.mime_type === 'text/vcard' || file.file_name.endsWith('.vcf')) {
                try {
                    await this.bot.sendMessage(chatId, 
                        '📥 Memproses file kontak...',
                        { parse_mode: 'Markdown' }
                    );

                    const result = await this.whatsapp.processVCardFile(file, this.bot);
                    this.sessions.set(chatId, result.numbers);

                    await this.sendContactProcessingResult(chatId, result);
                } catch (error) {
                    await this.bot.sendMessage(chatId,
                        `❌ Gagal memproses file: ${error.message}`,
                        { parse_mode: 'Markdown' }
                    );
                }
            }
        });
    }

    // Helper method to send contact processing results
    async sendContactProcessingResult(chatId, result) {
        let message = '*Hasil Impor Kontak*\n\n';
        message += `✅ Berhasil: ${result.totalSuccess}\n`;
        message += `❌ Gagal: ${result.totalFailed}\n\n`;

        if (result.totalSuccess > 0) {
            message += 'Kontak yang berhasil diimpor:\n';
            result.details.success.slice(0, 10).forEach((contact, i) => {
                message += `${i + 1}. ${contact.name} (${contact.country})\n`;
            });

            if (result.totalSuccess > 10) {
                message += `...dan ${result.totalSuccess - 10} kontak lainnya\n`;
            }
        }

        await this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    }

    // Handler for monitoring connection
    async monitorConnection() {
        if (this.loginChatId && this.whatsapp.isInitialized()) {
            try {
                const state = await this.whatsapp.getConnectionState();
                if (state !== 'CONNECTED') {
                    await this.bot.sendMessage(this.loginChatId,
                        '⚠️ *PERINGATAN*\n' +
                        `Status Koneksi: ${state}\n` +
                        'Mencoba menghubungkan kembali...',
                        { parse_mode: 'Markdown' }
                    );
                }
            } catch (error) {
                console.error('Error monitoring connection:', error);
            }
        }
    }
}

module.exports = TelegramHandler;