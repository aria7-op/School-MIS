#!/usr/bin/env node

import readline from 'readline';
import credentialManager from '../utils/credentialManager.js';
import logger from '../config/logger.js';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

/**
 * Display menu options
 */
function showMenu() {
    console.log('\n=== Credential Manager ===');
    console.log('1. Initialize default credentials');
    console.log('2. Set OpenAI API Key');
    console.log('3. Set Hugging Face API Key');
    console.log('4. Set Cohere API Key');
    console.log('5. Set Database URL');
    console.log('6. Set Redis URL');
    console.log('7. Set JWT Secret');
    console.log('8. Set Encryption Key');
    console.log('9. View all credentials');
    console.log('10. Export credentials to .env file');
    console.log('11. Import credentials from .env file');
    console.log('12. Test credentials');
    console.log('0. Exit');
    console.log('========================');
}

/**
 * Get user input
 */
function askQuestion(question) {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer);
        });
    });
}

/**
 * Initialize default credentials
 */
async function initializeCredentials() {
    console.log('\nInitializing default credentials...');
    try {
        const credentials = credentialManager.initialize();
        console.log('✅ Default credentials initialized successfully!');
        console.log('📁 Credentials saved to: credentials.enc');
        return credentials;
    } catch (error) {
        console.error('❌ Error initializing credentials:', error.message);
        return null;
    }
}

/**
 * Set API key
 */
async function setApiKey(service, keyName) {
    console.log(`\nSetting ${service} API Key...`);
    console.log(`Get your free API key from:`);
    
    const urls = {
        'OpenAI': 'https://platform.openai.com/api-keys',
        'Hugging Face': 'https://huggingface.co/settings/tokens',
        'Cohere': 'https://dashboard.cohere.ai/api-keys'
    };
    
    console.log(`🌐 ${urls[service]}`);
    
    const apiKey = await askQuestion(`Enter your ${service} API Key: `);
    
    if (apiKey.trim()) {
        try {
            credentialManager.updateCredential(`ai.${keyName}.apiKey`, apiKey.trim());
            console.log(`✅ ${service} API Key set successfully!`);
        } catch (error) {
            console.error(`❌ Error setting ${service} API Key:`, error.message);
        }
    } else {
        console.log('⚠️  API Key not provided. Skipping...');
    }
}

/**
 * Set database URL
 */
async function setDatabaseUrl() {
    console.log('\nSetting Database URL...');
    console.log('Supported formats:');
    console.log('- PostgreSQL: postgresql://username:password@localhost:5432/database');
    console.log('- MySQL: mysql://username:password@localhost:3306/database');
    console.log('- SQLite: file:./database.sqlite');
    
    const dbUrl = await askQuestion('Enter Database URL: ');
    
    if (dbUrl.trim()) {
        try {
            credentialManager.updateCredential('database.url', dbUrl.trim());
            console.log('✅ Database URL set successfully!');
        } catch (error) {
            console.error('❌ Error setting Database URL:', error.message);
        }
    } else {
        console.log('⚠️  Database URL not provided. Skipping...');
    }
}

/**
 * Set Redis URL
 */
async function setRedisUrl() {
    console.log('\nSetting Redis URL...');
    console.log('Supported formats:');
    console.log('- Local: redis://localhost:6379');
    console.log('- With password: redis://:password@localhost:6379');
    console.log('- Cloud: redis://username:password@host:port');
    
    const redisUrl = await askQuestion('Enter Redis URL: ');
    
    if (redisUrl.trim()) {
        try {
            credentialManager.updateCredential('redis.url', redisUrl.trim());
            console.log('✅ Redis URL set successfully!');
        } catch (error) {
            console.error('❌ Error setting Redis URL:', error.message);
        }
    } else {
        console.log('⚠️  Redis URL not provided. Skipping...');
    }
}

/**
 * Set JWT Secret
 */
async function setJwtSecret() {
    console.log('\nSetting JWT Secret...');
    console.log('⚠️  Use a strong, random secret for production!');
    
    const jwtSecret = await askQuestion('Enter JWT Secret: ');
    
    if (jwtSecret.trim()) {
        try {
            credentialManager.updateCredential('jwt.secret', jwtSecret.trim());
            console.log('✅ JWT Secret set successfully!');
        } catch (error) {
            console.error('❌ Error setting JWT Secret:', error.message);
        }
    } else {
        console.log('⚠️  JWT Secret not provided. Skipping...');
    }
}

/**
 * Set Encryption Key
 */
async function setEncryptionKey() {
    console.log('\nSetting Encryption Key...');
    console.log('⚠️  This key is used to encrypt/decrypt credentials!');
    console.log('⚠️  Keep this key secure and backup safely!');
    
    const encryptionKey = await askQuestion('Enter Encryption Key (32 characters): ');
    
    if (encryptionKey.trim().length >= 32) {
        try {
            credentialManager.updateCredential('encryption.key', encryptionKey.trim());
            console.log('✅ Encryption Key set successfully!');
        } catch (error) {
            console.error('❌ Error setting Encryption Key:', error.message);
        }
    } else {
        console.log('⚠️  Encryption Key must be at least 32 characters. Skipping...');
    }
}

/**
 * View all credentials
 */
function viewCredentials() {
    console.log('\n=== Current Credentials ===');
    try {
        const credentials = credentialManager.getAllCredentials();
        console.log(JSON.stringify(credentials, null, 2));
    } catch (error) {
        console.error('❌ Error viewing credentials:', error.message);
    }
}

/**
 * Export credentials to .env file
 */
