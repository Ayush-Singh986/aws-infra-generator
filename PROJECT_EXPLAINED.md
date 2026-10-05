# AWS Infra Generator — Complete Guide
### Simple English · Real-World Problem · Interview Questions at Every Level

---

## Part 1 — What Is This Project? (Plain English)

### The Real-World Problem

Imagine you are a developer at a startup. Your boss says:
> "We need to deploy our app on AWS by Friday."

You open the AWS console. You see 200+ services, hundreds of settings, and zero clear starting point.

So you:
1. Click around randomly and create things manually in the AWS Console
2. Forget what you created
3. Cannot repeat it for a second environment (staging, production)
4. Your teammate cannot understand what you built
5. You delete the wrong thing and your app goes down
6. You have no idea what it will cost until the bill arrives

This is the **real problem** — setting up cloud infrastructure manually is slow, error-prone, undocumented, and impossible to repeat consistently.

---

### The Solution This Project Proposes

**AWS Infra Generator** is a browser-based visual tool that solves every one of those problems:

| Problem | How this tool fixes it |
|---|---|
| Don't know where to start | Pick from preset templates (web app, serverless, microservices) |
| Don't know all the settings | Guided form wizard — just fill in the blanks |
| Can't repeat the setup | It generates code files you run every time, identically |
| Teammate can't understand | The code files ARE the documentation |
| Wrong thing deleted | `terraform destroy` removes exactly what was created, nothing else |
| Surprise cost bill | Built-in cost estimator shows monthly/yearly estimate before deploy |

The tool generates **Infrastructure as Code (IaC)** — which means your entire AWS setup is written as text files, just like your application code.

---

## Part 2 — How The Project Works (Layer by Layer)

### The Big Picture

```
YOU (browser)
    ↓  pick services + fill form
AWS Infra Generator (Next.js app)
    ↓  generates .tf files in memory
Your Machine
    ↓  terraform init / plan / apply
AWS Cloud (real resources created)
```

---

### Layer 1 — The Frontend (What You See)

**Technology:** Next.js + React + TypeScript + Tailwind CSS

The app is a **4-step wizard**:

#### Step 1: Services
You see a grid of AWS service cards — VPC, EC2, S3, RDS, Lambda, ECS, EKS, etc.
You click the ones you want. The app **automatically adds dependencies**.

Example: You click EC2 → the app automatically selects VPC too, because EC2 cannot exist without a network.

This dependency logic lives in `src/lib/service-dependencies.ts`.

#### Step 2: Configure
A form appears for each service you selected.
- Project name, region, environment (dev/staging/prod)
- EC2: instance type, number of instances, AMI type
- S3: bucket name, versioning on/off, encryption type
- RDS: database engine, instance size, storage

All form state is managed by **Zustand** (a lightweight React state manager) in `src/lib/store.ts`. It also saves your progress to `localStorage` so refreshing the page doesn't lose your work.

#### Step 3: Generate
You click "Generate". The app runs TypeScript code in your browser that takes your form values and **writes Terraform `.tf` files as strings**. No backend server, no API call. Pure client-side logic.

The generator lives in `src/lib/generators/terraform/`. There is one file per AWS service:
- `services/vpc.ts` → writes `vpc.tf`
- `services/ec2.ts` → writes `ec2.tf`
- `services/s3.ts` → writes `s3.tf`
- etc.

It also shows you a **simulated Terraform plan** — a preview of what resources will be created — before you download anything.

#### Step 4: Export
You download a `.zip` file containing all the `.tf` files. You unzip it, run `terraform init / plan / apply`, and your AWS infrastructure is live.

---

### Layer 2 — The Generated Terraform Code (What Gets Deployed)

The `my-infra/` folder in this repo is an example of the **output** the tool generates.

Here is what each file does:

#### `main.tf` — The Foundation
Think of this as the "settings page" for Terraform itself.
- Tells Terraform which version to use (`>= 1.5`)
- Tells it to use the AWS provider (the official AWS plugin)
- Sets up the backend (where to save the "state" — the record of what was built)
- Applies default tags to every resource (project name, environment, "ManagedBy: terraform")

