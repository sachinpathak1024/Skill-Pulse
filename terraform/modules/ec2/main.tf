# resource "tls_private_key" "my_tls_key" {
#     algorithm = "RSA"
#     rsa_bits  = 4096

# }

resource "aws_key_pair" "my_key" {
  key_name = var.aws_key_pair_name
  #   public_key = tls_private_key.my_tls_key.private_key_pem
  public_key = file(var.aws_public_key_path)
}

#____________________Custom VPC_______________________________________________

resource "aws_vpc" "tf_vpc" {
  cidr_block = "10.0.0.0/24"

  tags = {
    name   = var.aws_vpc_name
    server = var.aws_ec2_default_tag
  }

}

resource "aws_internet_gateway" "tf_gateway" {
  vpc_id = aws_vpc.tf_vpc.id
  tags = {
    name   = "skillpulse-gateway"
    server = var.aws_ec2_default_tag
  }
}

resource "aws_route_table" "tf_rt" {
  vpc_id = aws_vpc.tf_vpc.id
  route {
    cidr_block = var.allowed_cidrs["egress_ipv4"]
    gateway_id = aws_internet_gateway.tf_gateway.id
  }
  tags = {
    name   = "skillpulse-rt"
    server = var.aws_ec2_default_tag
  }
}

resource "aws_subnet" "tf_subnet" {
  vpc_id                  = aws_vpc.tf_vpc.id
  cidr_block              = "10.0.0.0/26"
  map_public_ip_on_launch = true
  tags = {
    name   = "skillpulse-subnet"
    server = var.aws_ec2_default_tag
  }

}
resource "aws_route_table_association" "tf_subnet_association" {
  subnet_id      = aws_subnet.tf_subnet.id
  route_table_id = aws_route_table.tf_rt.id
}

#____________________Security Group_______________________________________________

resource "aws_security_group" "tf_sg" {
  name   = var.aws_sg_name
  vpc_id = aws_vpc.tf_vpc.id
  tags = {
    name   = var.aws_sg_name
    server = var.aws_ec2_default_tag
  }
}

resource "aws_vpc_security_group_ingress_rule" "allow_ssh" {
  security_group_id = aws_security_group.tf_sg.id
  cidr_ipv4         = var.allowed_cidrs["ssh"]
  from_port         = 22
  ip_protocol       = "tcp"
  to_port           = 22
}
resource "aws_vpc_security_group_ingress_rule" "allow_http" {
  security_group_id = aws_security_group.tf_sg.id
  cidr_ipv4         = var.allowed_cidrs["http"]
  from_port         = 80
  ip_protocol       = "tcp"
  to_port           = 80
}
resource "aws_vpc_security_group_ingress_rule" "allow_https" {
  security_group_id = aws_security_group.tf_sg.id
  cidr_ipv4         = var.allowed_cidrs["https"]
  from_port         = 443
  ip_protocol       = "tcp"
  to_port           = 443
}
resource "aws_vpc_security_group_egress_rule" "allow_all_traffic_ipv4" {
  security_group_id = aws_security_group.tf_sg.id
  cidr_ipv4         = var.allowed_cidrs["egress_ipv4"]
  ip_protocol       = "-1" # semantically equivalent to all ports
}

resource "aws_vpc_security_group_egress_rule" "allow_all_traffic_ipv6" {
  security_group_id = aws_security_group.tf_sg.id
  cidr_ipv6         = var.allowed_cidrs["egress_ipv6"]
  ip_protocol       = "-1" # semantically equivalent to all ports
}
#____________________Instance_______________________________________________

resource "aws_instance" "my_instance" {
  vpc_security_group_ids = [aws_security_group.tf_sg.id]
  subnet_id              = aws_subnet.tf_subnet.id
  key_name               = aws_key_pair.my_key.key_name
  #   associate_public_ip_address = var.aws_associate_public_ip_address
  ami = data.aws_ami.ubuntu.id
  #   count                       = var.instance_count
  instance_type = var.instance_type

  root_block_device {
    volume_size = var.volume_size
    volume_type = "gp3"

  }
  tags = {
    Name   = var.instance_name
    server = var.aws_ec2_default_tag
    ansible_group = "eks_server"


  }
}


