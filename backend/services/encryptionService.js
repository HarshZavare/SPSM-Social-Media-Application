const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32; // 256 bits

/**
 * Generate a random 256-bit encryption key
 */
const generateKey = () => {
  return crypto.randomBytes(KEY_LENGTH);
};

/**
 * Encrypt plaintext using AES-256-GCM
 * @param {string} plaintext - Text to encrypt
 * @param {Buffer|string} key - 256-bit encryption key
 * @returns {{ encrypted: string, iv: string, authTag: string }}
 */
const encrypt = (plaintext, key) => {
  const keyBuffer = typeof key === 'string' ? Buffer.from(key, 'hex') : key;
  const iv = crypto.randomBytes(IV_LENGTH);
  
  const cipher = crypto.createCipheriv(ALGORITHM, keyBuffer, iv);
  
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();

  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
  };
};

/**
 * Decrypt ciphertext using AES-256-GCM
 * @param {string} encrypted - Hex-encoded ciphertext
 * @param {Buffer|string} key - 256-bit encryption key
 * @param {string} iv - Hex-encoded IV
 * @param {string} authTag - Hex-encoded auth tag
 * @returns {string} Decrypted plaintext
 */
const decrypt = (encrypted, key, iv, authTag) => {
  const keyBuffer = typeof key === 'string' ? Buffer.from(key, 'hex') : key;
  const ivBuffer = Buffer.from(iv, 'hex');
  const authTagBuffer = Buffer.from(authTag, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, keyBuffer, ivBuffer);
  decipher.setAuthTag(authTagBuffer);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
};

/**
 * Encrypt a buffer (for file encryption)
 * @param {Buffer} buffer - File buffer to encrypt
 * @param {Buffer|string} key - 256-bit encryption key
 * @returns {{ encryptedBuffer: Buffer, iv: string, authTag: string }}
 */
const encryptBuffer = (buffer, key) => {
  const keyBuffer = typeof key === 'string' ? Buffer.from(key, 'hex') : key;
  const iv = crypto.randomBytes(IV_LENGTH);
  
  const cipher = crypto.createCipheriv(ALGORITHM, keyBuffer, iv);
  
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    encryptedBuffer: encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
  };
};

/**
 * Decrypt a buffer (for file decryption)
 * @param {Buffer} encryptedBuffer - Encrypted file buffer
 * @param {Buffer|string} key - 256-bit encryption key
 * @param {string} iv - Hex-encoded IV
 * @param {string} authTag - Hex-encoded auth tag
 * @returns {Buffer} Decrypted file buffer
 */
const decryptBuffer = (encryptedBuffer, key, iv, authTag) => {
  const keyBuffer = typeof key === 'string' ? Buffer.from(key, 'hex') : key;
  const ivBuffer = Buffer.from(iv, 'hex');
  const authTagBuffer = Buffer.from(authTag, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, keyBuffer, ivBuffer);
  decipher.setAuthTag(authTagBuffer);

  return Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]);
};

/**
 * Derive a shared key from two user keys using HKDF
 * @param {string} userId1 
 * @param {string} userId2 
 * @returns {Buffer} Derived 256-bit key
 */
const deriveConversationKey = (userId1, userId2) => {
  const masterKey = Buffer.from(process.env.MASTER_ENCRYPTION_KEY, 'hex');
  // Sort IDs to always get same key regardless of who's sender/receiver
  const sortedIds = [userId1, userId2].sort().join(':');
  const salt = crypto.createHash('sha256').update(sortedIds).digest();
  
  return crypto.hkdfSync('sha256', masterKey, salt, 'spsm-messaging', KEY_LENGTH);
};

/**
 * Hash a token for secure storage
 */
const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Generate a cryptographically secure random token
 */
const generateSecureToken = (bytes = 32) => {
  return crypto.randomBytes(bytes).toString('hex');
};

module.exports = {
  generateKey,
  encrypt,
  decrypt,
  encryptBuffer,
  decryptBuffer,
  deriveConversationKey,
  hashToken,
  generateSecureToken,
  ALGORITHM,
};