```hcl
provider "aws" {
  region = var.aws_region   # ← reads from variables.tf
}
```

#### `variables.tf` — The Inputs
All the knobs and dials. Every value you set in the wizard form ends up here as a `variable`.

```hcl
variable "instance_type" {
  type    = string
  default = "t3.micro"     # ← safe default, can be overridden
}
```

#### `terraform.tfvars` — Your Personal Settings
You change values here without touching the code.
This is the file you edit before deploying.

```hcl
instance_type = "t3.medium"   # override the default
aws_region    = "ap-south-1"  # change region to Mumbai
```

#### `vpc.tf` — Your Private Network
VPC = Virtual Private Cloud. Think of it as your own private building inside AWS.

Inside the building you have:
- **Public subnets** — rooms with windows (internet access). EC2 web servers live here.
- **Private subnets** — rooms with no windows (no direct internet). Databases live here.
- **Internet Gateway** — the building's front door
- **Route Table** — the building's directory, telling traffic where to go

```
Internet
   ↓
Internet Gateway (front door)
   ↓
Public Subnet (your web server, EC2)
   ↓
Private Subnet (your database, RDS)
```

#### `ec2.tf` — Your Virtual Server
EC2 = Elastic Compute Cloud. Think of it as renting a computer in Amazon's data center.

