import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import OpenAI from 'openai';
import { marked } from 'marked';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Initialize OpenAI (for GPT-4 analysis)
const openai = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'placeholder_key_for_testing' 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

// Dynamic placeholder examples based on common startup types
const PLACEHOLDER_EXAMPLES = {
  products: [
    "AI-powered form builder for small businesses",
    "Mobile app for local food delivery",
    "SaaS tool for social media scheduling", 
    "E-commerce platform for handmade goods",
    "Project management tool for remote teams",
    "CRM for freelancers and consultants",
    "Video editing tool for content creators",
    "Fitness tracking app with AI coaching"
  ],
  targets: [
    "Small business owners who need simple forms",
    "Restaurants wanting direct delivery without fees",
    "Social media managers at small agencies",
    "Crafters and artists selling online",
    "Remote startup teams under 50 people",
    "Independent consultants and freelancers",
    "YouTube creators and TikTokers",
    "Fitness enthusiasts wanting personalized plans"
  ],
  differentiators: [
    "Natural language form creation, no coding required",
    "Zero commission fees, flat monthly rate",
    "AI-powered content suggestions and timing",
    "Built-in SEO and social media marketing tools",
    "Voice-first interface for quick updates",
    "Automated invoicing and time tracking",
    "One-click effects that look professional",
    "Adapts workouts based on recovery data"
  ],
  pricing: [
    "$29/month for unlimited forms",
    "$99/month per restaurant",
    "$49/month for 10 social accounts",
    "$19/month + 3% transaction fee",
    "Free for 5 users, $10/user after",
    "$39/month with unlimited clients",
    "$15/month or $149/year",
    "Free with premium coaching at $29/month"
  ],
  competitors: [
    "Typeform, Google Forms, Jotform",
    "DoorDash, Uber Eats, Grubhub",
    "Buffer, Hootsuite, Later",
    "Etsy, Shopify, WooCommerce",
    "Asana, Trello, Monday.com",
    "HoneyBook, Dubsado, FreshBooks",
    "Adobe Premiere, Final Cut, DaVinci",
    "MyFitnessPal, Strava, Fitbit"
  ]
};

// Get random example from category
function getRandomExample(category) {
  const examples = PLACEHOLDER_EXAMPLES[category];
  return examples[Math.floor(Math.random() * examples.length)];
}

// Progressive context questions with dynamic placeholders
function getContextQuestions() {
  // Select a random "persona" to make placeholders coherent
  const personaIndex = Math.floor(Math.random() * PLACEHOLDER_EXAMPLES.products.length);
  
  return [
    {
      id: 'product',
      question: "What are you building?",
      placeholder: PLACEHOLDER_EXAMPLES.products[personaIndex],
      description: "Be specific about what your product does and who uses it",
      required: true
    },
    {
      id: 'target',
      question: "Who's your target customer?",
      placeholder: PLACEHOLDER_EXAMPLES.targets[personaIndex],
      required: true
    },
    {
      id: 'differentiator',
      question: "What's your main differentiator?",
      placeholder: PLACEHOLDER_EXAMPLES.differentiators[personaIndex],
      required: true
    },
    {
      id: 'pricing',
      question: "What's your price range?",
      placeholder: PLACEHOLDER_EXAMPLES.pricing[personaIndex],
      required: true
    },
    {
      id: 'competitors',
      question: "Any known competitors? (optional)",
      placeholder: PLACEHOLDER_EXAMPLES.competitors[personaIndex],
      required: false
    },
    {
      id: 'brutalMode',
      question: "Want the brutal truth?",
      type: 'checkbox',
      description: "Get an honest, no-BS assessment of your chances (not for the faint-hearted)",
      required: false
    }
  ];
}

// Serve the landing page
app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'public', 'index.html'));
});

// Get context questions with dynamic placeholders
app.get('/api/questions', (req, res) => {
  res.json({ questions: getContextQuestions() });
});

// Quick test endpoint - just pass params in URL
app.get('/api/test', async (req, res) => {
  const context = {
    product: req.query.product || 'AI token organizer for SAAS',
    target: req.query.target || 'SAAS companies',
    differentiator: req.query.differentiator || 'niche',
    pricing: req.query.pricing || '$50/month',
    competitors: req.query.competitors || '',
    brutalMode: req.query.brutal === 'true'
  };
  
  console.log('Quick test with context:', context);
  
  try {
    // Just get competitor names for quick testing
    const competitors = await researchCompetitorsWithPerplexity(context);
    
    res.json({
      success: true,
      context,
      competitors: competitors.map(c => ({
        name: c.name,
        description: c.description || 'No description',
        pricing: c.pricing || 'Unknown'
      })),
      additionalCompetitors: competitors.additionalCompetitors || [],
      count: competitors.length
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    res.json({
      success: false,
      error: error.message,
      context,
      hint: 'Check server logs for Perplexity response'
    });
  }
});

// Analyze competition
app.post('/api/analyze', async (req, res) => {
  try {
    const { context } = req.body;
    
    if (!context || !context.product || !context.target) {
      return res.status(400).json({ 
        error: 'Missing required context information' 
      });
    }

    console.log('Starting analysis for:', context.product);
    console.log('=== DEBUG CONTEXT ===');
    console.log('Received context:', JSON.stringify(context, null, 2));
    console.log('===================');

    // Step 1: Research competitors using Perplexity API
    const competitors = await researchCompetitorsWithPerplexity(context);
    
    // Step 2: Analyze with GPT-4 (or fallback)
    const analysis = await analyzeCompetition(context, competitors);
    
    // Step 3: Generate recommendations
    const recommendations = await generateRecommendations(context, competitors, analysis);
    
    // Step 4: Generate critical questions founders should ask
    const questionsToAsk = await generateCriticalQuestions(context, competitors, analysis);
    
    // Step 5: Calculate success rating
    const successRating = calculateSuccessRating(context, competitors, analysis);
    
    // Step 6: Generate brutal truth (if requested)
    const brutalTruth = context.brutalMode === 'true' || context.brutalMode === true
      ? await generateBrutalTruth(context, competitors, successRating)
      : null;
    
    // Parse markdown in insights to HTML
    const parsedInsights = marked.parse(analysis);
    
    res.json({
      success: true,
      analysis: {
        competitors,
        additionalCompetitors: competitors.additionalCompetitors || [],
        insights: parsedInsights,
        recommendations,
        opportunities: findOpportunities(analysis, competitors),
        questionsToAsk,
        successRating,
        brutalTruth
      }
    });
    
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ 
      error: 'Failed to analyze competition',
      details: error.message 
    });
  }
});

