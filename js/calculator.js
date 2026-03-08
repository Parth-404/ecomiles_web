/* ============================================================
   EcoMiles — Calculator Page Logic
   ============================================================ */

(function() {
    'use strict';

    /* Wait for core app to load */
    window.addEventListener('load', initCalculator);

    let selectedMode = null;
    let chartInstance = null;

    function initCalculator() {
        buildTransportGrid();
        bindStepperEvents();
        bindFormEvents();
        updateHistoryCount();
    }

    /* ── BUILD TRANSPORT SELECTOR ── */
    function buildTransportGrid() {
        const grid = document.getElementById('transport-grid');
        if (!grid) return;
        const { EMISSION_DATA } = window.EcoMiles;

        grid.innerHTML = Object.entries(EMISSION_DATA).map(([key, d]) => `
      <div class="transport-card" data-mode="${key}" role="button" tabindex="0" aria-label="${d.label}">
        <span class="transport-icon">${d.icon}</span>
        <div class="transport-label">${d.label}</div>
        <div class="transport-emission">${d.value === 0 ? 'Zero' : d.value * 1000 + 'g'} CO₂/km</div>
      </div>
    `).join('');

        grid.querySelectorAll('.transport-card').forEach(card => {
            card.addEventListener('click', () => selectMode(card.dataset.mode));
            card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') selectMode(card.dataset.mode); });
        });
    }

    function selectMode(mode) {
        selectedMode = mode;
        document.querySelectorAll('.transport-card').forEach(c => c.classList.toggle('selected', c.dataset.mode === mode));
        document.getElementById('mode-error')?.classList.add('hidden');

        /* Show/hide car fuel options */
        const isCar = ['carPetrol', 'carDiesel', 'carElec'].includes(mode);
        document.getElementById('car-fuel-row')?.classList.toggle('hidden', true); // always hidden, mode encodes fuel
    }

    /* ── STEPPER ── */
    function bindStepperEvents() {
        const nextBtns = document.querySelectorAll('[data-step-next]');
        const prevBtns = document.querySelectorAll('[data-step-prev]');

        nextBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const current = parseInt(btn.closest('[data-step]')?.dataset.step);
                if (validateStep(current)) goToStep(current + 1);
            });
        });
        prevBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const current = parseInt(btn.closest('[data-step]')?.dataset.step);
                goToStep(current - 1);
            });
        });
    }

    function validateStep(step) {
        if (step === 1) {
            if (!selectedMode) {
                document.getElementById('mode-error')?.classList.remove('hidden');
                Utils.showToast('Please select a transport mode', 'error');
                return false;
            }
        }
        if (step === 2) {
            const dist = parseFloat(document.getElementById('distance').value);
            const pass = parseInt(document.getElementById('passengers').value);
            if (!dist || dist <= 0) { Utils.showToast('Enter a valid distance', 'error'); return false; }
            if (!pass || pass <= 0) { Utils.showToast('Enter a valid passenger count', 'error'); return false; }
        }
        return true;
    }

    function goToStep(step) {
        document.querySelectorAll('[data-step]').forEach(el => {
            el.classList.toggle('active', parseInt(el.dataset.step) === step);
        });
        document.querySelectorAll('.step').forEach(el => {
            const n = parseInt(el.dataset.stepNum);
            el.classList.toggle('active', n === step);
            el.classList.toggle('done', n < step);
        });
        if (step === 3) calculateAndRender();
    }

    /* ── FORM EVENTS ── */
    function bindFormEvents() {
        const distInput = document.getElementById('distance');
        const distVal   = document.getElementById('distance-display');
        const distSlider = document.getElementById('distance-slider');
        const passengerInput = document.getElementById('passengers');

        distInput?.addEventListener('input', () => {
            const v = distInput.value;
            if (distVal) distVal.textContent = v ? `${v} km` : '— km';
            if (distSlider) distSlider.value = Math.min(v, distSlider.max);
        });
        distSlider?.addEventListener('input', () => {
            const v = distSlider.value;
            if (distInput) distInput.value = v;
            if (distVal) distVal.textContent = `${v} km`;
        });

        document.getElementById('calc-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            if (validateStep(1) && validateStep(2)) goToStep(3);
        });

        document.getElementById('save-trip')?.addEventListener('click', saveCurrentTrip);
        document.getElementById('recalculate')?.addEventListener('click', () => goToStep(1));
        document.getElementById('share-btn')?.addEventListener('click', shareResult);
    }

    /* ── CALCULATE ── */
    function calculateAndRender() {
        const { Calculator, Utils, EMISSION_DATA } = window.EcoMiles;
        const distance   = parseFloat(document.getElementById('distance').value) || 0;
        const passengers = parseInt(document.getElementById('passengers').value) || 1;
        const roundTrip  = document.getElementById('round-trip')?.checked;

        const result = Calculator.calculate({ mode: selectedMode, distance, passengers, roundTrip });
        if (!result) return;

        window._lastResult = result;
        renderSummary(result);
        renderTrees(result.treesNeeded);
        renderEquivalences(result);
        renderComparisonChart(result, distance, passengers);
        renderEcoScore(result.ecoScore);
        renderTips(result);
    }

    function renderSummary(r) {
        const { Utils } = window.EcoMiles;
        const fields = {
            'res-mode':      r.data.label,
            'res-distance':  `${r.distance} km`,
            'res-total-co2': `${r.totalCO2} kg`,
            'res-per-person':null,
            'res-trees':     `${r.treesNeeded} tree(s)`,
            'res-fuel-cost': r.fuelCost > 0 ? `₹${r.fuelCost}` : 'N/A',
        };
        Object.entries(fields).forEach(([id, val]) => {
            const el = document.getElementById(id);
            if (el && val !== null) el.textContent = val;
        });

        const co2El = document.getElementById('res-total-co2-num');
        if (co2El) Utils.animateValue(co2El, 0, r.totalCO2, 900);
        const personEl = document.getElementById('res-per-person-num');
        if (personEl) Utils.animateValue(personEl, 0, r.co2Person, 900);
    }

    function renderTrees(count) {
        const container = document.getElementById('trees-display');
        if (!container) return;
        container.innerHTML = '';
        const show = Math.min(count, 60);
        for (let i = 0; i < show; i++) {
            const span = document.createElement('span');
            span.className = 'tree-icon';
            span.textContent = '🌳';
            span.style.animationDelay = `${i * 30}ms`;
            container.appendChild(span);
        }
        if (count > 60) {
            const more = document.createElement('span');
            more.style.color = 'var(--c-text-muted)';
            more.style.fontSize = '0.85rem';
            more.textContent = `+${count - 60} more`;
            container.appendChild(more);
        }
        if (count === 0) container.innerHTML = '<span style="color:var(--c-primary);font-weight:600">🌱 Zero trees needed! Perfectly clean.</span>';
    }

    function renderEquivalences(result) {
        const container = document.getElementById('equivalences');
        if (!container) return;
        container.innerHTML = result.equivalences.map(e => `
      <div class="equiv-item reveal">
        <span class="equiv-icon">${e.icon}</span>
        <div>
          <div class="equiv-value">${e.amount} <span style="font-size:0.8rem;font-weight:400;color:var(--c-text-muted)">${e.unit}</span></div>
          <div class="equiv-desc">${e.label}</div>
        </div>
      </div>
    `).join('');
        initReveal();
    }

    function renderEcoScore(score) {
        const ring    = document.getElementById('eco-ring');
        const numEl   = document.getElementById('eco-score-num');
        const gradeEl = document.getElementById('eco-score-grade');
        const labelEl = document.getElementById('eco-score-label');

        if (numEl) numEl.textContent = score.score;
        if (gradeEl) gradeEl.textContent = score.grade;
        if (labelEl) labelEl.textContent = score.label;

        if (ring) {
            const circle = ring.querySelector('.ring-progress');
            if (circle) {
                const r = 52;
                const circumference = 2 * Math.PI * r;
                const offset = circumference - (score.score / 100) * circumference;
                circle.style.stroke = score.color;
                circle.style.strokeDasharray = circumference;
                setTimeout(() => { circle.style.strokeDashoffset = offset; }, 100);
            }
            const scoreLabel = ring.parentElement?.querySelector('.score-num');
            if (scoreLabel) scoreLabel.style.color = score.color;
        }
    }

    function renderComparisonChart(result, distance, passengers) {
        const { Calculator, EMISSION_DATA } = window.EcoMiles;
        const canvas = document.getElementById('comparison-chart');
        if (!canvas || !window.Chart) return;

        const comparison = Calculator.compareAll(distance, passengers);

        if (chartInstance) chartInstance.destroy();

        const ctx = canvas.getContext('2d');
        chartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: comparison.map(c => c.label),
                datasets: [{
                    label: 'CO₂ per person (kg)',
                    data: comparison.map(c => c.co2Person),
                    backgroundColor: comparison.map(c =>
                        c.key === selectedMode
                            ? c.color
                            : c.color + '55'
                    ),
                    borderColor: comparison.map(c => c.color),
                    borderWidth: comparison.map(c => c.key === selectedMode ? 2 : 1),
                    borderRadius: 8,
                    borderSkipped: false,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: '#1a2a1a',
                        borderColor: 'rgba(74,197,107,0.3)',
                        borderWidth: 1,
                        padding: 12,
                        callbacks: {
                            label: ctx => `${ctx.parsed.y.toFixed(3)} kg CO₂/person`
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { color: 'rgba(74,197,107,0.08)' },
                        ticks: { color: '#7fa882', font: { family: 'DM Mono', size: 11 } }
                    },
                    y: {
                        grid: { color: 'rgba(74,197,107,0.08)' },
                        ticks: { color: '#7fa882', font: { family: 'DM Mono', size: 11 } },
                        title: { display: true, text: 'kg CO₂/person', color: '#7fa882', font: { size: 11 } }
                    }
                },
                animation: { duration: 800, easing: 'easeOutQuart' }
            }
        });
    }

    function renderTips(result) {
        const tips = {
            plane:     ['✈️ Use non-stop flights — layovers increase emissions by 15-30%.', '🚆 For trips under 700km, trains are 90% cleaner.', '🎒 Pack light — every 10kg adds ~0.3% to flight emissions.'],
            carPetrol: ['🚗 Carpool! One extra passenger halves your per-person emissions.', '⚡ Consider switching to electric — saves ~70% CO₂.', '🛞 Keep tires inflated — improves fuel efficiency by 3%.'],
            carDiesel: ['🔄 Switch to electric for up to 75% lower emissions.', '🚌 Bus or metro for daily commutes saves 10+ kg CO₂/week.', '🛢️ Diesel cars are cleaner for long highways, but EVs are better overall.'],
            carElec:   ['☀️ Charge with renewable energy for near-zero emissions!', '🔋 Precondition your car while plugged in to save battery range.', '♻️ EVs have 60-70% lower lifecycle emissions than petrol cars.'],
            bus:       ['🌍 Buses are 6x cleaner than solo car travel. Great choice!', '⏱️ Travel off-peak to ensure buses run at capacity.', '📱 Use apps to plan multi-modal trips for maximum efficiency.'],
            train:     ['🌟 Trains are one of the cleanest ways to travel long distances.', '🎫 Book advance tickets — trains run regardless, so filling seats matters.', '🌿 Trains are 15x cleaner per km than domestic flights.'],
            bike:      ['🚲 Zero emissions! You\'re already at the top of the eco ladder.', '🥗 Cycling also improves cardiovascular health and saves money.', '🏙️ Advocate for better cycling infrastructure in your city.'],
            walk:      ['👟 Walking is the ultimate zero-emission transport — keep it up!', '🧠 Regular walking improves mental health and saves ~0.5kg CO₂/km vs car.', '🌱 Try walking for all trips under 2km.'],
        };
        const container = document.getElementById('eco-tips');
        if (!container) return;
        const tip = tips[selectedMode] || ['🌿 Small choices add up — keep choosing cleaner transport!'];
        container.innerHTML = tip.map(t => `<li style="padding:8px 0;border-bottom:1px solid var(--c-border);font-size:0.92rem;">${t}</li>`).join('');
    }

    /* ── SAVE TRIP ── */
    function saveCurrentTrip() {
        const { AppState, Utils } = window.EcoMiles;
        const result = window._lastResult;
        if (!result) return;
        const trip = {
            id: Utils.uid(),
            mode: selectedMode,
            label: result.data.label,
            icon: result.data.icon,
            distance: result.distance,
            passengers: result.passengers,
            totalCO2: result.totalCO2,
            co2Person: result.co2Person,
            treesNeeded: result.treesNeeded,
            timestamp: Date.now()
        };
        AppState.saveTrip(trip);
        Utils.showToast('Trip saved to your log! 🌿');
        updateHistoryCount();
    }

    function updateHistoryCount() {
        const { AppState } = window.EcoMiles;
        const el = document.getElementById('trip-count-badge');
        if (el) el.textContent = AppState.trips.length;
    }

    /* ── SHARE ── */
    function shareResult() {
        const { Utils } = window.EcoMiles;
        const result = window._lastResult;
        if (!result) return;
        const text = `🌍 My EcoMiles Report: I travelled ${result.distance}km by ${result.data.label} and emitted ${result.totalCO2}kg CO₂ (${result.data.label} has an eco score of ${result.ecoScore.grade}). Join me in tracking smarter travel! #EcoMiles`;
        if (navigator.share) {
            navigator.share({ title: 'EcoMiles Travel Report', text });
        } else {
            navigator.clipboard.writeText(text).then(() => Utils.showToast('Share text copied to clipboard!'));
        }
    }

    /* Make initReveal available if called late */
    function initReveal() {
        document.querySelectorAll('.reveal:not(.visible)').forEach(el => {
            window.EcoMiles && RevealObserver?.observe(el);
        });
    }

})();