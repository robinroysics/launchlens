import dotenv from 'dotenv';
import OpenAI from 'openai';
import { analyzeMarketSize, analyzeCustomerPain, analyzeCompetitorQuality, calculateMarketScore } from './market-analyzer.js';
import config from './config.js';

dotenv.config();

function getOpenAIClient(modelOverride = null) {
  const apiKey = config.getOpenAIKey();
  if (!apiKey) {
    throw new Error('OpenAI API key not configured. Run: launchlens config set openai-api-key <your-key>');
  }
  return new OpenAI({ apiKey });
}

const competitorCache = new Map();

export async function findCompetitors(idea) {
  const perplexityApiKey = config.getPerplexityKey();
  
  if (!perplexityApiKey) {
    return [
      { name: "Existing Solution A", description: "Current market leader" },
      { name: "Existing Solution B", description: "Popular alternative" }
    ];
  }

  const cacheKey = idea.toLowerCase().trim().replace(/\s+/g, ' ');
  const cached = competitorCache.get(cacheKey);
  
  if (cached && cached.timestamp > Date.now() - 24 * 60 * 60 * 1000) {
    return cached.data;
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
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      throw new Error('Perplexity API error');
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    const competitors = [];
    const lines = content.split('\n');
    
    for (const line of lines) {
      const cleaned = line.replace(/^\d+\.\s*/, '').replace(/\*\*/g, '').replace(/\[\d+\]/g, '').trim();
      
      if (cleaned.length > 10 && !cleaned.toLowerCase().includes('here are') && !cleaned.toLowerCase().includes('list of')) {
        const parts = cleaned.split(/[-–:]/);
        if (parts.length >= 2) {
          const name = parts[0].trim();
          if (name.length < 50) {
            competitors.push({
              name: name,
              description: parts.slice(1).join('-').trim()
            });
          }
        }
      }
    }
    
    const result = competitors.slice(0, 5);
    
    competitorCache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });
    
    return result;
    
  } catch (error) {
    console.error('Competitor search failed:', error);
    return [
      { name: "Unknown Competitor", description: "Failed to load competitors" }
    ];
  }
}

