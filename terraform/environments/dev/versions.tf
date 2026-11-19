terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.40.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6.0"
    }
  }

  # Production S3 Backend with Native S3 State Lockfile (supported in modern Terraform)
  # backend "s3" {
  #   bucket       = "retailcorp-ecommerce-tfstate-dev"
  #   key          = "dev/terraform.tfstate"
  #   region       = "us-east-1"
  #   encrypt      = true
  #   use_lockfile = true
  # }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = "dev"
      ManagedBy   = "Terraform"
      Owner       = "DevOps-Capstone-Team"
    }
  }
}