// Research competitors using Perplexity API
async function researchCompetitorsWithPerplexity(context) {
  const perplexityApiKey = process.env.PERPLEXITY_API_KEY;
  
  // If no Perplexity API key, use mock data
  if (!perplexityApiKey || perplexityApiKey === 'placeholder_key_for_testing') {
    console.log('Using mock competitors (no Perplexity API key)');
    return getMockCompetitors(context);
  }

  try {
    // Two-phase research: First get names, then get details
    console.log('Phase 1: Finding competitor names...');
    
    let competitorNames = [];
    
    // If user provided specific competitors, use those first
    if (context.competitors && context.competitors.trim()) {
      const userCompetitors = context.competitors.split(',').map(c => c.trim()).filter(c => c);
      competitorNames = userCompetitors;
      console.log('Using user-provided competitors:', competitorNames);
      
      // If user provided less than 6, get more from Perplexity
      if (competitorNames.length < 6) {
        const additionalQuery = `List ${6 - competitorNames.length} companies that compete with ${userCompetitors.join(', ')} in the ${context.product} space for ${context.target}.
        Exclude these companies: ${userCompetitors.join(', ')}.
        Return only real company names, not generic descriptions.`;
        
        const nameResponse = await fetch('https://api.perplexity.ai/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${perplexityApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'sonar',
            messages: [
              {
                role: 'system',
                content: 'You are a startup competitive intelligence expert. Focus on finding direct, specific competitors including lesser-known specialized tools and emerging startups, not just dominant market leaders. Be precise about matching the exact product category.'
              },
              {
                role: 'user',
                content: additionalQuery
              }
            ],
            temperature: 0.1,
            top_p: 0.9,
            return_images: false,
            return_related_questions: false,
            stream: false
          })
        });

        if (nameResponse.ok) {
          const nameData = await nameResponse.json();
          const additionalNames = extractCompetitorNames(nameData.choices[0].message.content);
          competitorNames = [...competitorNames, ...additionalNames];
        }
      }
    } else {
      // No user competitors provided, get from Perplexity
      const nameQuery = `Find 6 direct competitors for: ${context.product}
      Target market: ${context.target}
      
      Return only company names that directly compete.`;
      
      const nameResponse = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${perplexityApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'sonar',
          messages: [
            {
              role: 'system',
              content: 'You are a startup competitive intelligence expert. Focus on finding direct, specific competitors including lesser-known specialized tools and emerging startups, not just dominant market leaders. Be precise about matching the exact product category.'
            },
            {
              role: 'user',
              content: nameQuery
            }
          ],
          temperature: 0.1,
          top_p: 0.9,
          return_images: false,
          return_related_questions: false,
          stream: false
        })
      });

      if (!nameResponse.ok) {
        throw new Error(`Perplexity API error: ${nameResponse.status}`);
      }

      const nameData = await nameResponse.json();
      const perplexityResponse = nameData.choices[0].message.content;
      console.log('Perplexity response:', perplexityResponse);
      competitorNames = extractCompetitorNames(perplexityResponse);
      
      // If extraction failed, try a simpler approach
      if (competitorNames.length === 0) {
        console.log('No names extracted with regex, trying simple split...');
        // Look for markdown bold names
        const boldMatches = perplexityResponse.matchAll(/\*\*([^*]+)\*\*/g);
        for (const match of boldMatches) {
          const name = match[1].trim();
          if (name && name.length > 2 && name.length < 50 && !name.toLowerCase().includes('these')) {
            competitorNames.push(name);
          }
        }
        
        // If still nothing, try bullet points
        if (competitorNames.length === 0) {
          const lines = perplexityResponse.split(/\n/);
          for (const line of lines) {
            const cleaned = line.trim()
              .replace(/^[-*•\d.)\s]+/, '')
              .replace(/\*\*/g, '')
              .trim();
            if (cleaned && cleaned.length > 2 && cleaned.length < 30 && 
                !cleaned.includes(' ') && // Single word company names
                !cleaned.includes('companies') &&
                !cleaned.includes('tools')) {
              competitorNames.push(cleaned);
            }
          }
        }
      }
    }
    
    console.log('Final competitor names:', competitorNames);
    
    // Phase 2: Get detailed information for top 3 competitors (in parallel)
    console.log('Phase 2: Researching competitor details...');
    
    // Get detailed info for top 3 competitors in parallel
    const topCompetitors = competitorNames.slice(0, 3);
    const additionalCompetitors = competitorNames.slice(3, 6);
    
    const detailPromises = topCompetitors.map(async (name) => {
      const detailQuery = `Research ${name} as a competitor to ${context.product}:
      1. What exactly do they offer that competes with ${context.product}?
      2. Key features relevant to ${context.target}
      3. Actual pricing (be specific with numbers)
      4. Their main advantages (especially for ${context.target})
      5. Their gaps/weaknesses that a startup could exploit
      6. Who uses them most
      7. Why would someone choose them vs a new alternative?
      
      Focus on practical competitive intelligence, not generic company info.`;
      
      try {
        const detailResponse = await fetch('https://api.perplexity.ai/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${perplexityApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'sonar',
            messages: [
              {
                role: 'system',
                content: 'You are a competitive intelligence analyst. Provide detailed, factual information.'
              },
              {
                role: 'user',
                content: detailQuery
              }
            ],
            temperature: 0.2,
            top_p: 0.9,
            return_images: false,
            stream: false
          })
        });
        
        if (detailResponse.ok) {
          const detailData = await detailResponse.json();
          const details = detailData.choices[0].message.content;
          
          // Parse the detailed response
          return parseCompetitorDetails(name, details);
        }
        return null;
      } catch (error) {
        console.error(`Failed to get details for ${name}:`, error);
        return null;
      }
    });
    
    // Wait for all parallel requests to complete
    const competitorResults = await Promise.all(detailPromises);
    const competitors = competitorResults.filter(c => c !== null);
    
    console.log(`Found ${competitors.length} competitors with details`);
    console.log(`Additional competitors identified: ${additionalCompetitors.join(', ')}`);
    
    // If no competitors found, throw error
    if (competitors.length === 0) {
      throw new Error('Failed to extract competitor information from Perplexity response');
    }
    
    // Add the additional competitors as a property
    competitors.additionalCompetitors = additionalCompetitors;
    
    return competitors;
    
  } catch (error) {
    console.error('Perplexity API error:', error);
    throw error; // Propagate the error instead of hiding it
  }
}

