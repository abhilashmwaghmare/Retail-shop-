# =============================================================================
# EC2 Module: Ubuntu Application Host with Automated Docker Bootstrapping
# =============================================================================

data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

resource "aws_instance" "app_server" {
  ami                  = data.aws_ami.ubuntu.id
  instance_type        = var.instance_type
  subnet_id            = var.subnet_id
  vpc_security_group_ids = var.security_group_ids
  iam_instance_profile = var.instance_profile_name
  key_name             = var.key_name != "" ? var.key_name : null

  root_block_device {
    volume_size           = var.volume_size
    volume_type           = "gp3"
    encrypted             = true
    delete_on_termination = true

    tags = {
      Name = "${var.project_name}-${var.environment}-root-ebs"
    }
  }

  # Automated Instance Bootstrapping
  user_data = <<-EOF
              #!/usr/bin/env bash
              set -euo pipefail
              export DEBIAN_FRONTEND=noninteractive

              # 1. Update OS packages
              apt-get update -y
              apt-get install -y ca-certificates curl gnupg lsb-release git unzip

              # 2. Install Docker Engine
              mkdir -m 0755 -p /etc/apt/keyrings
              curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
              echo \
                "deb [arch=\$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
                \$(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

              apt-get update -y
              apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

              # 3. Add ubuntu user to docker group
              usermod -aG docker ubuntu

              # 4. Install AWS CLI v2
              curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
              unzip -q awscliv2.zip
              ./aws/install
              rm -rf aws awscliv2.zip

              # 5. Prepare application deployment folder
              mkdir -p /opt/ecommerce-devops-project
              chown -R ubuntu:ubuntu /opt/ecommerce-devops-project

              echo "Bootstrapping completed successfully at \$(date)" > /var/log/user_data_init.log
              EOF

  tags = {
    Name        = "${var.project_name}-${var.environment}-app-server"
    Environment = var.environment
    Role        = "ApplicationHost"
  }
}
