const { Client } = require('whatsapp-web.js');
const { APP_CONFIG, getRandomUserAgent } = require('../config/constants');

class WhatsAppService {
    constructor(options = {}) {
        this.client = new Client({
            authStrategy: options.authStrategy,
            puppeteer: {
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-gpu'
                ],
                ...options.puppeteer
            },
            userAgent: getRandomUserAgent(),
            ...options
        });

        this.initialized = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
    }

    async initialize() {
        if (this.initialized) return;

        try {
            await this.client.initialize();
            this.initialized = true;
            this.setupAutoReconnect();
        } catch (error) {
            console.error('WhatsApp initialization error:', error);
            throw error;
        }
    }

    setupAutoReconnect() {
        this.client.on('disconnected', async (reason) => {
            console.log('WhatsApp disconnected:', reason);
            
            if (this.reconnectAttempts < this.maxReconnectAttempts) {
                this.reconnectAttempts++;
                console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
                
                setTimeout(async () => {
                    try {
                        await this.initialize();
                    } catch (error) {
                        console.error('Reconnection failed:', error);
                    }
                }, 5000 * this.reconnectAttempts); // Increasing delay
            }
        });

        this.client.on('ready', () => {
            this.reconnectAttempts = 0;
        });
    }

    async createGroup(name, participants) {
        try {
            const formattedParticipants = this.formatParticipants(participants);
            const group = await this.client.createGroup(name, formattedParticipants);
            return {
                success: true,
                groupId: group.gid._serialized,
                name: name,
                participants: formattedParticipants.length
            };
        } catch (error) {
            console.error('Error creating group:', error);
            throw error;
        }
    }

    formatParticipants(participants) {
        return participants.map(number => {
            return number.includes('@c.us') ? number : `${number}@c.us`;
        });
    }

    async getProfilePicUrl(number) {
        try {
            return await this.client.getProfilePicUrl(number);
        } catch (error) {
            console.error('Error getting profile picture:', error);
            return null;
        }
    }

    async isRegisteredUser(number) {
        try {
            const formattedNumber = `${number}@c.us`;
            return await this.client.isRegisteredUser(formattedNumber);
        } catch (error) {
            console.error('Error checking registered user:', error);
            return false;
        }
    }

    async getState() {
        try {
            return await this.client.getState();
        } catch (error) {
            console.error('Error getting state:', error);
            return 'DISCONNECTED';
        }
    }

    async logout() {
        try {
            await this.client.logout();
            this.initialized = false;
        } catch (error) {
            console.error('Error logging out:', error);
            throw error;
        }
    }
}

module.exports = WhatsAppService;