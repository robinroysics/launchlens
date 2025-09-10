import dotenv from 'dotenv';

dotenv.config();

const marketCache = new Map();

export async function analyzeMarketSize(idea) {
  const cacheKey = `market:${idea.toLowerCase().trim()}`;
  const cached = marketCache.get(cacheKey);
  
  if (cached && cached.timestamp > Date.now() - 7 * 24 * 60 * 60 * 1000) {
    return cached.data;
  }

  const perplexityApiKey = process.env.PERPLEXITY_API_KEY;
  
  if (!perplexityApiKey) {
    return {
      marketSize: 'Unknown',
      growthRate: 'Unknown',
      funding: 'Unknown',
      confidence: 'low'
    };
  }

  try {
    const query = `What is the market size, growth rate (CAGR), and recent funding activity for: ${idea}
    Provide specific numbers:
    - Total addressable market (TAM) in USD
    - Annual growth rate percentage
    - Recent funding rounds in this space (last 2 years)
    Be concise and specific with numbers.`;
    
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perplexityApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [{ role: 'user', content: query }],
        temperature: 0.1,
        max_tokens: 500
      })
    });

    if (!response.ok) throw new Error('Perplexity API error');

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    const marketSize = extractMarketSize(content);
    const growthRate = extractGrowthRate(content);
    const funding = extractFunding(content);
    
    const result = {
      marketSize,
      growthRate,
      funding,
      confidence: (marketSize !== 'Unknown' && growthRate !== 'Unknown') ? 'high' : 'medium',
      rawData: content
    };
    
    marketCache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });
    
    return result;
    
  } catch (error) {
    console.error('Market analysis failed:', error);
    return {
      marketSize: 'Unknown',
      growthRate: 'Unknown',
      funding: 'Unknown',
      confidence: 'low'
    };
  }
}

export async function analyzeCustomerPain(idea, competitors) {
  const cacheKey = `pain:${idea.toLowerCase().trim()}`;
  const cached = marketCache.get(cacheKey);
  
  if (cached && cached.timestamp > Date.now() - 3 * 24 * 60 * 60 * 1000) {
    return cached.data;
  }

  const perplexityApiKey = process.env.PERPLEXITY_API_KEY;
  
  if (!perplexityApiKey) {
    return {
      painLevel: 5,
      unmetNeeds: [],
      searchVolume: 'Unknown'
    };
  }

  try {
    const competitorNames = competitors.slice(0, 3).map(c => c.name).join(', ');
    const query = `What are the main customer complaints and unmet needs for ${idea}?
    ${competitorNames ? `Consider existing solutions like ${competitorNames}.` : ''}
    List:
    - Top 3 customer pain points
    - Search volume for alternatives
    - Common feature requests`;
    
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perplexityApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [{ role: 'user', content: query }],
        temperature: 0.1,
        max_tokens: 400
      })
    });

    if (!response.ok) throw new Error('Perplexity API error');

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    const unmetNeeds = extractUnmetNeeds(content);
    const painLevel = calculatePainLevel(content);
    
    const result = {
      painLevel,
      unmetNeeds,
      searchVolume: extractSearchVolume(content),
      rawData: content
    };
    
    marketCache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });
    
    return result;
    
  } catch (error) {
    console.error('Pain analysis failed:', error);
    return {
      painLevel: 5,
      unmetNeeds: [],
      searchVolume: 'Unknown'
    };
  }
}

export async function analyzeCompetitorQuality(competitors) {
  if (!competitors || competitors.length === 0) {
    return {
      avgFunding: 'Unknown',
      satisfaction: 5,
      marketConcentration: 'Unknown'
    };
  }

  const perplexityApiKey = process.env.PERPLEXITY_API_KEY;
  
  if (!perplexityApiKey) {
    return {
      avgFunding: 'Unknown',
      satisfaction: 5,
      marketConcentration: 'Unknown'
    };
  }

  try {
    const topCompetitors = competitors.slice(0, 3).map(c => c.name).join(', ');
    const query = `For these companies: ${topCompetitors}
    Provide:
    - Average funding raised (in USD)
    - Customer satisfaction level (general sentiment)
    - Market share distribution (concentrated or fragmented)`;
    
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perplexityApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [{ role: 'user', content: query }],
        temperature: 0.1,
        max_tokens: 300
      })
    });

    if (!response.ok) throw new Error('Perplexity API error');

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    return {
      avgFunding: extractFunding(content),
      satisfaction: calculateSatisfaction(content),
      marketConcentration: extractConcentration(content),
      rawData: content
    };
    
  } catch (error) {
    console.error('Competitor quality analysis failed:', error);
    return {
      avgFunding: 'Unknown',
      satisfaction: 5,
      marketConcentration: 'Unknown'
    };
  }
}

function extractMarketSize(text) {
  const patterns = [
    /\$[\d.]+\s*[BbMm]illion/i,
    /\$[\d.]+\s*[TtBbMm]/i,
    /USD\s*[\d.]+\s*[BbMm]illion/i,
    /market.*?(\$[\d.]+\s*[BbMm])/i,
    /TAM.*?(\$[\d.]+\s*[BbMm])/i,
    /valued at.*?(\$[\d.]+\s*[BbMm])/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[0];
  }
  
  return 'Unknown';
}

function extractGrowthRate(text) {
  const patterns = [
    /(\d+\.?\d*)\s*%\s*(?:CAGR|annual growth|growth rate)/i,
    /CAGR\s*(?:of\s*)?(\d+\.?\d*)\s*%/i,
    /growing\s*(?:at\s*)?(\d+\.?\d*)\s*%/i,
    /(\d+\.?\d*)\s*%\s*(?:yearly|annually)/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1] + '%';
  }
  
  return 'Unknown';
}

