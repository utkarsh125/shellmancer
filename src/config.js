// This module will handle
// Reading and Writing your configuration
// API Key, Default Model, etc

import chalk from 'chalk';
import crypto from 'crypto';
import { execSync } from 'child_process';
import fs from 'fs';
import inquirer from "inquirer";
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const configFilePath = path.join(os.homedir(), ".shell-sage-config.json");
const FALLBACK_MODEL = "gemini-2.0-flash"; //Current model that works will be used as fallback

// Encryption configuration
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 16 bytes for AES
const SALT_LENGTH = 64; // 64 bytes for salt
const TAG_LENGTH = 16; // 16 bytes for GCM tag
const KEY_LENGTH = 32; // 32 bytes for AES-256
const ITERATIONS = 100000; // PBKDF2 iterations

/**
 * Derives an encryption key from system-specific information
 * This ensures the key is unique to the user's system
 */
function deriveEncryptionKey() {
    // Use system-specific information to create a unique seed
    const seed = [
        os.homedir(),
        os.hostname(),
        os.userInfo().username,
        os.platform(),
        os.arch()
    ].join('|');
    
    // Generate a salt from the seed (deterministic but system-specific)
    const salt = crypto.createHash('sha256').update(seed).digest();
    
    // Derive key using PBKDF2 with the seed as password
    const key = crypto.pbkdf2Sync(seed, salt, ITERATIONS, KEY_LENGTH, 'sha512');
    
    return key;
}

/**
 * Encrypts a plain text string using AES-256-GCM
 * @param {string} text - Plain text to encrypt
 * @returns {string} - Encrypted string in format: iv:salt:tag:encryptedData (all base64)
 */
function encrypt(text) {
    try {
        const key = deriveEncryptionKey();
        const iv = crypto.randomBytes(IV_LENGTH);
        const salt = crypto.randomBytes(SALT_LENGTH);
        
        // Derive a unique key for this encryption using the salt
        const derivedKey = crypto.pbkdf2Sync(key.toString('hex'), salt, ITERATIONS, KEY_LENGTH, 'sha512');
        
        const cipher = crypto.createCipheriv(ALGORITHM, derivedKey, iv);
        
        let encrypted = cipher.update(text, 'utf8', 'base64');
        encrypted += cipher.final('base64');
        
        const tag = cipher.getAuthTag();
        
        // Return format: iv:salt:tag:encryptedData (all base64 encoded)
        return [
            iv.toString('base64'),
            salt.toString('base64'),
            tag.toString('base64'),
            encrypted
        ].join(':');
    } catch (error) {
        console.error(chalk.red('Encryption error:'), error.message);
        throw error;
    }
}

/**
 * Decrypts an encrypted string
 * @param {string} encryptedData - Encrypted string in format: iv:salt:tag:encryptedData
 * @returns {string} - Decrypted plain text
 */
function decrypt(encryptedData) {
    try {
        // Handle legacy unencrypted keys (for backward compatibility)
        if (!encryptedData.includes(':')) {
            return encryptedData;
        }
        
        const parts = encryptedData.split(':');
        if (parts.length !== 4) {
            throw new Error('Invalid encrypted data format');
        }
        
        const [ivBase64, saltBase64, tagBase64, encrypted] = parts;
        
        const iv = Buffer.from(ivBase64, 'base64');
        const salt = Buffer.from(saltBase64, 'base64');
        const tag = Buffer.from(tagBase64, 'base64');
        
        const key = deriveEncryptionKey();
        const derivedKey = crypto.pbkdf2Sync(key.toString('hex'), salt, ITERATIONS, KEY_LENGTH, 'sha512');
        
        const decipher = crypto.createDecipheriv(ALGORITHM, derivedKey, iv);
        decipher.setAuthTag(tag);
        
        let decrypted = decipher.update(encrypted, 'base64', 'utf8');
        decrypted += decipher.final('utf8');
        
        return decrypted;
    } catch (error) {
        console.error(chalk.red('Decryption error:'), error.message);
        // If decryption fails, try returning as-is (for backward compatibility)
        return encryptedData;
    }
}

