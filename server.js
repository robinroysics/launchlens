import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { validateIdea, validateIdeaDetailed } from './lib/validator.js';

const app = express();
const PORT = process.env.PORT || 3003;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.use(cors());
app.use(express.json());
app.use(express.static('public'));



// Simple validation endpoint
app.post('/api/validate', async (req, res) => {
  try {
    const { idea, roastMode, detailed } = req.body;
    
    console.log('Validating idea:', idea, detailed ? '(detailed)' : '(simple)');
    
    const result = detailed ? 
      await validateIdeaDetailed(idea, roastMode) :
      await validateIdea(idea, roastMode);
    res.json(result);
    
  } catch (error) {
    console.error('Validation error:', error);
    res.status(500).json({ 
      error: 'Failed to validate idea',
      details: error.message 
    });
  }
});


app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    version: 'MVP',
    apis: {
      openai: !!process.env.OPENAI_API_KEY,
      perplexity: !!process.env.PERPLEXITY_API_KEY
    },
    cli: 'Available via: node cli.js'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 LaunchLens MVP running on port ${PORT}`);
  console.log(`🔗 http://localhost:${PORT}`);
  console.log('');
  console.log('API Status:');
  console.log(`  OpenAI: ${process.env.OPENAI_API_KEY ? '✅ Connected' : '❌ No API key'}`);
  console.log(`  Perplexity: ${process.env.PERPLEXITY_API_KEY ? '✅ Connected' : '❌ No API key'}`);
  console.log('');
  console.log('CLI Usage:');
  console.log('  node cli.js "your startup idea"');
  console.log('  node cli.js --help');
});