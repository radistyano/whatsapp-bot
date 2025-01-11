let loginChatId = null;

const handleTelegramCommands = (bot, whatsapp) => {
    // Command /start
    bot.onText(/\/start/, (msg) => {
        const chatId = msg.chat.id;
        bot.sendMessage(chatId, 
            'Welcome Sob!\n\n' +
            'Gunakan /login untuk menghubungkan WhatsApp'
        );
    });

    // Command /login
    bot.onText(/\/login/, (msg) => {
        const chatId = msg.chat.id;
        loginChatId = chatId;  // Set loginChatId
        global.loginChatId = chatId;  // Set global loginChatId
        
        bot.sendMessage(chatId, '⏳ Mempersiapkan QR Code...');
        
        if (!whatsapp.initialized) {
            whatsapp.initialize();
        }
    });

    // Command /help
    bot.onText(/\/help/, (msg) => {
        const chatId = msg.chat.id;
        bot.sendMessage(chatId,
            '📖 *Panduan Penggunaan*\n\n' +
            '1. /start - Mulai bot\n' +
            '2. /login - Hubungkan WhatsApp\n' +
            '3. /help - Tampilkan bantuan\n',
            { parse_mode: 'Markdown' }
        );
    });

    return {
        setLoginChatId: (chatId) => {
            loginChatId = chatId;
            global.loginChatId = chatId;
        },
        getLoginChatId: () => loginChatId
    };
};

module.exports = { handleTelegramCommands };