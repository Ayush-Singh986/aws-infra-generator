# my-infra — Terraform Infrastructure Stack

This folder is the **deployable output** of the AWS Infra Generator tool.
It contains production-ready Terraform code that creates a VPC + EC2 + S3 stack on AWS.

Run `terraform apply` inside this folder and all the AWS resources described below will be live in minutes.

---

## What Gets Created on AWS

```
AWS Account
└── Region: us-east-1
    ├── VPC (my-infra-development-vpc)
    │   ├── Internet Gateway
    │   ├── Public Subnet 1  (10.0.0.0/24) — AZ-a  ← EC2 lives here
    │   ├── Public Subnet 2  (10.0.1.0/24) — AZ-b
    │   ├── Private Subnet 1 (10.0.10.0/24) — AZ-a
    │   ├── Private Subnet 2 (10.0.11.0/24) — AZ-b
    │   └── Route Table (public → Internet Gateway)
    │
    ├── EC2 Instance (my-infra-development-instance-1)
    │   ├── Type: t3.micro (1 vCPU, 1GB RAM)
    │   ├── OS: Amazon Linux 2023 (latest AMI, auto-selected)
    │   ├── Storage: 20GB encrypted gp3 SSD
    │   ├── Security Group (ports 22, 80, 443 open)
    │   └── IAM Role (AWS Systems Manager access)
    │
    └── S3 Bucket (my-infra-development-data-<random-suffix>)
        ├── Versioning: Enabled
        ├── Encryption: AES-256 at rest
        └── Public Access: Fully Blocked
```

Estimated cost: ~$8–10/month (t3.micro is free tier eligible for 12 months on new AWS accounts).

---

## File by File Explanation

### `main.tf` — The Foundation

The first file Terraform reads. Sets up the engine.

- Declares required Terraform version (`>= 1.5`)
- Pulls in the official AWS provider plugin (`~> 5.0`)
- Sets the AWS region from `var.aws_region`
- Creates a `random_pet` resource for unique bucket naming (e.g. "happy-fox")
- Applies common tags (`Project`, `Environment`, `ManagedBy`) to every resource
- Uses `backend "local"` — state file is saved on your machine as `terraform.tfstate`

> For teams, change the backend to `"s3"` so everyone shares the same state file.

---

### `variables.tf` — The Settings Menu

Declares all input variables. None of these create resources — they just define what values the code accepts.

| Variable | Default | What it controls |
|---|---|---|
| `project_name` | `my-infra` | Prefix for all resource names |
| `environment` | `development` | dev / staging / production |
| `aws_region` | `us-east-1` | Which AWS data center to use |
| `vpc_cidr` | `10.0.0.0/16` | Your private IP address range (65,536 addresses) |
| `instance_type` | `t3.micro` | Size of the EC2 server |
| `instance_count` | `1` | How many EC2 instances to create |
| `root_volume_size` | `20` | EC2 hard drive size in GB |
| `allowed_cidr_blocks` | `0.0.0.0/0` | Who can SSH into the server — restrict to your IP in production |
| `s3_bucket_suffix` | `data` | Part of the S3 bucket name |
| `s3_versioning` | `true` | Keep old file versions in S3 |

---

### `terraform.tfvars` — Your Personal Values

Edit this file before deploying. Override any default from `variables.tf` here.

```hcl
project_name  = "my-infra"
aws_region    = "us-east-1"
instance_type = "t3.micro"
```

This keeps the code generic and reusable. You can have `dev.tfvars`, `staging.tfvars`, `prod.tfvars` and deploy to all three environments with the same code.

---

### `vpc.tf` — Your Private Network

Creates the entire networking layer. Everything else depends on this.

**What it builds:**

```
VPC (10.0.0.0/16) — your private building inside AWS
├── Internet Gateway — the front door to the internet
├── Public Subnet 1 & 2 — rooms with internet access (web servers go here)
├── Private Subnet 1 & 2 — rooms with no internet (databases go here)
└── Route Table — traffic directory: send 0.0.0.0/0 to the Internet Gateway
```

**Why 2 subnets in 2 Availability Zones?**
Each AZ is a physically separate data center. Spreading across 2 AZs means if one data center has a problem, your app still runs in the other. This is called high availability.

**Public vs Private subnets:**
- Public = has a route to the Internet Gateway → internet can reach it → use for web servers
- Private = no internet route → only reachable from within the VPC → use for databases

