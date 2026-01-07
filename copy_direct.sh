#!/bin/bash

# COPY FILES DIRECTLY TO LXC CONTAINER ROOT
# Target: root@31.97.70.79:/var/snap/lxd/common/lxd/containers/sms/rootfs/root/

echo "=== COPYING FILES DIRECTLY TO LXC CONTAINER ==="
echo "Timestamp: $(date)"

SERVER="root@31.97.70.79"
TARGET_PATH="/var/snap/lxd/common/lxd/containers/sms/rootfs/root/"

echo "1. Copying emergency recovery script..."
scp /home/yosuf/Pictures/School/emergency_recovery.sh $SERVER:$TARGET_PATH

echo "2. Copying export script..."
scp /home/yosuf/Pictures/School/export_all_data.sh $SERVER:$TARGET_PATH

echo "3. Copying SQL schema..."
scp /home/yosuf/Pictures/School/complete_schema.sql $SERVER:$TARGET_PATH

echo "4. Making scripts executable..."
ssh $SERVER "chmod +x $TARGET_PATH/emergency_recovery.sh"
ssh $SERVER "chmod +x $TARGET_PATH/export_all_data.sh"

echo "5. Verifying files are in place..."
ssh $SERVER "ls -la $TARGET_PATH/*.sh $TARGET_PATH/*.sql"

echo ""
echo "=== COPY COMPLETED ==="
echo ""
echo "Files are now at:"
echo "- $TARGET_PATH/emergency_recovery.sh"
echo "- $TARGET_PATH/export_all_data.sh"
echo "- $TARGET_PATH/complete_schema.sql"
echo ""
echo "To run recovery in container:"
echo "ssh root@31.97.70.79"
echo "lxc exec sms -- bash /root/emergency_recovery.sh"
echo ""
echo "To export all data:"
echo "ssh root@31.97.70.79"
echo "lxc exec sms -- bash /root/export_all_data.sh"
