variable "project_name" { type = string }
variable "environment" { type = string }
variable "vpc_id" { type = string }
variable "admin_cidr" {
  type        = string
  default     = "0.0.0.0/0"
  description = "CIDR block permitted for SSH administration"
}
