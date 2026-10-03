#!/bin/bash

# Paths and Variables
# Get the absolute path of where this script lives to prevent navigation errors
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE}")" && pwd)"

TERRAFORM_OUTPUT_DIR="$SCRIPT_DIR/../terraform/modules/ec2"  
ANSIBLE_INVENTORY_FILE="$SCRIPT_DIR/inventory/inventory"

# Ensure the parent directory for the inventory file exists
mkdir -p "$(dirname "$ANSIBLE_INVENTORY_FILE")"

# Navigate to the Terraform directory
cd "$TERRAFORM_OUTPUT_DIR" || { echo "Terraform directory not found at $TERRAFORM_OUTPUT_DIR"; exit 1; }

# Fetch and clean up IPs from Terraform outputs (extracts only valid IPv4 strings)
IPS=$(terraform output -json ec2_public_ip | jq -r '.. | strings | select(test("^[0-9]+\\.[0-9]+\\.[0-9]+\\.[0-9]+$"))')

# Verify we actually got IPs before clearing our inventory file
if [ -z "$IPS" ]; then
    echo "Error: No public IP addresses found in Terraform output!"
    exit 1
fi

# Create or clear the inventory file
> "$ANSIBLE_INVENTORY_FILE"

# Write the inventory header
echo "[eks-server]" >> "$ANSIBLE_INVENTORY_FILE"

count=1
for ip in $IPS; do
    echo "server${count} ansible_host=$ip" >> "$ANSIBLE_INVENTORY_FILE"
    count=$((count + 1))
done

# Add common variables
echo "" >> "$ANSIBLE_INVENTORY_FILE"
echo "[eks-server:vars]" >> "$ANSIBLE_INVENTORY_FILE"
echo "ansible_user=ubuntu" >> "$ANSIBLE_INVENTORY_FILE"
echo "ansible_ssh_private_key_file=../terraform/modules/ec2/eks-key" >> "$ANSIBLE_INVENTORY_FILE"
echo "ansible_python_interpreter=/usr/bin/python3" >> "$ANSIBLE_INVENTORY_FILE"
echo "ansible_ssh_common_args='-o IdentitiesOnly=yes -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null'" >> "$ANSIBLE_INVENTORY_FILE"

echo "Updated inventory file at: $ANSIBLE_INVENTORY_FILE"
echo "All done!"