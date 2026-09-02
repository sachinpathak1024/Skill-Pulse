resource "aws_dynamodb_table" "my_dynamodb_table" {
  name         = "${var.env}-${var.aws_dynamodb_table_name}-${count.index + 1}"
  count        = var.dynamodb_table_count
  billing_mode = var.aws_dynamodb_table_billing_mode
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }


  tags = {
    Name = "${var.env}-${var.aws_dynamodb_table_name}-${count.index + 1}"
  }
}