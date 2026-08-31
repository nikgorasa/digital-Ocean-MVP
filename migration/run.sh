#!/bin/bash
set -e

echo "=== GoRASA DigitalOcean Migration — Ready to Execute ==="
echo ""
echo "1. Copy this entire 'migration/' folder to your DigitalOcean Droplet"
echo "2. SSH into the Droplet"
echo "3. Run: bash migration/setup-droplet.sh"
echo "4. Copy your built app to /var/www/gorasa"
echo "5. Run: pm2 start migration/ecosystem.config.js"
echo ""
echo "=== Done ==="
