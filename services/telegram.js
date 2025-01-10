const TelegramBot = require('node-telegram-bot-api');
const { APP_CONFIG, MESSAGES } = require('../config/constants');

class TelegramService {
    constructor(token, options = {}) {
        this.bot = new TelegramBot(token, {
            polling: true,
            ...options
        });
        this.messageQueue = new Map();
    }

    async sendMessage(chatId, message, options = {}) {
        try {
            return await this.bot.sendMessage(chatId, message, {
                parse_mode: 'Markdown',
                ...options
            });
        } catch (error) {
            console.error('Error sending message:', error);
            throw error;
        }
    }

    async sendPhoto(chatId, photo, options = {}) {
        try {
            return await this.bot.sendPhoto(chatId, photo, {
                parse_mode: 'Markdown',
                ...options
            });
        } catch (error) {
            console.error('Error sending photo:', error);
            throw error;
        }
    }

    async setWebhook(url) {
        try {
            await this.bot.setWebHook(url);
            console.log('Webhook set successfully');
        } catch (error) {
            console.error('Error setting webhook:', error);
            throw error;
        }
    }

    async deleteWebhook() {
        try {
            await this.bot.deleteWebHook();
            console.log('Webhook deleted successfully');
        } catch (error) {
            console.error('Error deleting webhook:', error);
            throw error;
        }
    }

    // Advanced message handling with rate limiting
    async sendQueuedMessage(chatId, message, options = {}) {
        if (!this.messageQueue.has(chatId)) {
            this.messageQueue.set(chatId, []);
        }

        const queue = this.messageQueue.get(chatId);
        queue.push({ message, options });

        if (queue.length === 1) {
            this.processMessageQueue(chatId);
        }
    }

    async processMessageQueue(chatId) {
        const queue = this.messageQueue.get(chatId);
        if (!queue || queue.length === 0) return;

        const { message, options } = queue[0];
        try {
            await this.sendMessage(chatId, message, options);
            queue.shift();
            
            if (queue.length > 0) {
                setTimeout(() => this.processMessageQueue(chatId), 1000); // 1 second delay
            }
        } catch (error) {
            console.error('Error processing message queue:', error);
        }
    }

    // Status updates
    async sendStatusUpdate(chatId, status) {
        const statusMessage = `🤖 *Status Bot*\n\n${status}`;
        await this.sendMessage(chatId, statusMessage);
    }

    // Error reporting
    async sendErrorReport(chatId, error) {
        const errorMessage = `❌ *Error*\n\n${error.message}`;
        await this.sendMessage(chatId, errorMessage);
    }

    // Progress updates
    async sendProgress(chatId, current, total, message = '') {
        const percentage = Math.round((current / total) * 100);
        const progressMessage = `⏳ *Progress: ${percentage}%*\n${message}`;
        await this.sendMessage(chatId, progressMessage);
    }
}

module.exports = TelegramService;