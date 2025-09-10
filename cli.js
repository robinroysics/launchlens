#!/usr/bin/env node

import { validateIdea, validateIdeaDetailed } from './lib/validator.js';
import { readFileSync } from 'fs';
import config from './lib/config.js';

const args = process.argv.slice(2);

function printHelp() {
  console.log(`
LaunchLens CLI - Quick Startup Idea Validation

Usage:
  launchlens <idea>                    Validate a single idea
  launchlens --file <path>              Validate ideas from file (one per line)
  launchlens --json <idea>              Output in JSON format
  launchlens --roast <idea>             Enable roast mode (extra harsh)
  launchlens --detailed <idea>          Detailed analysis with market scores
  launchlens --model <model> <idea>     Use specific AI model
  launchlens --help                     Show this help

Configuration Commands:
  launchlens config set <key> <value>   Set configuration value
  launchlens config get <key>           Get configuration value
  launchlens config list                List all configuration

Examples:
  launchlens "AI-powered todo app for developers"
  launchlens --json "marketplace for local tutors"
  launchlens --roast "uber for dogs"
  launchlens --detailed "AI code review tool"
  launchlens --model gpt-4 "AI code review tool"
  launchlens --file ideas.txt
  launchlens config set openai-api-key sk-...
  launchlens config set model gpt-4
  launchlens config list

Configuration Keys:
  openai-api-key       OpenAI API key for GPT analysis
  perplexity-api-key   Perplexity API key for competitor search
  model                AI model to use (gpt-4, gpt-4-turbo-preview, gpt-3.5-turbo, gpt-3.5-turbo-16k)

Environment Variables (fallback if not configured):
  OPENAI_API_KEY       OpenAI API key
  PERPLEXITY_API_KEY   Perplexity API key
`);
}

