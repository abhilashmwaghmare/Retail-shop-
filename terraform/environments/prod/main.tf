# =============================================================================
# Production Environment Infrastructure Orchestration
# High Availability Configuration: Multi-AZ subnets, NAT enabled, t3.large compute.
# =============================================================================

data "aws_availability_zones" "available" {
  state = "available"
}

module "vpc" {
  source = "../../modules/vpc"

  project_name       = var.project_name
  environment        = "prod"
  vpc_cidr           = var.vpc_cidr
  availability_zones = slice(data.aws_availability_zones.available.names, 0, 2)
  enable_nat_gateway = true
}

module "security_groups" {
  source = "../../modules/security_groups"

  project_name = var.project_name
  environment  = "prod"
  vpc_id       = module.vpc.vpc_id
  admin_cidr   = var.admin_cidr
}

module "iam" {
  source = "../../modules/iam"

  project_name = var.project_name
  environment  = "prod"
}

module "s3" {
  source = "../../modules/s3"

  project_name = var.project_name
  environment  = "prod"
}

module "ec2" {
  source = "../../modules/ec2"

  project_name          = var.project_name
  environment           = "prod"
  subnet_id             = module.vpc.public_subnet_ids[0]
  security_group_ids    = [module.security_groups.web_security_group_id, module.security_groups.app_security_group_id]
  instance_profile_name = module.iam.instance_profile_name
  instance_type         = var.instance_type
  key_name              = var.key_name
  volume_size           = 50
}
