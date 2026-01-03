#!/bin/bash

# Quick Deploy Script for Mark Leave Feature
# Run this to copy all files at once

SERVER="root@31.97.70.79"
BASE="/var/snap/lxd/common/lxd/containers/sms/rootfs/root/sms"

echo "🚀 Deploying Mark Leave Feature to khwanzay.school..."
echo ""

scp /home/yosuf/Pictures/School/middleware/leaveDocumentUpload.js ${SERVER}:${BASE}/middleware/ && \
scp /home/yosuf/Pictures/School/controllers/attendanceController.js ${SERVER}:${BASE}/controllers/ && \
scp /home/yosuf/Pictures/School/routes/attendances.js ${SERVER}:${BASE}/routes/ && \
scp /home/yosuf/Pictures/School/prisma/schema.prisma ${SERVER}:${BASE}/prisma/

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Files copied successfully!"
    echo ""
    echo "🔄 Now run these commands on the server:"
    echo ""
    echo "ssh root@31.97.70.79"
    echo "lxc exec sms -- bash"
    echo "cd /root/sms"
    echo ""
    echo "# Run migration (if not done yet)"
    echo "mysql -u root -p school -e \"ALTER TABLE attendances ADD COLUMN IF NOT EXISTS leaveDocumentPath VARCHAR(500) NULL AFTER remarks;\""
    echo ""
    echo "# Regenerate Prisma"
    echo "npx prisma generate"
    echo ""
    echo "# Restart server"
    echo "pm2 restart sms"
    echo ""
else
    echo ""
    echo "❌ Deployment failed. Please copy files manually."
fi