// Extract competitor names from Perplexity response
function extractCompetitorNames(content) {
  const names = [];
  
  // Look for names in numbered lists with bold formatting
  const boldMatches = content.matchAll(/\d+\.\s*\*\*([^*]+)\*\*/g);
  for (const match of boldMatches) {
    const name = match[1].trim();
    // Extract just the company name before any dash or description
    const cleanName = name.split(/\s*[–—-]\s*/)[0].trim();
    if (cleanName && cleanName.length > 2) {
      names.push(cleanName);
    }
  }
  
  // Also look for patterns like "1. Company Name"
  if (names.length === 0) {
    const numberedMatches = content.matchAll(/\d+\.\s*([A-Z][A-Za-z0-9\s&.()]+?)(?:\s*[–—-]|\s+(?:is|offers|provides)|$)/g);
    for (const match of numberedMatches) {
      const name = match[1].trim();
      // Remove parenthetical additions
      const cleanName = name.replace(/\s*\([^)]+\)/g, '').trim();
      if (cleanName && cleanName.length > 2 && !cleanName.match(/^(The|Best|Top|Leading|Popular|Main|These)/i)) {
        names.push(cleanName);
      }
    }
  }
  
  // If still no names, try extracting from sentences
  if (names.length === 0) {
    // Look for "companies like X, Y, and Z" pattern
    const likeMatch = content.match(/companies?\s+(?:like|such as|including)\s+([^.]+)/i);
    if (likeMatch) {
      const companiesList = likeMatch[1];
      const companyNames = companiesList.split(/,|\sand\s/);
      companyNames.forEach(name => {
        const clean = name.trim().replace(/[*"]/g, '');
        if (clean && clean.length > 2) {
          names.push(clean);
        }
      });
    }
  }
  
  // Remove duplicates and return
  const uniqueNames = [...new Set(names)];
  console.log('Extracted competitor names:', uniqueNames);
  return uniqueNames;
}

// Parse detailed competitor information
function parseCompetitorDetails(name, content) {
  // Clean up markdown artifacts
  const cleanContent = content
    .replace(/\*\*/g, '') // Remove bold markers
    .replace(/\*/g, '') // Remove italic markers
    .replace(/\[(\d+)\]/g, '') // Remove reference markers like [1], [2]
    .replace(/##/g, '') // Remove headers
    .replace(/\n\s*\n/g, '\n'); // Remove extra line breaks
  
  const competitor = {
    name: name.replace(/\*\*/g, ''), // Clean name too
    description: '',
    pricing: 'Pricing information not available',
    strengths: [],
    weaknesses: [],
    targetMarket: 'General market',
    features: [],
    recentUpdates: []
  };
  
  // Extract description (usually in the first paragraph)
  const descMatch = cleanContent.match(/(?:overview|description|about|is a)[:\s]+([^.]+\.)/i);
  if (descMatch) {
    competitor.description = descMatch[1].trim();
  } else {
    // Take first sentence as description
    const firstSentence = cleanContent.match(/^[^.]+\./);
    if (firstSentence) {
      competitor.description = firstSentence[0].trim();
    }
  }
  
  // Extract pricing
  const priceMatches = content.match(/\$[\d,]+(?:\/\w+)?|\$[\d,]+-[\d,]+|Free|Freemium/gi);
  if (priceMatches && priceMatches.length > 0) {
    competitor.pricing = priceMatches.join(', ');
  }
  
  // Extract features (use cleanContent)
  const featureSection = cleanContent.match(/(?:features?|capabilities)[:\s]+([^]+?)(?:\n\n|\n\d\.)/i);
  if (featureSection) {
    const features = featureSection[1].split(/[•\-\n]/).filter(f => f.trim().length > 5);
    competitor.features = features.slice(0, 4).map(f => f.trim().replace(/[:]/g, ''));
  }
  
  // Extract strengths (use cleanContent)
  const strengthSection = cleanContent.match(/(?:strengths?|advantages?|pros?)[:\s]+([^]+?)(?:\n\n|\n\d\.)/i);
  if (strengthSection) {
    const strengths = strengthSection[1].split(/[•\-\n]/).filter(s => s.trim().length > 5);
    competitor.strengths = strengths.slice(0, 3).map(s => s.trim().replace(/[:]/g, ''));
  } else {
    // Default strengths based on common patterns
    if (cleanContent.toLowerCase().includes('popular')) competitor.strengths.push('Popular and trusted');
    if (cleanContent.toLowerCase().includes('easy')) competitor.strengths.push('Easy to use');
    if (cleanContent.toLowerCase().includes('integrate')) competitor.strengths.push('Good integrations');
  }
  
  // Extract weaknesses (use cleanContent)
  const weaknessSection = cleanContent.match(/(?:weaknesses?|limitations?|cons?)[:\s]+([^]+?)(?:\n\n|\n\d\.)/i);
  if (weaknessSection) {
    const weaknesses = weaknessSection[1].split(/[•\-\n]/).filter(w => w.trim().length > 5);
    competitor.weaknesses = weaknesses.slice(0, 3).map(w => w.trim().replace(/[:]/g, ''));
  } else {
    // Default weaknesses based on common patterns
    if (cleanContent.toLowerCase().includes('expensive')) competitor.weaknesses.push('Can be expensive');
    if (cleanContent.toLowerCase().includes('complex')) competitor.weaknesses.push('Complex for beginners');
    if (cleanContent.toLowerCase().includes('limited')) competitor.weaknesses.push('Limited features');
  }
  
  // Extract target market
  const marketMatch = content.match(/(?:target|market|customers?|users?)[:\s]+([^.]+)/i);
  if (marketMatch) {
    competitor.targetMarket = marketMatch[1].trim();
  }
  
  // Extract recent updates
  const recentMatch = content.match(/(?:recent|latest|new|update)[:\s]+([^.]+)/i);
  if (recentMatch) {
    competitor.recentUpdates.push(recentMatch[1].trim());
  }
  
  return competitor;
}

// Parse Perplexity response into structured competitor data (legacy, kept for compatibility)
function parsePerplexityResponse(content, context) {
  try {
    // Attempt to extract structured information from the response
    const competitors = [];
    
    // Split content into sections (assuming Perplexity returns numbered or bulleted list)
    const sections = content.split(/\d+\.|•|\n\n/).filter(s => s.trim().length > 50);
    
    for (let i = 0; i < Math.min(3, sections.length); i++) {
      const section = sections[i];
      
      // Extract competitor name (usually at the beginning)
      const nameMatch = section.match(/^([A-Z][A-Za-z0-9\s]+)(?:\:|,|-)/);
      const name = nameMatch ? nameMatch[1].trim() : `Competitor ${i + 1}`;
      
      // Extract pricing
      const priceMatch = section.match(/\$[\d,]+(?:\/\w+)?|\$[\d,]+-[\d,]+|Free|Freemium/i);
      const pricing = priceMatch ? priceMatch[0] : 'Pricing varies';
      
      // Extract strengths and weaknesses (look for keywords)
      const strengths = extractPoints(section, ['strength', 'advantage', 'feature', 'good', 'pro']);
      const weaknesses = extractPoints(section, ['weakness', 'limitation', 'con', 'issue', 'problem']);
      
      competitors.push({
        name,
        description: section.slice(0, 150).trim() + '...',
        pricing,
        strengths: strengths.slice(0, 3),
        weaknesses: weaknesses.slice(0, 3),
        targetMarket: extractTargetMarket(section)
      });
    }
    
    // If parsing fails, return at least some structured data
    if (competitors.length === 0) {
      return getMockCompetitors(context);
    }
    
    return competitors;
    
  } catch (error) {
    console.error('Error parsing Perplexity response:', error);
    return getMockCompetitors(context);
  }
}

// Helper function to extract bullet points
function extractPoints(text, keywords) {
  const points = [];
  const sentences = text.split(/[.!?]+/);
  
  for (const sentence of sentences) {
    const lower = sentence.toLowerCase();
    if (keywords.some(keyword => lower.includes(keyword))) {
      const cleaned = sentence.replace(/^[-•*]\s*/, '').trim();
      if (cleaned.length > 10 && cleaned.length < 100) {
        points.push(cleaned);
      }
    }
  }
  
  // If no points found with keywords, take first few short sentences
  if (points.length === 0) {
    for (const sentence of sentences) {
      const cleaned = sentence.replace(/^[-•*]\s*/, '').trim();
      if (cleaned.length > 10 && cleaned.length < 100) {
        points.push(cleaned);
        if (points.length >= 3) break;
      }
    }
  }
  
  return points;
}

// Extract target market from text
function extractTargetMarket(text) {
  const marketKeywords = ['enterprise', 'small business', 'startup', 'consumer', 'B2B', 'B2C', 'SMB'];
  for (const keyword of marketKeywords) {
    if (text.toLowerCase().includes(keyword.toLowerCase())) {
      return keyword.charAt(0).toUpperCase() + keyword.slice(1) + ' customers';
    }
  }
  return 'General market';
}

// Get mock competitors (fallback)
function getMockCompetitors(context) {
  const mockCompetitors = [
    {
      name: "Market Leader",
      description: "The established player with the largest market share",
      pricing: "$49-299/month",
      strengths: ["Brand recognition", "Feature-rich platform", "Enterprise integrations"],
      weaknesses: ["Complex user interface", "Expensive for small businesses", "Slow customer support"],
      targetMarket: "Enterprise customers"
    },
    {
      name: "Budget Alternative", 
      description: "Popular choice for cost-conscious buyers",
      pricing: "$19-99/month",
      strengths: ["Affordable pricing", "Simple to use", "Good template library"],
      weaknesses: ["Limited advanced features", "No API access", "Basic analytics only"],
      targetMarket: "Small businesses"
    },
    {
      name: "Innovation Challenger",
      description: "New player with modern approach",
      pricing: "$29-149/month",
      strengths: ["Modern UI/UX", "AI-powered features", "Fast performance"],
      weaknesses: ["Limited track record", "Fewer integrations", "Smaller team"],
      targetMarket: "Tech-savvy startups"
    }
  ];
  
  // Customize based on user's competitors if provided
  if (context.competitors) {
    const userCompetitors = context.competitors.split(',').map(c => c.trim());
    for (let i = 0; i < userCompetitors.length && i < mockCompetitors.length; i++) {
      mockCompetitors[i].name = userCompetitors[i];
    }
  }
  
  // Add additional competitors property
  mockCompetitors.additionalCompetitors = ["Emerging Startup", "Regional Player", "Open Source Alternative"];
  
  return mockCompetitors;
}

// Analyze competition with GPT-4
async function analyzeCompetition(context, competitors) {
  if (!openai) {
    console.log('Using fallback analysis (no OpenAI API key)');
    return generateFallbackAnalysis(context, competitors);
  }

  const prompt = `
    Analyze the competitive landscape for a startup with these details:
    - Product: ${context.product}
    - Target Customer: ${context.target}
    - Main Differentiator: ${context.differentiator}
    - Pricing: ${context.pricing}
    
    Competitors found:
    ${JSON.stringify(competitors, null, 2)}
    
    Provide strategic insights in these sections:
    
    ## Market Opportunities
    (2-3 specific opportunities based on competitor weaknesses and market gaps)
    
    ## Your Competitive Position
    (How you stack up against competitors, your unique advantages)
    
    ## Positioning Strategy
    (How to position yourself in the market for maximum impact)
    
    ## Key Risks to Address
    (2-3 main challenges you'll face)
    
    ## Go-to-Market Recommendations
    (Specific, actionable steps to launch successfully)
    
    Be specific and actionable. Focus on insights the founder can act on immediately.
  `;
  
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a competitive intelligence expert helping startups. Provide detailed but well-structured insights. Use clear sections and be specific."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });
    
    return completion.choices[0].message.content;
  } catch (error) {
    console.error('GPT-4 analysis failed:', error);
    return generateFallbackAnalysis(context, competitors);
  }
}

// Generate specific recommendations
async function generateRecommendations(context, competitors, analysis) {
  const recommendations = [];
  
  // Pricing recommendations
  const competitorPrices = extractPrices(competitors);
  if (context.pricing) {
    const userPrice = extractPrice(context.pricing);
    if (userPrice > 0 && competitorPrices.length > 0) {
      const avgCompetitorPrice = competitorPrices.reduce((a, b) => a + b, 0) / competitorPrices.length;
      
      if (userPrice < avgCompetitorPrice * 0.7) {
        recommendations.push({
          type: 'pricing',
          priority: 'high',
          title: 'Price disruption opportunity',
          description: 'Your pricing significantly undercuts competitors',
          action: 'Lead with price in marketing, emphasize value not "cheap"'
        });
      } else if (userPrice > avgCompetitorPrice * 1.3) {
        recommendations.push({
          type: 'pricing',
          priority: 'high',
          title: 'Premium positioning required',
          description: 'Your pricing is above market average',
          action: 'Emphasize premium features and superior support'
        });
      }
    }
  }
  
  // Feature recommendations based on differentiator
  recommendations.push({
    type: 'feature',
    priority: 'high', 
    title: 'Lead with your differentiator',
    description: `"${context.differentiator}" is your unique advantage`,
    action: 'Make this the hero message on your landing page'
  });
  
  // Market positioning based on competitors' weaknesses
  const commonWeaknesses = findCommonWeaknesses(competitors);
  if (commonWeaknesses.length > 0) {
    recommendations.push({
      type: 'positioning',
      priority: 'high',
      title: 'Address market pain points',
      description: `Competitors struggle with: ${commonWeaknesses.slice(0, 2).join(', ')}`,
      action: 'Build features and messaging that directly address these issues'
    });
  }
  
  // Target market recommendations
  recommendations.push({
    type: 'targeting',
    priority: 'medium',
    title: 'Focus on underserved segment',
    description: `${context.target} may be overlooked by enterprise-focused competitors`,
    action: 'Create targeted content, case studies, and pricing for this segment'
  });
  
  // Go-to-market
  recommendations.push({
    type: 'gtm',
    priority: 'high',
    title: 'Quick validation strategy',
    description: 'Test product-market fit before full launch',
    action: 'Launch on Product Hunt, get 100 beta users, iterate based on feedback'
  });
  
  // Competition-specific recommendations
  if (competitors[0].name.toLowerCase().includes('enterprise') || 
      competitors[0].targetMarket.toLowerCase().includes('enterprise')) {
    recommendations.push({
      type: 'strategy',
      priority: 'medium',
      title: 'David vs Goliath positioning',
      description: 'Position as the nimble alternative to slow enterprise tools',
      action: 'Emphasize speed, simplicity, and personal support'
    });
  }
  
  return recommendations;
}

// Find common weaknesses across competitors
function findCommonWeaknesses(competitors) {
  const weaknessCount = {};
  
  competitors.forEach(comp => {
    comp.weaknesses.forEach(weakness => {
      const key = weakness.toLowerCase();
      weaknessCount[key] = (weaknessCount[key] || 0) + 1;
    });
  });
  
  // Return weaknesses that appear in multiple competitors
  return Object.entries(weaknessCount)
    .filter(([_, count]) => count > 1)
    .map(([weakness, _]) => weakness)
    .slice(0, 3);
}

// Find market opportunities
function findOpportunities(analysis, competitors) {
  const opportunities = [];
  
  // Analyze competitor weaknesses for opportunities
  const commonWeaknesses = findCommonWeaknesses(competitors);
  
  if (commonWeaknesses.some(w => w.includes('complex') || w.includes('difficult'))) {
    opportunities.push({
      title: 'Simplicity gap',
      description: 'Competitors have complex interfaces - opportunity for intuitive design',
      impact: 'high'
    });
  }
  
  if (commonWeaknesses.some(w => w.includes('expensive') || w.includes('price'))) {
    opportunities.push({
      title: 'Price disruption',
      description: 'Market is overpriced - opportunity for affordable alternative',
      impact: 'high'
    });
  }
  
  if (commonWeaknesses.some(w => w.includes('support') || w.includes('slow'))) {
    opportunities.push({
      title: 'Support excellence',
      description: 'Poor support is common - differentiate with responsive help',
      impact: 'medium'
    });
  }
  
  if (commonWeaknesses.some(w => w.includes('integration') || w.includes('api'))) {
    opportunities.push({
      title: 'Integration advantage',
      description: 'Limited integrations in market - opportunity to connect everything',
      impact: 'medium'
    });
  }
  
  // Derive opportunities from actual data, no hardcoding
  
  // Opportunity from competitor count
  if (competitors.length < 3) {
    opportunities.push({
      title: 'Emerging market',
      description: 'Few direct competitors indicates untapped opportunity',
      impact: 'high'
    });
  } else if (competitors.length > 5) {
    opportunities.push({
      title: 'Proven demand',
      description: 'Multiple competitors validate market need',
      impact: 'medium'
    });
  }
  
  // Opportunity from missing features across competitors
  const allWeaknesses = {};
  competitors.forEach(c => {
    c.weaknesses?.forEach(w => {
      const key = w.toLowerCase();
      allWeaknesses[key] = (allWeaknesses[key] || 0) + 1;
    });
  });
  
  const topWeakness = Object.entries(allWeaknesses)
    .sort((a, b) => b[1] - a[1])[0];
    
  if (topWeakness && topWeakness[1] >= 2) {
    opportunities.push({
      title: 'Common gap in market',
      description: `Multiple competitors share weakness: ${topWeakness[0].substring(0, 50)}...`,
      impact: 'high'
    });
  }
  
  // Opportunity from pricing analysis
  const competitorPrices = extractPrices(competitors);
  if (competitorPrices.length > 0) {
    const avgPrice = competitorPrices.reduce((a, b) => a + b, 0) / competitorPrices.length;
    const userPrice = extractPrice(context.pricing);
    
    if (userPrice > 0 && userPrice < avgPrice * 0.7) {
      opportunities.push({
        title: 'Price disruption potential',
        description: `Significantly below market average of $${Math.round(avgPrice)}`,
        impact: 'high'
      });
    } else if (userPrice > avgPrice * 1.3) {
      opportunities.push({
        title: 'Premium positioning viable',
        description: `Market accepts higher pricing for superior value`,
        impact: 'medium'
      });
    }
  }
  
  return opportunities.slice(0, 5); // Return top 5 opportunities
}

// Utility functions
function extractPrices(competitors) {
  const prices = [];
  competitors.forEach(c => {
    const matches = c.pricing.match(/\$(\d+)/g);
    if (matches) {
      matches.forEach(match => {
        const price = parseInt(match.replace('$', ''));
        if (price > 0) prices.push(price);
      });
    }
  });
  return prices;
}

function extractPrice(priceString) {
  const match = priceString.match(/\$(\d+)/);
  return match ? parseInt(match[1]) : 0;
}

function generateFallbackAnalysis(context, competitors) {
  const competitorNames = competitors.map(c => c.name).join(', ');
  
  return `
## Market Opportunities
• Competitors (${competitorNames}) are complex/expensive for ${context.target}
• Your "${context.differentiator}" fills a clear gap
• At ${context.pricing}, you undercut market significantly

## Your Competitive Position
• Modern alternative to legacy tools
• Focus on ${context.target} exclusively
• Leverage speed and personal touch as advantages

## Positioning Strategy  
• Lead with simplicity and affordability
• Target underserved ${context.target} segment
• Emphasize founder-led support and rapid iteration

## Key Risks to Address
• Building trust against established brands
• Limited resources vs funded competitors
• Need for rapid market validation

## Go-to-Market Recommendations
• Launch on Product Hunt this week
• Get 100 beta users in your exact niche
• Create side-by-side comparison page
• Build in public to establish credibility
`;
}

// Generate critical questions founders should ask themselves
async function generateCriticalQuestions(context, competitors, analysis) {
  if (!openai) {
    // Fallback questions if no GPT-4
    return [
      {
        question: "Why will customers choose you over " + (competitors[0]?.name || "competitors") + "?",
        category: "differentiation",
        importance: "critical"
      },
      {
        question: "Can you survive 18 months with zero revenue?",
        category: "runway",
        importance: "critical"
      },
      {
        question: "What happens when a competitor copies your differentiator?",
        category: "moat",
        importance: "high"
      },
      {
        question: "Who specifically will pay " + context.pricing + " for this?",
        category: "customer",
        importance: "critical"
      },
      {
        question: "How will you get your first 100 customers?",
        category: "go-to-market",
        importance: "critical"
      }
    ];
  }

  const prompt = `
    Context:
    - Product: ${context.product}
    - Target: ${context.target}
    - Differentiator: ${context.differentiator}
    - Pricing: ${context.pricing}
    - Main Competitors: ${competitors.map(c => c.name).join(', ')}
    
    Generate 7 critical questions this founder MUST answer before building.
    Make them specific to their context, not generic.
    
    Format each as:
    [CATEGORY]: Question text
    
    Categories: differentiation, moat, pricing, customer, runway, go-to-market, competitive advantage
    
    Questions should be hard-hitting and specific to their situation.
  `;
  
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a tough startup advisor. Generate critical questions that expose weaknesses and force deep thinking."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 400
    });
    
    const response = completion.choices[0].message.content;
    const questions = [];
    
    // Parse response into questions
    const lines = response.split('\n').filter(line => line.trim());
    lines.forEach(line => {
      const match = line.match(/\[([^\]]+)\]:\s*(.+)/);
      if (match) {
        questions.push({
          question: match[2].trim(),
          category: match[1].toLowerCase(),
          importance: ['differentiation', 'customer', 'runway', 'go-to-market'].includes(match[1].toLowerCase()) ? 'critical' : 'high'
        });
      } else if (line.includes('?')) {
        // Fallback for questions without category
        questions.push({
          question: line.replace(/^\d+\.\s*/, '').trim(),
          category: 'general',
          importance: 'high'
        });
      }
    });
    
    return questions.slice(0, 7);
    
  } catch (error) {
    console.error('Question generation failed:', error);
    // Return fallback questions
    return [
      {
        question: `How will you beat ${competitors[0]?.name || 'established players'} with their resources?`,
        category: "competition",
        importance: "critical"
      },
      {
        question: "What stops someone from copying your idea tomorrow?",
        category: "moat",
        importance: "critical"
      },
      {
        question: `Why would ${context.target} pay ${context.pricing} for this?`,
        category: "pricing",
        importance: "critical"
      },
      {
        question: "How do you acquire customers profitably?",
        category: "unit economics",
        importance: "high"
      },
      {
        question: "What's your plan when you run out of money?",
        category: "runway",
        importance: "critical"
      }
    ];
  }
}

