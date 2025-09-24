# External Services Deployment Guide

This guide covers deploying the smart contracts and ML validation service that integrate with the Blue Carbon platform.

## 🔗 Smart Contracts (Polygon)

### Prerequisites
```bash
cd contracts
npm install
```

### Environment Setup
Create `contracts/.env`:
```bash
PRIVATE_KEY=your_wallet_private_key
POLYGON_MUMBAI_RPC_URL=https://rpc-mumbai.maticvigil.com
POLYGON_RPC_URL=https://polygon-rpc.com
POLYGONSCAN_API_KEY=your_polygonscan_api_key
```

### Deployment Commands

**Mumbai Testnet:**
```bash
cd contracts
npm run deploy:mumbai
```

**Polygon Mainnet:**
```bash
cd contracts
npm run deploy:polygon
```

### Integration with Supabase

After deployment, update the Edge Functions with contract details:

1. **Add Secrets in Supabase Dashboard:**
   - `POLYGON_RPC_URL`: Your Polygon RPC endpoint
   - `PRIVATE_KEY`: Contract owner private key
   - `CARBON_TOKEN_ADDRESS`: Deployed CarbonToken address
   - `GOVERNANCE_ADDRESS`: Deployed GovernanceMultiSig address

2. **Update Edge Functions:**
   The `mint-carbon-token` function will automatically use these contracts:

```typescript
// In mint-carbon-token/index.ts
const { ethers } = await import('ethers');
const provider = new ethers.JsonRpcProvider(Deno.env.get('POLYGON_RPC_URL'));
const wallet = new ethers.Wallet(Deno.env.get('PRIVATE_KEY'), provider);

const carbonTokenContract = new ethers.Contract(
  Deno.env.get('CARBON_TOKEN_ADDRESS'),
  CARBON_TOKEN_ABI, // Import from deployments/
  wallet
);
```

### Contract Verification

Contracts are automatically verified on Polygonscan during deployment. View them at:
- Mumbai: `https://mumbai.polygonscan.com/address/{contract_address}`
- Polygon: `https://polygonscan.com/address/{contract_address}`

---

## 🤖 ML Validation Service

### Local Development

**Using Docker (Recommended):**
```bash
cd ml-service
docker-compose up -d
```

**Using Python:**
```bash
cd ml-service
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

### Production Deployment

**Deploy to Railway:**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Deploy
cd ml-service
railway login
railway init
railway up
```

**Deploy to Heroku:**
```bash
# Install Heroku CLI and login
cd ml-service
heroku create blue-carbon-ml-service
git init
git add .
git commit -m "Initial ML service"
heroku git:remote -a blue-carbon-ml-service
git push heroku main
```

**Deploy to Google Cloud Run:**
```bash
# Build and deploy
cd ml-service
gcloud builds submit --tag gcr.io/PROJECT_ID/blue-carbon-ml
gcloud run deploy --image gcr.io/PROJECT_ID/blue-carbon-ml --platform managed
```

### Integration with Supabase

Update the `validate-report` Edge Function to call your deployed ML service:

```typescript
// In validate-report/index.ts
const ML_SERVICE_URL = Deno.env.get('ML_SERVICE_URL') || 'https://your-ml-service.com';

const mlResponse = await fetch(`${ML_SERVICE_URL}/validate-report`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    report_data: report.report_data,
    file_urls: report.file_urls
  })
});

const validation = await mlResponse.json();
```

Add `ML_SERVICE_URL` secret in Supabase Dashboard.

---

## 🧪 Testing Integration

### Test Deployed Contracts
```bash
cd scripts
node test-contracts.js
```

### Test ML Service
```bash
cd scripts
chmod +x test-ml-service.sh
./test-ml-service.sh
```

### Full Integration Test
```bash
cd scripts
node test-contracts.js && ./test-ml-service.sh
```

---

## 🔧 Environment Variables Summary

### Supabase Secrets (Required)
```bash
# Blockchain Integration
POLYGON_RPC_URL=https://polygon-rpc.com
PRIVATE_KEY=your_wallet_private_key
CARBON_TOKEN_ADDRESS=0x... # From deployment
GOVERNANCE_ADDRESS=0x...   # From deployment

# ML Service Integration  
ML_SERVICE_URL=https://your-ml-service.com

# Optional: IPFS Integration
PINATA_JWT=your_pinata_jwt_token
```

### Local Development (.env)
```bash
# For contract deployment
PRIVATE_KEY=your_wallet_private_key
POLYGON_MUMBAI_RPC_URL=https://rpc-mumbai.maticvigil.com
POLYGON_RPC_URL=https://polygon-rpc.com
POLYGONSCAN_API_KEY=your_polygonscan_api_key

# For testing
ML_SERVICE_URL=http://localhost:8000
```

---

## 🚀 Production Checklist

### Smart Contracts
- [ ] Deploy to Polygon mainnet
- [ ] Verify contracts on Polygonscan  
- [ ] Set up multi-sig wallet for contract ownership
- [ ] Add production approvers to GovernanceMultiSig
- [ ] Update Supabase secrets with mainnet addresses

### ML Service
- [ ] Deploy to production cloud provider
- [ ] Set up monitoring and logging
- [ ] Configure auto-scaling
- [ ] Add API rate limiting
- [ ] Set up backup/disaster recovery
- [ ] Update Supabase with production ML service URL

### Security
- [ ] Rotate all private keys
- [ ] Enable 2FA on all services
- [ ] Set up monitoring alerts
- [ ] Conduct security audit
- [ ] Configure CORS properly
- [ ] Set up API authentication

---

## 📊 Monitoring & Logs

### Contract Events
Monitor key events on-chain:
- `TokenMinted`: New carbon credits minted
- `ApprovalSubmitted`: Governance approvals
- `ApprovalExecuted`: Multi-sig execution

### ML Service Metrics
Monitor service health:
- Request volume and latency
- Validation success/failure rates
- Model confidence score distribution
- Error rates and types

### Integration Health
- Supabase Edge Function execution logs
- API call success rates between services
- End-to-end transaction completion

Use the Supabase Dashboard and your cloud provider's monitoring tools to track these metrics.