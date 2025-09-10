# LaunchLens

A CLI tool to validate startup ideas before you build them. Get instant verdict, market scores, and competitor analysis.

```bash
$ launchlens "uber for dogs"
> VERDICT: NO ❌
> Market oversaturated, unit economics don't work
> Try: Pet walking for elderly-owned dogs in suburbs
```

## Why?

Built this after wasting months on ideas nobody wanted. Now my AI assistant can validate ideas programmatically while I sleep.

## What You Get

```bash
$ launchlens "AI-powered code review tool"

✅ VERDICT: YES (Score: 7/10)

📊 REASONS:
  • Real developer pain point
  • AI can genuinely improve this
  • B2B SaaS model proven

🏢 COMPETITORS:
  • DeepCode - AI code analysis
  • Codacy - Automated reviews  
  • SonarQube - Code quality

💡 STRATEGY:
  Focus on security vulnerabilities first, expand later
```

## Features

- **Instant validation** - YES/NO verdict in 30 seconds
- **Market scores** - 0-10 ratings for opportunity, competition, feasibility
- **Real competitors** - Finds actual companies in the space
- **Pivot suggestions** - Specific alternatives when idea is bad
- **JSON output** - For AI agents and automation
- **Roast mode** - When you need brutal honesty

## Usage Examples

```bash
# Basic validation
launchlens "social network for cats"

# Get detailed scores
launchlens --detailed "AI resume builder"

# Output as JSON (for AI agents)
launchlens --json "blockchain for real estate"

# Brutal honesty mode
launchlens --roast "uber for X"

# Validate multiple ideas
launchlens --file ideas.txt
```

## For AI Assistants

Perfect for AI agents that need to validate ideas programmatically:

```bash
# Your AI can run this
RESULT=$(launchlens --json "$IDEA")
VERDICT=$(echo $RESULT | jq .decision)

if [ "$VERDICT" = "YES" ]; then
  # Proceed with building
fi
```

See [AI Integration Guide](./docs/ai-integration.md) for LangChain, AutoGPT, and more.

## Documentation

- [Examples](./docs/examples.md) - See real validation outputs
- [JSON API](./docs/json-api.md) - Integrate with your tools
- [AI Integration](./docs/ai-integration.md) - Use with AI assistants
- [Web UI](./docs/web-ui.md) - Browser interface option

## CLI Reference

```bash
launchlens <idea>                    # Basic validation
launchlens --json <idea>             # JSON output for scripts
launchlens --detailed <idea>         # Include market scores
launchlens --roast <idea>            # Harsh feedback mode
launchlens --file <path>             # Batch validate ideas
launchlens --model gpt-4 <idea>      # Use specific model

launchlens config set <key> <value>  # Set API keys/settings
launchlens config get <key>          # View configuration
launchlens config list               # Show all settings
```

## Quick Start

```bash
# Install
npm install -g launchlens

# Configure API keys
launchlens config set openai-api-key sk-...      # Required
launchlens config set perplexity-api-key pplx-... # Recommended

# Validate idea
launchlens "your startup idea"
```

⚠️ **Important**: Without Perplexity API key, competitor search returns placeholder data.
Get your key at: https://www.perplexity.ai/settings/api

### Install from Source

```bash
# Clone the repository
git clone https://github.com/yourusername/launchlens.git
cd launchlens

# Install dependencies
npm install

# Link globally for development
npm link

# Configure API keys
launchlens config set openai-api-key sk-...
```

## Configuration

### API Keys Required

| API | Purpose | Required? | Get Key |
|-----|---------|-----------|----------|
| OpenAI | AI analysis & validation | ✅ Required | [OpenAI Platform](https://platform.openai.com/api-keys) |
| Perplexity | Real competitor search | ⚠️ Highly Recommended | [Perplexity Settings](https://www.perplexity.ai/settings/api) |

```bash
# Set OpenAI API key (REQUIRED)
launchlens config set openai-api-key sk-...

# Set Perplexity key (RECOMMENDED - without it, competitors are fake)
launchlens config set perplexity-api-key pplx-...

# Choose AI model
launchlens config set model gpt-4

# Or use environment variables
export OPENAI_API_KEY="sk-..."
export PERPLEXITY_API_KEY="pplx-..."
```

API keys are encrypted and stored locally in `~/.launchlens/`

**Note**: Without Perplexity API, you'll see generic competitors like "Existing Solution A" instead of real companies.

## Market Positioning

### Who This Is For
- Early-stage startup founders
- Solo entrepreneurs validating ideas
- Product managers exploring new markets
- Anyone who needs quick competitive intelligence

### Who This Is NOT For
- Enterprise companies needing ongoing monitoring
- Teams requiring complex integrations
- Companies needing detailed traffic analytics

## Competitive Advantage

While tools like Crayon and Klue serve enterprises with $30K+/year subscriptions, LaunchLens focuses on:

1. **Speed**: 60-second analysis vs 7-8 week setup
2. **Simplicity**: No training required
3. **Affordability**: $29 vs $30,000+
4. **Focus**: Finding opportunities, not monitoring
5. **Startup-First**: Built for founders, not analysts

## How It Works

1. **Analyzes your idea** using GPT-4/GPT-3.5 (OpenAI)
2. **Searches for real competitors** via Perplexity API (or returns placeholders without key)
3. **Calculates market scores** based on opportunity, competition, feasibility
4. **Suggests pivots** if the idea won't work
5. **Returns structured data** for further processing

### With vs Without Perplexity API

**With Perplexity** (Recommended):
```
🏢 COMPETITORS:
  • Notion - All-in-one workspace with AI
  • Obsidian - Knowledge base with plugins
  • Roam Research - Networked thought tool
```

**Without Perplexity** (Placeholder data):
```
🏢 COMPETITORS:
  • Existing Solution A - Current market leader
  • Existing Solution B - Popular alternative
```

## Requirements

- Node.js 16+
- OpenAI API key (required) - [Get key](https://platform.openai.com/api-keys)
- Perplexity API key (recommended) - [Get key](https://www.perplexity.ai/settings/api)

See [API Keys Guide](./docs/api-keys.md) for detailed setup instructions.

## FAQ

**Is this accurate?**  
It's as good as GPT-4 with real competitor data. Better than building blindly.

**Why CLI instead of web app?**  
Because developers live in terminals and AI agents can call CLIs.

**Does it store my ideas?**  
No. Everything runs locally with your API keys.

**Can I customize it?**  
Yes. MIT licensed. Fork it, modify it, make it yours.

## Contributing

PRs welcome. Some ideas:
- Better competitor detection
- More analysis criteria
- Support for non-English ideas
- Integration with more AI models

## License

MIT - Do whatever you want

## Links

- [GitHub](https://github.com/khoaleeeeee/launchlens)
- [NPM Package](https://www.npmjs.com/package/launchlens)
- [Report Issues](https://github.com/khoaleeeeee/launchlens/issues)

---

Built by [Khoa Le](https://github.com/khoaleeeeee) after too many failed startups
