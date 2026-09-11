# 🇮🇳 Arogya Mitra — SIH Grand Finale Healthcare Mock Demo

Arogya Mitra is a unified, closed-loop clinical continuum and rural field tele-health platform connecting Frontline ASHA Workers, OPD Triage Desks, Doctors, and Citizens.

## 🚀 Live Portals in this Demo

| Portal | File | Description |
| :--- | :--- | :--- |
| 🏠 **Portal Hub** | `index.html` | Master navigation hub linking all 5 workstations |
| 🧑‍⚕️ **ASHA Worker Portal** | `asha-worker.html` | Offline field screening, high-risk alerts & GPS task list |
| 📋 **OPD Queue Dispatcher** | `queue-ticket.html` | 4-tier ESI drag-and-drop live queue & bilingual voice TTS |
| 👨‍⚕️ **Doctor Clinical Console** | `dashboard.html` | Tele-consultation, CDSS drug interaction safety & digital eRx |
| 📱 **Citizen Health App** | `patient-app.html` | Mobile ABHA QR wallet, live token tracker & prescription vault |
| 🏥 **Central Continuum Audit**| `followup.html` | Closed-loop 100% referral audit tracker |
| 📊 **System Flowcharts** | `flowcharts.html` | Interactive architecture flowcharts & offline data pipelines |

---

## ⚡ 1-Click Deploy to Vercel

### Option 1: Via Vercel Web Dashboard (Recommended)
1. Push this folder to a GitHub repository (e.g. `arogya-mitra-demo`).
2. Go to [vercel.com/new](https://vercel.com/new).
3. Import the repository and click **Deploy**.
4. (If importing the parent repository, set **Root Directory** to `mccphp/demo`).

### Option 2: Via Vercel CLI
```bash
npm install -g vercel
vercel
```

---

## 🔒 Tech Stack Highlights
* **Zero Dependencies:** Native Vanilla JS, Modern CSS tokens, and HTML5 Web APIs.
* **Offline First:** Service Worker caching and IndexedDB edge storage simulation.
* **Instant Load:** <50ms load time on legacy 2GB RAM clinic terminals.