export function loadConfig(){

    if(fs.existsSync(configFilePath)){
        try {
            
            const data = fs.readFileSync(configFilePath, 'utf-8')
            return JSON.parse(data);
        } catch (error) {
            console.error("Error reading configFile: ", error.message);
            return {};            
        }


    } else {

        return {};
    }
}

export function saveConfig(config) {
    try {
        // Encrypt API key before saving if it exists and is not already encrypted
        if (config.apiKey) {
            // Check if already encrypted (format: base64:base64:base64:base64)
            const parts = config.apiKey.split(':');
            const isEncrypted = parts.length === 4 && 
                               parts.every(part => {
                                   try {
                                       Buffer.from(part, 'base64');
                                       return true;
                                   } catch {
                                       return false;
                                   }
                               });
            
            // Only encrypt if it's not already in encrypted format (backward compatibility)
            if (!isEncrypted) {
                config.apiKey = encrypt(config.apiKey);
            }
        }
        
        fs.writeFileSync(configFilePath, JSON.stringify(config, null, 2), 'utf8');
        
        // Set restrictive file permissions (600 = owner read/write only)
        try {
            fs.chmodSync(configFilePath, 0o600);
        } catch (chmodError) {
            // chmod may fail on some systems, but it's not critical
            console.warn(chalk.yellow('Warning: Could not set file permissions'));
        }
    } catch (error) {
        console.error("Error writing to configFile: ", error.message);
    }
}


export async function getApiKey(){
    const config = loadConfig();
    if(!config.apiKey){
        const { apiKey } = await inquirer.prompt([

            {
                type: "password", // Use password type to hide input
                "name": "apiKey",
                "message": "Enter your GeminiAPI Key: ",
                mask: "*", // Mask character for password input
                validate: (input) => (input ? true: "API Key cannot be empty"),
            },
        ]);
        config.apiKey = apiKey;
        saveConfig(config); // Will encrypt before saving
        return apiKey;
    }
    // Decrypt the API key when retrieving
    return decrypt(config.apiKey);
}

export async function removeApiKey(){

    const config = loadConfig();

    if(config.apiKey){
        delete config.apiKey;
        saveConfig(config);
        console.log(chalk.redBright("API key removed from config."));
    }else{
        console.log(chalk.yellowBright("No stored API key found in config."))
    }
}

export function getDefaultModel(){

    const config = loadConfig();

    //if model is defined properly then return it
    //if no model is specified then return the FALLBACK_MODEL (gemini-2.0-flash)
    return config.getDefaultModel || FALLBACK_MODEL;
}

export function setDefaultModel(newModel){
    const config = loadConfig();
    config.getDefaultModel = newModel;
    saveConfig(config);
    console.log(chalk.blue("Default model is set to: "), newModel);
}

/**
 * Gets the current package version from package.json
 * @param {boolean} debug - If true, logs debug information
 * @returns {string} - Package version or null if not found
 */
