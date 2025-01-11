const fs = require('fs').promises;

class Helpers {
    static async ensureDirectoryExists(path) {
        try {
            await fs.access(path);
        } catch {
            await fs.mkdir(path, { recursive: true });
        }
    }

    static formatPhoneNumber(number) {
        let cleaned = number.replace(/\D/g, '');
        if (!cleaned.startsWith('62')) {
            cleaned = cleaned.startsWith('0') ? 
                `62${cleaned.slice(1)}` : `62${cleaned}`;
        }
        return `${cleaned}@c.us`;
    }

    static async cleanupTempFiles() {
        try {
            const tempFiles = await fs.readdir('./temp');
            await Promise.all(
                tempFiles.map(file => 
                    fs.unlink(`./temp/${file}`)
                )
            );
        } catch (error) {
            console.error('Cleanup error:', error);
        }
    }
}

module.exports = Helpers;