# LaunchLens CLI

Quick startup idea validation from the command line.

## Installation

```bash
# Install globally
npm install -g launchlens

# Or run locally
node cli.js "your idea"
```

## Usage

### Basic validation
```bash
launchlens "AI-powered todo app for developers"
```

### JSON output (for AI/automation)
```bash
launchlens --json "marketplace for tutors"
```

### Roast mode (extra harsh feedback)
```bash
launchlens --roast "uber for dogs"
```

### Batch validation from file
```bash
# Create a file with one idea per line
echo "AI code review tool" > ideas.txt
echo "Blockchain voting system" >> ideas.txt

# Validate all ideas
launchlens --file ideas.txt
```

## Environment Variables

Create a `.env` file in the project root:

```bash
OPENAI_API_KEY=your_openai_key_here
PERPLEXITY_API_KEY=your_perplexity_key_here
```

## Examples

### For AI Integration

Get structured JSON output that's easy to parse:

```bash
launchlens --json "AI code review tool" | jq '.decision'
# Output: "NO"

launchlens --json "niche B2B compliance tool" | jq '.competitors[].name'
# Lists competitor names
```

### For Humans

Get colorful, formatted output:

```bash
launchlens "social media for pets"

# Output:
# ============================================================
# VERDICT: NO
# ============================================================
# 
# 📊 REASONS:
#   1. Market is saturated
#   2. Hard to monetize
#   3. Low differentiation potential
# 
# 🏢 EXISTING COMPETITORS:
#   • Petbook: Social network for pets
#   • BarkHappy: Dog social app
#   ...
```

## Features

- **Fast validation**: Get YES/NO decision in seconds
- **Competitor analysis**: Finds existing solutions via Perplexity
- **Smart alternatives**: Suggests specific pivots if idea isn't viable
- **Batch processing**: Validate multiple ideas at once
- **JSON output**: Perfect for integration with other tools
- **Roast mode**: For when you need brutal honesty

## API Compatibility

The CLI uses the same validation engine as the web app, ensuring consistent results across both interfaces.