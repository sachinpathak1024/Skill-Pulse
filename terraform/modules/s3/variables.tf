variable bucket_name {
  type        = string
  # default     = "sachin-bucket-s3-remote"
  description = "name of the bucket"
}

variable bucket_count {
  type        = string
#   default     = ""
  description = "count of the bucket"
}


variable env {
  type        = string
#   default     = ""
  description = "environment"
}