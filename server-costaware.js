import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import OpenAI from 'openai';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const CostAware = require('@costaware/sdk');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3003;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Track request context globally (simple approach for MVP)
let currentRequest = null;

// Initialize CostAware SDK
const costaware = new CostAware({
  endpoint: 'http://localhost:3000/v1/openai',
  getUserContext: () => {
    // Dynamic context based on current request
    if (currentRequest) {
      return {
        userId: currentRequest.ip || 'anonymous',
        plan: 'mvp-test',
        revenue: 0,
        feature: currentRequest.path?.includes('validate') ? 'idea-validation' : 'unknown'
      };
    }
    return { userId: 'launchlens-background', plan: 'system', revenue: 0 };
  },
  debug: true // Enable debug logging to see what's happening
});

// Create tracked OpenAI client ONCE at startup
const openai = process.env.OPENAI_API_KEY 
  ? costaware.createClient(OpenAI, { apiKey: process.env.OPENAI_API_KEY })
  : null;

// Middleware to capture request context
app.use((req, res, next) => {
  currentRequest = req;
  console.log(`📍 Request from IP: ${req.ip} to ${req.path}`);
  next();
});

// Simple validation endpoint
app.post('/api/validate', async (req, res) => {
  try {
    const { idea } = req.body;
    
    if (!idea || idea.trim().length < 10) {
      return res.status(400).json({ 
        error: 'Please describe your idea (at least 10 characters)' 
      });
    }

    console.log('Validating idea:', idea);

    // Step 1: Quick competitor search
    const competitors = await findCompetitors(idea);
    
    // Step 2: Make YES/NO decision
    const decision = await makeDecision(idea, competitors);
    
    res.json({
      success: true,
      decision: decision.verdict,
      reasons: decision.reasons,
      competitors: competitors,
      alternative: decision.alternative
    });
    
  } catch (error) {
    console.error('Validation error:', error);
    res.status(500).json({ 
      error: 'Failed to validate idea',
      details: error.message 
    });
  }
});

// Find competitors using Perplexity
async function findCompetitors(idea) {
  const perplexityApiKey = process.env.PERPLEXITY_API_KEY;
  
  if (!perplexityApiKey) {
    return [
      { name: "Existing Solution A", description: "Current market leader" },
      { name: "Existing Solution B", description: "Popular alternative" }
    ];
  }

  try {
    const query = `List 5 existing products/companies that do something similar to: ${idea}
    Return only company names and one-line descriptions.`;
    
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perplexityApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          {
            role: 'user',
            content: query
          }
        ],
        temperature: 0.1,
        max_tokens: 300
      })
    });

    if (!response.ok) {
      throw new Error('Perplexity API error');
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Simple parsing
    const competitors = [];
    const lines = content.split('\n');
    
    for (const line of lines) {
      const cleaned = line.replace(/^\d+\.\s*/, '').replace(/\*\*/g, '').trim();
      
      // Skip header lines or overly long lines (likely explanatory text)
      if (cleaned.length > 10 && cleaned.length < 200 && !cleaned.toLowerCase().includes('here are')) {
        const parts = cleaned.split(/[-–:]/);
        if (parts.length >= 2) {
          const name = parts[0].trim();
          // Only add if name looks like a company name (not too long)
          if (name.length < 50) {
            competitors.push({
              name: name,
              description: parts.slice(1).join('-').trim().substring(0, 100)
            });
          }
        }
      }
    }
    
    return competitors.slice(0, 5);
    
  } catch (error) {
    console.error('Competitor search failed:', error);
    return [
      { name: "Unknown Competitor", description: "Failed to load competitors" }
    ];
  }
}

// Make GO/NO-GO decision
async function makeDecision(idea, competitors) {
  if (!openai) {
    // Fallback logic without GPT
    const hasCompetitors = competitors.length > 3;
    return {
      verdict: hasCompetitors ? "NO" : "MAYBE",
      reasons: hasCompetitors 
        ? [
            "Market is saturated with existing solutions",
            "Difficult to differentiate from competitors",
            "High customer acquisition cost likely"
          ]
        : [
            "Market may have room for innovation",
            "Fewer competitors could mean opportunity",
            "Need more research to validate demand"
          ],
      alternative: hasCompetitors 
        ? "Consider a more specific niche within this market"
        : "Validate demand with 20 potential customers first"
    };
  }

  const prompt = `Analyze this startup idea for viability:
    
    Idea: ${idea}
    
    Existing competitors found: ${competitors.map(c => c.name).join(', ')}
    
    Give a clear YES or NO decision for whether this is worth pursuing.
    
    Respond in this exact JSON format:
    {
      "verdict": "YES" or "NO",
      "reasons": ["reason 1", "reason 2", "reason 3"],
      "alternative": "If NO, suggest what they should do instead"
    }
    
    Be direct and honest. Consider:
    - Is the market already saturated?
    - Is there a real problem being solved?
    - Can a small team compete here?
    - Is the idea specific enough?
    
    Keep reasons under 15 words each.`;
  
  try {
    // This OpenAI call is now tracked through CostAware!
    console.log('🎯 Making OpenAI call for idea validation...');
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a startup validator. Give clear YES/NO decisions with brief reasons. Be harsh but fair."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 200
    });
    
    const response = completion.choices[0].message.content;
    console.log('✅ OpenAI response received and tracked!');
    
    // Parse JSON response
    try {
      const decision = JSON.parse(response);
      return decision;
    } catch (parseError) {
      // Fallback if JSON parsing fails
      const isYes = response.toLowerCase().includes('"yes"') || 
                    response.toLowerCase().includes('verdict": "yes');
      
      return {
        verdict: isYes ? "YES" : "NO",
        reasons: [
          "Market analysis complete",
          "Competition level assessed",
          "Viability determined"
        ],
        alternative: isYes ? null : "Refine your idea to be more specific"
      };
    }
    
  } catch (error) {
    console.error('GPT decision failed:', error);
    return {
      verdict: "UNCLEAR",
      reasons: [
        "Unable to make clear determination",
        "More information needed",
        "Consider validating with customers"
      ],
      alternative: "Start with customer interviews before building"
    };
  }
}

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    version: 'MVP with CostAware',
    tracking: 'ENABLED',
    apis: {
      openai: !!openai,
      perplexity: !!process.env.PERPLEXITY_API_KEY,
      costaware: 'ACTIVE'
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 LaunchLens MVP (with CostAware) running on port ${PORT}`);
  console.log(`🔗 http://localhost:${PORT}`);
  console.log('');
  console.log('API Status:');
  console.log(`  OpenAI: ${openai ? '✅ Connected (Tracked)' : '❌ No API key'}`);
  console.log(`  Perplexity: ${process.env.PERPLEXITY_API_KEY ? '✅ Connected' : '❌ No API key'}`);
  console.log(`  CostAware: ✅ Tracking enabled`);
  console.log('');
  console.log('💰 All OpenAI costs will be tracked at: http://localhost:5173');
});