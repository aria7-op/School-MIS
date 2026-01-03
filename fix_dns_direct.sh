#!/bin/bash
# Run this INSIDE the LXC container (root@sms)

echo "🔧 Fixing DNS configuration..."

# Stop systemd-resolved if it's running (it might be interfering)
systemctl stop systemd-resolved 2>/dev/null
systemctl disable systemd-resolved 2>/dev/null

# Remove any existing resolv.conf
rm -f /etc/resolv.conf

# Create new resolv.conf with public DNS servers
cat > /etc/resolv.conf << 'EOF'
nameserver 8.8.8.8
nameserver 8.8.4.4
nameserver 1.1.1.1
EOF

# Make it readable
chmod 644 /etc/resolv.conf

# Try to make it immutable (prevents overwriting)
chattr +i /etc/resolv.conf 2>/dev/null || echo "⚠️ chattr not available"

# Verify the file was created
echo ""
echo "📄 DNS configuration:"
cat /etc/resolv.conf

# Test DNS
echo ""
echo "🧪 Testing DNS resolution..."
echo ""

echo "1. Testing Google:"
nslookup google.com 8.8.8.8 || echo "❌ Failed"

echo ""
echo "2. Testing Etisalat SMS service:"
nslookup dservices.etisalat.af 8.8.8.8 || echo "❌ Failed"

echo ""
echo "3. Testing ping:"
ping -c 2 8.8.8.8 && echo "✅ Can reach DNS server" || echo "❌ Cannot reach DNS server"

echo ""
echo "4. Testing DNS resolution with dig:"
dig @8.8.8.8 google.com +short || echo "❌ Failed"

echo ""
echo "✅ DNS configuration complete!"

