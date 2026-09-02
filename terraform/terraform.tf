terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "6.62.0"
    }
  }
  # backend "s3" {
  #   bucket         = "dev-sachin-bucket-s3-remote"
  #   key            = "terraform.tfstate"
  #   workspace_key_prefix = "states"
  #   region         = "us-west-2"
  #   use_lockfile = true
  #   # dynamodb_table = "remote-my-dynamodb-table-sachin"
  # }
}