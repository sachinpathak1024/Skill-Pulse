output ec2_public_ip {
    value = aws_instance.my_instance[*].public_ip
}


output ec2_route_table_id {
    value = aws_route_table_association.my_subnet_association.route_table_id
}