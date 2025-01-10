// src/index.js
require('dotenv').config();
const express = require('express');
const { LocalAuth } = require('whatsapp-web.js');
const ngrok = require('ngrok');
const logger = require('./utils/logger');
const { APP_CONFIG } = require('./config/constants');
const { TelegramService, WhatsAppService } = require('./services');
const TelegramHandler = require('./handlers/telegram');
const WhatsAppHandler = require('./handlers/whatsapp');
const Helpers = require('./utils/helpers');

class BotApplication {
    constructor() {
        this.app = express();
        this.port = process.env.PORT || 3000;
        this.setupExpress();
        this.initializeServices();
    }

    // Setup Express middleware dan routes
    setupExpress() {
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));

        // Health check route
        this.app.get('/', (req, res) => {
            res.send({ status: 'Bot is running' });
        });
    }

    // Inisialisasi services
    async initializeServices() {
        try {
            // Setup WhatsApp
            this.whatsappService = new WhatsAppService({
                authStrategy: new LocalAuth({
                    clientId: APP_CONFIG.whatsapp.clientId,
                    dataPath: APP_CONFIG.whatsapp.authFolder
                }),
                puppeteer: {
                    headless: true,
                    args: [
                        '--no-sandbox',
                        '--disable-setuid-sandbox',
                        '--disable-dev-shm-usage',
                        '--disable-gpu'
                    ]
                }
            });

            // Setup Telegram
            this.telegramService = new TelegramService(
                process.env.TELEGRAM_BOT_TOKEN,
                { polling: true }
            );

            // Setup Handlers
            this.whatsappHandler = new WhatsAppHandler(this.whatsappService.client);
            this.telegramHandler = new TelegramHandler(
                this.telegramService.bot,
                this.whatsappService
            );

            // Initialize handlers
            this.whatsappHandler.init();
            this.telegramHandler.init();

            // Setup directory structure
            await Helpers.ensureDirectory(APP_CONFIG.whatsapp.authFolder);
            await Helpers.ensureDirectory(APP_CONFIG.whatsapp.cacheFolder);

        } catch (error) {
            logger.error('Error initializing services:', error);
            process.exit(1);
        }
    }

    // Setup Webhook dengan ngrok
    async setupWebhook() {
        try {
            const url = await ngrok.connect({
                addr: this.port,
                proto: 'http'
            });
            logger.info(`Ngrok tunnel created: ${url}`);

            await this.telegramService.setWebhook(`${url}/webhook`);
            logger.info(`Webhook set to: ${url}/webhook`);

            // Webhook endpoint
            this.app.post('/webhook', (req, res) => {
                this.telegramService.bot.handleUpdate(req.body);
                res.sendStatus(200);
            });

        } catch (error) {
            logger.error('Error setting up webhook:', error);
            logger.info('Falling back to polling mode...');
        }
    }

    // Start server
    async start() {
        try {
            // Start Express server
            this.server = this.app.listen(this.port, () => {
                logger.info(`Server running on port ${this.port}`);
            });

            // Setup webhook in development
            if (process.env.NODE_ENV !== 'production') {
                await this.setupWebhook();
            }

            // Initialize WhatsApp
            await this.whatsappService.initialize();

            // Setup monitoring
            this.setupMonitoring();

            logger.info('Bot application started successfully');

        } catch (error) {
            logger.error('Error starting application:', error);
            process.exit(1);
        }
    }

    // Setup monitoring dan health checks
    setupMonitoring() {
        setInterval(async () => {
            try {
                const whatsappState = await this.whatsappService.getState();
                logger.info('WhatsApp state:', whatsappState);

                if (whatsappState !== 'CONNECTED') {
                    await this.telegramHandler.monitorConnection();
                }
            } catch (error) {
                logger.error('Error in monitoring:', error);
            }
        }, APP_CONFIG.whatsapp.reconnectInterval);
    }

    // Cleanup pada saat shutdown
    async cleanup() {
        try {
            logger.info('Cleaning up...');
            await this.whatsappService.logout();
            await ngrok.kill();
            this.server.close();
            process.exit(0);
        } catch (error) {
            logger.error('Error during cleanup:', error);
            process.exit(1);
        }
    }
}

// Create and start the application
const bot = new BotApplication();

// Handle shutdown signals
process.on('SIGTERM', () => bot.cleanup());
process.on('SIGINT', () => bot.cleanup());

// Handle uncaught errors
process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception:', error);
    bot.cleanup();
});

process.on('unhandledRejection', (error) => {
    logger.error('Unhandled rejection:', error);
    bot.cleanup();
});

// Start the application
bot.start().catch((error) => {
    logger.error('Failed to start application:', error);
    process.exit(1);
});