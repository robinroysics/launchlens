# LaunchLens - Competitive Intelligence for Startups

**Tagline:** Competitive intelligence for startups, not enterprises

## What is LaunchLens?

LaunchLens is a powerful CLI tool that provides instant AI-powered validation for startup ideas. Get comprehensive competitive analysis, market insights, and actionable recommendations in seconds, not weeks.

## Key Features

### 🎯 Validation Modes
- **Quick Validation**: Get YES/NO verdict with reasons
- **Detailed Analysis**: Market scores, competition analysis, customer pain points
- **Roast Mode**: Brutally honest feedback to test your idea's resilience
- **JSON Output**: Structured data for integration with other tools

### 📊 Analysis Components
- **Competition Analysis**: Find and analyze existing competitors
- **Market Scoring**: 0-10 scores for market opportunity, competition, and feasibility
- **Customer Pain Assessment**: Identify unmet needs and pain levels
- **Strategic Recommendations**: Specific pivot suggestions and alternatives
- **Success Stories**: Learn from companies that pivoted successfully

### 🔧 Developer-Friendly
- **CLI-First Design**: Works perfectly in your terminal workflow
- **API Key Management**: Secure, encrypted storage of credentials
- **Multiple AI Models**: Choose between GPT-4, GPT-3.5-turbo, and more
- **Batch Processing**: Validate multiple ideas at once
- **Environment Flexibility**: Works with config files or environment variables

## Usage

### Basic Validation
```bash
# Validate a single idea
launchlens "AI-powered code review tool"

# Get harsh, brutally honest feedback
launchlens --roast "uber for dogs"

# Detailed analysis with market scores
launchlens --detailed "marketplace for tutors"

# Output as JSON for processing
launchlens --json "SaaS analytics tool"
```

### Batch Processing
```bash
# Validate multiple ideas from a file
echo "AI todo app" > ideas.txt
echo "Marketplace for services" >> ideas.txt
launchlens --file ideas.txt
```

### Configuration Management
```bash
# List all settings
launchlens config list

# Get specific setting
launchlens config get model

# Change AI model
launchlens config set model gpt-4
```

## CLI Commands Reference

```bash
# Basic usage
launchlens <idea>                    # Validate a single idea
launchlens --help                    # Show help

# Validation options
launchlens --json <idea>             # Output as JSON
launchlens --roast <idea>            # Extra harsh feedback
launchlens --detailed <idea>         # Detailed market analysis
launchlens --model <model> <idea>    # Use specific AI model
launchlens --file <path>             # Batch process ideas

# Configuration
launchlens config set <key> <value>  # Set configuration
launchlens config get <key>          # Get configuration value
launchlens config list               # List all settings
```

## Output Examples

### Standard Validation
```
🔍 Validating: "AI-powered code review tool"...

============================================================
VERDICT: YES
============================================================

📊 REASONS:
  1. Real problem being solved
  2. High demand for security tools
  3. AI can provide competitive edge

🏢 EXISTING COMPETITORS:
  • DeepCode: AI-driven code analysis platform
  • Veracode: Advanced security testing tool
  • Checkmarx: SAST tool with AI capabilities
```

### Detailed Analysis (--detailed)
```
📊 SCORING BREAKDOWN:
  Market Opportunity: ████████░░ 8/10
  Competition Balance: ███████░░░ 7/10
  Entry Feasibility: ██████░░░░ 6/10

📈 MARKET ANALYSIS:
  Market Size: $5B and growing
  Growth Rate: 25% annually
  Recent Funding: $500M in last quarter
```

## Installation

### Quick Install (Recommended)

```bash
# Install globally from npm
npm install -g launchlens

# Configure your API keys
launchlens config set openai-api-key sk-...
launchlens config set perplexity-api-key pplx-...

# Start validating ideas!
launchlens "Your startup idea here"
```

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

### API Keys

LaunchLens requires API keys for AI-powered analysis. You can configure them in multiple ways:

#### Method 1: CLI Configuration (Recommended)
```bash
# Set OpenAI API key
launchlens config set openai-api-key sk-...

# Set Perplexity API key (optional, for competitor search)
launchlens config set perplexity-api-key pplx-...

# View current configuration
launchlens config list
```

#### Method 2: Environment Variables
```bash
# Add to your ~/.bashrc or ~/.zshrc
export OPENAI_API_KEY="sk-..."
export PERPLEXITY_API_KEY="pplx-..."
```

### AI Models

```bash
# Set default model (options: gpt-4, gpt-3.5-turbo, etc.)
launchlens config set model gpt-4

# Or use a specific model for one query
launchlens --model gpt-4 "Your idea"
```

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

## Requirements

- Node.js 16.0.0 or higher
- OpenAI API key (required)
- Perplexity API key (optional, for enhanced competitor search)

## Tech Stack

- **Core**: Node.js ES Modules
- **AI**: OpenAI GPT-4 / GPT-3.5
- **Research**: Perplexity API for competitor search
- **Security**: AES-256 encryption for API keys
- **Package**: npm global package support

## Troubleshooting

### API Key Issues
```bash
# If you get "API key not configured" error:
launchlens config set openai-api-key sk-...

# Verify key is set:
launchlens config get openai-api-key
```

### Permission Issues
```bash
# If you get permission errors during global install:
sudo npm install -g launchlens

# Or use a Node version manager like nvm
```

### Model Errors
```bash
# If a model isn't available, try:
launchlens config set model gpt-3.5-turbo
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Support

For questions or feedback, please open an issue on GitHub.

## Author

Created by Khoa Le
