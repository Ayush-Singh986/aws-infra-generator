<p align="center">
  <h1>🚀 AWS Infra Generator</h1>
</p>

<p align="center">
  <img src="public/banner.png" alt="AWS Infra Generator Banner" width="800" />
</p>

<p align="center">
  <strong>Design AWS infrastructure visually and generate production-ready Terraform or CloudFormation — no manual IaC writing required.</strong>
</p>

---

## What Is This Tool?

**AWS Infra Generator** is a browser-based platform engineering tool that helps you go from service selection to deployable infrastructure in minutes.

Pick the AWS services you need, configure them through a guided wizard, validate your setup, and export a ready-to-use IaC project — all without leaving your browser. No backend server required; everything runs client-side.

---

## How It Helps You

| Who | How it helps |
|-----|----------------|
| **DevOps & Platform Engineers** | Prototype stacks faster, standardize templates, and catch dependency issues before deploy |
| **Developers** | Learn AWS architecture patterns and generate correct IaC without starting from a blank file |
| **Startups & Small Teams** | Ship infra quickly without deep Terraform or CloudFormation expertise |
| **Consultants** | Produce consistent, documented infrastructure for client projects |

**In practice, you save time, reduce misconfiguration, and get clearer cost and architecture visibility before anything hits AWS.**

---

## How to Use It

### 1. Get started locally

```bash
git clone https://github.com/Ayush-Singh986/aws-infra-generator.git
cd aws-infra-generator
npm install
```

**Optional — Enable the AI Infrastructure Advisor chatbot:**

1. Get a **free** Gemini API key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey) (no credit card required)
2. Create a `.env.local` file in the project root:
```bash
GEMINI_API_KEY=your_gemini_api_key_here
```

Then start the dev server:
```bash
npm run dev
```

Open **http://localhost:3000** in your browser.

> Without the API key the app works fully — the AI chat button will show an error message if clicked. Everything else works without any key.

### 2. Follow the wizard

| Step | What you do |
|------|-------------|
| **Services** | Select AWS services (or start from a preset template) |
| **Configure** | Set project name, region, environment, output format, and per-service options |
| **Generate** | Validate and generate Terraform or CloudFormation files |
| **Export** | Preview, copy, or download everything as a ZIP |

### 3. Deploy

**Terraform:**

```bash
cd my-infra
terraform init
terraform plan
terraform apply
```

**CloudFormation:**

```bash
cd my-infra
aws cloudformation deploy \
  --template-file template.json \
  --stack-name my-infra-stack \
  --capabilities CAPABILITY_IAM
```

> **Tip:** If you change configuration after generating, the app will prompt you to **re-generate** before exporting — so your download always matches your latest settings.

---

## What Makes This Tool Incredible

### 🎯 End-to-end wizard, not just a code dump
A clear **Services → Configure → Generate → Export** flow with step navigation, validation gates, and progress you can trust.

### ☁️ 32+ AWS services, one unified experience
VPC, EC2, Lambda, ECS, EKS, S3, RDS, DynamoDB, ALB, API Gateway, IAM, SQS, SNS, CloudWatch, Step Functions, CodePipeline, and more — with **automatic dependency resolution** so related services are included for you.

### 📋 Preset architecture templates
Jump-start common patterns: web apps, serverless APIs, microservices, data pipelines, ML workloads, and static sites.

### 💰 Cost estimation built in
See **monthly and yearly** cost projections with per-service breakdowns before you deploy.

### 📊 Live infrastructure diagram
Interactive architecture view with service relationships, categories, and SVG export for docs and presentations.

### 🔍 Real Terraform plan preview
Plan output is **parsed from your actual generated `.tf` files** — see which resources will be created and key attributes before you download.

### ✅ Validation before generation
Dependency checks, config validation, and warnings — so you fix issues **before** generating code.

### 📦 Smart export
Download a ZIP with your IaC files, optional **README.md** and **`.gitignore`**, deploy commands, and file preview with copy/open actions.

### 🔒 Privacy-first & fast
Runs entirely in the browser. Your config stays on your machine. Generation is instant with no server round-trips.

