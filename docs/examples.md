# LaunchLens Examples

## Important: Real vs Placeholder Competitors

LaunchLens behavior depends on whether you have a Perplexity API key configured:

### With Perplexity API (Real Competitors)
```bash
$ launchlens "Note-taking app with AI"

🏢 EXISTING COMPETITORS:
  • Notion: All-in-one workspace with AI writing assistant
  • Obsidian: Knowledge base with community plugins and AI integration  
  • Mem: AI-powered note-taking with auto-organization
  • Reflect: Networked notes with GPT-4 integration
  • Roam Research: Graph database for thoughts with AI features
```

### Without Perplexity API (Placeholder Data)
```bash
$ launchlens "Note-taking app with AI"

🏢 EXISTING COMPETITORS:
  • Existing Solution A: Current market leader
  • Existing Solution B: Popular alternative
```

⚠️ **To get real competitor data**, set up your Perplexity API key:
```bash
launchlens config set perplexity-api-key pplx-...
```

See [API Keys Guide](./api-keys.md) for setup instructions.

## Basic Validation

### Good Idea Example

```bash
$ launchlens "API monitoring for GraphQL endpoints"
```

Output:
```
🔍 Validating: "API monitoring for GraphQL endpoints"...

============================================================
VERDICT: YES
============================================================

📊 REASONS:
  1. Specific technical problem
  2. Growing GraphQL adoption
  3. Existing tools don't focus on GraphQL

🏢 EXISTING COMPETITORS:
  • Apollo Studio: GraphQL-specific but expensive
  • Datadog: General monitoring, not GraphQL-focused
  • New Relic: APM tool with basic GraphQL support
```

### Bad Idea Example

```bash
$ launchlens "Social media app for pets"
```

Output:
```
🔍 Validating: "Social media app for pets"...

============================================================
VERDICT: NO
============================================================

📊 REASONS:
  1. Oversaturated market
  2. No clear monetization path
  3. High user acquisition cost

🏢 EXISTING COMPETITORS:
  • Petcube: Social network for pet owners
  • Petzbe: Pet social media platform
  • BarkHappy: Dog social app
  • Catmoji: Cat-focused social network
  • Petster: Pet community platform

💡 BETTER ALTERNATIVES:
  1. Pet health tracking for senior dogs only
  2. Marketplace for verified pet sitters in rural areas
  3. B2B platform for veterinary clinics
```

## Detailed Analysis Mode

```bash
$ launchlens --detailed "AI-powered code documentation generator"
```

Output:
```
🔍 Validating: "AI-powered code documentation generator"...
Starting detailed analysis...

============================================================
VERDICT: YES (Score: 7/10)
============================================================

📊 SCORING BREAKDOWN:
  Market Opportunity: ████████░░ 8/10
  Competition Balance: ███████░░░ 7/10
  Entry Feasibility: ██████░░░░ 6/10

📈 MARKET ANALYSIS:
  Market Size: $2B documentation tools market
  Growth Rate: 15% annually
  Recent Funding: $200M invested in dev tools last quarter

🎯 CUSTOMER PAIN:
  Pain Level: 7/10
  Unmet Needs:
    • Auto-updating documentation
    • Context-aware examples
    • Multi-language support

🏢 COMPETITION:
  Number of Competitors: 5
  Market Concentration: Fragmented
  Customer Satisfaction: 6/10
  Top Competitors:
    • Mintlify: AI documentation but focused on APIs
    • Documentator: Basic automation, no AI
    • Scribe: Process documentation, not code

💡 ANALYSIS:
  1. Developers hate writing docs - proven pain point
  2. AI can genuinely solve this unlike other AI wrappers
  3. Can start with specific niche (e.g., React components)

🎯 STRATEGY:
  Focus on one framework first, nail the experience, then expand
```

## Roast Mode

```bash
$ launchlens --roast "Uber for groceries"
```

Output:
```
🔍 Validating: "Uber for groceries"...

============================================================
VERDICT: NO
============================================================

📊 REASONS:
  1. Instacart literally exists and dominates
  2. "Uber for X" stopped being cool in 2015
  3. Grocery delivery has razor-thin margins

🏢 EXISTING COMPETITORS:
  • Instacart: $24B valuation, market leader
  • Amazon Fresh: Backed by infinite money
  • Walmart+: Leveraging 4,700 stores
  • DoorDash: Already pivoted into groceries
  • Gopuff: Instant delivery model

💡 BETTER ALTERNATIVES:
  1. Grocery delivery for elderly in specific zip codes
  2. B2B wholesale delivery for small restaurants
  3. Ethnic grocery delivery in underserved areas

🔄 SUCCESSFUL PIVOTS:
  • Instacart: Started as same-day delivery, became marketplace
  • DoorDash: Food delivery expanded to groceries
  • Gopuff: Convenience store model instead of supermarket
```

## JSON Output Mode

```bash
$ launchlens --json "No-code platform for building APIs"
```

Output:
```json
{
  "success": true,
  "decision": "MAYBE",
  "reasons": [
    "Crowded market but growing demand",
    "No-code trend is strong",
    "Differentiation would be challenging"
  ],
  "competitors": [
    {
      "name": "Bubble",
      "description": "Full no-code platform with API capabilities"
    },
    {
      "name": "Xano",
      "description": "No-code backend and API builder"
    },
    {
      "name": "Buildship",
      "description": "No-code API builder with workflows"
    }
  ],
  "alternatives": [
    "Focus on no-code APIs for specific industry (healthcare, finance)",
    "No-code API testing and monitoring instead of building",
    "API marketplace for no-code builders"
  ]
}
```

## Batch Processing

```bash
$ cat ideas.txt
AI email writer
Blockchain for voting
Mental health app for developers
VR meditation app

$ launchlens --file ideas.txt
```

Output:
```
📋 Processing 4 ideas from ideas.txt...

🔍 Validating: "AI email writer"...
[Full output for each idea...]

============================================================
SUMMARY:
  ✅ YES: 1
  ❌ NO: 2
  ⚠️  MAYBE: 1
============================================================
```

## Using with Unix Pipes

```bash
# Get only the verdicts
$ echo "AI todo app" | launchlens --json | jq .decision
"NO"

# Check multiple ideas quickly
$ for idea in "AI writer" "VR gaming" "Crypto wallet"; do
    echo "$idea: $(launchlens "$idea" --json | jq .decision)"
  done

AI writer: "NO"
VR gaming: "MAYBE"
Crypto wallet: "NO"
```

## CI/CD Integration Example

```yaml
# .github/workflows/validate-idea.yml
name: Validate Startup Idea
on:
  issues:
    types: [opened]

jobs:
  validate:
    if: contains(github.event.issue.labels.*.name, 'idea')
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm install -g launchlens
      - run: |
          RESULT=$(launchlens "${{ github.event.issue.title }}" --json)
          echo "::set-output name=verdict::$(echo $RESULT | jq .decision)"
```