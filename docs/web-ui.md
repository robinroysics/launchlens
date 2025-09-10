# Web UI Guide

## Overview

LaunchLens includes a simple web interface for those who prefer a browser over CLI. It's a lightweight, single-page application that runs locally.

## Starting the Web Server

```bash
# Clone the repo (if not installed globally)
git clone https://github.com/khoaleeeeee/launchlens.git
cd launchlens

# Install dependencies
npm install

# Start the server
npm start
# or
node server.js
```

Server runs at: `http://localhost:3003`

## Features

### Simple Input Form
- Large text area for idea description
- Roast mode toggle for harsh feedback
- Detailed analysis toggle for comprehensive scores

### Real-time Validation
- Instant feedback as you type (with debouncing)
- Loading animation during analysis
- Color-coded results (Green = YES, Red = NO, Yellow = MAYBE)

### Visual Results
- Clean card-based layout
- Emoji indicators for different sections
- Expandable competitor details
- Progress bars for scores (in detailed mode)

## Screenshots

### Input Screen
```
┌─────────────────────────────────────┐
│ LaunchLens    Quick Idea Validation │
├─────────────────────────────────────┤
│                                     │
│ Should You Build This?              │
│ Get a clear YES or NO in 30 seconds│
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Describe your idea              │ │
│ │ [Text area for input]           │ │
│ └─────────────────────────────────┘ │
│                                     │
│ □ 🔥 Roast Mode  □ 📊 Detailed     │
│                                     │
│ [Validate Idea]                     │
└─────────────────────────────────────┘
```

### Results Display
```
┌─────────────────────────────────────┐
│ VERDICT: YES ✅                     │
├─────────────────────────────────────┤
│ 📊 REASONS:                         │
│ • Real problem being solved         │
│ • Growing market demand             │
│ • Technical differentiation possible│
│                                     │
│ 🏢 COMPETITORS:                     │
│ • Competitor 1: Description         │
│ • Competitor 2: Description         │
│                                     │
│ [Validate Another]                  │
└─────────────────────────────────────┘
```

## API Endpoints

The web UI uses these endpoints:

### POST /api/validate
```javascript
// Request
{
  "idea": "Your startup idea",
  "roastMode": false,
  "detailed": false
}

// Response
{
  "success": true,
  "decision": "YES",
  "reasons": [...],
  "competitors": [...],
  "scores": {...}  // If detailed=true
}
```

### GET /health
```javascript
// Response
{
  "status": "OK",
  "version": "MVP",
  "apis": {
    "openai": true,
    "perplexity": false
  }
}
```

## Customization

### Modify the UI

Edit `public/index.html`:

```html
<!-- Change colors -->
<style>
  .verdict-yes { color: #10b981; }  /* Green */
  .verdict-no { color: #ef4444; }   /* Red */
  .verdict-maybe { color: #f59e0b; } /* Yellow */
</style>

<!-- Add your logo -->
<header>
  <img src="your-logo.png" alt="Logo">
  <h1>Your Brand</h1>
</header>
```

### Add Custom Styling

The UI uses Tailwind CSS via CDN. Add custom styles:

```html
<style>
  /* Dark mode */
  @media (prefers-color-scheme: dark) {
    body { 
      background: #1a1a1a;
      color: #fff;
    }
  }
  
  /* Custom animations */
  @keyframes slideIn {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  
  .result-card {
    animation: slideIn 0.3s ease;
  }
</style>
```

## Deployment Options

### Local Only (Recommended)
Keep it simple - run locally with your own API keys:
```bash
npm start
```

### Deploy to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
# OPENAI_API_KEY, PERPLEXITY_API_KEY
```

### Docker Container
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3003
CMD ["node", "server.js"]
```

```bash
docker build -t launchlens-web .
docker run -p 3003:3003 --env-file .env launchlens-web
```

### Deploy to Railway/Render
1. Connect GitHub repo
2. Set environment variables
3. Deploy with one click

## Security Considerations

⚠️ **Important**: The web UI is designed for local use. If deploying publicly:

1. **Add authentication** - Don't expose your API keys
2. **Rate limiting** - Prevent abuse
3. **CORS configuration** - Restrict origins
4. **Input sanitization** - Prevent XSS
5. **HTTPS only** - Use SSL certificates

### Example: Adding Basic Auth

```javascript
// server.js
import basicAuth from 'express-basic-auth';

app.use(basicAuth({
  users: { 'admin': process.env.ADMIN_PASSWORD },
  challenge: true
}));
```

## Differences from CLI

| Feature | CLI | Web UI |
|---------|-----|--------|
| Installation | Global npm package | Local server |
| API Keys | Encrypted local storage | Environment variables |
| Batch Processing | ✅ Yes | ❌ No |
| JSON Output | ✅ Yes | Via API endpoint |
| Automation | ✅ Easy | Requires API calls |
| Visual Results | Terminal colors | HTML/CSS styled |
| Accessibility | Terminal users | Browser users |

## Troubleshooting

### Port Already in Use
```bash
# Change port
PORT=3004 npm start

# Or kill existing process
lsof -i :3003
kill -9 <PID>
```

### API Keys Not Working
```bash
# Check if set
echo $OPENAI_API_KEY

# Set in .env file
echo "OPENAI_API_KEY=sk-..." > .env
```

### CORS Issues
```javascript
// server.js - Add specific origin
app.use(cors({
  origin: 'http://localhost:3000'
}));
```

## Use Cases for Web UI

1. **Quick demos** - Show non-technical people
2. **Team sharing** - Run on local network
3. **Mobile access** - Use from phone browser
4. **Visual preference** - Some prefer GUI over CLI
5. **Copy-paste friendly** - Easier to share results