// utils/logger.js
class Logger {
    static info(message) {
        console.log(`[INFO] ${new Date().toISOString()} - ${message}`);
    }

    static error(message) {
        console.error(`[ERROR] ${new Date().toISOString()} - ${message}`);
    }

    static warning(message) {
        console.warn(`[WARN] ${new Date().toISOString()} - ${message}`);
    }
}

module.exports = Logger;