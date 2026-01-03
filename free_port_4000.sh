#!/bin/bash
# Script to free port 4000
# Run this inside the container (root@sms)

echo "🔍 Finding process using port 4000..."

# Find process using port 4000
PID=$(lsof -ti:4000 2>/dev/null || netstat -tlnp 2>/dev/null | grep :4000 | awk '{print $7}' | cut -d'/' -f1 | head -1)

if [ -z "$PID" ]; then
    # Try with ss command
    PID=$(ss -tlnp 2>/dev/null | grep :4000 | awk '{print $6}' | cut -d',' -f2 | cut -d'=' -f2 | head -1)
fi

if [ -z "$PID" ]; then
    echo "❌ Could not find process using port 4000"
    echo "Trying alternative methods..."
    
    # Try fuser
    fuser 4000/tcp 2>/dev/null && echo "Port 4000 is in use" || echo "Port 4000 appears free"
    
    # Show all processes
    echo ""
    echo "All processes:"
    ps aux | grep -E "node|pm2|app" | grep -v grep
else
    echo "✅ Found process using port 4000: PID $PID"
    echo "Process details:"
    ps -p $PID -o pid,ppid,cmd
    
    echo ""
    read -p "Kill this process? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        kill -9 $PID
        echo "✅ Process killed"
        sleep 2
        echo "Verifying port is free..."
        lsof -ti:4000 && echo "⚠️ Port still in use" || echo "✅ Port 4000 is now free"
    fi
fi

# Alternative: Kill all Node.js processes (use with caution)
# pkill -9 node

# Alternative: Kill PM2 processes
# pm2 kill

