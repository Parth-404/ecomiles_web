# 🌿 EcoMiles — Smart CO₂ Travel Tracker

> A static web application that calculates, compares, and logs the carbon footprint of your travel — built with HTML, CSS, and Vanilla JavaScript. Designed to scale into a full-stack project with Node.js + MongoDB.

<br>

## 🔗 Live Demo
**[View Live Site](#)** ← *(replace with your Netlify / GitHub Pages link)*

<br>

## 👨‍💻 About the Developer

| | |
|---|---|
| **Name** | Parth Bendre |
| **College** | Pimpri Chinchwad College of Engineering, Pune |
| **Degree** | B.Tech — Artificial Intelligence & Machine Learning |
| **GitHub** | [@Parth-404](https://github.com/Parth-404) |
| **LinkedIn** | [Parth Bendre](https://www.linkedin.com/in/parth-bendre-732abb32a) |

> *"Trying to build projects that make the world a little better — one line of code at a time."*

<br>

## 💡 Project Story

EcoMiles started as a **first-year C programming assignment** — a simple console tool to calculate CO₂ emissions from travel. In second year, it was rebuilt as a full static website with a modern UI, interactive charts, trip history, and a design that's ready for a real backend when the time comes.

<br>

## ✨ Features

| Feature | Status |
|---|---|
| 9 transport modes (bike, walk, motorcycle, bus, train, car ×3, plane) | ✅ |
| 3-step interactive CO₂ calculator | ✅ |
| Eco score grading system (A+ to F) | ✅ |
| Animated tree offset counter | ✅ |
| Real-world CO₂ equivalences (smartphones, water, chicken burgers) | ✅ |
| Chart.js bar chart — all modes compared | ✅ |
| Side-by-side mode comparison with winner banner | ✅ |
| All-modes ranked bar chart | ✅ |
| Round trip toggle | ✅ |
| Trip history log with delete | ✅ |
| Cumulative CO₂ + km stats | ✅ |
| Doughnut chart by transport mode | ✅ |
| Dark / Light mode toggle | ✅ |
| Cursor particle trail animation | ✅ |
| Share result (Web Share API) | ✅ |
| Login / Sign Up modal UI | ✅ *(UI ready, backend coming soon)* |
| Backend — Node.js + Express | 🔜 |
| Database — MongoDB + Mongoose | 🔜 |
| Cloud trip sync across devices | 🔜 |
| Route distance planner (OpenStreetMap) | 🔜 |
| Real-time fuel price API | 🔜 |

<br>

## 🖥️ Pages

- **Home** — Hero section, features overview, eco facts ticker
- **Calculator** — 3-step wizard: pick transport → enter journey → get full report
- **Compare** — Head-to-head comparison of any two transport modes
- **My Trips** — Saved trip history with stats and charts
- **About** — Methodology, data sources, and developer info

<br>

## 📁 Project Structure

```
ecomiles/
├── index.html               # Homepage
├── css/
│   └── style.css            # Full design system (CSS variables, dark/light theme)
├── js/
│   ├── app.js               # Core engine — emission data, calculator, state management
│   ├── calculator.js        # Calculator page logic + Chart.js rendering
│   └── log-compare.js       # Trip log + comparison page logic
└── pages/
    ├── calculator.html      # 3-step CO₂ calculator
    ├── compare.html         # Side-by-side mode comparison
    ├── log.html             # Trip history log
    └── about.html           # Methodology + developer info
```

<br>

## 🚀 Run Locally

No installation needed. Just clone and open in a browser.

```bash
git clone https://github.com/Parth-404/ecomiles.git
cd ecomiles
```

Then open `index.html` directly, or use a local server:

```bash
# Using Python
python3 -m http.server 3000

# Using Node
npx serve .
```

<br>

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Markup | HTML5 |
| Styling | CSS3 (custom design system, CSS variables) |
| Logic | Vanilla JavaScript (ES6+) |
| Charts | Chart.js 4.4 |
| Fonts | Google Fonts — Syne + DM Sans + DM Mono |
| Storage | localStorage *(temporary — MongoDB coming soon)* |

<br>

## 🔮 Roadmap — Full Stack Version

When adding a backend, every `localStorage` call in `js/app.js` is marked with a `/* FUTURE BACKEND */` comment showing exactly what to replace with a real API call.

**Planned stack:**
- **Backend** — Node.js + Express
- **Database** — MongoDB + Mongoose
- **Auth** — JWT (Login / Signup modal UI already built)
- **APIs** — `/api/auth/register`, `/api/auth/login`, `/api/trips`

<br>

## 📊 Emission Factors Used

| Transport Mode | kg CO₂/km | Notes |
|---|---|---|
| 🚲 Bicycle / 🚶 Walking | 0.000 | Zero direct emissions |
| 🚆 Train | 0.041 | UK National Rail average |
| 🚌 Bus | 0.089 | Average occupancy |
| ⚡ Electric Car | 0.053 | India grid mix 2024 |
| 🏍️ Motorcycle | 0.103 | Average petrol motorcycle |
| 🚗 Petrol Car | 0.192 | Average 1.5L engine |
| 🛻 Diesel Car | 0.209 | Average 2.0L engine |
| ✈️ Airplane | 0.255 | Economy + radiative forcing |

> Emission factors are averages. Real-world values vary by vehicle, load, and geography.

<br>

## 🌐 Data Sources

- [Our World in Data](https://ourworldindata.org/transport) — Transport Emissions
- IPCC AR6 (2023) — Lifecycle emission factors
- UK DEFRA — Vehicle emission conversion factors
- IEA — Electric Vehicle Report 2024
- Arbor Day Foundation — Tree CO₂ absorption estimates

<br>

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

<div align="center">
  Built with 💚 by <a href="https://github.com/Parth-404">Parth Bendre</a> — PCCOE Pune
  <br>
  <i>Let's travel greener, one trip at a time. 🌍</i>
</div>
