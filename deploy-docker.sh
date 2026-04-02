#!/bin/bash
set -e

echo "========================================="
echo "  DesignBid Docker Deployment"
echo "========================================="

# 1. Install Docker if not present
if ! command -v docker &> /dev/null; then
    echo "[1/4] Installing Docker..."
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
else
    echo "[1/4] Docker already installed."
fi

# Install docker-compose plugin if not present
if ! docker compose version &> /dev/null; then
    echo "Installing Docker Compose plugin..."
    apt-get update -qq
    apt-get install -y -qq docker-compose-plugin > /dev/null 2>&1
fi

# 2. Clone/update from GitLab
echo "[2/4] Cloning DesignBid from GitLab..."
rm -rf /opt/app/DesignBid
mkdir -p /opt/app
cd /opt/app
git clone https://gitlab.com/digitalkookiehub/DesignBid.git
cd DesignBid

# 3. Stop old containers
echo "[3/4] Stopping old containers..."
docker compose down 2>/dev/null || true

# 4. Build and start
echo "[4/4] Building and starting containers..."
docker compose up -d --build

# Wait for backend to be ready
echo "Waiting for services to start..."
sleep 10

echo ""
echo "========================================="
echo "  DEPLOYMENT COMPLETE!"
echo "========================================="
echo ""
echo "  Frontend: http://optionscreener.online"
echo "  API Docs: http://optionscreener.online/docs"
echo ""
echo "  Useful commands:"
echo "    docker compose -f /opt/app/DesignBid/docker-compose.yml logs -f"
echo "    docker compose -f /opt/app/DesignBid/docker-compose.yml ps"
echo "    docker compose -f /opt/app/DesignBid/docker-compose.yml restart"
echo "========================================="