// Calculate success rating based on various factors
function calculateSuccessRating(context, competitors, analysis) {
  let score = 50; // Start neutral
  
  // Differentiation factor
  if (context.differentiator && context.differentiator.length > 20) {
    score += 10; // Has clear differentiator
  }
  
  // Pricing factor
  const userPrice = extractPrice(context.pricing);
  const competitorPrices = extractPrices(competitors);
  if (competitorPrices.length > 0) {
    const avgPrice = competitorPrices.reduce((a, b) => a + b, 0) / competitorPrices.length;
    if (userPrice > 0 && userPrice < avgPrice * 0.7) {
      score += 10; // Price advantage
    } else if (userPrice > avgPrice * 1.5) {
      score -= 10; // Overpriced
    }
  }
  
  // Market size factor
  if (context.target && context.target.toLowerCase().includes('enterprise')) {
    score += 5; // Larger market
  } else if (context.target && context.target.toLowerCase().includes('individual')) {
    score -= 5; // Harder to monetize
  }
  
  // Competition intensity
  if (competitors.length >= 3) {
    score -= 10; // Crowded market
  }
  
  // Competitor weaknesses opportunity
  const commonWeaknesses = findCommonWeaknesses(competitors);
  if (commonWeaknesses.length >= 2) {
    score += 15; // Clear opportunity
  }
  
  // AI/Tech advantage
  if (context.product && context.product.toLowerCase().includes('ai')) {
    score += 5; // Tech advantage
  }
  
  // Ensure score is between 0 and 100
  score = Math.max(0, Math.min(100, score));
  
  return {
    score,
    level: score >= 70 ? 'high' : score >= 40 ? 'moderate' : 'challenging',
    factors: {
      differentiation: context.differentiator ? 'positive' : 'negative',
      pricing: userPrice > 0 ? 'analyzed' : 'unknown',
      competition: competitors.length >= 3 ? 'intense' : 'moderate',
      marketOpportunity: commonWeaknesses.length >= 2 ? 'strong' : 'limited'
    }
  };
}

