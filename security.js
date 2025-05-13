var crypto = require('crypto');

const ECDH_CURVE = 'secp512r1';

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
    keyExchange(otherkey) 
    {
        var serverKey = crypto.createECDH(ECDH_CURVE)

        var decompressedKey = crypto.ECDH.convertKey(otherkey,ECDH_CURVE, 'hex', 'hex', 'uncompressed');

        ecdhKey = serverKey.computeSecret(decompressedKey);

        serverKey = crypto.ECDH.convertKey(serverKey, 'secp521r1',)
        return(serverKey);
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
                        .update(testPassword)
                        .digest('hex');  
    //TODO begin login 
    verifyAccount()

    // lg for test purposes
    console.log(estabiishConnection());
}

function verifyAccount()
{
    var key = establishConnection()
}

// Connect to server and generate ECDH key to securely exchange symmetric keys for communication encryption
function establishConnection()
{
    // Output encryption key
    var key;

    // Generate ECDH public key in a compressed format
    var ecdhKeys = crypto.createECDH('secp521r1').generateKeys('hex', 'compressed');

    // Connect to server send user's public and receive their public key for mutual private keys
    // testCode
    var serverKey = server.keyExchange(ecdhKeys)
    // 

    // Decompress server public key and generate secret key for encrypted server communications
    serverKey = crypto.ECDH.convertKey(serverKey, 'secp512r1', 'hex', 'hex', 'uncompressed');
    ecdhKeys = ecdhKeys.computeSecret(serverKey);

    // Test Code
    key = (ecdhKeys == server.ecdhKey);
    // 

    // Return encryption key for server communications.
    return key;
}

// Encrypt messages to be sent using provided encryption key
function encryptMessage(key, message)
{
    crypto.scrypt(key)
}


