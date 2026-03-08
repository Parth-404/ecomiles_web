/* ============================================================
   EcoMiles — Core App Logic
   Structured for future backend / MongoDB integration.
   All API calls will replace local data functions.
   ============================================================ */

'use strict';

/* ── EMISSION DATA (kg CO2 per km per vehicle, not per person) ──
   Source: Our World in Data / IPCC 2023 estimates
   Future: fetch from /api/emissions endpoint */
const EMISSION_DATA = {
    bike:    { label: 'Bicycle',       icon: '🚲', value: 0.000, color: '#4ac56b', category: 'zero' },
    moto:    { label: 'Motorcycle',    icon: '🏍️', value: 0.103, color: '#fd9644', category: 'low'  },
    walk:    { label: 'Walking',       icon: '🚶', value: 0.000, color: '#a8ff78', category: 'zero' },
    train:   { label: 'Train',         icon: '🚆', value: 0.041, color: '#78d4f5', category: 'low'  },
    bus:     { label: 'Bus',           icon: '🚌', value: 0.089, color: '#f7c948', category: 'low'  },
    carElec: { label: 'Electric Car',  icon: '⚡', value: 0.053, color: '#b8f5a0', category: 'low'  },
    carPetrol:{ label: 'Petrol Car',   icon: '🚗', value: 0.192, color: '#ff9f43', category: 'high' },
    carDiesel:{ label: 'Diesel Car',   icon: '🛻', value: 0.209, color: '#ff6b35', category: 'high' },
    plane:   { label: 'Airplane',      icon: '✈️', value: 0.255, color: '#ff6b6b', category: 'high' },
};

/* ── ECO SCORE THRESHOLDS ── */
const ECO_SCORE = [
    { min: 0,    max: 0.5,   score: 100, grade: 'A+', label: 'Exceptional',    color: '#4ac56b' },
    { min: 0.5,  max: 2,     score: 90,  grade: 'A',  label: 'Excellent',      color: '#78d4f5' },
    { min: 2,    max: 5,     score: 75,  grade: 'B',  label: 'Good',           color: '#a8ff78' },
    { min: 5,    max: 15,    score: 55,  grade: 'C',  label: 'Average',        color: '#f7c948' },
    { min: 15,   max: 50,    score: 35,  grade: 'D',  label: 'Poor',           color: '#ff9f43' },
    { min: 50,   max: Infinity, score: 15, grade: 'F', label: 'Critical',      color: '#ff6b6b' },
];

/* ── ENVIRONMENTAL EQUIVALENCES ── */
const EQUIVALENCES = [
    { icon: '📱', label: 'Smartphones charged', factor: 122,   unit: '' },
    { icon: '💡', label: 'LED bulb hours',       factor: 1200,  unit: 'hrs' },
    { icon: '🏠', label: 'Home energy (hours)',  factor: 0.12,  unit: 'hrs' },
    { icon: '🛢️', label: 'Grams of coal burned', factor: 476,   unit: 'g'  },
    { icon: '🌊', label: 'Liters of water boiled', factor: 23,  unit: 'L'  },
    { icon: '🍗', label: 'Chicken burger equiv.', factor: 0.364, unit: ''   },
];

/* ── TICKER FACTS ── */
const ECO_FACTS = [
    '🌍 Transport accounts for ~24% of global CO₂ emissions',
    '🚆 Trains emit 6x less CO₂ per km than planes',
    '🚗 70%+ of urban travel emissions come from cars',
    '🌱 One tree absorbs ~21 kg of CO₂ per year',
    '⚡ Electric vehicles cut emissions by up to 70% vs petrol',
    '🚲 Cycling instead of driving for 1 year saves ~1.5 tonnes CO₂',
    '✈️ One transatlantic flight emits more CO₂ than 3 months of driving',
    '🌿 Carpooling with 3 others reduces per-person emissions by 75%',
    '🏙️ Public transit reduces CO₂ by up to 45% per trip vs solo driving',
    '☀️ Solar-charged EVs can achieve near-zero lifecycle emissions',
];