function extractFunding(text) {
  const patterns = [
    /\$[\d.]+\s*[BbMm]illion\s*(?:in funding|raised)/i,
    /raised\s*\$[\d.]+\s*[BbMm]/i,
    /funding.*?\$[\d.]+\s*[BbMm]/i,
    /\$[\d.]+[BbMm]\s*(?:Series [A-E]|round)/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[0];
  }
  
  if (text.toLowerCase().includes('bootstrap') || text.toLowerCase().includes('self-funded')) {
    return 'Bootstrapped';
  }
  
  return 'Unknown';
}

function extractUnmetNeeds(text) {
  const needs = [];
  const lines = text.split('\n');
  
  for (const line of lines) {
    const cleaned = line.replace(/^[-*•]\s*/, '').trim();
    if (cleaned.length > 10 && cleaned.length < 100) {
      if (!cleaned.toLowerCase().includes('here are') && 
          !cleaned.toLowerCase().includes('list of')) {
        needs.push(cleaned);
      }
    }
  }
  
  return needs.slice(0, 3);
}

function calculatePainLevel(text) {
  const painKeywords = ['frustrat', 'difficult', 'pain', 'problem', 'issue', 'complain', 
                        'lack', 'missing', 'need', 'want', 'wish', 'expensive', 'slow'];
  
  let score = 5;
  const lowerText = text.toLowerCase();
  
  for (const keyword of painKeywords) {
    if (lowerText.includes(keyword)) score++;
  }
  
  return Math.min(10, score);
}

function extractSearchVolume(text) {
  const patterns = [
    /(\d+[KkMm]?)\s*(?:searches|queries)/i,
    /search volume.*?(\d+[KkMm]?)/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1];
  }
  
  return 'Unknown';
}

function calculateSatisfaction(text) {
  const positive = ['satisfied', 'happy', 'love', 'excellent', 'great', 'positive'];
  const negative = ['frustrated', 'unhappy', 'poor', 'bad', 'terrible', 'negative'];
  
  const lowerText = text.toLowerCase();
  let score = 5;
  
  for (const word of positive) {
    if (lowerText.includes(word)) score++;
  }
  
  for (const word of negative) {
    if (lowerText.includes(word)) score--;
  }
  
  return Math.max(1, Math.min(10, score));
}

function extractConcentration(text) {
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('monopoly') || lowerText.includes('dominant')) {
    return 'Highly concentrated';
  } else if (lowerText.includes('fragmented') || lowerText.includes('many players')) {
    return 'Fragmented';
  } else if (lowerText.includes('few leaders') || lowerText.includes('oligopoly')) {
    return 'Moderately concentrated';
  }
  
  return 'Unknown';
}

export function calculateMarketScore(marketData, competitorData, painData) {
  let marketOpportunityScore = 5;
  let competitionScore = 5;
  let entryFeasibilityScore = 5;
  
  if (marketData.marketSize !== 'Unknown') {
    const sizeValue = parseMarketValue(marketData.marketSize);
    if (sizeValue > 10000) marketOpportunityScore = 10;
    else if (sizeValue > 1000) marketOpportunityScore = 8;
    else if (sizeValue > 100) marketOpportunityScore = 6;
    else if (sizeValue > 10) marketOpportunityScore = 4;
    else marketOpportunityScore = 2;
  }
  
  if (marketData.growthRate !== 'Unknown') {
    const growth = parseFloat(marketData.growthRate);
    if (growth > 30) marketOpportunityScore = Math.min(10, marketOpportunityScore + 2);
    else if (growth > 15) marketOpportunityScore = Math.min(10, marketOpportunityScore + 1);
    else if (growth < 5) marketOpportunityScore = Math.max(1, marketOpportunityScore - 2);
  }
  
  const competitorCount = competitorData.length || 0;
  if (competitorCount === 0) competitionScore = 3;
  else if (competitorCount <= 2) competitionScore = 5;
  else if (competitorCount <= 5) competitionScore = 8;
  else if (competitorCount <= 10) competitionScore = 6;
  else competitionScore = 3;
  
  entryFeasibilityScore = painData.painLevel || 5;
  
  if (competitorData.marketConcentration === 'Highly concentrated') {
    entryFeasibilityScore = Math.max(1, entryFeasibilityScore - 3);
  } else if (competitorData.marketConcentration === 'Fragmented') {
    entryFeasibilityScore = Math.min(10, entryFeasibilityScore + 2);
  }
  
  const weightedScore = (
    marketOpportunityScore * 0.4 +
    competitionScore * 0.3 +
    entryFeasibilityScore * 0.3
  );
  
  return {
    overall: Math.round(weightedScore * 10) / 10,
    marketOpportunity: marketOpportunityScore,
    competition: competitionScore,
    entryFeasibility: entryFeasibilityScore,
    verdict: weightedScore >= 7 ? 'YES' : weightedScore >= 4 ? 'MAYBE' : 'NO'
  };
}

function parseMarketValue(marketStr) {
  const match = marketStr.match(/\$([\d.]+)\s*([BbMmTt])/);
  if (!match) return 0;
  
  const value = parseFloat(match[1]);
  const unit = match[2].toLowerCase();
  
  if (unit === 't') return value * 1000000;
  if (unit === 'b') return value * 1000;
  if (unit === 'm') return value;
  return value;
}