output "vpc_id" {
  value = module.vpc.vpc_id
}

output "public_subnet_ids" {
  value = module.vpc.public_subnet_ids
}

output "private_subnet_ids" {
  value = module.vpc.private_subnet_ids
}

output "app_server_public_ip" {
  value = module.ec2.public_ip
}

output "assets_bucket_name" {
  value = module.s3.bucket_name
}
