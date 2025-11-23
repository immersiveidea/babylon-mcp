# Running Babylon MCP Server as an Alpine Linux Service

This guide explains how to run the Babylon MCP server as a system service on Alpine Linux using OpenRC.

## Prerequisites

- Babylon MCP server installed and built
- Repositories cloned and indexed
- Application working when run manually with `npm start`

## Setup Instructions

### 1. Create a dedicated user (recommended)

```bash
# Create a system user for running the service
adduser -S -D -h /var/lib/babylon-mcp -s /sbin/nologin babylon-mcp

# Copy application files to service directory
mkdir -p /var/lib/babylon-mcp
cp -r /root/babylon-mcp/* /var/lib/babylon-mcp/
chown -R babylon-mcp:nogroup /var/lib/babylon-mcp
```

**Or run as root (simpler but less secure):**

Skip this step and use `/root/babylon-mcp` as the working directory in the service file.

### 2. Create the OpenRC service file

```bash
cat > /etc/init.d/babylon-mcp << 'EOF'
#!/sbin/openrc-run

name="babylon-mcp"
description="Babylon MCP Server"

# Application directory
directory="/root/babylon-mcp"

# Command to run (using node directly for better performance)
command="/usr/local/bin/node"
command_args="dist/mcp/index.js"

# Run in background
command_background="yes"
pidfile="/run/${RC_SVCNAME}.pid"

# Logs
output_log="/var/log/babylon-mcp.log"
error_log="/var/log/babylon-mcp.err"

# Environment variables (optional)
# export NODE_ENV="production"
# export PORT="4000"

depend() {
    need net
    after firewall
}

start_pre() {
    # Ensure log files exist
    touch "$output_log" "$error_log"

    # Check if built
    if [ ! -f "$directory/dist/mcp/index.js" ]; then
        eerror "Application not built. Run 'npm run build' first."
        return 1
    fi
}
EOF

chmod +x /etc/init.d/babylon-mcp
```

**If running as dedicated user:**

```bash
cat > /etc/init.d/babylon-mcp << 'EOF'
#!/sbin/openrc-run

name="babylon-mcp"
description="Babylon MCP Server"

# Run as dedicated user
command_user="babylon-mcp:nogroup"

# Application directory
directory="/var/lib/babylon-mcp"

# Command to run
command="/usr/local/bin/node"
command_args="dist/mcp/index.js"

# Run in background
command_background="yes"
pidfile="/run/${RC_SVCNAME}.pid"

# Logs
output_log="/var/log/babylon-mcp.log"
error_log="/var/log/babylon-mcp.err"

depend() {
    need net
    after firewall
}

start_pre() {
    # Ensure log files exist with correct permissions
    touch "$output_log" "$error_log"
    chown babylon-mcp:nogroup "$output_log" "$error_log"

    # Check if built
    if [ ! -f "$directory/dist/mcp/index.js" ]; then
        eerror "Application not built. Run 'npm run build' first."
        return 1
    fi
}
EOF

chmod +x /etc/init.d/babylon-mcp
```

### 3. Enable and start the service

```bash
# Enable service to start on boot
rc-update add babylon-mcp default

# Start service now
rc-service babylon-mcp start

# Check status
rc-service babylon-mcp status
```

### 4. Verify the service is running

```bash
# Check if service is running
rc-service babylon-mcp status

# View logs
tail -f /var/log/babylon-mcp.log

# View errors
tail -f /var/log/babylon-mcp.err

# Test the server
curl http://localhost:4000/health
```

## Service Management Commands

```bash
# Start the service
rc-service babylon-mcp start

# Stop the service
rc-service babylon-mcp stop

# Restart the service
rc-service babylon-mcp restart

# Check status
rc-service babylon-mcp status

# View logs in real-time
tail -f /var/log/babylon-mcp.log

# View error logs
tail -f /var/log/babylon-mcp.err

# Disable service from starting on boot
rc-update del babylon-mcp default

# Enable service to start on boot
rc-update add babylon-mcp default
```

## Troubleshooting

