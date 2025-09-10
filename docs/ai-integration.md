# AI Integration Guide

## Why LaunchLens for AI Assistants?

AI assistants (Claude, GPT, Gemini) can execute shell commands but can't easily:
- Search for real competitors
- Calculate market scores
- Provide structured validation

LaunchLens bridges this gap with a simple CLI interface.

## For AI Assistant Users

### Tell Your AI Assistant

```
I have launchlens installed. You can use it to validate startup ideas:
- Basic: launchlens "idea"
- JSON: launchlens --json "idea"  
- Detailed: launchlens --detailed "idea"
```

### Example Prompts

```
"Use launchlens to validate these 3 startup ideas and tell me which is best"

"Run launchlens on 'AI podcast editor' and parse the JSON to show only competitors"

"Validate my idea with launchlens --detailed and create a report"
```

## For AI Agent Developers

### LangChain Integration

```python
from langchain.tools import ShellTool
from langchain.agents import initialize_agent
import json

shell = ShellTool()

def validate_startup_idea(idea: str) -> dict:
    """Validate a startup idea using LaunchLens CLI"""
    result = shell.run(f'launchlens --json "{idea}"')
    return json.loads(result)

# Add to your agent's tools
tools = [
    Tool(
        name="ValidateStartup",
        func=validate_startup_idea,
        description="Validate startup ideas with market analysis"
    )
]
```

### AutoGPT/AgentGPT Integration

```yaml
# commands.yml
validate_idea:
  description: "Validate a startup idea"
  command: "launchlens --json"
  args:
    - name: "idea"
      type: "string"
      description: "The startup idea to validate"
  output_parser: "json"
```

### Claude Computer Use

```python
# For Claude's computer use feature
async def validate_idea_with_scores(idea: str):
    """Get detailed validation with numerical scores"""
    result = await computer.run(
        f'launchlens --detailed --json "{idea}"'
    )
    data = json.loads(result)
    
    return {
        "verdict": data["decision"],
        "score": data["scores"]["overall"],
        "should_proceed": data["decision"] == "YES" and data["scores"]["overall"] >= 7
    }
```

## GitHub Actions for AI Workflows

### Idea Validation Bot

```yaml
name: AI Idea Validator
on:
  issue_comment:
    types: [created]

jobs:
  validate:
    if: contains(github.event.comment.body, '/validate')
    runs-on: ubuntu-latest
    steps:
      - name: Extract idea
        id: extract
        run: |
          IDEA=$(echo "${{ github.event.comment.body }}" | sed 's/\/validate //')
          echo "idea=$IDEA" >> $GITHUB_OUTPUT
      
      - name: Install LaunchLens
        run: npm install -g launchlens
      
      - name: Configure API
        run: launchlens config set openai-api-key ${{ secrets.OPENAI_KEY }}
      
      - name: Validate idea
        id: validate
        run: |
          RESULT=$(launchlens --json "${{ steps.extract.outputs.idea }}")
          echo "result=$RESULT" >> $GITHUB_OUTPUT
      
      - name: Comment result
        uses: actions/github-script@v6
        with:
          script: |
            const result = JSON.parse('${{ steps.validate.outputs.result }}');
            const emoji = result.decision === 'YES' ? '✅' : '❌';
            const comment = `${emoji} **Verdict: ${result.decision}**\n\n${result.reasons.join('\n')}`;
            
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: comment
            });
```

## Zapier/Make.com Integration

### Webhook Endpoint

Create a simple server that wraps LaunchLens:

```javascript
// webhook-server.js
import express from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';

const app = express();
const execAsync = promisify(exec);

app.post('/validate', express.json(), async (req, res) => {
  const { idea } = req.body;
  
  try {
    const { stdout } = await execAsync(
      `launchlens --json "${idea.replace(/"/g, '\\"')}"`
    );
    res.json(JSON.parse(stdout));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000);
```

## n8n Workflow

```json
{
  "nodes": [
    {
      "name": "Execute Command",
      "type": "n8n-nodes-base.executeCommand",
      "parameters": {
        "command": "launchlens --json \"{{ $json.idea }}\""
      }
    },
    {
      "name": "Parse JSON",
      "type": "n8n-nodes-base.function",
      "parameters": {
        "functionCode": "return JSON.parse($input.all()[0].json.stdout);"
      }
    }
  ]
}
```

## ChatGPT Custom GPT

### Instructions for Custom GPT

```
You have access to LaunchLens CLI for validating startup ideas.

Commands available:
- launchlens "idea" - Basic validation
- launchlens --json "idea" - JSON output
- launchlens --detailed "idea" - Detailed analysis with scores
- launchlens --roast "idea" - Harsh feedback mode

When users ask about startup ideas:
1. Run launchlens with their idea
2. Parse the results
3. Provide actionable insights based on the verdict

Always use --json flag for structured data.
```

## Perplexity AI Integration

Since LaunchLens uses Perplexity API for competitor research, you can:

```python
# Enhance Perplexity AI responses with validation
async def enhanced_perplexity_search(query: str):
    # First, validate if it's a startup idea
    validation = subprocess.run(
        ['launchlens', '--json', query],
        capture_output=True,
        text=True
    )
    
    val_data = json.loads(validation.stdout)
    
    # Then do deeper Perplexity search on competitors
    if val_data['competitors']:
        competitor_research = await perplexity.search(
            f"Detailed analysis of {val_data['competitors'][0]['name']}"
        )
    
    return {
        "validation": val_data,
        "deep_research": competitor_research
    }
```

## Shell Scripting for AI

```bash
#!/bin/bash
# validate-and-decide.sh

IDEA="$1"
RESULT=$(launchlens --json "$IDEA")
DECISION=$(echo "$RESULT" | jq -r .decision)

if [ "$DECISION" = "YES" ]; then
    echo "✅ Proceeding with: $IDEA"
    # Trigger next automation
else
    echo "❌ Skipping: $IDEA"
    # Try alternatives
    echo "$RESULT" | jq -r '.alternatives[]'
fi
```

## Best Practices

1. **Always use --json flag** for AI parsing
2. **Handle errors gracefully** - Check for API key configuration
3. **Cache results** - Same idea validation within 24h returns same result
4. **Rate limit aware** - Add delays between batch validations
5. **Sanitize inputs** - Escape quotes and special characters

## Common AI Integration Patterns

### Pattern 1: Idea Filter
```bash
# Only proceed with good ideas
for idea in "${ideas[@]}"; do
  if [ $(launchlens --json "$idea" | jq -r .decision) = "YES" ]; then
    echo "$idea" >> good_ideas.txt
  fi
done
```

### Pattern 2: Score Ranking
```bash
# Rank ideas by score
launchlens --detailed --json "idea1" | jq '{idea: "idea1", score: .scores.overall}'
launchlens --detailed --json "idea2" | jq '{idea: "idea2", score: .scores.overall}'
# Sort by score...
```

### Pattern 3: Pivot Generator
```bash
# Get alternative ideas when original fails
RESULT=$(launchlens --json "$ORIGINAL_IDEA")
if [ $(echo "$RESULT" | jq -r .decision) = "NO" ]; then
  echo "$RESULT" | jq -r '.alternatives[]' | while read alt; do
    launchlens "$alt"  # Validate each alternative
  done
fi
```