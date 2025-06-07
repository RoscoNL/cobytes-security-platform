# Ansible Deployment for Cobytes Security Platform

This Ansible playbook automates the deployment of the Cobytes Security Platform to a VPS.

## Prerequisites

1. **Local machine requirements:**
   ```bash
   # Install Ansible
   pip install ansible
   
   # Or on macOS
   brew install ansible
   ```

2. **VPS requirements:**
   - Ubuntu 20.04 or 22.04
   - Root access or sudo privileges
   - At least 1GB RAM
   - Domain pointed to VPS IP address

## Setup Instructions

1. **Create a VPS on DigitalOcean:**
   - Create a new Droplet (Ubuntu 22.04, Basic plan, $6/month is sufficient)
   - Add your SSH key during creation
   - Note the IP address

2. **Configure inventory:**
   ```bash
   # Edit inventory.yml and replace YOUR_VPS_IP_HERE with actual IP
   nano ansible/inventory.yml
   ```

3. **Update configuration:**
   - Change `db_password` in inventory.yml to a secure password
   - Update domain_name if different
   - Adjust any other settings as needed

4. **Run the playbook:**
   ```bash
   cd ansible
   ansible-playbook -i inventory.yml playbook.yml
   ```

## What the playbook does:

1. **System Setup:**
   - Updates system packages
   - Installs Node.js, PostgreSQL, Nginx
   - Creates application user
   - Sets up firewall rules

2. **Application Deployment:**
   - Clones the repository
   - Sets up PostgreSQL database
   - Installs dependencies
   - Builds frontend and backend
   - Creates systemd service

3. **Web Server Configuration:**
   - Configures Nginx as reverse proxy
   - Sets up SSL with Let's Encrypt
   - Enables WebSocket support

4. **Security:**
   - Configures UFW firewall
   - Sets up SSL certificates
   - Creates non-root user for app

## Post-deployment:

- Application will be available at: https://securityscan.cobytes.com
- Backend API: https://securityscan.cobytes.com/api
- Logs: `sudo journalctl -u cobytes-backend -f`

## Updating the application:

```bash
# Run playbook again to pull latest code and restart
ansible-playbook -i inventory.yml playbook.yml

# Or use the update tag (once implemented)
ansible-playbook -i inventory.yml playbook.yml --tags update
```

## Troubleshooting:

1. **Check service status:**
   ```bash
   sudo systemctl status cobytes-backend
   ```

2. **View logs:**
   ```bash
   sudo journalctl -u cobytes-backend -n 100
   ```

3. **Test database connection:**
   ```bash
   sudo -u postgres psql -d cobytes_db
   ```

4. **Check Nginx:**
   ```bash
   sudo nginx -t
   sudo systemctl status nginx
   ```