### Service won't start

1. Check the error log:
```bash
cat /var/log/babylon-mcp.err
```

2. Verify the application is built:
```bash
ls -la /root/babylon-mcp/dist/mcp/index.js
```

3. Try running manually first:
```bash
cd /root/babylon-mcp
node dist/mcp/index.js
```

### Permission issues

If running as dedicated user, ensure proper permissions:
```bash
chown -R babylon-mcp:nogroup /var/lib/babylon-mcp
```

### Port already in use

Check if another service is using port 4000:
```bash
netstat -tlnp | grep 4000
```

### Node.js not found

Verify node installation and path:
```bash
which node
# Should output: /usr/local/bin/node or /usr/bin/node

# Update command path in /etc/init.d/babylon-mcp if needed
```

## Environment Variables

To set environment variables for the service, edit `/etc/init.d/babylon-mcp` and add before the `depend()` function:

```bash
# Set environment variables
export NODE_ENV="production"
export PORT="4000"
export TRANSFORMERS_BACKEND="wasm"  # For Alpine Linux
```

## Updating the Application

When you update the code:

```bash
# 1. Stop the service
rc-service babylon-mcp stop

# 2. Pull changes
cd /root/babylon-mcp
git pull

# 3. Rebuild
npm run build

# 4. Start the service
rc-service babylon-mcp start
```

## Running with npm start (alternative)

If you prefer to use `npm start` instead of running node directly:

```bash
cat > /etc/init.d/babylon-mcp << 'EOF'
#!/sbin/openrc-run

name="babylon-mcp"
description="Babylon MCP Server"
directory="/root/babylon-mcp"
command="/usr/bin/npm"
command_args="start"
command_background="yes"
pidfile="/run/${RC_SVCNAME}.pid"
output_log="/var/log/babylon-mcp.log"
error_log="/var/log/babylon-mcp.err"

depend() {
    need net
    after firewall
}
EOF

chmod +x /etc/init.d/babylon-mcp
```

**Note:** Using `node` directly is more efficient and faster than using `npm start`.

## Integration with Cloudflare Tunnel

If you're running Cloudflare Tunnel, ensure both services start in the correct order:

```bash
# In /etc/init.d/cloudflared, add:
depend() {
    need net babylon-mcp
    after firewall
}
```

This ensures the MCP server starts before the tunnel.

## Monitoring and Logs

### View live logs
```bash
tail -f /var/log/babylon-mcp.log
```

### Rotate logs (optional)

Create `/etc/logrotate.d/babylon-mcp`:
```
/var/log/babylon-mcp.log
/var/log/babylon-mcp.err {
    daily
    missingok
    rotate 7
    compress
    notifempty
    create 0640 root root
    sharedscripts
    postrotate
        rc-service babylon-mcp restart > /dev/null 2>&1 || true
    endscript
}
```

## Complete Setup Script

For a fresh Alpine installation, run:

```bash
#!/bin/sh
# Complete setup script

# Create service file
cat > /etc/init.d/babylon-mcp << 'EOF'
#!/sbin/openrc-run
name="babylon-mcp"
description="Babylon MCP Server"
directory="/root/babylon-mcp"
command="/usr/local/bin/node"
command_args="dist/mcp/index.js"
command_background="yes"
pidfile="/run/${RC_SVCNAME}.pid"
output_log="/var/log/babylon-mcp.log"
error_log="/var/log/babylon-mcp.err"

depend() {
    need net
    after firewall
}

start_pre() {
    touch "$output_log" "$error_log"
    if [ ! -f "$directory/dist/mcp/index.js" ]; then
        eerror "Application not built. Run 'npm run build' first."
        return 1
    fi
}
EOF

# Make executable
chmod +x /etc/init.d/babylon-mcp

# Enable and start
rc-update add babylon-mcp default
rc-service babylon-mcp start

echo "✓ Babylon MCP service configured and started"
echo "Check status: rc-service babylon-mcp status"
echo "View logs: tail -f /var/log/babylon-mcp.log"
```
