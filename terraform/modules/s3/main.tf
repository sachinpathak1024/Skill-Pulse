resource "aws_s3_bucket" "my_bucket" {
  bucket = "${var.env}-${var.bucket_name}-${count.index + 1}"
  count  = var.bucket_count
  tags = {
    Name = "${var.env}-${var.bucket_name}-${count.index + 1}"
    # Environment = "Dev"
  }
}