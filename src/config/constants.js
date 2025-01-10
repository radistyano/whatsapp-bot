// Kode negara untuk formatting nomor telepon
exports.COUNTRY_CODES = {
    'ID': {
        code: '62',
        name: 'Indonesia',
        format: 'XXX-XXXX-XXXX'
    },
    'MY': {
        code: '60',
        name: 'Malaysia',
        format: 'XX-XXXX-XXXX'
    },
    'SG': {
        code: '65',
        name: 'Singapore',
        format: 'XXXX-XXXX'
    },
    'TH': {
        code: '66',
        name: 'Thailand',
        format: 'X-XXXX-XXXX'
    },
    'PH': {
        code: '63',
        name: 'Philippines',
        format: 'XXX-XXX-XXXX'
    },
    'VN': {
        code: '84',
        name: 'Vietnam',
        format: 'XX-XXXX-XXXX'
    },
    'US': {
        code: '1',
        name: 'United States',
        format: 'XXX-XXX-XXXX'
    },
    'GB': {
        code: '44',
        name: 'United Kingdom',
        format: 'XXXX-XXXXXX'
    },
    'AU': {
        code: '61',
        name: 'Australia',
        format: 'X-XXXX-XXXX'
    },
    'IN': {
        code: '91',
        name: 'India',
        format: 'XXXXX-XXXXX'
    },
    'CN': {
        code: '86',
        name: 'China',
        format: 'XXX-XXXX-XXXX'
    },
    'JP': {
        code: '81',
        name: 'Japan',
        format: 'XX-XXXX-XXXX'
    },
    'KR': {
        code: '82',
        name: 'South Korea',
        format: 'XX-XXXX-XXXX'
    }
};

// Browser User Agents
exports.USER_AGENTS = [
    {
        name: 'Chrome Windows',
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        type: 'desktop'
    },
    {
        name: 'Chrome Mac',
        value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        type: 'desktop'
    },
    {
        name: 'Firefox Windows',
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
        type: 'desktop'
    },
    {
        name: 'Safari Mac',
        value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
        type: 'desktop'
    },
    {
        name: 'Chrome Mobile',
        value: 'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Mobile Safari/537.36',
        type: 'mobile'
    }
];

// App Configuration
exports.APP_CONFIG = {
    // Server Configuration
    server: {
        port: process.env.PORT || 3000,
        webhook_url: process.env.WEBHOOK_URL,
        environment: process.env.NODE_ENV || 'development'
    },
    
    // WhatsApp Configuration
    whatsapp: {
        clientId: 'telegram-bot',
        authFolder: './whatsapp-auth',
        cacheFolder: './webCache',
        qrTimeout: 20000, // 20 seconds
        reconnectInterval: 60000 // 1 minute
    },
    
    // Telegram Configuration
    telegram: {
        polling: true,
        filepath: './temp_files'
    },

    // File Processing
    files: {
        allowedMimes: ['text/vcard'],
        allowedExtensions: ['.vcf'],
        maxSize: 5 * 1024 * 1024 // 5MB
    }
};

// Message Templates
exports.MESSAGES = {
    welcome: '🤖 Selamat datang di Bot Telegram-WhatsApp!\n\nGunakan /help untuk melihat daftar perintah.',
    help: `Cara Penggunaan Bot:
1. /start - Memulai bot
2. /login - Login ke WhatsApp
3. /creategroup - Membuat grup WhatsApp
4. /help - Menampilkan bantuan

Format Perintah:
/creategroup [nama_grup] [nomor1,nomor2,...]
Contoh: /creategroup TestGrup 628123456789,628987654321`,
    
    errors: {
        invalidNumber: 'Nomor tidak valid',
        groupCreationFailed: 'Gagal membuat grup',
        fileProcessingError: 'Gagal memproses file'
    }
};

// Helper Functions
exports.getRandomUserAgent = () => {
    const agents = exports.USER_AGENTS;
    return agents[Math.floor(Math.random() * agents.length)].value;
};

exports.getCountryCode = (countryCode) => {
    return exports.COUNTRY_CODES[countryCode]?.code || exports.COUNTRY_CODES['ID'].code;
};

exports.isValidCountryCode = (countryCode) => {
    return countryCode in exports.COUNTRY_CODES;
};