locals {
  env = {
    dev = {
      instance_count       = 1
      aws_instance_type    = "t3.small"
      volume_size          = 15
      bucket_name          = "sachin-bucket-s3-remote"
      bucket_count         = 1
      dynamodb_table_count = 1

    }
    stg = {
      instance_count       = 2
      aws_instance_type    = "t3.micro"
      volume_size          = 20
      bucket_name          = "sachin-bucket-s3-remote"
      bucket_count      = 1
      dynamodb_table_count = 1

    }
    prd = {
      instance_count       = 3
      aws_instance_type    = "t3.micro"
      volume_size          = 25
      bucket_name          = "sachin-bucket-s3-remote"
      bucket_count      = 2
      dynamodb_table_count = 2

    }
  }
  current = lookup(
    local.env,
    terraform.workspace,
    local.env.dev
  )

  #current = lookup(local.env, terraform.workspace, local.env["dev"])
}

module "ec2" {
  source            = "./modules/ec2"
  env               = terraform.workspace
  instance_count    = local.current.instance_count
  aws_instance_type = local.current.aws_instance_type
  volume_size       = local.current.volume_size
}

module "s3" {
  source       = "./modules/s3"
  env          = terraform.workspace
  bucket_name  = local.current.bucket_name
  bucket_count = local.current.bucket_count
}

module "dynamodb" {
  source = "./modules/dynamodb"
  env    = terraform.workspace
  dynamodb_table_count = local.current.dynamodb_table_count
}