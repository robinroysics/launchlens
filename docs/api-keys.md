# API Keys Setup Guide

LaunchLens requires API keys to function. This guide will help you obtain and configure them.

## Overview

| API Service | Purpose | Required? | Free Tier | Cost |
|------------|---------|-----------|-----------|------|
| **OpenAI** | Core AI analysis, idea validation, scoring | ✅ Required | No | ~$0.01-0.02 per validation |
| **Perplexity** | Real-time competitor search | ⚠️ Highly Recommended | Yes (5 requests/min) | $5/month for 300 requests/min |

## OpenAI API Key (Required)

### What it does
- Analyzes your startup idea
- Provides YES/NO/MAYBE verdict
- Generates market scores (0-10)
- Suggests alternatives and pivots
- Powers roast mode feedback

### How to get it

1. **Sign up** at [OpenAI Platform](https://platform.openai.com/signup)
2. **Add payment method** (required even for small usage)
3. **Create API key**:
   - Go to [API Keys page](https://platform.openai.com/api-keys)
   - Click "Create new secret key"
   - Name it (e.g., "LaunchLens")
   - Copy immediately (you won't see it again!)

4. **Configure in LaunchLens**:
   ```bash
   launchlens config set openai-api-key sk-...
   ```

### Pricing
- GPT-3.5-turbo: ~$0.002 per validation
- GPT-4: ~$0.02 per validation
- Most users spend <$5/month

### Without OpenAI
**LaunchLens will not work without an OpenAI API key.**

## Perplexity API Key (Highly Recommended)

### What it does
- Searches for real competitors in your market
- Provides actual company names and descriptions
- Updates competitor data in real-time
- Improves validation accuracy

### How to get it

1. **Sign up** at [Perplexity.ai](https://www.perplexity.ai)
2. **Go to API settings**:
   - Navigate to [Settings → API](https://www.perplexity.ai/settings/api)
   - Or click your profile → Settings → API

3. **Generate API key**:
   - Click "Generate API Key"
   - Copy the key (starts with `pplx-`)

4. **Configure in LaunchLens**:
   ```bash
   launchlens config set perplexity-api-key pplx-...
   ```

### Pricing
- **Free tier**: 5 requests/minute (enough for casual use)
- **Pro**: $5/month for 300 requests/minute
- Each validation uses 1 request

### Without Perplexity

Without a Perplexity API key, LaunchLens still works but returns **placeholder competitor data**:

```
# With Perplexity (Real Data):
🏢 COMPETITORS:
  • Notion - All-in-one workspace with databases and AI
  • Airtable - Spreadsheet-database hybrid for teams
  • Coda - Document platform that combines docs and apps

# Without Perplexity (Fake Data):
🏢 COMPETITORS:
  • Existing Solution A - Current market leader
  • Existing Solution B - Popular alternative
```

**Impact**: Your validation will be less accurate without knowing real competitors.

## Configuration Methods

### Method 1: CLI Configuration (Recommended)

```bash
# Set OpenAI key
launchlens config set openai-api-key sk-proj-...

# Set Perplexity key
launchlens config set perplexity-api-key pplx-...

# Verify configuration
launchlens config list
```

Keys are encrypted and stored in `~/.launchlens/`

### Method 2: Environment Variables

Add to your `~/.bashrc` or `~/.zshrc`:

```bash
export OPENAI_API_KEY="sk-proj-..."
export PERPLEXITY_API_KEY="pplx-..."
```

Then reload:
```bash
source ~/.bashrc
```

### Method 3: .env File (For Web UI)

Create `.env` file in project root:

```env
OPENAI_API_KEY=sk-proj-...
PERPLEXITY_API_KEY=pplx-...
```

**Note**: The web interface (`npm start`) only reads from `.env` file, not from CLI config.

## Security Best Practices

1. **Never commit API keys** to version control
2. **Use different keys** for development and production
3. **Rotate keys regularly** if exposed
4. **Set usage limits** in OpenAI dashboard
5. **Monitor usage** to detect unusual activity

## Troubleshooting

### "API key not configured"
```bash
# Check if key is set
launchlens config get openai-api-key

# If not, set it
launchlens config set openai-api-key sk-...
```

### "Invalid API key"
- Ensure key is copied correctly (no extra spaces)
- Check key hasn't been revoked
- Verify billing is set up (OpenAI requires payment method)

### "Perplexity API error"
- Free tier is limited to 5 requests/minute
- Wait 60 seconds and try again
- Consider upgrading to Pro for higher limits

### Web UI not finding keys
- Web UI reads from `.env` file, not CLI config
- Create `.env` file with your keys
- Restart server after adding keys

## Cost Optimization

### Reduce costs by:
1. **Use GPT-3.5** instead of GPT-4:
   ```bash
   launchlens config set model gpt-3.5-turbo
   ```

2. **Cache results** - LaunchLens caches competitor searches for 24 hours

3. **Batch validation** - Validate multiple ideas at once:
   ```bash
   launchlens --file ideas.txt
   ```

## API Status Check

Check if your APIs are configured:

```bash
# CLI check
launchlens config list

# Web UI check (visit in browser)
http://localhost:3003/health
```

## Support

- **OpenAI issues**: [OpenAI Help Center](https://help.openai.com)
- **Perplexity issues**: [Perplexity Support](https://perplexity.ai/support)
- **LaunchLens issues**: [GitHub Issues](https://github.com/khoaleeeeee/launchlens/issues)