This file creates:
- The **EC2 instance** itself (the computer)
- A **Security Group** (the firewall — rules for who can connect on which ports)
- An **IAM Role** (the server's identity card — what AWS services it is allowed to talk to)
- An **Instance Profile** (attaches the IAM Role to the server)

#### `s3.tf` — Your File Storage
S3 = Simple Storage Service. Think of it as a folder in the cloud that never fills up.

This file creates:
- The **S3 bucket** (the folder)
- **Versioning** enabled (keeps old versions of files, like Git for your files)
- **Encryption** (files are scrambled at rest — AES-256)
- **Public access block** (nobody on the internet can read your files by accident)

#### `outputs.tf` — The Results
After `terraform apply` finishes, this prints useful info to your terminal:
- VPC ID
- Subnet IDs
- EC2 instance IDs and public IP addresses
- S3 bucket name and ARN

---

### Layer 3 — The State File (`terraform.tfstate`)

This is the most important file in Terraform that most beginners don't know about.

After `terraform apply`, Terraform creates `terraform.tfstate`. This file is a JSON record of **every resource Terraform created**. It maps your code to real AWS resource IDs.

```
vpc.tf  →  aws_vpc.main  →  vpc-0abc1234def56789  (real AWS ID)
```

Terraform uses this file to know:
- What already exists (don't create it again)
- What changed (update only the diff)
- What was removed (delete it)

**Never delete this file.** If you lose it, Terraform loses track of what it built.

---

## Part 3 — The Full Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    AWS INFRA GENERATOR (Browser)                 │
│                                                                   │
│  Step 1: Services     Step 2: Configure    Step 3: Generate      │
│  ┌──────────────┐    ┌──────────────────┐  ┌────────────────┐   │
│  │ ☑ VPC        │    │ Region: us-east-1│  │ vpc.tf ✓       │   │
│  │ ☑ EC2        │ →  │ Env: development  │→ │ ec2.tf ✓       │   │
│  │ ☑ S3         │    │ Instance: t3.micro│  │ s3.tf ✓        │   │
│  │ ☐ RDS        │    │ S3: data          │  │ main.tf ✓      │   │
│  └──────────────┘    └──────────────────┘  └────────────────┘   │
│                                                    ↓              │
│                                             Step 4: Export        │
│                                             ┌────────────────┐   │
│                                             │  my-infra.zip  │   │
│                                             └────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                                ↓ unzip + run commands
┌─────────────────────────────────────────────────────────────────┐
│                       YOUR TERMINAL                              │
│                                                                   │
│  cd my-infra                                                      │
│  terraform init    ← downloads AWS provider plugin               │
│  terraform plan    ← shows preview of what will be created       │
│  terraform apply   ← actually creates resources on AWS           │
└─────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────┐
│                         AWS CLOUD                                │
│                                                                   │
│  VPC (10.0.0.0/16)                                               │
│  ├── Public Subnet 1 (10.0.0.0/24) → EC2 Instance               │
│  ├── Public Subnet 2 (10.0.1.0/24)                               │
│  ├── Private Subnet 1 (10.0.10.0/24)                             │
│  └── Private Subnet 2 (10.0.11.0/24)                             │
│                                                                   │
│  S3 Bucket: my-infra-development-data-happy-fox                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Part 4 — Interview Questions by Level

---

### Level 1 — Beginner (0–1 year experience)

**Q1. What is AWS and why do companies use it?**
AWS (Amazon Web Services) is Amazon's cloud platform. Instead of buying physical servers, companies rent computing power, storage, and networking from AWS and pay only for what they use. It saves upfront cost, scales instantly, and is maintained by Amazon.

**Q2. What is the difference between EC2 and S3?**
EC2 is a virtual computer — you run code on it. S3 is a storage bucket — you store files in it. Think of EC2 as the machine and S3 as the hard drive that machine reads from.

**Q3. What is a VPC and why do you need it?**
VPC (Virtual Private Cloud) is your own isolated network inside AWS. Without it, all your resources would be on a shared public network. With it, you control who can reach what. It's like having a private office inside a shared coworking building.

**Q4. What is Terraform?**
Terraform is a tool that lets you write your infrastructure as code. Instead of clicking buttons in the AWS console, you write `.tf` files. Terraform reads those files and creates, updates, or deletes cloud resources automatically.

**Q5. What is a subnet?**
A subnet is a smaller network carved out of your VPC. Public subnets have a path to the internet. Private subnets do not. You put web servers in public subnets and databases in private subnets for security.

**Q6. What is the difference between a public and private subnet?**
A public subnet has an Internet Gateway attached via a route table — meaning traffic can flow in and out from the internet. A private subnet has no such route — it can only be reached from within the VPC.

**Q7. What is a Security Group?**
A Security Group is a virtual firewall for your EC2 instance. It has inbound rules (who can connect to you) and outbound rules (where you can connect). Example: allow port 22 (SSH) only from your IP address.

---

### Level 2 — Intermediate (1–3 years experience)

**Q8. What is Infrastructure as Code (IaC) and why is it better than clicking in the console?**
IaC means your infrastructure is defined in text files, versioned in Git, and applied automatically. Benefits:
- Reproducible: run the same code, get the same infrastructure every time
- Reviewable: teammates can review infrastructure changes like code reviews
- Auditable: Git history shows who changed what and when
- Recoverable: if something breaks, you can roll back to a previous version

**Q9. Explain the Terraform workflow: init, plan, apply, destroy.**
- `terraform init` — downloads the required provider plugins (like npm install)
- `terraform plan` — compares your code to the current state and shows what will change (dry run)
- `terraform apply` — makes the changes on AWS (real deployment)
- `terraform destroy` — deletes everything Terraform created

**Q10. What is a Terraform state file and why is it important?**
The state file (`terraform.tfstate`) is a JSON file that maps your Terraform resources to real AWS resource IDs. Without it, Terraform cannot know what already exists. It is the source of truth between your code and your cloud. In teams, it is stored in a shared backend (like S3) so everyone uses the same state.

**Q11. What is an IAM Role and why attach it to EC2?**
An IAM Role is a set of permissions. Instead of hardcoding AWS credentials in your application, you attach a role to the EC2 instance. The instance can then call AWS services (like S3 or CloudWatch) that the role permits — without storing any secret keys. This is the secure, recommended approach.

**Q12. What is a CIDR block? Explain `10.0.0.0/16`.**
CIDR (Classless Inter-Domain Routing) is a notation for defining an IP address range.
- `10.0.0.0/16` means: start at `10.0.0.0`, the `/16` means the first 16 bits are fixed, giving you 65,536 addresses (10.0.0.0 to 10.0.255.255)
- Subnets carve smaller pieces: `10.0.0.0/24` = 256 addresses (10.0.0.0 to 10.0.0.255)

**Q13. What is `cidrsubnet()` in Terraform?**
It is a built-in Terraform function that calculates a subnet CIDR from a parent CIDR.
```hcl
cidrsubnet("10.0.0.0/16", 8, 0)  # → 10.0.0.0/24
cidrsubnet("10.0.0.0/16", 8, 1)  # → 10.0.1.0/24
```
The `8` means "add 8 more bits to the prefix" (16+8=24), and the last number is the subnet index.

**Q14. What is an Internet Gateway and a Route Table?**
An Internet Gateway (IGW) is the door between your VPC and the internet. A Route Table is the routing logic — it tells traffic "to reach 0.0.0.0/0 (the internet), use this Internet Gateway." You attach the route table to a subnet to make it public.

**Q15. Why use `terraform.tfvars` instead of hardcoding values?**
`terraform.tfvars` separates configuration from code. The code (`.tf` files) stays generic and reusable. The vars file holds environment-specific values. You can have `dev.tfvars`, `prod.tfvars` and deploy to different environments with the same code.

**Q16. What is S3 versioning and when would you use it?**
S3 versioning keeps every version of every file. If you overwrite or delete a file, the previous version is still there. Use it when storing important data like backups, logs, or config files where accidental deletion or overwrite would be costly.

---

### Level 3 — Advanced (3+ years experience)

**Q17. What is the difference between Terraform backend "local" vs "s3"?**
- `local` backend: state file is stored on your machine. Fine for solo projects, but if you lose it or two people run Terraform at the same time, things break.
- `s3` backend: state file is stored in an S3 bucket. Teams share the same state. Combined with DynamoDB for state locking — only one person can run `terraform apply` at a time, preventing race conditions.

```hcl
# Production-grade backend
backend "s3" {
  bucket         = "my-infra-prod-terraform-state"
  key            = "terraform.tfstate"
  region         = "us-east-1"
  encrypt        = true
  dynamodb_table = "my-infra-prod-terraform-locks"
}
```

**Q18. What is a `lifecycle` block in Terraform? Explain `create_before_destroy`.**
The `lifecycle` block controls how Terraform handles resource replacement. By default, Terraform destroys the old resource then creates the new one. `create_before_destroy = true` reverses this — it creates the replacement first, then destroys the old one. This prevents downtime during infrastructure updates.

```hcl
lifecycle {
  create_before_destroy = true
}
```

**Q19. What are Terraform `locals` and when should you use them?**
`locals` are reusable computed values within a module. Use them to avoid repeating the same expression multiple times.

```hcl
locals {
  common_tags = {
    Project   = var.project_name
    Environment = var.environment
    ManagedBy = "terraform"
  }
}
# Then reuse with: merge(local.common_tags, { Name = "..." })
```

**Q20. What is a `dynamic` block in Terraform? Give an example from this project.**
A `dynamic` block generates repeated nested blocks based on a collection. In `ec2.tf`, the SSH ingress rules are dynamic:

```hcl
dynamic "ingress" {
  for_each = var.allowed_cidr_blocks   # iterates over a list
  content {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [ingress.value]      # one rule per CIDR in the list
  }
}
```
This generates one `ingress` block per IP in `allowed_cidr_blocks` — without repeating code.

**Q21. How does this tool handle dependency resolution between AWS services?**
The tool maintains a dependency graph in `src/lib/service-dependencies.ts`. Each service declares its `dependencies` array. When you select EC2 (which depends on `["vpc"]`), the `resolveServicesWithDependencies()` function does a topological sort and auto-adds VPC. This prevents broken configurations where a service references a resource that doesn't exist.

**Q22. What is the security risk of `allowed_cidr_blocks = ["0.0.0.0/0"]` for SSH?**
It allows anyone on the internet to attempt SSH connections to your EC2 instance. This exposes you to brute-force and credential stuffing attacks. In production, always restrict to your specific IP: `["203.0.113.5/32"]`. Better yet, remove port 22 entirely and use AWS Systems Manager Session Manager (SSM) — which is why this project attaches `AmazonSSMManagedInstanceCore` to the IAM role.

**Q23. Why does the S3 bucket name include `random_pet.suffix.id`?**
S3 bucket names are globally unique across all AWS accounts in the world. Two companies cannot have a bucket named `my-infra-data`. Adding a random suffix like `happy-fox` ensures the name is unique. The `random_pet` resource generates a deterministic random name that stays the same across `terraform apply` runs (stored in state).

**Q24. Explain the concept of "drift" in Infrastructure as Code.**
Drift is when the actual state of your cloud infrastructure no longer matches what your code says it should be. This happens when someone manually changes a setting in the AWS console. `terraform plan` detects drift and shows what changed. This is one reason IaC is superior to manual management — you can always detect and correct drift.

**Q25. How would you extend this tool to support multiple environments (dev/staging/prod)?**
Use Terraform workspaces or separate `tfvars` files per environment:

```bash
# Using separate var files
terraform apply -var-file="dev.tfvars"
terraform apply -var-file="prod.tfvars"
```

Or use Terraform workspaces:
```bash
terraform workspace new production
terraform workspace select production
terraform apply
```

The state is kept separate per environment, so dev and prod never interfere with each other.

**Q26. What is the Next.js / React state management pattern used in this project?**
The project uses **Zustand** with the `persist` middleware. Zustand is a minimal React state library — simpler than Redux. The `persist` middleware serializes the store to `localStorage` automatically so state survives page refreshes. The store (`src/lib/store.ts`) has `partialize` to control which parts are persisted (e.g., generated files are NOT persisted because they'd be stale after reload).

**Q27. How does the app generate Terraform code without a backend server?**
All generator logic is TypeScript running in the browser. The `TerraformGenerator` class in `src/lib/generators/terraform/index.ts` calls individual generator functions (`generateVpc()`, `generateEc2()`, etc.), each of which returns a `GeneratedFile` object with `name`, `path`, `content`, and `language`. These strings are assembled into a ZIP in-browser using a library like JSZip. No data ever leaves the user's machine.

---

## Part 5 — Key Concepts Cheat Sheet

| Term | Simple Definition |
|---|---|
| AWS | Amazon's cloud platform — rent computers, storage, network |
| IaC | Infrastructure as Code — write your infra like code, deploy with commands |
| Terraform | Tool to write and deploy IaC for AWS (and other clouds) |
| VPC | Your private network inside AWS |
| Subnet | A segment of your VPC — public (internet-facing) or private (internal) |
| EC2 | A virtual computer you rent on AWS |
| S3 | A file storage bucket that scales infinitely |
| IAM Role | A set of permissions attached to an AWS resource (like a server's ID card) |
| Security Group | Firewall rules for an EC2 instance |
| Internet Gateway | The door between your VPC and the internet |
| Route Table | The traffic directory — tells packets where to go |
| State File | Terraform's memory — tracks what it built on AWS |
| CIDR Block | An IP address range notation (e.g., `10.0.0.0/16`) |
| Drift | When real cloud state no longer matches your code |
| Backend | Where Terraform stores its state file (local disk or S3) |

---

## Part 6 — How to Run This Project

### Run the Web App (UI)
```bash
npm install
npm run dev
# Open http://localhost:3000
```

### Deploy the Example Terraform Stack
```bash
# Prerequisites: AWS CLI configured + Terraform installed

cd my-infra

# 1. Edit terraform.tfvars with your settings
# 2. Download AWS provider
terraform init

# 3. Preview what will be created
terraform plan

# 4. Deploy to AWS (will cost money!)
terraform apply

# 5. To clean up and delete everything
terraform destroy
```

### What Gets Created on AWS
- 1 VPC with 2 public + 2 private subnets
- 1 EC2 instance (t3.micro by default — free tier eligible)
- 1 S3 bucket (encrypted, versioned, no public access)
- Security Group, IAM Role, Internet Gateway, Route Tables

---

*This README was generated as a companion guide to the AWS Infra Generator project.*
