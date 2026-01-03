#!/bin/bash
# Script to fix DNS configuration in LXC container
# Run this INSIDE the LXC container (root@sms)

echo "🔧 Configuring DNS in LXC container..."

# Create /etc/resolv.conf with public DNS servers
cat > /etc/resolv.conf << 'EOF'
nameserver 8.8.8.8
nameserver 8.8.4.4
nameserver 1.1.1.1
search local
EOF

echo "✅ DNS configuration created"

# Make it read-only to prevent systemd from overwriting it
chattr +i /etc/resolv.conf 2>/dev/null || echo "⚠️ chattr not available, skipping read-only flag"

# Test DNS resolution
echo ""
echo "🧪 Testing DNS resolution..."
echo ""

echo "Testing Google DNS:"
nslookup google.com || echo "❌ Failed"

echo ""
echo "Testing Etisalat SMS service:"
nslookup dservices.etisalat.af || echo "❌ Failed"

echo ""
echo "Testing ping:"
ping -c 2 google.com 2>&1 | head -5

echo ""
echo "✅ DNS configuration complete!"
echo "💡 If DNS still doesn't work, you may need to configure DNS at the LXC host level"