### 💾 Session persistence
Wizard progress is saved locally — refresh the page and pick up where you left off.

---


---

## 🤖 AI Infrastructure Advisor

The AI chatbot is a built-in AWS architecture expert powered by **Google Gemini**. It lives in the bottom-right corner of every page as a floating chat button.

### What it does

Describe what you want to build in plain English and the advisor will:

- **Recommend the right AWS services** with clear reasoning (e.g. "Use ECS Fargate instead of EC2 because you don't need to manage servers")
- **Explain the architecture** — how the services connect and why
- **Warn about common mistakes** for that specific stack
- **Estimate rough costs** before you commit to an architecture
- **Tell you which services to pick** in the wizard to build exactly what you described

### Example conversations

> **You:** I need to deploy a Node.js REST API that handles 10,000 requests per day with a PostgreSQL database and file uploads.
>
> **Advisor:** For this workload I'd recommend:
> - `ECS Fargate` for the API — serverless containers, no EC2 management
> - `RDS` (PostgreSQL) — managed database with automated backups
> - `S3` for file uploads — cost-effective object storage
> - `ALB` — load balancer to route traffic to your containers
> - `VPC` — isolated network for security
>
> In the wizard, select: VPC → RDS → S3 → ALB → ECS

---

> **You:** What's the cheapest way to host a static website on AWS?
>
> **Advisor:** `S3` + `CloudFront` is the standard approach. S3 hosts the files (~$0.023/GB/month), CloudFront serves them from edge locations globally. For a typical marketing site you're looking at under $1/month.

---

### Setup (5 minutes, free)

**Step 1 — Get a Gemini API key**

1. Go to [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
2. Sign in with your Google account
3. Click **"Create API key"**
4. Copy the key

No credit card required. Free tier limits:
- 15 requests per minute
- 1 million tokens per day
- Completely free

**Step 2 — Add the key to your project**

Create a `.env.local` file in the project root (next to `package.json`):

```bash
GEMINI_API_KEY=AIzaSy...your_key_here
```

**Step 3 — Restart the dev server**

```bash
npm run dev
```

The chat button in the bottom-right corner will now be fully active.

---

### Deploying with the AI chatbot

**On Vercel:**

1. Go to your project on [vercel.com](https://vercel.com)
2. Click **Settings → Environment Variables**
3. Add: `GEMINI_API_KEY` = your key
4. Redeploy

**On Ubuntu server:**

```bash
# Add to your environment before running npm start
export GEMINI_API_KEY=your_key_here
npm start

# Or add it to a .env.local file on the server
echo "GEMINI_API_KEY=your_key_here" > .env.local
npm run build
npm start
```

---

### How it works (technical)

The chatbot uses a **Next.js API route** (`/api/ai-chat`) as a secure server-side proxy. Your Gemini API key never reaches the browser — all requests go through the server.

```
Browser → POST /api/ai-chat → Google Gemini API → Response → Browser
```

The AI is given a system prompt that makes it behave specifically as an AWS architecture expert, with knowledge of all 32+ services in the wizard. It maintains full conversation history so follow-up questions work naturally.

**Model used:** `gemini-1.5-flash` — fast, accurate, and free tier friendly.

---

## Deploying to Production

### Vercel (recommended — free)

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **Add New Project** → import `aws-infra-generator`
3. Add environment variable: `GEMINI_API_KEY` = your key
4. Click **Deploy**

Every `git push` to `main` auto-deploys. You get HTTPS, CDN, and a live URL instantly.

### Ubuntu Server

```bash
# Pull latest code
git pull origin main
git checkout -- package-lock.json  # if there are conflicts

# Install and build
npm install
npm run build

# Add your Gemini key
echo "GEMINI_API_KEY=your_key_here" > .env.local

# Start production server
npm start
```

Keep it running with PM2:

```bash
sudo npm install -g pm2
pm2 start "npm start" --name aws-infra-generator
pm2 save
pm2 startup
```

---

## License

MIT — see [LICENSE](./LICENSE) for details.
