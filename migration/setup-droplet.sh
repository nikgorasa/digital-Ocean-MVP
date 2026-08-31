#!/bin/bash
set -e
echo "=== DigitalOcean Droplet Minimal Setup ==="
apt-get update && apt-get upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs nginx ufw fail2ban
npm install -g pm2
mkdir -p /var/www/gorasa
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow http
ufw allow https
ufw --force enable
echo "=== Basic setup complete ==="
