const crypto = require('crypto');

class secUtilities
{
    static ECDH_CURVE = 'sect571r1';
    static IV_LENGTH = 16;
    static ITERATIONS = 100000;
    static ENCRYPT_SIZE = 16;

    static createHash(toHash)
    {
        return crypto.createHash('sha256')
                        .update(toHash) 
                        .digest('hex'); 
    }

    static establishConnection()
    {
        // Generate ECDH public key in a compressed format
        var ecdhKeys = crypto.createECDH(secUtilities.ECDH_CURVE);

        // Connect to server send user's public and receive their public key for mutual private keys
        var serverKey = server.keyExchange(ecdhKeys.generateKeys('hex', 'compressed'))

        // Decompress server public key and generate secret key for encrypted server communications
        serverKey = crypto.ECDH.convertKey(serverKey, secUtilities.ECDH_CURVE, 'hex', 'hex', 'uncompressed');
        ecdhKeys = ecdhKeys.computeSecret(serverKey, 'hex', 'hex');
        
        // Return encryption key for server communications.
        return(secUtilities.exchangeSecretKey(ecdhKeys));
    }

    // Encrypt messages to be sent using provided encryption key
    static encryptMessage(key, message)
    { 
        var iv = Buffer.alloc(secUtilities.IV_LENGTH, key);
        crypto.randomFillSync(iv, 0, secUtilities.IV_LENGTH);
        
        const derivedKey = crypto.pbkdf2Sync(key, iv, secUtilities.ITERATIONS, 32, 'sha256')
        var cipher = crypto.createCipheriv('aes-256-cbc', derivedKey, iv);

        var out = cipher.update(message, 'utf8', 'hex');
        out += cipher.final('hex')

        return Buffer.concat([iv, Buffer.from(out)]);
    }

    // Decrypt messages using provided encryption key
    static decryptMessage(key, message)
    {
        var iv = message.subarray(0, secUtilities.IV_LENGTH);
        var encrMess = message.subarray(secUtilities.IV_LENGTH, message.length)

        const derivedKey = crypto.pbkdf2Sync(key, iv, secUtilities.ITERATIONS, 32, 'sha256')

        var decipher = crypto.createDecipheriv('aes-256-cbc', derivedKey, iv);

        var out = decipher.update(encrMess.toString(), 'hex', 'utf8');

        return out + decipher.final('utf8');
    }

    static exchangeSecretKey(privateKey)
    {
        const secretKey = Buffer.alloc(32);
        crypto.randomFillSync(secretKey, 32);

        this.encryptMessage(privateKey, secretKey)
        // TODO send serverside
        
        // 
        return secretKey;
    }
}

// Data for test values delete upon implementation
// Following lines are test code prior to implementing security schema with existing systems
const testUsername = 'username';
const testPassword = 'password';

// A fake representation of server side responses
class fakeServer
{
    constructor()
    {
        var ecdhKey = ''
        var secretKey = ''
    }

    // Exchange public keys with connection save the public key to be used to securely initiate symmetric encryption
    keyExchange(otherKey) 
    {
        var serverKeys = crypto.createECDH(secUtilities.ECDH_CURVE)
        var serverPublic = serverKeys.generateKeys('hex', 'compressed');

        var decompressedKey = crypto.ECDH.convertKey(otherKey, secUtilities.ECDH_CURVE, 'hex', 'hex', 'uncompressed');

        this.ecdhKey = serverKeys.computeSecret(decompressedKey, 'hex', 'hex');

        return(serverPublic);
    }
}

var server = new fakeServer();

login(testUsername, testPassword);

function login(user, pass)
{
    // TODO take input from login form and set the username and password
    const username = user;
    const password = secUtilities.createHash(pass);
    
    const secretKey = secUtilities.establishConnection();

    verifyAccount(username, password);
}

function verifyAccount(user, hashPass)
{
    const secretKey = secUtilities.establishConnection();
    message = secUtilities.encryptMessage(secretKey, 'This is a test message just to make sure I didn\'t fuck up majorly\n' + user + ' ' + hashPass);
    console.log(secUtilities.decryptMessage(secretKey, message));
}