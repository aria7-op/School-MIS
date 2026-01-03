# Fix DNS in LXC Container

## Problem
The LXC container `sms` cannot resolve DNS names, causing SMS service failures.

## Solution Options

### Option 1: Configure DNS Inside Container (Quick Fix)

**Run these commands INSIDE the container (root@sms):**

```bash
# Create DNS configuration
cat > /etc/resolv.conf << 'EOF'
nameserver 8.8.8.8
nameserver 8.8.4.4
nameserver 1.1.1.1
search local
EOF

# Test DNS
nslookup google.com
nslookup dservices.etisalat.af
ping -c 2 google.com
```

**Note:** This may be overwritten by systemd. To make it persistent:

```bash
# Make file immutable (prevents overwriting)
chattr +i /etc/resolv.conf

# Or disable systemd-resolved if it's interfering
systemctl stop systemd-resolved
systemctl disable systemd-resolved
```

---

### Option 2: Configure DNS at LXC Host Level (Recommended)

**Run these commands on the HOST (not inside container):**

```bash
# Configure DNS for the container
lxc config set sms raw.lxc "lxc.apparmor.profile = unconfined"
lxc config set sms user.network-config "nameserver 8.8.8.8\nnameserver 8.8.4.4"

# Or set DNS directly
lxc config device set sms eth0 ipv4.address=auto ipv4.gateway=auto

# Restart container to apply changes
lxc restart sms
```

---

### Option 3: Configure DNS via Cloud-init (If using cloud-init)

**On the HOST:**

```bash
# Create cloud-init config
cat > /tmp/sms-dns.yaml << 'EOF'
#cloud-config
resolv_conf:
  nameservers:
    - '8.8.8.8'
    - '8.8.4.4'
    - '1.1.1.1'
  searchdomains:
    - 'local'
EOF

# Apply to container
lxc config set sms user.user-data - < /tmp/sms-dns.yaml
lxc restart sms
```

---

### Option 4: Configure via systemd-networkd (If container uses it)

**Inside the container (root@sms):**

```bash
# Create networkd config
mkdir -p /etc/systemd/network
cat > /etc/systemd/network/20-dns.conf << 'EOF'
[Network]
DNS=8.8.8.8 8.8.4.4 1.1.1.1
Domains=local
EOF

# Restart networkd
systemctl restart systemd-networkd
```

---

## Verification

After applying any solution, verify DNS works:

```bash
# Inside container
nslookup google.com
nslookup dservices.etisalat.af
ping -c 2 google.com
dig dservices.etisalat.af
```

---

## Quick Fix Script

I've created a script `fix_dns_in_container.sh` that you can copy to the container and run:

```bash
# Copy script to container
scp fix_dns_in_container.sh root@YOUR_SERVER_IP:/tmp/

# Or if you have direct access to container
lxc file push fix_dns_in_container.sh sms/tmp/

# Execute inside container
lxc exec sms -- bash /tmp/fix_dns_in_container.sh
```

---

## Troubleshooting

If DNS still doesn't work:

1. **Check container network mode:**
   ```bash
   lxc config show sms | grep network
   ```

2. **Check if container can reach host:**
   ```bash
   # Inside container
   ping <host-ip>
   ```

3. **Check DNS servers are reachable:**
   ```bash
   # Inside container
   ping 8.8.8.8
   ```

4. **Check firewall rules:**
   ```bash
   # On host
   iptables -L -n | grep 53
   ```

5. **Check LXC network configuration:**
   ```bash
   # On host
   lxc network list
   lxc network show <network-name>
   ```

