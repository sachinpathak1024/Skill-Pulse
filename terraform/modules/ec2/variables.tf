variable "aws_key_pair_name" {
  type        = string
  default     = "eks-server-key"
  description = "this is the key for the eks server vm"
}

variable "aws_public_key_path" {
  type        = string
  default     = "./eks-key.pub"
  description = "this is the path of the key to create eks server vm"
}
variable "aws_vpc_name" {
  type        = string
  default     = "skillpulse-vpc"
  description = "this is the name of the vpc of eks server vm"
}
variable "aws_ec2_default_tag" {
  type        = string
  default     = "skillpulse"
  description = "this is the default additional tag for the all the resources on eks server vm"
}
variable "aws_sg_name" {
  type        = string
  default     = "skillpulse-sg"
  description = "name of the sg"
}


# All allowed CIDR blocks grouped together in one variable instead of multiple standalone variables(using map(string))
variable "allowed_cidrs" {
  type = map(string)
  default = {
    ssh         = "122.181.103.101/32"
    http        = "0.0.0.0/0"
    https       = "0.0.0.0/0"
    egress_ipv4 = "0.0.0.0/0"
    egress_ipv6 = "::/0"
  }
}
variable "ubuntu_version" {
  type        = string
  description = "Ubuntu LTS release codename or version"
  default     = "noble-24.04" # Or "jammy-22.04" - you can change os without modifying data block query
}


variable "aws_associate_public_ip_address" {
  type        = bool
  default     = true
  description = "to assign public ip on launch"
}

variable "instance_type" {
  type        = string
  default     = "m7i-flex.large"
  description = "instance type"
}


variable "volume_size" {
  type        = number
  default     = 20
  description = "volume_size"
}
variable "instance_name" {
  type        = string
  default     = "eks-server"
  description = "name of instance"
}