/* ── STATE (Future: sync with MongoDB via API) ──
   Replace localStorage calls with fetch('/api/trips') etc. */
const AppState = {
    trips: JSON.parse(localStorage.getItem('ecomiles_trips') || '[]'),
    theme: localStorage.getItem('ecomiles_theme') || 'dark',
    currentTrip: null,

    saveTrip(trip) {
        this.trips.unshift(trip);
        if (this.trips.length > 50) this.trips.pop(); // cap history
        localStorage.setItem('ecomiles_trips', JSON.stringify(this.trips));
        /* FUTURE BACKEND:
        fetch('/api/trips', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.token}` },
          body: JSON.stringify(trip)
        });
        */
    },

    deleteTrip(id) {
        this.trips = this.trips.filter(t => t.id !== id);
        localStorage.setItem('ecomiles_trips', JSON.stringify(this.trips));
    },

    clearTrips() {
        this.trips = [];
        localStorage.removeItem('ecomiles_trips');
    },

    get totalCO2() { return this.trips.reduce((s, t) => s + (t.totalCO2 || 0), 0); },
    get totalKm()  { return this.trips.reduce((s, t) => s + (t.distance || 0), 0); },
};

/* ── CALCULATION ENGINE ── */
const Calculator = {
    calculate({ mode, distance, passengers, roundTrip }) {
        const data = EMISSION_DATA[mode];
        if (!data) return null;
        const actualDist = roundTrip ? distance * 2 : distance;
        const totalCO2    = parseFloat((data.value * actualDist).toFixed(3));
        const co2Person   = parseFloat((totalCO2 / Math.max(passengers, 1)).toFixed(3));
        const treesNeeded = Math.ceil(totalCO2 / 21);
        const ecoScore    = this.getEcoScore(co2Person);
        const fuelCost    = this.estimateFuelCost(mode, actualDist);
        const equivalences = EQUIVALENCES.map(e => ({
            ...e,
            amount: parseFloat((totalCO2 * e.factor).toFixed(1))
        }));
        return { mode, distance: actualDist, passengers, totalCO2, co2Person, treesNeeded, ecoScore, fuelCost, equivalences, data, timestamp: Date.now() };
    },

    getEcoScore(co2PerPerson) {
        return ECO_SCORE.find(s => co2PerPerson >= s.min && co2PerPerson < s.max) || ECO_SCORE[ECO_SCORE.length - 1];
    },

    estimateFuelCost(mode, distance) {
        /* Future: fetch real fuel prices from API */
        const rates = { carPetrol: 8.5, carDiesel: 7.8, carElec: 1.8, bus: 1.2, train: 0.9, plane: 6.5 };
        const rate = rates[mode] || 0;
        return parseFloat((rate * distance).toFixed(2));
    },

    compareAll(distance, passengers) {
        return Object.entries(EMISSION_DATA).map(([key, data]) => {
            const totalCO2  = parseFloat((data.value * distance).toFixed(3));
            const co2Person = parseFloat((totalCO2 / Math.max(passengers, 1)).toFixed(3));
            return { key, ...data, totalCO2, co2Person };
        }).sort((a, b) => a.co2Person - b.co2Person);
    },
};

/* ── UTILITY FUNCTIONS ── */
const Utils = {
    formatNum(n, dec = 2) {
        if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
        return Number(n).toFixed(dec);
    },

    uid() { return Date.now().toString(36) + Math.random().toString(36).substr(2); },

    animateValue(el, start, end, duration = 800, decimals = 2) {
        const startTime = performance.now();
        const update = (time) => {
            const elapsed = time - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const ease = 1 - Math.pow(1 - progress, 3);
            el.textContent = (start + (end - start) * ease).toFixed(decimals);
            if (progress < 1) requestAnimationFrame(update);
        };
        requestAnimationFrame(update);
    },

    showToast(msg, type = 'success') {
        const container = document.getElementById('toast-container');
        if (!container) return;
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `<span>${type === 'success' ? '✅' : '❌'}</span><span>${msg}</span>`;
        container.appendChild(toast);
        setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateX(40px)'; toast.style.transition = '0.3s'; setTimeout(() => toast.remove(), 300); }, 3500);
    },

    formatDate(ts) {
        return new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    },
};

