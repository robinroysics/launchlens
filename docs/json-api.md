# JSON API Documentation

## Overview

LaunchLens can output structured JSON for programmatic use. Perfect for:
- AI assistants parsing results
- CI/CD pipelines
- Building your own tools
- Data analysis

## Basic JSON Output

```bash
launchlens --json "your idea"
```

## Response Structure

### Standard Validation Response

```typescript
interface ValidationResponse {
  success: boolean;
  decision: "YES" | "NO" | "MAYBE";
  reasons: string[];
  competitors: Competitor[];
  alternatives?: string[];
  pivotExamples?: PivotExample[];
}

interface Competitor {
  name: string;
  description: string;
}

interface PivotExample {
  company: string;
  story: string;
}
```

### Example Response

```json
{
  "success": true,
  "decision": "NO",
  "reasons": [
    "Market is saturated with existing solutions",
    "Difficult to differentiate from competitors",
    "High customer acquisition cost likely"
  ],
  "competitors": [
    {
      "name": "Notion",
      "description": "All-in-one workspace with AI features"
    },
    {
      "name": "Obsidian",
      "description": "Knowledge base with local storage"
    }
  ],
  "alternatives": [
    "Focus on note-taking for specific profession (lawyers, doctors)",
    "Build plugin for existing tools instead",
    "Target enterprises with compliance needs"
  ],
  "pivotExamples": [
    {
      "company": "Slack",
      "story": "Pivoted from gaming to team communication"
    }
  ]
}
```

## Detailed Analysis JSON

```bash
launchlens --json --detailed "your idea"
```

### Detailed Response Structure

```typescript
interface DetailedValidationResponse {
  success: boolean;
  decision: "YES" | "NO" | "MAYBE";
  scores: {
    overall: number;  // 0-10
    breakdown: {
      marketOpportunity: number;  // 0-10
      competition: number;        // 0-10 (8 is optimal)
      entryFeasibility: number;   // 0-10
    };
  };
  marketAnalysis: {
    size: string;
    growth: string;
    funding: string;
  };
  customerPain: {
    level: number;  // 0-10
    unmetNeeds: string[];
  };
  competitorAnalysis: {
    count: number;
    quality: number;  // 0-10
    concentration: string;
    competitors: Competitor[];
  };
  reasons: string[];
  alternatives?: string[];
  strategy?: string;
}
```

### Example Detailed Response

```json
{
  "success": true,
  "decision": "YES",
  "scores": {
    "overall": 7,
    "breakdown": {
      "marketOpportunity": 8,
      "competition": 7,
      "entryFeasibility": 6
    }
  },
  "marketAnalysis": {
    "size": "$5B and growing",
    "growth": "25% annually",
    "funding": "$500M in recent quarter"
  },
  "customerPain": {
    "level": 8,
    "unmetNeeds": [
      "Faster deployment cycles",
      "Better error tracking",
      "Cost optimization"
    ]
  },
  "competitorAnalysis": {
    "count": 5,
    "quality": 6,
    "concentration": "Fragmented",
    "competitors": [
      {
        "name": "DataDog",
        "description": "Monitoring and analytics platform"
      }
    ]
  },
  "reasons": [
    "Clear market need identified",
    "Technical differentiation possible",
    "B2B SaaS model proven"
  ],
  "strategy": "Focus on SMB market first, then expand enterprise"
}
```

## Using with jq

```bash
# Get just the verdict
launchlens --json "idea" | jq .decision

# Get the overall score
launchlens --json --detailed "idea" | jq .scores.overall

# List all competitors
launchlens --json "idea" | jq '.competitors[].name'

# Get alternatives if idea is bad
launchlens --json "idea" | jq 'if .decision == "NO" then .alternatives else empty end'

# Filter good ideas from file
cat ideas.txt | xargs -I {} launchlens --json {} | jq 'select(.decision == "YES")'
```

## Python Integration

```python
import subprocess
import json

def validate_idea(idea):
    result = subprocess.run(
        ['launchlens', '--json', idea],
        capture_output=True,
        text=True
    )
    return json.loads(result.stdout)

# Example usage
idea = "AI-powered recipe generator"
validation = validate_idea(idea)

if validation['decision'] == 'YES':
    print(f"✅ Good idea! Score: {validation.get('scores', {}).get('overall', 'N/A')}")
else:
    print(f"❌ Bad idea. Try these instead:")
    for alt in validation.get('alternatives', []):
        print(f"  - {alt}")
```

## Node.js Integration

```javascript
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function validateIdea(idea) {
  const { stdout } = await execAsync(`launchlens --json "${idea}"`);
  return JSON.parse(stdout);
}

// Example usage
const result = await validateIdea('Blockchain for supply chain');
console.log(`Verdict: ${result.decision}`);
console.log(`Competitors: ${result.competitors.length}`);
```

## Error Handling

### Error Response Structure

```json
{
  "success": false,
  "error": "Error message here"
}
```

### Common Errors

1. **Missing API Key**
```json
{
  "error": "OpenAI API key not configured. Run: launchlens config set openai-api-key <your-key>"
}
```

2. **Invalid Input**
```json
{
  "error": "Please describe your idea (at least 10 characters)"
}
```

3. **API Failure**
```json
{
  "error": "Failed to analyze idea: API rate limit exceeded"
}
```

## Batch Processing JSON

```bash
launchlens --file ideas.txt --json
```

Returns array of results:
```json
[
  {
    "idea": "AI email writer",
    "success": true,
    "decision": "NO",
    "reasons": [...],
    "competitors": [...]
  },
  {
    "idea": "VR fitness app",
    "success": true,
    "decision": "MAYBE",
    "reasons": [...],
    "competitors": [...]
  }
]
```