#!/bin/bash

# Deploy ALL attendance-related files with fixes

SERVER="root@31.97.70.79"
BASE="/var/snap/lxd/common/lxd/containers/sms/rootfs/root/sms"

echo "🚀 Deploying ALL Attendance Files..."
echo ""

echo "1️⃣ Copying middleware..."
scp /home/yosuf/Pictures/School/middleware/leaveDocumentUpload.js ${SERVER}:${BASE}/middleware/

echo "2️⃣ Copying controller..."
scp /home/yosuf/Pictures/School/controllers/attendanceController.js ${SERVER}:${BASE}/controllers/

echo "3️⃣ Copying routes..."
scp /home/yosuf/Pictures/School/routes/attendances.js ${SERVER}:${BASE}/routes/

echo "4️⃣ Copying schema..."
scp /home/yosuf/Pictures/School/prisma/schema.prisma ${SERVER}:${BASE}/prisma/

echo ""
echo "✅ All files copied!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 Now run on server:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "ssh root@31.97.70.79"
echo "lxc exec sms -- bash"
echo "cd /root/sms"
echo ""
echo "# Migration (if not done)"
echo "mysql -u root -p school -e \"ALTER TABLE attendances ADD COLUMN IF NOT EXISTS leaveDocumentPath VARCHAR(500) NULL AFTER remarks;\""
echo ""
echo "# Regenerate Prisma"
echo "npx prisma generate"
echo ""
echo "# Restart"
echo "pm2 restart sms"
echo ""
echo "# Check logs"
echo "pm2 logs sms --lines 50"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ Look for these in logs:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 Mark Student Leave - START"
echo "📄 File: { originalname: 'xxx.pdf', ... }"
echo "📄 File uploaded: YES"
echo ""























