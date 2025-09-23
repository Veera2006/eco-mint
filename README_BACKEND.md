# Blue Carbon Platform Backend

A complete Supabase-powered backend for the AI-powered Carbon Credits MRV (Monitoring, Reporting, Verification) platform.

## 🏗️ Architecture Overview

The backend is built using **Supabase** as the primary infrastructure:
- **Database**: PostgreSQL with Row Level Security (RLS)
- **Authentication**: Supabase Auth with JWT
- **APIs**: Supabase Edge Functions (Deno runtime)
- **File Storage**: Supabase Storage with IPFS integration
- **Real-time**: Supabase Realtime for live updates

## 📊 Database Schema

### Core Tables

1. **profiles** - User profile data with roles
   - `user_id` → References auth.users
   - `role` → Enum: admin, validator, ngo, community
   - `organization`, `wallet_address`

2. **reports** - MRV report submissions
   - Carbon sequestration data (JSONB)
   - File attachments via Storage
   - Status tracking (pending → validating → validated → minted)
   - AI confidence scores

3. **carbon_tokens** - Blockchain-minted carbon credits
   - Links to reports and users
   - Blockchain transaction details
   - Token metadata

4. **governance_approvals** - Multi-sig NGO approvals
   - Report approvals from NGO validators
   - Digital signatures
   - Approval notes and status

## 🔌 API Endpoints (Edge Functions)

### Authentication
- Uses Supabase Auth automatically
- JWT token validation
- Role-based access control

### Core APIs

#### `POST /upload-report`
- Upload MRV JSON data + files
- Store files in Supabase Storage
- Create report record in database

#### `POST /validate-report`
- Trigger AI validation (calls FastAPI ML service)
- Update report with confidence scores
- Set validation status

#### `POST /mint-carbon-token`
- Validate governance approvals (min 2 required)
- Call blockchain smart contract
- Record token details

#### `POST /governance-approve`
- NGO/Panchayat multi-sig approvals
- Role-based authorization
- Track approval progress

#### `GET /analytics-global`
- Aggregate platform statistics
- Sequestration trends
- Token metrics and governance data

## 🔐 Security Features

### Row Level Security (RLS)
- Users can only access their own data
- Admins/validators have elevated permissions
- NGO approvers can access relevant reports

### Authentication & Authorization
- JWT-based authentication via Supabase Auth
- Role-based access control (RBAC)
- Email verification for new users

### Data Validation
- Input sanitization and validation
- File type and size restrictions
- SQL injection prevention

## 🚀 Deployment

### Local Development
1. Install Supabase CLI
2. Run `supabase start`
3. The Edge Functions deploy automatically

### Production
- Edge Functions auto-deploy with Lovable
- Database migrations handled via Supabase Dashboard
- Environment variables managed in Supabase

## 🔧 Integration Points

### AI/ML Service Integration
```typescript
// In validate-report function
const mlResponse = await fetch('YOUR_ML_API_ENDPOINT', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    report_data: report.report_data,
    file_urls: report.file_urls
  })
});
```

### Blockchain Integration  
```typescript
// In mint-carbon-token function
const { ethers } = await import('ethers');
const provider = new ethers.JsonRpcProvider(POLYGON_RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet);

const tx = await contract.mintCarbonToken(
  wallet_address,
  ethers.parseEther(sequestration_amount.toString()),
  report_id
);
```

### IPFS Storage
```typescript
// File uploads automatically use Supabase Storage
// For IPFS integration, add Pinata SDK:
const pinata = new pinataSDK(PINATA_KEY, PINATA_SECRET);
const result = await pinata.pinFileToIPFS(file);
```

## 🧪 Testing & Sample Data

### Sample MRV Reports
Use `src/utils/sampleData.ts` for testing:
- Amazon reforestation data
- Kenya agroforestry projects  
- Indonesia mangrove restoration

### Test Users
Create test accounts with different roles:
- Community users (default)
- NGO validators  
- System administrators

## 📈 Analytics & Monitoring

### Real-time Dashboard Metrics
- Total sequestration amounts
- Token minting statistics
- Validation pipeline status
- Governance approval rates

### Audit Trail
- All actions logged with timestamps
- User attribution for governance decisions
- Blockchain transaction tracking

## 🔗 Frontend Integration

### React Hooks
- `useAuth()` - Authentication management
- `useReports()` - MRV report operations
- `useGovernance()` - Approval workflows
- `useAnalytics()` - Dashboard metrics

### API Service Class
```typescript
import { BlueCarbonAPI } from '@/services/api';

// Upload report
const result = await BlueCarbonAPI.uploadReport(reportData, files);

// Validate report  
await BlueCarbonAPI.validateReport(reportId);

// Mint tokens
await BlueCarbonAPI.mintCarbonToken(reportId, walletAddress);
```

## 🌍 Production Considerations

### Scalability
- Supabase handles auto-scaling
- Edge Functions scale automatically
- Database connection pooling

### Security
- Enable 2FA for admin accounts
- Regular security audits
- HTTPS enforcement
- API rate limiting

### Compliance
- GDPR-compliant user data handling
- Carbon accounting standards (ISO 14064)
- Blockchain transparency requirements

---

## 🔧 Environment Setup

Required Supabase Secrets:
- `OPENAI_API_KEY` (for AI validation - optional)
- `PINATA_JWT` (for IPFS uploads - optional)
- `POLYGON_RPC_URL` (for blockchain - optional)
- `PRIVATE_KEY` (for blockchain - optional)

The platform is ready for hackathon demos with mock services, but can be easily upgraded to production integrations.