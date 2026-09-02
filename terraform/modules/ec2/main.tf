# Key_Pair

resource "aws_key_pair" "my_key_pair" {
  key_name   = "${var.env}-${var.aws_key_pair_name}-v2"
  public_key = file("skillpulse.pub")
}

# VPC

resource "aws_vpc" "my_vpc" {
  cidr_block = "10.0.0.0/24"

  tags = {
    name = "${var.env}-${var.aws_instance_tag}-vpc"
  }
}

resource aws_internet_gateway "my_igw" {
    vpc_id     = aws_vpc.my_vpc.id

    tags = {
        Name = "${var.env}-${var.aws_instance_tag}-igw"
    }
}
resource aws_route_table "my_route_table" {
    vpc_id     = aws_vpc.my_vpc.id
    route {
        cidr_block = "122.179.91.113/32"
        gateway_id = aws_internet_gateway.my_igw.id
    }

    tags = {
        Name = "${var.env}-${var.aws_instance_tag}-rt"
    }
}



resource "aws_subnet" "my_subnet" {
  vpc_id     = aws_vpc.my_vpc.id
  cidr_block = "10.0.0.0/26"
  map_public_ip_on_launch = var.aws_public_ip_on_launch

  tags = {
    Name = "${var.env}-${var.aws_instance_tag}-subnet"
  }
}

resource "aws_route_table_association" "my_subnet_association" {
  subnet_id      = aws_subnet.my_subnet.id
  route_table_id = aws_route_table.my_route_table.id
}

# Security Groups

resource "aws_security_group" "my_sg" {
  name        = "${var.env}-${var.aws_security_group_name}"
  vpc_id      = aws_vpc.my_vpc.id
  description = "This Security Group manages traffic for skillpulse"


  tags = {
    Name = "${var.env}-${var.aws_instance_tag}-sg"
  }

}

resource "aws_vpc_security_group_ingress_rule" "allow_front" {
  security_group_id = aws_security_group.my_sg.id
  cidr_ipv4         = "122.179.89.11/32"
  from_port         = 8888
  ip_protocol       = "tcp"
  to_port           = 8888
}
resource "aws_vpc_security_group_ingress_rule" "allow_ssh" {
  security_group_id = aws_security_group.my_sg.id
  cidr_ipv4         = "122.179.89.11/32"
  from_port         = 22
  ip_protocol       = "tcp"
  to_port           = 22
}

resource "aws_vpc_security_group_egress_rule" "allow_all_traffic_ipv4" {
  security_group_id = aws_security_group.my_sg.id
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "-1" # semantically equivalent to all ports
}

resource "aws_vpc_security_group_egress_rule" "allow_all_traffic_ipv6" {
  security_group_id = aws_security_group.my_sg.id
  cidr_ipv6         = "::/0"
  ip_protocol       = "-1" # semantically equivalent to all ports
}


resource "aws_instance" "my_instance" {
  ami                    = var.aws_ami_id
  count                  = var.instance_count
  instance_type          = var.aws_instance_type
  vpc_security_group_ids = [aws_security_group.my_sg.id]
  subnet_id              = aws_subnet.my_subnet.id
  key_name               = aws_key_pair.my_key_pair.key_name
  associate_public_ip_address = var.aws_associate_public_ip_address 

  root_block_device {
    volume_size = var.volume_size
    volume_type = "gp3"
  }
  tags = {
    Name = "${var.env}-${var.aws_instance_tag}-vm"
  }
}

