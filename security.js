const { error } = require('console');
const crypto = require('crypto');

const ECDH_CURVE = 'sect571r1';
const IV_LENGTH = 16;
const ITERATIONS = 100000;

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
        var serverKeys = crypto.createECDH(ECDH_CURVE)
        var serverPublic = serverKeys.generateKeys('hex', 'compressed');

        var decompressedKey = crypto.ECDH.convertKey(otherKey, ECDH_CURVE, 'hex', 'hex', 'uncompressed');

        this.ecdhKey = serverKeys.computeSecret(decompressedKey, 'hex', 'hex');

        return(serverPublic);
    }
}

var server = new fakeServer();

// End of test values
var username = '';
var password = '';

login();

function login()
{
    // TODO take input from login form and set the username and password
    username = testUsername;

    // hash provided password from login form 
    password = crypto.createHash('sha256')
                        .update(testPassword) // TODO update to input password
                        .digest('hex');  
    //TODO begin login 
    verifyAccount()

    // lg for test purposes
    console.log(establishConnection());
}

function verifyAccount()
{
    //var key = establishConnection()
}

// Connect to server and generate ECDH key to securely exchange symmetric keys for communication encryption
function establishConnection()
{
    // Output encryption key
    var key;

    // Generate ECDH public key in a compressed format
    var ecdhKeys = crypto.createECDH(ECDH_CURVE);

    // Connect to server send user's public and receive their public key for mutual private keys
    // testCode
    var serverKey = server.keyExchange(ecdhKeys.generateKeys('hex', 'compressed'))
    // 

    // Decompress server public key and generate secret key for encrypted server communications
    serverKey = crypto.ECDH.convertKey(serverKey, ECDH_CURVE, 'hex', 'hex', 'uncompressed');
    ecdhKeys = ecdhKeys.computeSecret(serverKey, 'hex', 'hex');

    // Test Code
    key = ecdhKeys;
    // 
    //console.log(key);

    //console.log(key);
    message = encryptMessage(key, 'hello there');
    console.log("Post-En " + message + "\n");
    message = decryptMessage(key, message);
    
    // Return encryption key for server communications.
    return message;
}

// Encrypt messages to be sent using provided encryption key
function encryptMessage(key, message)
{ 
    if (typeof message != Buffer)
    {
        message = Buffer.from(message);
    }



    var iv = Buffer.alloc(IV_LENGTH, key);
    crypto.randomFillSync(iv, 0, IV_LENGTH);

    console.log("During-En m: " + message + "\niv: " + iv + "\n");

    const derivedKey = crypto.pbkdf2Sync(key, iv, ITERATIONS, 32, 'sha256')
    var cipher = crypto.createCipheriv('aes-256-cbc', derivedKey, iv);

    cipher.update(message);

    return Buffer.concat([iv, cipher.final()]);
}

// Decrypt messages using provided encryption key
function decryptMessage(key, message)
{
    //return cipher = crypto.privateDecrypt(key, message);
    var iv = message.subarray(0, IV_LENGTH);
    
    const derivedKey = crypto.pbkdf2Sync(key, iv, ITERATIONS, 32, 'sha256')
    var decipher = crypto.createDecipheriv('aes-256-cbc', derivedKey, iv);

    decipher.update(message.subarray(IV_LENGTH, message.length), 'hex', 'utf8');

    return decipher.final('utf8');
}


