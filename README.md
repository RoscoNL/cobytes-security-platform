# Cobytes Security Platform

🛡️ White-label security scanning platform voor de Nederlandse markt

## 🚀 Project Status

- **Fase 1**: ✅ COMPLEET (Service catalog, pricing, API mapping)
- **Fase 2**: 🔄 IN ONTWIKKELING (API architectuur)
- **Context Management**: ✅ Checkpoint system geïmplementeerd

## 💻 Quick Start

```bash
# Clone repository
git clone https://github.com/RoscoNL/cobytes-security-platform.git
cd cobytes-security-platform

# Setup environment
cp .env.example .env
# Edit .env met je API keys

# Install dependencies
npm install

# Run development
npm run dev
```

## 📊 Services & Pricing

### Scans vanaf €10
- Basis scans: €10
- Vulnerability scans: €20-25  
- API/Cloud scans: €50
- CMS scans: €35
- Enterprise scans: €75

### Add-ons
- Herstelplan: €15
- Management Summary: €10

Zie [docs/SERVICE_CATALOG.md](docs/SERVICE_CATALOG.md) voor details.

## 🏗️ Architecture

```
Frontend (React) → Backend API → Security Scanner API
                        ↓
                  PostgreSQL + Redis
```

## 📁 Project Structure

```
cobytes-platform/
├── backend/           # Node.js + Express API
├── frontend/          # React + TypeScript
├── docs/             # Documentatie
├── scripts/          # Utility scripts
└── config/           # Configuratie files
```

## 🔐 Security Features

- JWT authentication
- API rate limiting
- Input validation
- CORS configuration
- SQL injection protection

## 🤝 Development

Dit project gebruikt een checkpoint systeem om context window problemen te voorkomen:
- Checkpoint files in `/docs`
- Frequente git commits
- Modulaire ontwikkeling

## 📝 License

Copyright © 2024 Cobytes B.V.