# Deployment Guide: CivicPulse AI

This document provides configuration steps to compile, secure, and deploy CivicPulse AI to a production environment.

## 1. Environment Preparation

Ensure the production server or hosting container has the following environment variables configured (refer to `.env.example`):

- **`NODE_ENV`**: Set to `"production"`.
- **`VITE_APP_MODE`**: Set to `"firebase"` to enforce cryptographic session checks.
- **`FIREBASE_PROJECT_ID`**: Your Firebase console project ID.
- **`GEMINI_API_KEY`**: API key representing access to Google AI Studio.
- **`SMTP_USER`**: SMTP relay sender email (e.g., Gmail address).
- **`SMTP_PASS`**: SMTP app-specific verification password.

## 2. Production Build

To compile both client and backend bundles:
```bash
npm run build
```
This performs two primary compile tasks:
1. **Frontend**: Compiles and minifies TypeScript/Vite static resources into the `dist/` directory.
2. **Backend**: Bundles `server.ts` into a unified CommonJS node script inside `dist/server.cjs`.

## 3. Starting the Production Server

Run the unified node server script:
```bash
npm run start
```
The server will bind to `0.0.0.0` on port `3000` by default.

## 4. Production Security Hardening

When deploying behind a reverse proxy (e.g., Nginx, Cloudflare, AWS ALB), configure the proxy to enforce:

### SSL/TLS and HSTS
The Express server sets Strict-Transport-Security (`HSTS`) headers automatically in production. Ensure your reverse proxy handles SSL termination (port 443) and redirects HTTP (port 80) traffic.

### Reverse Proxy Nginx Configuration Sample
```nginx
server {
    listen 80;
    server_name civicpulse.yourcity.gov.in;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name civicpulse.yourcity.gov.in;

    ssl_certificate /etc/letsencrypt/live/civicpulse/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/civicpulse/privkey.pem;

    # Secure TLS configurations
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```
