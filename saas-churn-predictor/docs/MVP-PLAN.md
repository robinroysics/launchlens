# MVP Build Plan - 4 Weeks to Launch

## Overview
Build a working churn prediction tool that can onboard paying customers in 4 weeks.

## Core MVP Features
- **Data ingestion**: Stripe/Paddle webhooks
- **Basic tracking**: Login frequency, feature usage
- **Risk scoring**: Rule-based (no ML yet)
- **Alerts**: Email/Slack notifications
- **Dashboard**: Simple list of at-risk customers
- **Pricing**: Flat $99/month

---

## Week 1: Foundation (Dec 9-15)

### Goals
- [ ] Landing page live
- [ ] Stripe integration working
- [ ] Basic event tracking API
- [ ] Database schema ready

### Technical Tasks
```javascript
// 1. Set up Node.js + Express server
const app = express();
app.post('/api/track', trackEvent);
app.post('/webhooks/stripe', handleStripeWebhook);

// 2. PostgreSQL schema
CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  customer_id VARCHAR(255),
  event_type VARCHAR(100),
  properties JSONB,
  created_at TIMESTAMP
);

// 3. Simple tracking script
<script src="https://app.churnpredictor.io/track.js" 
        data-api-key="xxx"></script>
```

### Deliverables
- Landing page at churnpredictor.io
- Working webhook endpoint
- Event storage in PostgreSQL
- Basic tracking documentation

---

## Week 2: Intelligence (Dec 16-22)

### Goals
- [ ] Risk scoring algorithm
- [ ] Customer dashboard
- [ ] Daily risk calculation
- [ ] Email alerts working

### Risk Scoring Logic
```javascript
const calculateRiskScore = (customer) => {
  let score = 0;
  
  // Simple rules, no ML
  if (daysSinceLastLogin > 14) score += 30;
  if (monthlyUsageDropped > 50) score += 25;
  if (visitedBillingPage) score += 20;
  if (contactedSupport && sentiment === 'negative') score += 15;
  if (failedPayment) score += 40;
  
  return Math.min(score, 100);
};
```

### Dashboard Features
- List of customers sorted by risk
- Risk score (0-100)
- Last seen date
- Key metrics (logins, usage)
- Quick actions (email, view details)

---

## Week 3: Actions (Dec 23-29)

### Goals
- [ ] Retention playbooks
- [ ] Email templates
- [ ] Slack integration
- [ ] Intervention tracking

### Retention Playbooks
```javascript
const playbooks = {
  dormant: {
    trigger: "No login in 14+ days",
    action: "Send re-engagement email",
    template: "we-miss-you",
    discount: "20% off next month"
  },
  
  declining: {
    trigger: "Usage dropped 50%+",
    action: "Schedule check-in call",
    template: "how-can-we-help",
    followUp: "Product feedback survey"
  },
  
  paymentIssue: {
    trigger: "Failed payment",
    action: "Payment retry sequence",
    template: "update-payment-method",
    escalation: "Direct phone call"
  }
};
```

### Integration Code
```javascript
// Slack notification
const notifySlack = async (customer, risk) => {
  await slack.post({
    text: `⚠️ High risk customer alert`,
    blocks: [{
      text: `${customer.name} - Risk: ${risk.score}/100`,
      action: risk.suggestedAction
    }]
  });
};
```

---

## Week 4: Polish & Launch (Dec 30 - Jan 5)

### Goals
- [ ] Onboarding flow
- [ ] Documentation site
- [ ] 5 beta customers
- [ ] Critical bug fixes

### Onboarding Flow
1. Sign up → Stripe Checkout
2. Connect data source (5 min)
   - Add Stripe webhook
   - Install tracking snippet
   - Connect Slack (optional)
3. See first insights (24 hours)
4. First alert (when triggered)

### Beta Customer Outreach
```markdown
Subject: Prevent churn for $99/month - looking for 5 beta users

Hi [Name],

I noticed you run a SaaS doing ~$[X]K MRR. 

I built a tool that predicts which customers will churn 
and tells you exactly how to save them.

- Takes 5 min to set up
- $99/month (50% off for beta users)
- Already integrated with Stripe

Want to be one of my first 5 users?

[Your name]
```

### Success Metrics
- 5 paying beta customers
- <5 min setup time
- 1 prevented churn per customer
- NPS > 8 from beta users

---

## Post-MVP Roadmap

### Month 2
- Machine learning model
- More integrations (Paddle, Chargebee)
- Team collaboration features
- Custom playbooks

### Month 3
- API for developers
- Cohort analysis
- Revenue impact tracking
- White-label option

### Month 6
- $10K MRR (100 customers)
- Hire first engineer
- Enterprise tier ($499/month)

---

## What We're NOT Building (Yet)
❌ Machine learning - use simple rules
❌ Real-time processing - batch is fine
❌ Mobile app - web only
❌ Complex integrations - just Stripe
❌ Multiple pricing tiers
❌ Free trial - straight to paid
❌ API access - UI only
❌ Custom reports - fixed dashboard

## Resources Needed
- **Time**: 4 weeks full-time
- **Cost**: ~$200/month (hosting + tools)
- **Skills**: Node.js, PostgreSQL, React
- **Tools**: Railway (hosting), Stripe, SendGrid