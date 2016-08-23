var utf8 = require("@nathanfaucett/utf8_encoding"),
    isString = require("@nathanfaucett/is_string"),
    BCRYPT_SALT_LEN = require("../consts/BCRYPT_SALT_LEN"),
    base64Decode = require("../base64/decode"),
    crypt = require("./crypt"),
    hashFinish = require("./hashFinish");


module.exports = hash;


function hash(s, salt, callback, progressCallback) {
    var minor, offset, r1, r2, rounds, real_salt, passwordb, saltb;

    if (!isString(s) || !isString(salt)) {
        callback(new Error("Invalid string / salt: Not a string"));
        return;
    }

    if (salt.charAt(0) !== '$' || salt.charAt(1) !== '2') {
        callback(new Error("Invalid salt version: " + salt.substring(0, 2)));
        return;
    }

    if (salt.charAt(2) === '$') {
        minor = String.fromCharCode(0);
        offset = 3;
    } else {
        minor = salt.charAt(2);

        if ((minor !== 'a' && minor !== 'b' && minor !== 'y') || salt.charAt(3) !== '$') {
            callback(new Error("Invalid salt revision: " + salt.substring(2, 4)));
            return;
        }
        offset = 4;
    }

    // Extract number of rounds
    if (salt.charAt(offset + 2) > '$') {
        callback(new Error("Missing salt rounds"));
        return;
    }

    r1 = parseInt(salt.substring(offset, offset + 1), 10) * 10;
    r2 = parseInt(salt.substring(offset + 1, offset + 2), 10);
    rounds = r1 + r2;
    real_salt = salt.substring(offset + 3, offset + 25);

    s += minor >= 'a' ? "\x00" : "";

    passwordb = utf8.stringToBytes(s);
    saltb = base64Decode(real_salt, BCRYPT_SALT_LEN);

    crypt(passwordb, saltb, rounds, function onCrypt(error, bytes) {
        if (error) {
            callback(error, null);
        } else {
            callback(null, hashFinish(bytes, saltb, minor, rounds));
        }
    }, progressCallback);
}