function getCurrentPackageVersion(debug = false) {
    try {
        // Get the directory of the current module
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = dirname(__filename);
        
        // Try multiple strategies to find package.json
        
        // Strategy 1: Relative to current module (for local development)
        let packageJsonPath = path.join(__dirname, '..', 'package.json');
        
        // Strategy 2: Try parent directories (for global installs in node_modules)
        if (!fs.existsSync(packageJsonPath)) {
            // Walk up the directory tree looking for package.json
            let currentDir = __dirname;
            for (let i = 0; i < 5; i++) { // Limit to 5 levels up
                const testPath = path.join(currentDir, 'package.json');
                if (fs.existsSync(testPath)) {
                    // Check if it's the shellmancer package
                    try {
                        const pkg = JSON.parse(fs.readFileSync(testPath, 'utf-8'));
                        if (pkg.name === 'shellmancer') {
                            packageJsonPath = testPath;
                            break;
                        }
                    } catch {
                        // Continue searching
                    }
                }
                currentDir = path.dirname(currentDir);
            }
        }
        
        // Strategy 3: Try npm global prefix location
        if (!fs.existsSync(packageJsonPath)) {
            try {
                const npmGlobalPrefix = execSync('npm config get prefix', { encoding: 'utf-8' }).trim();
                const globalPackagePath = path.join(npmGlobalPrefix, 'lib', 'node_modules', 'shellmancer', 'package.json');
                if (fs.existsSync(globalPackagePath)) {
                    packageJsonPath = globalPackagePath;
                }
            } catch {
                // Ignore errors, continue with other strategies
            }
        }
        
        // Strategy 4: Try process.cwd() (current working directory)
        if (!fs.existsSync(packageJsonPath)) {
            const cwdPath = path.join(process.cwd(), 'package.json');
            if (fs.existsSync(cwdPath)) {
                try {
                    const pkg = JSON.parse(fs.readFileSync(cwdPath, 'utf-8'));
                    if (pkg.name === 'shellmancer') {
                        packageJsonPath = cwdPath;
                    }
                } catch {
                    // Not the right package
                }
            }
        }
        
        if (fs.existsSync(packageJsonPath)) {
            const packageData = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
            // Verify it's the shellmancer package
            if (packageData.name === 'shellmancer') {
                if (debug) {
                    console.log(chalk.blue(`Found package.json at: ${packageJsonPath}`));
                    console.log(chalk.blue(`Package version: ${packageData.version}`));
                }
                return packageData.version || null;
            }
        }
        
        if (debug) {
            console.warn(chalk.yellow('Could not find shellmancer package.json'));
        }
        return null;
    } catch (error) {
        // Silently fail - version check is not critical
        // This can happen if package.json is not accessible (e.g., in some deployment scenarios)
        return null;
    }
}

/**
 * Checks if the package version has changed and removes API key if it has
 * This ensures that after an update, users must re-enter their API key
 * @param {boolean} debug - If true, logs debug information
 * @returns {boolean} - True if version changed and API key was removed
 */
export function checkVersionAndCleanApiKey(debug = false) {
    try {
        const currentVersion = getCurrentPackageVersion(debug);
        if (!currentVersion) {
            // If we can't determine version, skip the check silently
            // This prevents errors in edge cases where package.json can't be found
            if (debug) {
                console.warn(chalk.yellow('Warning: Could not determine current package version'));
            }
            return false;
        }
        
        const config = loadConfig();
        const storedVersion = config.packageVersion;
        
        if (debug) {
            console.log(chalk.blue(`Current version: ${currentVersion}`));
            console.log(chalk.blue(`Stored version: ${storedVersion || 'none'}`));
        }
        
        // If versions differ, remove API key
        if (storedVersion && storedVersion !== currentVersion) {
            console.log(chalk.yellow(`\n⚠️  Package updated from v${storedVersion} to v${currentVersion}`));
            console.log(chalk.blue('🔒 API key has been removed for security. Please enter it again.\n'));
            
            if (config.apiKey) {
                delete config.apiKey;
            }
            
            // Update stored version
            config.packageVersion = currentVersion;
            saveConfig(config);
            return true;
        } else if (!storedVersion) {
            // First time running or version not stored yet - store current version
            if (debug) {
                console.log(chalk.blue(`Storing initial version: ${currentVersion}`));
            }
            config.packageVersion = currentVersion;
            saveConfig(config);
        }
        // If storedVersion === currentVersion, do nothing (no update detected)
        
        return false;
    } catch (error) {
        if (debug) {
            console.error(chalk.red('Error checking version:'), error.message);
        }
        // Silently fail - version check should not break the application
        return false;
    }
}