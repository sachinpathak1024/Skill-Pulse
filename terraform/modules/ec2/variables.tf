variable "aws_key_pair_name" {
  default     = "skillpulse"
  type        = string
  description = "skillpulse key pair"
}


variable "aws_instance_tag" {
  default     = "skillpulse"
  type        = string
  description = "skillpulse tag"
}

variable "aws_public_ip_on_launch" {
  default     = true
  type        = bool
  description = "to assign public ip on launch"
}

# variable instance_count {
#     # default = 2
#     type = number
#     description = "Instances counts"
# }


variable "instances" {
  description = "map of instances"
  type = map(object({
    instance_type = string
    volume_size   = number
    ami           = string
    user          = string
    os_family     = string
  }))
  default = {
    "control-node-ubuntu" = {
      ami           = "ami-02167eae61967e403"
      user          = "ubuntu"
      os_family     = "ubuntu"
      instance_type = "t3.small"
      volume_size   = 15
    }
    "worker-redhat" = {
      ami           = "ami-0da467f007dfebd6b"
      user          = "ec2-user"
      os_family     = "redhat"
      instance_type = "t3.small"
      volume_size   = 15
    }
    "worker-ubuntu" = {
      ami           = "ami-02167eae61967e403"
      user          = "ubuntu"
      os_family     = "ubuntu"
      instance_type = "t3.small"
      volume_size   = 15
    }
    "worker-amazon" = {
      ami           = "ami-0bea529386a62a2ad"
      user          = "ec2-user"
      os_family     = "amazon"
      instance_type = "t3.small"
      volume_size   = 15
    }
  }
}


variable "env" {
  # default = 2
  type        = string
  description = "Instances counts"
}


variable "aws_security_group_name" {
  default     = "skillpulse_sg"
  type        = string
  description = "security group name"
}


# variable aws_ami_id {
#     default = "ami-02167eae61967e403"
#     type = string
#     description = "ami id of instance"
# }

# variable aws_instance_type {
#     # default = "t3.small"
#     type = string
#     description = "instance_type of an instance"
# }

variable "aws_associate_public_ip_address" {
  default     = true
  type        = bool
  description = "public ip"
}


# variable volume_size {
#     # default = 20
#     type = number
#     description = "instance_type of an instance"
# }