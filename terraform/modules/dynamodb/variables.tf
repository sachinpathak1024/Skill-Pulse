variable aws_dynamodb_table_name {
  type        = string
  default     = "my-dynamodb-table-sachin"
  description = "Name of the table"
}


variable aws_dynamodb_table_billing_mode {
  type        = string
  default     = "PAY_PER_REQUEST"
  description = "billing mode"
}


variable dynamodb_table_count {
  type        = number
  description = "Number of DynamoDB tables"
}

variable env {
  type        = string
  # default     = "terraform.workspace"
  description = "description"
}