function formatOutput(result, json = false, detailed = false) {
  if (json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  
  if (detailed && result.scores) {
    formatDetailedOutput(result);
    return;
  }

  const verdictColor = result.decision === 'YES' ? '\x1b[32m' : 
                       result.decision === 'MAYBE' ? '\x1b[33m' : '\x1b[31m';
  const reset = '\x1b[0m';
  
  console.log('\n' + '='.repeat(60));
  console.log(`${verdictColor}VERDICT: ${result.decision}${reset}`);
  console.log('='.repeat(60));
  
  console.log('\n📊 REASONS:');
  result.reasons.forEach((reason, i) => {
    console.log(`  ${i + 1}. ${reason}`);
  });
  
  if (result.competitors && result.competitors.length > 0) {
    console.log('\n🏢 EXISTING COMPETITORS:');
    result.competitors.forEach(comp => {
      console.log(`  • ${comp.name}: ${comp.description}`);
    });
  }
  
  if (result.decision === 'NO' && result.alternatives && result.alternatives.length > 0) {
    console.log('\n💡 BETTER ALTERNATIVES:');
    result.alternatives.forEach((alt, i) => {
      console.log(`  ${i + 1}. ${alt}`);
    });
  }
  
  if (result.decision === 'NO' && result.pivotExamples && result.pivotExamples.length > 0) {
    console.log('\n🔄 SUCCESSFUL PIVOTS:');
    result.pivotExamples.forEach(example => {
      console.log(`  • ${example.company}: ${example.story}`);
    });
  }
  
  console.log();
}

function formatDetailedOutput(result) {
  const verdictColor = result.decision === 'YES' ? '\x1b[32m' : 
                       result.decision === 'MAYBE' ? '\x1b[33m' : '\x1b[31m';
  const reset = '\x1b[0m';
  
  console.log('\n' + '='.repeat(60));
  console.log(`${verdictColor}VERDICT: ${result.decision}${reset} (Score: ${result.scores.overall}/10)`);
  console.log('='.repeat(60));
  
  console.log('\n📊 SCORING BREAKDOWN:');
  console.log(`  Market Opportunity: ${getScoreBar(result.scores.breakdown.marketOpportunity)} ${result.scores.breakdown.marketOpportunity}/10`);
  console.log(`  Competition Balance: ${getScoreBar(result.scores.breakdown.competition)} ${result.scores.breakdown.competition}/10`);
  console.log(`  Entry Feasibility: ${getScoreBar(result.scores.breakdown.entryFeasibility)} ${result.scores.breakdown.entryFeasibility}/10`);
  
  console.log('\n📈 MARKET ANALYSIS:');
  console.log(`  Market Size: ${result.marketAnalysis.size}`);
  console.log(`  Growth Rate: ${result.marketAnalysis.growth}`);
  console.log(`  Recent Funding: ${result.marketAnalysis.funding}`);
  
  console.log('\n🎯 CUSTOMER PAIN:');
  console.log(`  Pain Level: ${result.customerPain.level}/10`);
  if (result.customerPain.unmetNeeds.length > 0) {
    console.log('  Unmet Needs:');
    result.customerPain.unmetNeeds.forEach(need => {
      console.log(`    • ${need}`);
    });
  }
  
  console.log('\n🏢 COMPETITION:');
  console.log(`  Number of Competitors: ${result.competitorAnalysis.count}`);
  console.log(`  Market Concentration: ${result.competitorAnalysis.concentration}`);
  console.log(`  Customer Satisfaction: ${result.competitorAnalysis.quality}/10`);
  if (result.competitorAnalysis.competitors.length > 0) {
    console.log('  Top Competitors:');
    result.competitorAnalysis.competitors.slice(0, 3).forEach(comp => {
      console.log(`    • ${comp.name}: ${comp.description}`);
    });
  }
  
  console.log('\n💡 ANALYSIS:');
  result.reasons.forEach((reason, i) => {
    console.log(`  ${i + 1}. ${reason}`);
  });
  
  if (result.strategy) {
    console.log('\n🎯 STRATEGY:');
    console.log(`  ${result.strategy}`);
  }
  
  if (result.alternatives && result.alternatives.length > 0) {
    console.log('\n🔄 ALTERNATIVES:');
    result.alternatives.forEach((alt, i) => {
      console.log(`  ${i + 1}. ${alt}`);
    });
  }
  
  console.log();
}

function getScoreBar(score) {
  const filled = '█'.repeat(Math.round(score));
  const empty = '░'.repeat(10 - Math.round(score));
  const color = score >= 7 ? '\x1b[32m' : score >= 4 ? '\x1b[33m' : '\x1b[31m';
  return `${color}${filled}${empty}\x1b[0m`;
}

async function processIdea(idea, options = {}) {
  try {
    console.log(`\n🔍 Validating: "${idea}"...`);
    if (options.model) {
      console.log(`📊 Using model: ${options.model}`);
    }
    const result = options.detailed ? 
      await validateIdeaDetailed(idea, options.roast, options.model) :
      await validateIdea(idea, options.roast, options.model);
    formatOutput(result, options.json, options.detailed);
    return result;
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    if (error.message.includes('API key')) {
      console.error('\n💡 Tip: Set your API key using: launchlens config set openai-api-key <your-key>');
    }
    if (options.json) {
      console.log(JSON.stringify({ error: error.message }, null, 2));
    }
    return null;
  }
}

async function processFile(filePath, options = {}) {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const ideas = content.split('\n').filter(line => line.trim().length > 0);
    
    console.log(`\n📋 Processing ${ideas.length} ideas from ${filePath}...\n`);
    
    const results = [];
    for (const idea of ideas) {
      const result = await processIdea(idea.trim(), options);
      if (result) results.push({ idea: idea.trim(), ...result });
    }
    
    if (options.json) {
      console.log(JSON.stringify(results, null, 2));
    } else {
      console.log('\n' + '='.repeat(60));
      console.log('SUMMARY:');
      console.log(`  ✅ YES: ${results.filter(r => r.decision === 'YES').length}`);
      console.log(`  ❌ NO: ${results.filter(r => r.decision === 'NO').length}`);
      console.log(`  ⚠️  MAYBE: ${results.filter(r => r.decision === 'MAYBE').length}`);
      console.log('='.repeat(60));
    }
    
  } catch (error) {
    console.error(`❌ Error reading file: ${error.message}`);
    process.exit(1);
  }
}