/* ── THEME MANAGER ── */
const ThemeManager = {
    init() {
        document.documentElement.setAttribute('data-theme', AppState.theme);
        this.updateIcon();
    },
    toggle() {
        AppState.theme = AppState.theme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('ecomiles_theme', AppState.theme);
        document.documentElement.setAttribute('data-theme', AppState.theme);
        this.updateIcon();
        /* FUTURE: save preference to user profile via API */
    },
    updateIcon() {
        const btn = document.getElementById('theme-toggle');
        if (btn) btn.textContent = AppState.theme === 'dark' ? '☀️' : '🌙';
    },
};

/* ── REVEAL ON SCROLL ── */
const RevealObserver = new IntersectionObserver((entries) => {
    entries.forEach((e, i) => {
        if (e.isIntersecting) {
            setTimeout(() => e.target.classList.add('visible'), i * 60);
            RevealObserver.unobserve(e.target);
        }
    });
}, { threshold: 0.1 });

function initReveal() {
    document.querySelectorAll('.reveal').forEach(el => RevealObserver.observe(el));
}

/* ── TICKER INIT ── */
function initTicker() {
    const inner = document.querySelector('.ticker-inner');
    if (!inner) return;
    const items = [...ECO_FACTS, ...ECO_FACTS]; // duplicate for seamless loop
    inner.innerHTML = items.map(f => `<span class="ticker-item">${f}<span class="ticker-sep">◆</span></span>`).join('');
}

/* ── NAVBAR SCROLL EFFECT ── */
function initNavbar() {
    const nav = document.querySelector('.navbar');
    if (!nav) return;
    window.addEventListener('scroll', () => {
        nav.style.padding = window.scrollY > 40 ? '10px 0' : '16px 0';
    }, { passive: true });

    // Mobile hamburger
    const ham = document.querySelector('.hamburger');
    const links = document.querySelector('.navbar-links');
    ham?.addEventListener('click', () => links?.classList.toggle('open'));

    // Active link
    const path = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.navbar-links a').forEach(a => {
        if (a.getAttribute('href') === path) a.classList.add('active');
    });
}

/* ── AUTH MODAL (FUTURE READY) ──
   UI structure exists; connect to /api/auth endpoints later */
function initAuthModal() {
    const loginBtns = document.querySelectorAll('[data-action="login"]');
    const overlay   = document.getElementById('auth-modal');
    const closeBtn  = document.getElementById('modal-close');
    const tabBtns   = overlay?.querySelectorAll('[data-modal-tab]');

    loginBtns.forEach(b => b.addEventListener('click', () => overlay?.classList.add('open')));
    closeBtn?.addEventListener('click', () => overlay?.classList.remove('open'));
    overlay?.addEventListener('click', (e) => { if (e.target === overlay) overlay.classList.remove('open'); });

    tabBtns?.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const target = btn.dataset.modalTab;
            overlay?.querySelectorAll('[data-modal-panel]').forEach(p => {
                p.style.display = p.dataset.modalPanel === target ? 'block' : 'none';
            });
        });
    });

    /* FUTURE: handle form submit
    document.getElementById('login-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const res = await fetch('/api/auth/login', { method:'POST', body: new FormData(e.target) });
      if (res.ok) { const { token } = await res.json(); AppState.token = token; }
    });
    */
}

/* ── GLOBAL INIT ── */
document.addEventListener('DOMContentLoaded', () => {
    ThemeManager.init();
    initNavbar();
    initTicker();
    initReveal();
    initAuthModal();

    document.getElementById('theme-toggle')?.addEventListener('click', () => ThemeManager.toggle());
});

/* ── EXPORTS (for module use in future bundler setup) ──
   When you add a build step (Vite/Webpack), convert to:
   export { EMISSION_DATA, Calculator, AppState, Utils }
*/
window.EcoMiles = { EMISSION_DATA, Calculator, AppState, Utils, ECO_FACTS, EQUIVALENCES };