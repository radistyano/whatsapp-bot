const { COUNTRY_CODES } = require('../config/constants');

class Validator {
    static isValidPhoneNumber(number, country = 'ID') {
        const pattern = /^\+?([0-9]{1,3})?([0-9]{10,12})$/;
        return pattern.test(number);
    }

    static isValidGroupName(name) {
        return typeof name === 'string' && 
               name.length >= 3 && 
               name.length <= 25 && 
               /^[\w\s-]+$/.test(name);
    }

    static validateParticipants(participants) {
        if (!Array.isArray(participants)) {
            throw new Error('Participants must be an array');
        }

        if (participants.length < 2) {
            throw new Error('Group must have at least 2 participants');
        }

        if (participants.length > 256) {
            throw new Error('Group cannot have more than 256 participants');
        }

        return participants.every(p => this.isValidPhoneNumber(p));
    }

    static validateVCardFile(file) {
        const allowedMimes = ['text/vcard', 'text/x-vcard'];
        const allowedExtensions = ['.vcf', '.vcard'];
        
        const extension = path.extname(file.name).toLowerCase();
        return allowedMimes.includes(file.mimetype) || 
               allowedExtensions.includes(extension);
    }
}

module.exports = Validator;