async function handleConfig(args) {
  const [command, key, ...valueArr] = args;
  const value = valueArr.join(' ');
  
  if (command === 'list') {
    const settings = config.list();
    console.log('\n📋 Current Configuration:');
    console.log('='.repeat(40));
    for (const [k, v] of Object.entries(settings)) {
      console.log(`  ${k}: ${v}`);
    }
    console.log();
    return;
  }
  
  if (command === 'get') {
    if (!key) {
      console.error('❌ Error: Please specify a key to get');
      console.log('Available keys: openai-api-key, perplexity-api-key, model');
      process.exit(1);
    }
    const val = config.get(key);
    if (val === null) {
      console.log(`❌ ${key} is not set`);
    } else if (key.includes('api-key') && val) {
      console.log(`${key}: ***${val.slice(-4)}`);
    } else {
      console.log(`${key}: ${val}`);
    }
    return;
  }
  
  if (command === 'set') {
    if (!key || !value) {
      console.error('❌ Error: Please specify both key and value');
      console.log('Example: launchlens config set openai-api-key sk-...');
      process.exit(1);
    }
    
    // Validate API keys
    if (key === 'openai-api-key') {
      console.log('🔐 Validating OpenAI API key...');
      const isValid = await config.validateApiKey('openai', value);
      if (!isValid) {
        console.error('❌ Invalid OpenAI API key');
        process.exit(1);
      }
    } else if (key === 'perplexity-api-key') {
      console.log('🔐 Validating Perplexity API key...');
      const isValid = await config.validateApiKey('perplexity', value);
      if (!isValid) {
        console.error('❌ Invalid Perplexity API key');
        process.exit(1);
      }
    }
    
    try {
      const success = config.set(key, value);
      if (success) {
        console.log(`✅ Successfully set ${key}`);
        if (key.includes('api-key')) {
          console.log('🔒 API key encrypted and stored securely');
        }
      } else {
        console.error(`❌ Failed to save ${key}`);
      }
    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
      process.exit(1);
    }
    return;
  }
  
  console.error(`❌ Unknown config command: ${command}`);
  console.log('Available commands: set, get, list');
  process.exit(1);
}

async function main() {
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    printHelp();
    process.exit(0);
  }
  
  // Handle config commands
  if (args[0] === 'config') {
    await handleConfig(args.slice(1));
    process.exit(0);
  }
  
  const jsonIndex = args.indexOf('--json');
  const roastIndex = args.indexOf('--roast');
  const fileIndex = args.indexOf('--file');
  const detailedIndex = args.indexOf('--detailed');
  const modelIndex = args.indexOf('--model');
  
  const options = {
    json: jsonIndex !== -1,
    roast: roastIndex !== -1,
    detailed: detailedIndex !== -1
  };
  
  // Handle model override
  if (modelIndex !== -1) {
    if (modelIndex + 1 >= args.length) {
      console.error('❌ Error: --model requires a model name');
      console.log(`Available models: ${config.getAvailableModels().join(', ')}`);
      process.exit(1);
    }
    const model = args[modelIndex + 1];
    const availableModels = ['gpt-4', 'gpt-4-turbo-preview', 'gpt-3.5-turbo', 'gpt-3.5-turbo-16k'];
    if (!availableModels.includes(model)) {
      console.error(`❌ Error: Invalid model '${model}'`);
      console.log(`Available models: ${availableModels.join(', ')}`);
      process.exit(1);
    }
    options.model = model;
  }
  
  if (fileIndex !== -1) {
    if (fileIndex + 1 >= args.length) {
      console.error('❌ Error: --file requires a file path');
      process.exit(1);
    }
    await processFile(args[fileIndex + 1], options);
  } else {
    let idea;
    if (jsonIndex !== -1 && jsonIndex + 1 < args.length) {
      idea = args[jsonIndex + 1];
    } else if (roastIndex !== -1 && roastIndex + 1 < args.length) {
      idea = args[roastIndex + 1];
    } else if (detailedIndex !== -1 && detailedIndex + 1 < args.length) {
      idea = args[detailedIndex + 1];
    } else if (modelIndex !== -1 && modelIndex + 2 < args.length) {
      idea = args[modelIndex + 2];
    } else {
      idea = args.filter((arg, i) => {
        // Skip flags and their values
        if (arg.startsWith('--')) return false;
        if (i > 0 && args[i-1].startsWith('--')) {
          const flag = args[i-1];
          // Skip values for flags that take parameters
          if (['--model', '--file'].includes(flag)) return false;
        }
        return true;
      }).join(' ');
    }
    
    if (!idea) {
      console.error('❌ Error: Please provide an idea to validate');
      printHelp();
      process.exit(1);
    }
    
    await processIdea(idea, options);
  }
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});