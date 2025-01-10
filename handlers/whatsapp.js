const qr = require('qr-image');
const fs = require('fs');

class WhatsAppHandler {
    constructor(client) {
        this.client = client;
        this.qrCallbacks = new Set();
    }

    // Initialize all event handlers
    init() {
        this.handleQR();
        this.handleAuthenticated();
        this.handleReady();
        this.handleDisconnected();
        this.handleAuthFailure();
    }

    // Handle QR code generation
    handleQR() {
        this.client.on('qr', async (qrContent) => {
            try {
                const qr_png = qr.imageSync(qrContent, { type: 'png' });
                const qrPath = './temp_qr.png';
                fs.writeFileSync(qrPath, qr_png);

                // Notify all registered callbacks
                for (const callback of this.qrCallbacks) {
                    await callback(qrPath);
                }

                fs.unlinkSync(qrPath);
            } catch (error) {
                console.error('QR generation error:', error);
            }
        });
    }

    // Handle authentication success
    handleAuthenticated() {
        this.client.on('authenticated', () => {
            console.log('WhatsApp authenticated successfully');
        });
    }

    // Handle ready state
    handleReady() {
        this.client.on('ready', async () => {
            try {
                const info = await this.client.info;
                console.log('WhatsApp client ready:', info);
            } catch (error) {
                console.error('Error getting client info:', error);
            }
        });
    }

    // Handle disconnection
    handleDisconnected() {
        this.client.on('disconnected', (reason) => {
            console.log('WhatsApp disconnected:', reason);
        });
    }

    // Handle authentication failure
    handleAuthFailure() {
        this.client.on('auth_failure', (msg) => {
            console.error('WhatsApp authentication failed:', msg);
        });
    }

    // Register QR callback
    onQR(callback) {
        this.qrCallbacks.add(callback);
    }

    // Remove QR callback
    offQR(callback) {
        this.qrCallbacks.delete(callback);
    }

    // Get client state
    async getState() {
        try {
            return await this.client.getState();
        } catch (error) {
            console.error('Error getting state:', error);
            return 'DISCONNECTED';
        }
    }
}

module.exports = WhatsAppHandler;