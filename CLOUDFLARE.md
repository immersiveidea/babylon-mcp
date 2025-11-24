# Alpine Linux Cloudflare Tunnel
wget -O cloudflared https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
chmod +x ./cloudflared
mv cloudflared /usr/local/bin
cloudflared tunnel login
tunnel: flatearthdefense
credentials-file: /root/.cloudflared/8cc15306-84a2-458a-b5bd-ccf07f61df8c.json

ingress:
- hostname: www.flatearthdefense.com
  service: http://localhost:4000
  originRequest:
- service: http_status:404