async function makeDetailedDecision(idea, competitors, marketData, painData, competitorQuality, scores, roastMode = false, modelOverride = null) {
  let openai;
  try {
    openai = getOpenAIClient(modelOverride);
  } catch (error) {
    if (error.message.includes('API key')) {
      return {
        verdict: scores.verdict,
        reasons: [
          `Market opportunity score: ${scores.marketOpportunity}/10`,
          `Competition score: ${scores.competition}/10`,
          `Entry feasibility: ${scores.entryFeasibility}/10`
        ],
        alternatives: scores.verdict === 'NO' ? [
          "Focus on a specific underserved niche",
          "Partner with existing players instead of competing",
          "Wait for better market timing or technology"
        ] : [],
        strategy: scores.verdict === 'YES' ? 
          "Focus on differentiation and rapid market entry" : 
          "Consider pivoting or refining the concept"
      };
    }
    throw error;
  }

  const prompt = `Analyze this startup opportunity with detailed market data:
    
    Idea: ${idea}
    
    Market Analysis:
    - Market Size: ${marketData.marketSize}
    - Growth Rate: ${marketData.growthRate}
    - Recent Funding: ${marketData.funding}
    
    Competition:
    - Number of Competitors: ${competitors.length}
    - Top Competitors: ${competitors.slice(0, 3).map(c => c.name).join(', ')}
    - Market Concentration: ${competitorQuality.marketConcentration}
    - Customer Satisfaction: ${competitorQuality.satisfaction}/10
    
    Customer Pain:
    - Pain Level: ${painData.painLevel}/10
    - Unmet Needs: ${painData.unmetNeeds.join('; ')}
    
    Calculated Scores:
    - Market Opportunity: ${scores.marketOpportunity}/10
    - Competition Score: ${scores.competition}/10 (note: 8/10 means optimal competition, not too few or too many)
    - Entry Feasibility: ${scores.entryFeasibility}/10
    - Overall Score: ${scores.overall}/10
    - Verdict: ${scores.verdict}
    
    Based on this analysis, provide:
    
    1. Three specific reasons supporting the ${scores.verdict} verdict (considering the scores)
    2. If NO or MAYBE: Three ultra-specific pivot alternatives
    3. If YES: A specific market entry strategy
    4. Key risk factors to consider
    
    Respond in JSON format:
    {
      "reasons": ["reason 1", "reason 2", "reason 3"],
      "alternatives": ["alt 1", "alt 2", "alt 3"],
      "strategy": "specific strategy",
      "risks": ["risk 1", "risk 2"],
      "pivotExamples": [{"company": "name", "story": "brief story"}]
    }
    
    ${roastMode ? 'Be BRUTALLY honest and sarcastic in your reasons!' : 'Be direct and analytical.'}`;
  
  try {
    const model = modelOverride || config.getModel();
    const completion = await openai.chat.completions.create({
      model: model,
      messages: [
        {
          role: "system",
          content: "You are an expert startup analyst with access to detailed market data. Provide data-driven insights."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    });
    
    const response = completion.choices[0].message.content;
    
    try {
      let cleanedResponse = response;
      if (response.includes('```json')) {
        cleanedResponse = response.replace(/```json\s*/, '').replace(/```\s*$/, '');
      } else if (response.includes('```')) {
        cleanedResponse = response.replace(/```\s*/g, '');
      }
      
      return JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error('JSON parsing failed:', parseError);
      return {
        reasons: [
          `Market opportunity: ${scores.marketOpportunity}/10`,
          `Competition balance: ${scores.competition}/10`,
          `Entry feasibility: ${scores.entryFeasibility}/10`
        ],
        alternatives: [],
        strategy: "Analyze the scores to determine your approach",
        risks: ["Market data may be approximate"]
      };
    }
  } catch (error) {
    console.error('GPT analysis failed:', error);
    return {
      reasons: [
        `Scoring shows ${scores.verdict} with ${scores.overall}/10 overall`,
        `Market opportunity rated ${scores.marketOpportunity}/10`,
        `Competition balance at ${scores.competition}/10`
      ],
      alternatives: [],
      strategy: "Use the scores to guide your decision"
    };
  }
}

export async function makeDecision(idea, competitors, roastMode = false, modelOverride = null) {
  let openai;
  try {
    openai = getOpenAIClient(modelOverride);
  } catch (error) {
    if (error.message.includes('API key')) {
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
        alternatives: hasCompetitors 
          ? [
              "Focus on one specific underserved segment like freelancers or students",
              "Build an integration for existing tools instead of standalone product",
              "Target a specific industry vertical with unique requirements"
            ]
          : [
              "Start with a landing page and get 100 email signups first",
              "Interview 20 potential customers to validate the problem exists",
              "Build a simple MVP and test with 10 beta users"
            ],
        pivotExamples: hasCompetitors
          ? [
              { company: "Segment", story: "Pivoted from classroom tool to customer data platform" },
              { company: "Shopify", story: "Started as snowboard shop, became e-commerce platform" },
              { company: "YouTube", story: "Dating site that pivoted to video sharing" }
            ]
          : []
      };
    }
    throw error;
  }

  const prompt = `Analyze this startup idea for viability:
    
    Idea: ${idea}
    
    Existing competitors found: ${competitors.map(c => c.name).join(', ')}
    
    Give a clear YES or NO decision for whether this is worth pursuing.
    
    Respond in this exact JSON format:
    {
      "verdict": "YES" or "NO",
      "reasons": ["reason 1", "reason 2", "reason 3"],
      "alternatives": ["specific pivot 1", "specific pivot 2", "specific pivot 3"],
      "pivotExamples": [
        {"company": "Company Name", "story": "Brief story of their pivot"},
        {"company": "Company Name", "story": "Brief story of their pivot"},
        {"company": "Company Name", "story": "Brief story of their pivot"}
      ]
    }
    
    Be direct and honest. Consider:
    - Is the market already saturated?
    - Is there a real problem being solved?
    - Can a small team compete here?
    - Is the idea specific enough?
    
    Keep reasons under 15 words each.${roastMode ? '\n    IMPORTANT: Make your reasons SAVAGE and SARCASTIC. Examples of good roast reasons:\n    - "Another todo app? How groundbreaking! Nobel Prize incoming!"\n    - "Because what the world needs is todo app #10,000"\n    - "Wow, such innovation! Nobody has EVER thought of this!"\n    - "Congratulations on the most boring idea of 2024"' : ''}
    
    For alternatives (only if NO), provide 3 ULTRA-SPECIFIC pivots. Examples of good specificity:
    - "Build exclusively for Shopify stores selling vintage clothing"
    - "Focus only on React component testing, not general unit tests"
    - "Target dental practices in rural areas under 50k population"
    - "Create a Chrome extension just for Gmail power users"
    - "Serve only B2B SaaS companies with 10-50 employees"
    
    BAD vague alternatives to avoid:
    - "Focus on a niche market"
    - "Target specific industry"
    - "Build for different platform"
    
    For pivotExamples (only if NO), provide 3 real companies that successfully pivoted from failure.
    Keep pivot stories under 20 words each.`;
  
  try {
    const systemPrompt = roastMode 
      ? "You are the most brutally honest, sarcastic startup validator. You're TIRED of terrible ideas. Be SAVAGE. Mock and ridicule bad ideas mercilessly. Use humor, sarcasm, and devastating one-liners. Think Gordon Ramsay but for startups. Examples: 'Another todo app? How revolutionary!', 'Pet social media? Because dogs really need more screen time', 'Wow, nobody has EVER thought of that before'. Default to NO unless it's absolutely brilliant."
      : "You are a startup validator. Give clear YES/NO decisions with brief reasons. Be harsh but fair.";
    
    const model = modelOverride || config.getModel();
    const completion = await openai.chat.completions.create({
      model: model,
      messages: [
        {
          role: "system",
          content: systemPrompt
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
    
    try {
      let cleanedResponse = response;
      if (response.includes('```json')) {
        cleanedResponse = response.replace(/```json\s*/, '').replace(/```\s*$/, '');
      } else if (response.includes('```')) {
        cleanedResponse = response.replace(/```\s*/g, '');
      }
      
      const decision = JSON.parse(cleanedResponse);
      return decision;
    } catch (parseError) {
      console.error('JSON parsing failed:', parseError);
      const isYes = response.toLowerCase().includes('"yes"') || 
                    response.toLowerCase().includes('verdict": "yes');
      
      return {
        verdict: isYes ? "YES" : "NO",
        reasons: [
          "Market analysis complete",
          "Competition level assessed",
          "Viability determined"
        ],
        alternatives: isYes ? [] : [
          "Refine your idea to be more specific",
          "Focus on a particular niche or user segment",
          "Consider building a simpler MVP first"
        ],
        pivotExamples: isYes ? [] : [
          { company: "Netflix", story: "DVD rental by mail to streaming giant" },
          { company: "Nokia", story: "Paper mill to telecommunications leader" },
          { company: "Nintendo", story: "Playing cards to video game empire" }
        ]
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
      alternatives: [
        "Start with customer interviews before building",
        "Create a landing page to test market interest",
        "Join relevant communities to understand the problem better"
      ],
      pivotExamples: []
    };
  }
}

export async function validateIdea(idea, roastMode = false, modelOverride = null) {
  if (!idea || idea.trim().length < 10) {
    throw new Error('Please describe your idea (at least 10 characters)');
  }

  const competitors = await findCompetitors(idea);
  const decision = await makeDecision(idea, competitors, roastMode, modelOverride);
  
  return {
    success: true,
    decision: decision.verdict,
    reasons: decision.reasons,
    competitors: competitors,
    alternatives: decision.alternatives || [decision.alternative],
    pivotExamples: decision.pivotExamples || []
  };
}

export async function validateIdeaDetailed(idea, roastMode = false, modelOverride = null) {
  if (!idea || idea.trim().length < 10) {
    throw new Error('Please describe your idea (at least 10 characters)');
  }

  console.log('Starting detailed analysis...');
  
  const [competitors, marketData, painData, competitorQuality] = await Promise.all([
    findCompetitors(idea),
    analyzeMarketSize(idea),
    findCompetitors(idea).then(comps => analyzeCustomerPain(idea, comps)),
    findCompetitors(idea).then(comps => analyzeCompetitorQuality(comps))
  ]);
  
  const scores = calculateMarketScore(marketData, competitors, painData);
  
  const enhancedDecision = await makeDetailedDecision(
    idea, 
    competitors, 
    marketData, 
    painData, 
    competitorQuality,
    scores,
    roastMode,
    modelOverride
  );
  
  return {
    success: true,
    decision: scores.verdict,
    scores: {
      overall: scores.overall,
      breakdown: {
        marketOpportunity: scores.marketOpportunity,
        competition: scores.competition,
        entryFeasibility: scores.entryFeasibility
      }
    },
    marketAnalysis: {
      size: marketData.marketSize,
      growth: marketData.growthRate,
      funding: marketData.funding
    },
    customerPain: {
      level: painData.painLevel,
      unmetNeeds: painData.unmetNeeds
    },
    competitorAnalysis: {
      count: competitors.length,
      quality: competitorQuality.satisfaction,
      concentration: competitorQuality.marketConcentration,
      competitors: competitors
    },
    reasons: enhancedDecision.reasons,
    alternatives: enhancedDecision.alternatives || [],
    pivotExamples: enhancedDecision.pivotExamples || [],
    strategy: enhancedDecision.strategy
  };
}