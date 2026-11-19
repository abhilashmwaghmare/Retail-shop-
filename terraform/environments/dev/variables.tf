variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "project_name" {
  type    = string
  default = "retailcorp-ecommerce"
}

variable "vpc_cidr" {
  type    = string
  default = "10.10.0.0/16"
}

variable "instance_type" {
  type    = string
  default = "t3.small"
}

variable "key_name" {
  type    = string
  default = ""
}

variable "admin_cidr" {
  type    = string
  default = "0.0.0.0/0"
}
