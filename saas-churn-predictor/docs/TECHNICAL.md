# Technical Architecture

## Tech Stack

### Core
- **Backend**: Node.js + Express
- **Database**: PostgreSQL (time-series data)
- **Queue**: Bull (scheduled jobs)
- **Cache**: Redis (risk scores)

### Infrastructure
- **Hosting**: Railway.app ($20/month)
- **CDN**: Cloudflare (free tier)
- **Monitoring**: Sentry (free tier)
- **Analytics**: Segment (free tier)

---

## System Architecture

```
┌─────────────────┐     ┌─────────────────┐
│  Customer SaaS  │────▶│   Stripe API    │
└─────────────────┘     └─────────────────┘
         │                       │
         │ Track.js             │ Webhooks
         ▼                       ▼
┌─────────────────────────────────────────┐
│         API Gateway (Express)           │
└─────────────────────────────────────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│   Event Store   │     │   Risk Engine   │
│  (PostgreSQL)   │────▶│   (Node.js)     │
└─────────────────┘     └─────────────────┘
                                │
                        ┌───────┴────────┐
                        ▼                ▼
                ┌─────────────┐  ┌─────────────┐
                │    Alerts   │  │  Dashboard  │
                │(Email/Slack)│  │   (React)   │
                └─────────────┘  └─────────────┘
```

---

## Database Schema

```sql
-- Customers table
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id VARCHAR(255) UNIQUE NOT NULL,
  company_name VARCHAR(255),
  email VARCHAR(255),
  stripe_customer_id VARCHAR(255),
  mrr DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Events table (time-series)
CREATE TABLE events (
  id BIGSERIAL PRIMARY KEY,
  customer_id UUID REFERENCES customers(id),
  event_type VARCHAR(100) NOT NULL,
  properties JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_events_customer_time ON events(customer_id, created_at DESC);
CREATE INDEX idx_events_type ON events(event_type);

-- Risk scores table
CREATE TABLE risk_scores (
  id BIGSERIAL PRIMARY KEY,
  customer_id UUID REFERENCES customers(id),
  score INTEGER CHECK (score >= 0 AND score <= 100),
  factors JSONB,
  calculated_at TIMESTAMP DEFAULT NOW()
);

-- Interventions table
CREATE TABLE interventions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id),
  type VARCHAR(100),
  status VARCHAR(50),
  outcome VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## API Endpoints

### Event Tracking
```javascript
POST /api/track
{
  "customerId": "cust_123",
  "event": "feature_used",
  "properties": {
    "feature": "export",
    "count": 5
  }
}
```

### Webhook Handler
```javascript
POST /webhooks/stripe
// Stripe webhook payload
{
  "type": "customer.subscription.deleted",
  "data": {...}
}
```

### Risk API
```javascript
GET /api/customers/:id/risk
Response:
{
  "score": 75,
  "level": "high",
  "factors": [
    "No login for 14 days",
    "Usage dropped 60%"
  ],
  "suggestedAction": "Send re-engagement email"
}
```

---

## Risk Calculation Algorithm

```javascript
class RiskCalculator {
  constructor(customer, events) {
    this.customer = customer;
    this.events = events;
  }

  calculate() {
    const factors = [];
    let score = 0;

    // Login frequency
    const daysSinceLogin = this.daysSinceLastEvent('login');
    if (daysSinceLogin > 14) {
      score += 30;
      factors.push(`No login for ${daysSinceLogin} days`);
    }

    // Usage trends
    const usageChange = this.calculateUsageChange();
    if (usageChange < -50) {
      score += 25;
      factors.push(`Usage dropped ${Math.abs(usageChange)}%`);
    }

    // Billing page visits
    if (this.hasRecentEvent('billing_page_view', 7)) {
      score += 20;
      factors.push('Viewed billing page recently');
    }

    // Support interactions
    const supportSentiment = this.getRecentSupportSentiment();
    if (supportSentiment === 'negative') {
      score += 15;
      factors.push('Negative support interaction');
    }

    // Payment issues
    if (this.hasRecentEvent('payment_failed', 30)) {
      score += 40;
      factors.push('Recent payment failure');
    }

    return {
      score: Math.min(score, 100),
      factors,
      level: this.getLevel(score)
    };
  }

  getLevel(score) {
    if (score >= 70) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
  }
}
```

---

## Integration Guide

### 1. Stripe Webhook Setup
```javascript
// Customer adds this webhook URL in Stripe Dashboard
https://api.churnpredictor.io/webhooks/stripe?key=YOUR_API_KEY

// Events to subscribe to:
- customer.subscription.updated
- customer.subscription.deleted
- charge.failed
- invoice.payment_failed
```

### 2. JavaScript Tracking
```html
<!-- Add to customer's app -->
<script src="https://api.churnpredictor.io/track.js"></script>
<script>
  ChurnPredictor.init('YOUR_API_KEY');
  
  // Track login
  ChurnPredictor.track('login', {
    userId: 'user_123'
  });
  
  // Track feature usage
  ChurnPredictor.track('feature_used', {
    feature: 'export',
    count: 5
  });
</script>
```

### 3. Server-Side Tracking
```javascript
// Node.js example
const ChurnPredictor = require('@churnpredictor/node');
const cp = new ChurnPredictor('YOUR_API_KEY');

// Track API usage
app.post('/api/export', async (req, res) => {
  // Your export logic
  
  // Track the event
  await cp.track({
    customerId: req.user.companyId,
    event: 'api_export',
    properties: {
      records: 1000
    }
  });
});
```

---

## Security Considerations

### API Authentication
```javascript
// API key validation middleware
const validateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || req.query.key;
  
  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }
  
  // Validate against database
  const account = await getAccountByApiKey(apiKey);
  if (!account) {
    return res.status(401).json({ error: 'Invalid API key' });
  }
  
  req.account = account;
  next();
};
```

### Data Privacy
- No PII storage (only IDs)
- GDPR compliant data deletion
- SSL/TLS encryption
- Webhook signature verification

### Rate Limiting
```javascript
const rateLimit = require('express-rate-limit');

const trackingLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: 'Too many events, please slow down'
});

app.post('/api/track', trackingLimiter, trackEvent);
```

---

## Deployment

### Environment Variables
```bash
# .env.example
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# Redis
REDIS_URL=redis://localhost:6379

# Stripe
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Email
SENDGRID_API_KEY=SG.xxx

# Slack
SLACK_CLIENT_ID=xxx
SLACK_CLIENT_SECRET=xxx
```

### Railway Deployment
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Deploy
railway up

# Set environment variables
railway variables set KEY=value
```

---

## Monitoring & Alerts

### Health Check
```javascript
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});
```

### Error Tracking
```javascript
const Sentry = require('@sentry/node');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV
});

app.use(Sentry.Handlers.errorHandler());
```

### Metrics
- Response time (p50, p95, p99)
- Risk calculations per minute
- Webhook processing time
- Alert delivery success rate