---

### `ec2.tf` — Your Virtual Server

Creates a computer in the cloud that runs your application.

**What it builds:**

```
1. AMI Data Source
   → Automatically finds the latest Amazon Linux 2023 image
   → No hardcoded AMI ID that goes stale

2. Security Group (Firewall)
   → Port 22  (SSH)   — allowed_cidr_blocks only
   → Port 80  (HTTP)  — open to internet
   → Port 443 (HTTPS) — open to internet
   → All outbound     — server can reach the internet

3. IAM Role + Instance Profile
   → The server's AWS identity card
   → AmazonSSMManagedInstanceCore policy attached
   → Lets you connect via AWS Systems Manager (no SSH key needed)

4. EC2 Instance
   → Placed in public_subnet_0
   → Gets a public IP address
   → 20GB encrypted gp3 SSD
   → Automatically replaced (not updated) when changed: create_before_destroy = true
```

**Why IAM Role instead of credentials?**
The server proves its identity through the role, not stored passwords. It can call AWS services (S3, CloudWatch) based on what the role permits — no secrets stored anywhere on the machine.

---

### `s3.tf` — Your File Storage

Creates a private, encrypted, versioned cloud storage bucket.

**What it builds:**

```
S3 Bucket: my-infra-development-data-happy-fox
(project + environment + suffix + random name for global uniqueness)

├── Versioning ON
│   → Every overwrite keeps the previous version
│   → Recover deleted or overwritten files any time
│   → Like Git for your stored files
│
├── Encryption: AES-256
│   → Every file is encrypted at rest automatically
│   → Unreadable without AWS decryption, even with physical disk access
│
└── Public Access Block (all 4 settings = true)
    → No one on the internet can access this bucket
    → Not via URL, not via bucket policy, not by any means
    → Only your EC2 instance (via IAM role) can read/write
```

---

### `outputs.tf` — The Results

After `terraform apply` finishes, this prints your new resource details to the terminal.

```
vpc_id            → vpc-0abc1234def56789
public_subnet_ids → [subnet-xxx, subnet-yyy]
private_subnet_ids→ [subnet-aaa, subnet-bbb]
ec2_instance_ids  → [i-0abc1234def56789]
ec2_public_ips    → [3.92.45.123]      ← use this to SSH or visit in browser
s3_bucket_name    → my-infra-development-data-happy-fox
s3_bucket_arn     → arn:aws:s3:::my-infra-...
```

---

### `.gitignore` — What NOT to Commit to Git

```
terraform.tfstate        ← NEVER commit — contains real AWS resource IDs and sensitive values
terraform.tfstate.backup
.terraform/              ← provider plugin binaries (huge, auto-downloaded on init)
.terraform.lock.hcl
*.auto.tfvars            ← may contain secrets
```

The state file is the most critical exclusion. It maps your code to real AWS resource IDs and can contain sensitive data. If two people commit different state files, Terraform loses track of what exists and may try to create duplicate resources or delete the wrong ones.

---

## How to Deploy

### Prerequisites
- [Terraform](https://developer.hashicorp.com/terraform/install) installed
- [AWS CLI](https://aws.amazon.com/cli/) installed and configured (`aws configure`)

### Steps

```bash
# 1. Edit terraform.tfvars with your values
#    At minimum, restrict allowed_cidr_blocks to your own IP

# 2. Download the AWS provider plugin
terraform init

# 3. Preview what will be created (no cost, no changes)
terraform plan

# 4. Deploy to AWS (creates real resources, costs money)
terraform apply

# 5. When you are done, delete everything
terraform destroy
```

### After Deploy

Your terminal will print the EC2 public IP. You can SSH into it:

```bash
ssh ec2-user@<ec2_public_ip>
```

Or use AWS Systems Manager in the AWS Console (no SSH key required — the IAM role handles authentication).

---

## Estimated Monthly Cost

| Resource | Type | Est. Cost/month |
|---|---|---|
| EC2 Instance | t3.micro | $0 (free tier) / ~$8.50 after free tier |
| S3 Bucket | First 5GB | ~$0.12 |
| VPC, Subnets, IGW | - | Free |
| Data Transfer | Minimal | ~$0–1 |

**Total: ~$0 (free tier) or ~$9–10/month after 12 months**

> Free tier applies to new AWS accounts for the first 12 months: 750 hours/month of t3.micro and 5GB of S3 storage.
