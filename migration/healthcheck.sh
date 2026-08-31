#!/bin/bash
echo "=== Healthcheck ==="
echo "Node: $(node -v 2>/dev/null || echo 'NOT FOUND')"
echo "PM2: $(pm2 -v 2>/dev/null || echo 'NOT FOUND')"
echo "Nginx: $(systemctl is-active nginx 2>/dev/null || echo 'NOT RUNNING')"
echo "App (PM2):"
pm2 list 2>/dev/null || echo "PM2 not running"
echo "App status: $(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000 || echo 'DOWN')"
