#!/bin/bash

# Quick deployment script for Cobytes Security Platform using Ansible

echo "🚀 Cobytes Security Platform - VPS Deployment"
echo "============================================="

# Check if ansible is installed
if ! command -v ansible &> /dev/null; then
    echo "❌ Ansible is not installed"
    echo "Install with: pip install ansible"
    exit 1
fi

# Check if inventory file exists
if [ ! -f "inventory.yml" ]; then
    echo "❌ inventory.yml not found"
    echo "Please create it from inventory.yml.example"
    exit 1
fi

# Check if VPS IP is configured
if grep -q "YOUR_VPS_IP_HERE" inventory.yml; then
    echo "❌ Please update the VPS IP in inventory.yml"
    exit 1
fi

# Run ansible playbook
echo "📦 Starting deployment..."
ansible-playbook -i inventory.yml playbook.yml

if [ $? -eq 0 ]; then
    echo "✅ Deployment completed successfully!"
    echo ""
    echo "Your application should be available at:"
    echo "https://securityscan.cobytes.com"
    echo ""
    echo "To check the status:"
    echo "ssh root@YOUR_VPS_IP 'systemctl status cobytes-backend'"
else
    echo "❌ Deployment failed"
    exit 1
fi