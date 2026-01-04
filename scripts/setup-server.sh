#!/usr/bin/env bash
set -euo pipefail

# Run this on the target Ubuntu 24.04 server to prepare environment (example)
# Usage: sudo bash setup-server.sh

# Create app dir
APP_DIR=${APP_DIR:-/opt/file-uploads}
mkdir -p "$APP_DIR"
chown -R $SUDO_USER:$SUDO_USER "$APP_DIR"

# Install Bun (optional) or Node
if ! command -v bun >/dev/null 2>&1; then
  echo "Installing Bun..."
  curl -fsSL https://bun.sh/install | bash
  export PATH="$HOME/.bun/bin:$PATH"
fi

# Install node (if needed)
if ! command -v node >/dev/null 2>&1; then
  echo "Please install Node.js (>=18) or Bun. Example with NodeSource:"
  echo "curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt-get install -y nodejs"
fi

# Create systemd service file (copy from repo)
echo "Copy 'deploy/systemd/file-uploads.service' to /etc/systemd/system/file-uploads.service and customize if needed."

# Final instructions
cat <<'EOF'
Next steps (on server):
  - Place built artifact into $APP_DIR (CI will copy)
  - Create /opt/file-uploads/.env with required variables (JWT_SECRET, PORT, etc)
  - Copy systemd service file and run:
      sudo systemctl daemon-reload
      sudo systemctl enable --now file-uploads.service
  - Check logs with: sudo journalctl -u file-uploads -f
EOF
