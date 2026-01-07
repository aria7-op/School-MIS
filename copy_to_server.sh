#!/bin/bash

# COPY RECOVERY FILES TO SERVER
# Server: root@31.97.70.79 - Container: sms

echo "=== COPYING FILES TO SERVER ==="
echo "Timestamp: $(date)"

SERVER="root@31.97.70.79"
CONTAINER="sms"

echo "1. Copying emergency recovery script to server..."
scp /home/yosuf/Pictures/School/emergency_recovery.sh $SERVER:/tmp/

echo "2. Copying export script to server..."
scp /home/yosuf/Pictures/School/export_all_data.sh $SERVER:/tmp/

echo "3. Copying SQL schema to server..."
scp /home/yosuf/Pictures/School/complete_schema.sql $SERVER:/tmp/

echo "4. Moving files into LXC container..."
ssh $SERVER "lxc file push /tmp/emergency_recovery.sh $CONTAINER/root/"
ssh $SERVER "lxc file push /tmp/export_all_data.sh $CONTAINER/root/"
ssh $SERVER "lxc file push /tmp/complete_schema.sql $CONTAINER/root/"

echo "5. Making scripts executable in container..."
ssh $SERVER "lxc exec $CONTAINER -- chmod +x /root/emergency_recovery.sh"
ssh $SERVER "lxc exec $CONTAINER -- chmod +x /root/export_all_data.sh"

echo "6. Verifying files are in container..."
echo "Files in /root of container:"
ssh $SERVER "lxc exec $CONTAINER -- ls -la /root/*.sh /root/*.sql"

echo ""
echo "=== COPY COMPLETED ==="
echo ""
echo "Files now available in your sms container:"
echo "- /root/emergency_recovery.sh"
echo "- /root/export_all_data.sh" 
echo "- /root/complete_schema.sql"
echo ""
echo "To run recovery:"
echo "ssh root@31.97.70.79"
echo "lxc exec sms -- bash /root/emergency_recovery.sh"
echo ""
echo "To export all data:"
echo "ssh root@31.97.70.79"
echo "lxc exec sms -- bash /root/export_all_data.sh"
