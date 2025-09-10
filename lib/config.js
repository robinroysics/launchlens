import { homedir } from 'os';
import { join } from 'path';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

const CONFIG_DIR = join(homedir(), '.launchlens');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');
const ENCRYPTED_FILE = join(CONFIG_DIR, 'keys.enc');

const DEFAULT_CONFIG = {
  model: 'gpt-3.5-turbo',
  maxTokens: 500,
  temperature: 0.7
};

const AVAILABLE_MODELS = [
  'gpt-4',
  'gpt-4-turbo-preview', 
  'gpt-3.5-turbo',
  'gpt-3.5-turbo-16k'
];

class Config {
  constructor() {
    this.ensureConfigDir();
    this.config = this.loadConfig();
    this.apiKeys = this.loadApiKeys();
  }

  ensureConfigDir() {
    if (!existsSync(CONFIG_DIR)) {
      mkdirSync(CONFIG_DIR, { recursive: true });
    }
  }

  loadConfig() {
    try {
      if (existsSync(CONFIG_FILE)) {
        const data = readFileSync(CONFIG_FILE, 'utf-8');
        return { ...DEFAULT_CONFIG, ...JSON.parse(data) };
      }
    } catch (error) {
      console.error('Error loading config:', error.message);
    }
    return { ...DEFAULT_CONFIG };
  }

  saveConfig() {
    try {
      writeFileSync(CONFIG_FILE, JSON.stringify(this.config, null, 2));
      return true;
    } catch (error) {
      console.error('Error saving config:', error.message);
      return false;
    }
  }

  loadApiKeys() {
    const keys = {};
    
    // Priority 1: Environment variables
    if (process.env.OPENAI_API_KEY) {
      keys.openai = process.env.OPENAI_API_KEY;
    }
    if (process.env.PERPLEXITY_API_KEY) {
      keys.perplexity = process.env.PERPLEXITY_API_KEY;
    }
    
    // Priority 2: Encrypted config file
    if (existsSync(ENCRYPTED_FILE)) {
      try {
        const encrypted = this.loadEncryptedKeys();
        Object.assign(keys, encrypted);
      } catch (error) {
        console.error('Error loading encrypted keys:', error.message);
      }
    }
    
    return keys;
  }

  loadEncryptedKeys() {
    try {
      const data = readFileSync(ENCRYPTED_FILE);
      const key = this.deriveKey();
      const iv = data.slice(0, 16);
      const encrypted = data.slice(16);
      
      const decipher = createDecipheriv('aes-256-cbc', key, iv);
      let decrypted = decipher.update(encrypted, null, 'utf8');
      decrypted += decipher.final('utf8');
      
      return JSON.parse(decrypted);
    } catch (error) {
      return {};
    }
  }

  saveEncryptedKeys() {
    try {
      const key = this.deriveKey();
      const iv = randomBytes(16);
      
      const cipher = createCipheriv('aes-256-cbc', key, iv);
      let encrypted = cipher.update(JSON.stringify(this.apiKeys), 'utf8');
      encrypted = Buffer.concat([encrypted, cipher.final()]);
      
      const combined = Buffer.concat([iv, encrypted]);
      writeFileSync(ENCRYPTED_FILE, combined);
      return true;
    } catch (error) {
      console.error('Error saving encrypted keys:', error.message);
      return false;
    }
  }

  deriveKey() {
    // Use machine ID + username as salt for encryption
    const salt = `${homedir()}-launchlens-v1`;
    return scryptSync('launchlens-local-encryption', salt, 32);
  }

  get(key) {
    if (key === 'openai-api-key') {
      return this.apiKeys.openai || null;
    }
    if (key === 'perplexity-api-key') {
      return this.apiKeys.perplexity || null;
    }
    return this.config[key] || null;
  }

  set(key, value) {
    if (key === 'openai-api-key') {
      this.apiKeys.openai = value;
      return this.saveEncryptedKeys();
    }
    if (key === 'perplexity-api-key') {
      this.apiKeys.perplexity = value;
      return this.saveEncryptedKeys();
    }
    if (key === 'model') {
      if (!AVAILABLE_MODELS.includes(value)) {
        throw new Error(`Invalid model. Available models: ${AVAILABLE_MODELS.join(', ')}`);
      }
    }
    this.config[key] = value;
    return this.saveConfig();
  }

  list() {
    const settings = {
      ...this.config,
      'openai-api-key': this.apiKeys.openai ? '***' + this.apiKeys.openai.slice(-4) : 'not set',
      'perplexity-api-key': this.apiKeys.perplexity ? '***' + this.apiKeys.perplexity.slice(-4) : 'not set'
    };
    return settings;
  }

  async validateApiKey(provider, key) {
    if (provider === 'openai') {
      try {
        const response = await fetch('https://api.openai.com/v1/models', {
          headers: {
            'Authorization': `Bearer ${key}`
          }
        });
        return response.ok;
      } catch (error) {
        return false;
      }
    }
    if (provider === 'perplexity') {
      try {
        const response = await fetch('https://api.perplexity.ai/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'sonar',
            messages: [{ role: 'user', content: 'test' }],
            max_tokens: 1
          })
        });
        return response.ok || response.status === 400; // 400 means auth worked but request was invalid
      } catch (error) {
        return false;
      }
    }
    return false;
  }

  getOpenAIKey() {
    return this.apiKeys.openai || process.env.OPENAI_API_KEY || null;
  }

  getPerplexityKey() {
    return this.apiKeys.perplexity || process.env.PERPLEXITY_API_KEY || null;
  }

  getModel() {
    return this.config.model || DEFAULT_CONFIG.model;
  }

  static getAvailableModels() {
    return AVAILABLE_MODELS;
  }
}

export default new Config();