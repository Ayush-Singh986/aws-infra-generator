# ─── Edit these before deploying ───────────────────────────────────────────────

project_name   = "my-infra"
environment    = "development"
aws_region     = "us-east-1"

# Networking
vpc_cidr = "10.0.0.0/16"

# EC2
instance_type    = "t3.micro"
instance_count   = 1
root_volume_size = 20
enable_public_ip = true

# Restrict SSH to your own IP: e.g. ["203.0.113.5/32"]
allowed_cidr_blocks = ["0.0.0.0/0"]

# S3
s3_bucket_suffix = "data"
s3_versioning    = true
