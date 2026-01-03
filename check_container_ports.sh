#!/bin/bash
# Script to check container ports and forwarding
# Run on HOST (root@srv930748)

echo "🔍 Checking LXC container 'sms' configuration..."
echo ""

# Check container status and IP
echo "1. Container Status:"
lxc list sms
echo ""

# Check what ports are exposed/forwarded
echo "2. Container Port Configuration:"
lxc config show sms | grep -E "devices|proxy" -A 10
echo ""

# Check what's listening inside container
echo "3. Processes listening on ports inside container:"
lxc exec sms -- netstat -tlnp 2>/dev/null || lxc exec sms -- ss -tlnp
echo ""

# Check Node.js/PM2 processes
echo "4. Node.js/PM2 processes:"
lxc exec sms -- ps aux | grep -E "node|pm2" | grep -v grep
echo ""

# Check if port 4000 is listening
echo "5. Port 4000 status:"
lxc exec sms -- lsof -i:4000 2>/dev/null || lxc exec sms -- netstat -tlnp | grep :4000
echo ""

# Check container IP
echo "6. Container IP address:"
lxc list sms -c n4
echo ""

# Check host port forwarding (if using iptables)
echo "7. Host iptables port forwarding rules:"
iptables -t nat -L -n | grep -E "4000|sms" || echo "No iptables rules found"
echo ""

# Check if Caddy is configured
echo "8. Caddy configuration (if accessible):"
cat /etc/caddy/Caddyfile 2>/dev/null | grep -A 5 -B 5 "sms\|4000" || echo "Caddyfile not found or no sms config"
echo ""

echo "✅ Diagnostic complete"