// Generate brutal truth assessment using GPT-4
async function generateBrutalTruth(context, competitors, successRating) {
  if (!openai) {
    // Fallback if no GPT-4
    return {
      truths: [{
        type: 'reality_check',
        message: `With a ${successRating.score}% success rating, you're facing an uphill battle. Most startups in your position fail within 6 months.`,
        severity: 'high'
      }],
      hardTruth: successRating.score < 50 
        ? "This idea needs major work. Talk to 50 customers before writing any code."
        : "You have potential but execution is everything. Can you outwork everyone?",
      silverLining: "At least you're getting honest feedback now instead of after burning through savings.",
      advice: "Stop seeking validation. Start building a prototype and get real user feedback."
    };
  }

  const prompt = `
    Context:
    - Product: ${context.product}
    - Target: ${context.target}
    - Differentiator: ${context.differentiator}
    - Pricing: ${context.pricing}
    - Success Rating: ${successRating.score}%
    - Competitors: ${competitors.map(c => c.name).join(', ')}
    
    Give a BRUTAL, honest assessment. Be harsh but constructive. Include:
    
    1. Three harsh truths about their idea (be specific to their context)
    2. The hard truth - one sentence reality check
    3. Silver lining - something genuinely positive
    4. Direct advice - what they should do RIGHT NOW
    
    Be brutally honest like a tough-love mentor. No sugarcoating.
  `;
  
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a brutally honest startup advisor. Give harsh but valuable truth. Be specific, not generic."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.8,
      max_tokens: 500
    });
    
    const response = completion.choices[0].message.content;
    
    // Parse the response into structured format
    const truths = [];
    const truthMatches = response.match(/(?:1\.|truth|reality)[\s:]+([^2.]+)/i);
    if (truthMatches) {
      const items = truthMatches[1].split(/\n/).filter(t => t.trim().length > 10);
      items.forEach(item => {
        truths.push({
          type: 'reality_check',
          message: item.trim(),
          severity: 'high'
        });
      });
    }
    
    const hardTruthMatch = response.match(/(?:hard truth|reality check|bottom line)[\s:]+([^.]+\.)/i);
    const hardTruth = hardTruthMatch ? hardTruthMatch[1].trim() : "Your idea needs serious work before it's viable.";
    
    const silverMatch = response.match(/(?:silver lining|good news|positive)[\s:]+([^.]+\.)/i);
    const silverLining = silverMatch ? silverMatch[1].trim() : "You're asking the right questions early.";
    
    const adviceMatch = response.match(/(?:advice|should do|next step|right now)[\s:]+([^.]+\.)/i);
    const advice = adviceMatch ? adviceMatch[1].trim() : "Talk to 10 potential customers this week.";
    
    return {
      truths: truths.slice(0, 3),
      hardTruth,
      silverLining,
      advice
    };
    
  } catch (error) {
    console.error('Brutal truth generation failed:', error);
    // Return fallback
    return {
      truths: [{
        type: 'reality_check',
        message: `Reality check: ${successRating.score}% success rate means you're more likely to fail than succeed.`,
        severity: 'high'
      }],
      hardTruth: "Most startups like yours fail. What makes you different?",
      silverLining: "At least you're validating before building.",
      advice: "Talk to customers, not advisors. Build something minimal this week."
    };
  }
}

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'LaunchLens',
    apis: {
      openai: !!openai,
      perplexity: !!process.env.PERPLEXITY_API_KEY
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 LaunchLens server running on port ${PORT}`);
  console.log(`📊 Competitive intelligence for startups`);
  console.log(`🔗 http://localhost:${PORT}`);
  console.log('');
  console.log('API Status:');
  console.log(`  OpenAI: ${openai ? '✅ Connected' : '❌ No API key'}`);
  console.log(`  Perplexity: ${process.env.PERPLEXITY_API_KEY ? '✅ Connected' : '❌ No API key'}`);
});