async function exportToEnv() {
    console.log('\nExporting credentials to .env file...');
    try {
        const envVars = credentialManager.exportToEnv();
        
        // Create .env file content
        let envContent = '# Auto-generated from encrypted credentials\n\n';
        Object.keys(envVars).forEach(key => {
            envContent += `${key}=${envVars[key]}\n`;
        });
        
        // Write to .env file
        const fs = await import('fs');
        fs.writeFileSync('.env', envContent, 'utf8');
        
        console.log('✅ Credentials exported to .env file successfully!');
        console.log('📁 File: .env');
    } catch (error) {
        console.error('❌ Error exporting credentials:', error.message);
    }
}

/**
 * Import credentials from .env file
 */
async function importFromEnv() {
    console.log('\nImporting credentials from .env file...');
    try {
        const fs = await import('fs');
        const path = await import('path');
        
        const envFile = path.join(process.cwd(), '.env');
        
        if (!fs.existsSync(envFile)) {
            console.log('❌ .env file not found!');
            return;
        }
        
        const envContent = fs.readFileSync(envFile, 'utf8');
        const lines = envContent.split('\n');
        
        const envVars = {};
        lines.forEach(line => {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#')) {
                const [key, ...valueParts] = trimmed.split('=');
                if (key && valueParts.length > 0) {
                    envVars[key] = valueParts.join('=');
                }
            }
        });
        
        // Update credentials with env vars
        Object.keys(envVars).forEach(key => {
            const value = envVars[key];
            
            if (key === 'DATABASE_URL') {
                credentialManager.updateCredential('database.url', value);
            } else if (key === 'REDIS_URL') {
                credentialManager.updateCredential('redis.url', value);
            } else if (key === 'JWT_SECRET') {
                credentialManager.updateCredential('jwt.secret', value);
            } else if (key === 'OPENAI_API_KEY') {
                credentialManager.updateCredential('ai.openai.apiKey', value);
            } else if (key === 'HUGGINGFACE_API_KEY') {
                credentialManager.updateCredential('ai.huggingface.apiKey', value);
            } else if (key === 'COHERE_API_KEY') {
                credentialManager.updateCredential('ai.cohere.apiKey', value);
            } else if (key === 'ENCRYPTION_KEY') {
                credentialManager.updateCredential('encryption.key', value);
            }
        });
        
        console.log('✅ Credentials imported from .env file successfully!');
    } catch (error) {
        console.error('❌ Error importing credentials:', error.message);
    }
}

/**
 * Test credentials
 */
async function testCredentials() {
    console.log('\nTesting credentials...');
    try {
        const credentials = credentialManager.getAllCredentials();
        
        console.log('🔍 Testing Database URL...');
        if (credentials.database?.url) {
            console.log('✅ Database URL configured');
        } else {
            console.log('⚠️  Database URL not configured');
        }
        
        console.log('🔍 Testing Redis URL...');
        if (credentials.redis?.url) {
            console.log('✅ Redis URL configured');
        } else {
            console.log('⚠️  Redis URL not configured');
        }
        
        console.log('🔍 Testing JWT Secret...');
        if (credentials.jwt?.secret && credentials.jwt.secret !== 'your-super-secret-jwt-key-change-this-in-production') {
            console.log('✅ JWT Secret configured');
        } else {
            console.log('⚠️  JWT Secret not configured');
        }
        
        console.log('🔍 Testing AI Services...');
        if (credentials.ai?.openai?.apiKey) {
            console.log('✅ OpenAI API Key configured');
        } else {
            console.log('⚠️  OpenAI API Key not configured');
        }
        
        if (credentials.ai?.huggingface?.apiKey) {
            console.log('✅ Hugging Face API Key configured');
        } else {
            console.log('⚠️  Hugging Face API Key not configured');
        }
        
        if (credentials.ai?.cohere?.apiKey) {
            console.log('✅ Cohere API Key configured');
        } else {
            console.log('⚠️  Cohere API Key not configured');
        }
        
        console.log('🔍 Testing Encryption Key...');
        if (credentials.encryption?.key && credentials.encryption.key.length >= 32) {
            console.log('✅ Encryption Key configured');
        } else {
            console.log('⚠️  Encryption Key not configured');
        }
        
        console.log('\n✅ Credential testing completed!');
        
    } catch (error) {
        console.error('❌ Error testing credentials:', error.message);
    }
}

/**
 * Main menu loop
 */
async function main() {
    console.log('🚀 Welcome to the Credential Manager!');
    console.log('This tool helps you manage encrypted credentials for your WebSocket service.');
    
    while (true) {
        showMenu();
        const choice = await askQuestion('\nEnter your choice (0-12): ');
        
        switch (choice.trim()) {
            case '0':
                console.log('\n👋 Goodbye!');
                rl.close();
                process.exit(0);
                break;
                
            case '1':
                await initializeCredentials();
                break;
                
            case '2':
                await setApiKey('OpenAI', 'openai');
                break;
                
            case '3':
                await setApiKey('Hugging Face', 'huggingface');
                break;
                
            case '4':
                await setApiKey('Cohere', 'cohere');
                break;
                
            case '5':
                await setDatabaseUrl();
                break;
                
            case '6':
                await setRedisUrl();
                break;
                
            case '7':
                await setJwtSecret();
                break;
                
            case '8':
                await setEncryptionKey();
                break;
                
            case '9':
                viewCredentials();
                break;
                
            case '10':
                await exportToEnv();
                break;
                
            case '11':
                await importFromEnv();
                break;
                
            case '12':
                await testCredentials();
                break;
                
            default:
                console.log('❌ Invalid choice. Please try again.');
        }
        
        await askQuestion('\nPress Enter to continue...');
    }
}

// Handle process termination
process.on('SIGINT', () => {
    console.log('\n👋 Goodbye!');
    rl.close();
    process.exit(0);
});

// Start the application
main().catch(error => {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
}); 