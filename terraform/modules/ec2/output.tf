# output "ec2_public_ip" {
#   value = aws_instance.my_instance[*].public_ip
# }



output "ec2_public_ip" {
  value = {
    for name, instance in aws_instance.my_instance : name => {
      public_ip = instance.public_ip
      user = var.instances[name].user
    }
  }
  
}

output "ec2_route_table_id" {
  value = aws_route_table_association.my_subnet_association.route_table_id
}