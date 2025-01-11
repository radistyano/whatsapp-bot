require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode'); // Ubah ini dari qr-image menjadi qrcode
const fs = require('fs');
const express = require('express');
const ngrok = require('ngrok');
const { handleTelegramCommands } = require('./src/handlers/telegram');
const { setupWhatsAppClient } = require('./src/handlers/whatsapp');

// Express setup
const app = express();
const port = process.env.PORT || 3000;

// Setup ngrok dengan tambahan error handling dan konfigurasi
const setupNgrok = async () => {
    try {
        // Kill existing ngrok sessions
        await ngrok.kill();

        // Configure ngrok
        await ngrok.authtoken('2rNd82tBuXpidvy7PcBvQJto8Z8_3vZ5pMTt8QKSec1pxuLgR');

        // Start tunnel with detailed configuration
        const url = await ngrok.connect({
            proto: 'http',
            addr: port,
            region: 'us',
            authtoken: '2rNd82tBuXpidvy7PcBvQJto8Z8_3vZ5pMTt8QKSec1pxuLgR'
        });

        console.log('Ngrok tunnel created:', url);
        return url;
    } catch (error) {
        console.error('Ngrok setup error:', error);
        return null;
    }
};

// WhatsApp client configuration
const whatsapp = new Client({
    authStrategy: new LocalAuth({
        clientId: 'telegram-bot',
        dataPath: './whatsapp-auth'
    }),
    puppeteer: {
        headless: 'new',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--disable-web-security',
            '--disable-extensions',
            '--disable-software-rasterizer',
            '--disable-dev-tools'
        ],
        defaultViewport: {
            width: 1280,
            height: 720
        }
    }
});

// Setup directories
const setupDirectories = () => {
    const dirs = ['./whatsapp-auth', './temp'];
    dirs.forEach(dir => {
        if (fs.existsSync(dir)) {
            fs.rmSync(dir, { recursive: true, force: true });
        }
        fs.mkdirSync(dir, { recursive: true });
    });
};

// Initialize application
const init = async () => {
    try {
        setupDirectories();
        
        app.use(express.json());
        
        const ngrokUrl = await setupNgrok();
        
        const bot = ngrokUrl ? 
            new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, {
                webHook: { port }
            }) :
            new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

        if (ngrokUrl) {
            await bot.setWebHook(`${ngrokUrl}/webhook`);
            console.log('Webhook set to:', `${ngrokUrl}/webhook`);

            app.post('/webhook', (req, res) => {
                bot.handleUpdate(req.body);
                res.sendStatus(200);
            });
        } else {
            console.log('Running in polling mode');
        }

        app.get('/', (req, res) => {
            res.json({
                status: 'active',
                mode: ngrokUrl ? 'webhook' : 'polling',
                timestamp: new Date().toISOString()
            });
        });
        
        app.listen(port, () => {
            console.log(`Server running on port ${port}`);
        });

        handleTelegramCommands(bot, whatsapp);
        setupWhatsAppClient(whatsapp, bot);

        await whatsapp.initialize();

        console.log('Bot initialization complete!');

    } catch (error) {
        console.error('Initialization error:', error);
        process.exit(1);
    }
};

// Error handling
process.on('unhandledRejection', (error) => {
    console.error('Unhandled rejection:', error);
});

process.on('SIGINT', async () => {
    console.log('Shutting down...');
    await ngrok.kill();
    process.exit(0);
});

// Start application
init().catch(error => {
    console.error('Failed to start application:', error);
    process.exit(1);
});