const fs = require('fs').promises;
const path = require('path');
const vcard = require('vcard-parser');
const { COUNTRY_CODES } = require('../config/constants');

class Helpers {
    // Phone number formatting
    static formatPhoneNumber(number, countryCode = 'ID') {
        try {
            // Bersihkan nomor dari karakter non-digit
            let cleanNumber = number.replace(/[^\d+]/g, '');
            
            // Tambahkan kode negara jika belum ada
            if (!cleanNumber.startsWith('+')) {
                if (cleanNumber.startsWith('0')) {
                    cleanNumber = cleanNumber.substring(1);
                }
                cleanNumber = COUNTRY_CODES[countryCode]?.code + cleanNumber;
            }

            return `${cleanNumber}@c.us`;
        } catch (error) {
            throw new Error(`Invalid phone number format: ${number}`);
        }
    }

    // File handling
    static async ensureDirectory(dirPath) {
        try {
            await fs.access(dirPath);
        } catch {
            await fs.mkdir(dirPath, { recursive: true });
        }
    }

    static async cleanDirectory(dirPath) {
        try {
            await fs.rm(dirPath, { recursive: true, force: true });
            await fs.mkdir(dirPath, { recursive: true });
        } catch (error) {
            console.error(`Error cleaning directory ${dirPath}:`, error);
        }
    }

    // VCard processing
    static async processVCard(filePath) {
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            const contacts = vcard.parse(content);
            const results = {
                success: [],
                failed: [],
                totalProcessed: 0
            };

            for (const contact of contacts) {
                try {
                    if (contact.tel) {
                        const name = contact.fn?.[0]?.value || 'Unknown';
                        for (const tel of contact.tel) {
                            try {
                                const formattedNumber = this.formatPhoneNumber(tel.value);
                                results.success.push({
                                    name,
                                    number: formattedNumber
                                });
                            } catch {
                                results.failed.push({ name, number: tel.value });
                            }
                        }
                    }
                } catch (error) {
                    console.error(`Error processing contact:`, error);
                }
                results.totalProcessed++;
            }

            return results;
        } catch (error) {
            throw new Error(`Error processing VCard file: ${error.message}`);
        }
    }

    // Error handling
    static formatError(error) {
        return {
            message: error.message,
            code: error.code || 'UNKNOWN_ERROR',
            timestamp: new Date().toISOString()
        };
    }

    // Validation helpers
    static isValidGroupName(name) {
        return name.length >= 3 && name.length <= 25;
    }

    static isValidParticipantCount(count) {
        return count >= 2 && count <= 256;
    }

    // File management
    static async saveTemporaryFile(buffer, filename) {
        const tempPath = path.join('temp', filename);
        await this.ensureDirectory('temp');
        await fs.writeFile(tempPath, buffer);
        return tempPath;
    }

    static async cleanupTemporaryFile(filePath) {
        try {
            await fs.unlink(filePath);
        } catch (error) {
            console.error('Error cleaning up temporary file:', error);
        }
    }

    // Session management
    static createSession(userId) {
        return {
            id: userId,
            createdAt: new Date(),
            data: new Map()
        };
    }

    // Message formatting
    static formatStatusMessage(status) {
        return {
            text: `Status: ${status.state}\nLast Updated: ${new Date().toLocaleString()}`,
            isError: status.state === 'DISCONNECTED'
        };
    }

    // Progress tracking
    static createProgressTracker(total) {
        return {
            total,
            current: 0,
            percentage: 0,
            updateProgress(current) {
                this.current = current;
                this.percentage = Math.round((current / total) * 100);
                return this.percentage;
            }
        };
    }
}

module.exports = Helpers;