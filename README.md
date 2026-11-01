# LuMekH (Paperclip)

> Open-source orchestration control plane for teams of AI agents. Manage business goals, org charts, budgets, governance, and autonomous agent coordination from a single unified dashboard.

---

## Table of Contents

- [Overview](#overview)
- [VPS System Requirements](#vps-system-requirements)
- [Method 1: Docker Compose Deployment (Recommended)](#method-1-docker-compose-deployment-recommended)
  - [1. Install Docker & Dependencies](#1-install-docker--dependencies)
  - [2. Clone the Repository](#2-clone-the-repository)
  - [3. Configure Environment Variables](#3-configure-environment-variables)
  - [4. Launch the Containers](#4-launch-the-containers)
  - [5. First-Time Setup & Admin Claim](#5-first-time-setup--admin-claim)
- [Method 2: Native Node.js Deployment (PM2 / Systemd)](#method-2-native-nodejs-deployment-pm2--systemd)
- [Production Nginx Reverse Proxy & SSL (HTTPS)](#production-nginx-reverse-proxy--ssl-https)
- [Updating Your VPS Instance](#updating-your-vps-instance)
- [Useful Commands](#useful-commands)

---

## Overview

LuMekH Paperclip combines an Express REST API backend, an embedded database or PostgreSQL instance, and a modern React UI. It includes native adapters for major AI agents (including Claude Code, OpenAI Codex, Google Gemini CLI, OpenCode, and HTTP bots).

---

## VPS System Requirements

- **Operating System:** Ubuntu 22.04 / 24.04 LTS or Debian 12 (recommended)
- **CPU & RAM:** 2+ vCPUs, 4GB+ RAM (8GB recommended if running multiple local agent CLI processes)
- **Disk Space:** 20GB+ SSD storage
- **Open Ports:** `3100` (Paperclip UI/API), `80` & `443` (if setting up Nginx + SSL)

---

## Method 1: Docker Compose Deployment (Recommended)

Docker Compose bundles Node.js, the database, agent CLI tooling, and persistent storage into isolated containers.

### 1. Install Docker & Dependencies

Log into your VPS via SSH and install Docker:

```bash
# Update package list and install prerequisites
sudo apt-get update && sudo apt-get install -y curl git openssl

# Install Docker using the official automated script
curl -fsSL https://get.docker.com | sh

# Allow your user to run Docker commands without sudo (optional)
sudo usermod -aG docker $USER
newgrp docker
```

Verify Docker installation:

```bash
docker --version && docker compose version
```

---

### 2. Clone the Repository

```bash
git clone https://github.com/lumekh000/Papaerclip.git
cd Papaerclip
```

---

### 3. Configure Environment Variables

Create the `.env` file inside the `docker/` directory by generating fresh cryptographic secrets:

```bash
BETTER_AUTH_SECRET=$(openssl rand -hex 32)
SIGNING_SECRET=$(openssl rand -hex 32)

cat <<EOF > docker/.env
# ── Authentication & Security Secrets ──
BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET}
PAPERCLIP_TOOL_ACTION_SIGNING_SECRET=${SIGNING_SECRET}

# ── Public URL & Host Settings ──
# Replace with your VPS IP or your custom domain:
PAPERCLIP_PUBLIC_URL=http://your-vps-ip:3100
# If using a domain with SSL: https://paperclip.yourdomain.com

# ── Deployment Exposure ──
PAPERCLIP_DEPLOYMENT_MODE=authenticated
# Use "public" if directly accessible, or "private" if behind VPN/Tailscale:
PAPERCLIP_DEPLOYMENT_EXPOSURE=public

# Optional: Extra accepted hostnames (comma-separated)
PAPERCLIP_ALLOWED_HOSTNAMES=

# ── LLM Provider API Keys ──
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=...
EOF
```

Edit `docker/.env` to enter your VPS IP/domain and API keys:

```bash
nano docker/.env
```

---

### 4. Launch the Containers

Choose one of two Compose options:

#### Option A: Quickstart (Single Container with Embedded PGlite DB — Easiest)

```bash
cd docker
docker compose -f docker-compose.quickstart.yml up -d --build
```

#### Option B: Full Stack (With Dedicated PostgreSQL Container)

```bash
cd docker
docker compose -f docker-compose.yml up -d --build
```

To follow container logs in real time:

```bash
docker compose -f docker-compose.quickstart.yml logs -f
```

---

### 5. First-Time Setup & Admin Claim

1. Open your browser and navigate to:
   ```
   http://<YOUR_VPS_IP>:3100
   ```
2. You will be greeted by the onboarding and sign-in screen.
3. Check your docker logs (`docker compose -f docker-compose.quickstart.yml logs`) for the one-time board claim link if claiming board administrator privileges:
   ```
   /board-claim/<token>?code=<code>
   ```

---

## Production Nginx Reverse Proxy & SSL (HTTPS)

To use your own custom domain (e.g. `paperclip.example.com`) with automated SSL certificates:

### 1. Install Nginx & Certbot

```bash
sudo apt-get install -y nginx certbot python3-certbot-nginx
```

### 2. Configure Nginx

Create `/etc/nginx/sites-available/paperclip`:

```bash
sudo nano /etc/nginx/sites-available/paperclip
```

Paste the following configuration (replace `paperclip.example.com` with your domain):

```nginx
server {
    server_name paperclip.example.com;

    location / {
        proxy_pass http://127.0.0.1:3100;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 3. Enable Site & Generate SSL Certificate

```bash
sudo ln -s /etc/nginx/sites-available/paperclip /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# Obtain free Let's Encrypt certificate
sudo certbot --nginx -d paperclip.example.com
```

### 4. Update `.env`

In `docker/.env`, update your public URL to use HTTPS:

```env
PAPERCLIP_PUBLIC_URL=https://paperclip.example.com
```

Restart the container:

```bash
cd docker
docker compose -f docker-compose.quickstart.yml down
docker compose -f docker-compose.quickstart.yml up -d
```

---

## Method 2: Native Node.js Deployment (PM2 / Systemd)

If you prefer to run directly on the host without Docker:

### 1. Install Node.js (20+), pnpm, and Git

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs git
corepack enable
corepack prepare pnpm@latest --activate
```

### 2. Clone & Build

```bash
git clone https://github.com/lumekh000/Papaerclip.git
cd Papaerclip
pnpm install
pnpm build
```

### 3. Interactive Onboarding

```bash
pnpm paperclipai onboard
```

Follow the prompts to select authentication mode (`authenticated`), network binding, and configure your initial administrator user.

### 4. Run as a Background Service with PM2

```bash
sudo npm install -g pm2
pm2 start "pnpm start" --name "paperclip"
pm2 save
pm2 startup
```

---

## Updating Your VPS Instance

When you push new changes to GitHub, update your VPS deployment with:

### For Docker:

```bash
cd Papaerclip
git pull origin main
cd docker
docker compose -f docker-compose.quickstart.yml up -d --build
```

### For Native Node.js:

```bash
cd Papaerclip
git pull origin main
pnpm install
pnpm build
pm2 restart paperclip
```

---

## Useful Commands

| Task | Command |
|---|---|
| View live logs | `docker compose -f docker/docker-compose.quickstart.yml logs -f` |
| Restart container | `docker compose -f docker/docker-compose.quickstart.yml restart` |
| Stop container | `docker compose -f docker/docker-compose.quickstart.yml down` |
| Check container status | `docker ps` |
| Run onboard CLI inside container | `docker exec -it <container_id> paperclipai configure` |
| View PM2 logs (native) | `pm2 logs paperclip` |

---

## License

MIT © 2026 LuMekH
