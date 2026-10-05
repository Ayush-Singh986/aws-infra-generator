variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "my-infra"
}

variable "environment" {
  description = "Deployment environment (development, staging, production)"
  type        = string
  default     = "development"
}

variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "us-east-1"
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}

variable "instance_count" {
  description = "Number of EC2 instances"
  type        = number
  default     = 1
}

variable "ami_id" {
  description = "Custom AMI ID (leave empty to use latest Amazon Linux 2023)"
  type        = string
  default     = ""
}

variable "root_volume_size" {
  description = "Root EBS volume size in GB (minimum 30 for Amazon Linux 2023)"
  type        = number
  default     = 30
}

variable "enable_public_ip" {
  description = "Assign public IP to EC2 instances"
  type        = bool
  default     = true
}

variable "allowed_cidr_blocks" {
  description = "CIDR blocks allowed SSH access to EC2 instances"
  type        = list(string)
  default     = ["0.0.0.0/0"] # Restrict this to your IP in production!
}

variable "s3_bucket_suffix" {
  description = "Suffix for S3 bucket name (must be globally unique)"
  type        = string
  default     = "data"
}

variable "s3_versioning" {
  description = "Enable S3 bucket versioning"
  type        = bool
  default     = true
}
