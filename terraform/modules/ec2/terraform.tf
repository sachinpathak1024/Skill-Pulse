terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "6.62.0"
    }
  }
  # backend "s3" {
  #   bucket         = "remote-my-s3-bucket-sachin"
  #   key            = "terraform.tfstate"
  #   region         = "us-west-2"
  #   use_lockfile = true
  #   # dynamodb_table = "remote-my-dynamodb-table-sachin"
  # }
}