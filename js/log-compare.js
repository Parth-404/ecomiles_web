/* ============================================================
   EcoMiles — Trip Log & Compare Logic
   ============================================================ */

(function() {
    'use strict';

    window.addEventListener('load', () => {
        initTripLog();
        initCompare();
    });

    /* ── TRIP LOG ── */
    function initTripLog() {
        const tableBody = document.getElementById('trip-log-body');
        if (!tableBody) return;
        renderTripLog();

        document.getElementById('clear-log')?.addEventListener('click', () => {
            if (confirm('Clear all trip history?')) {
                window.EcoMiles.AppState.clearTrips();
                renderTripLog();
                updateSummaryStats();
                window.EcoMiles.Utils.showToast('Trip log cleared');
            }
        });
    }

    function renderTripLog() {
        const { AppState, Utils } = window.EcoMiles;
        const tbody = document.getElementById('trip-log-body');
        const empty = document.getElementById('log-empty');
        const summary = document.getElementById('log-summary');
        if (!tbody) return;

        if (AppState.trips.length === 0) {
            tbody.innerHTML = '';
            empty?.classList.remove('hidden');
            summary?.classList.add('hidden');
            return;
        }

        empty?.classList.add('hidden');
        summary?.classList.remove('hidden');
        updateSummaryStats();

        tbody.innerHTML = AppState.trips.map(t => `
      <tr>
        <td><span style="font-size:1.2rem;margin-right:8px">${t.icon}</span>${t.label}</td>
        <td class="font-mono">${t.distance} km</td>
        <td>${t.passengers}</td>
        <td class="font-mono" style="color:var(--c-primary)">${t.totalCO2} kg</td>
        <td class="font-mono">${t.co2Person} kg</td>
        <td>${t.treesNeeded} 🌳</td>
        <td style="color:var(--c-text-dim)">${Utils.formatDate(t.timestamp)}</td>
        <td><button class="trip-delete" onclick="deleteTripById('${t.id}')" aria-label="Delete trip">🗑️</button></td>
      </tr>
    `).join('');

        renderLogChart();
    }

    window.deleteTripById = function(id) {
        window.EcoMiles.AppState.deleteTrip(id);
        renderTripLog();
        window.EcoMiles.Utils.showToast('Trip removed');
    };

    function updateSummaryStats() {
        const { AppState, Utils } = window.EcoMiles;
        const totalCO2El  = document.getElementById('log-total-co2');
        const totalKmEl   = document.getElementById('log-total-km');
        const totalTrips  = document.getElementById('log-total-trips');
        const treesEl     = document.getElementById('log-total-trees');

        if (totalCO2El) totalCO2El.textContent = AppState.totalCO2.toFixed(2);
        if (totalKmEl)  totalKmEl.textContent  = AppState.totalKm.toFixed(0);
        if (totalTrips) totalTrips.textContent = AppState.trips.length;
        if (treesEl)    treesEl.textContent    = Math.ceil(AppState.totalCO2 / 21);
    }

    let logChart = null;
    function renderLogChart() {
        const { AppState } = window.EcoMiles;
        const canvas = document.getElementById('log-chart');
        if (!canvas || !window.Chart) return;
        if (logChart) logChart.destroy();

        /* Aggregate by transport mode */
        const byMode = {};
        AppState.trips.forEach(t => {
            byMode[t.label] = (byMode[t.label] || 0) + t.totalCO2;
        });

        const labels = Object.keys(byMode);
        const data   = Object.values(byMode);
        const colors = ['#4ac56b','#78d4f5','#f7c948','#ff9f43','#ff6b6b','#a8ff78','#b8f5a0','#ffb3b3'];

        logChart = new Chart(canvas, {
            type: 'doughnut',
            data: {
                labels,
                datasets: [{ data, backgroundColor: colors.slice(0, labels.length), borderWidth: 2, borderColor: '#0f160f' }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'right', labels: { color: '#7fa882', font: { family: 'DM Sans', size: 12 }, padding: 16 } },
                    tooltip: {
                        backgroundColor: '#1a2a1a', borderColor: 'rgba(74,197,107,0.3)', borderWidth: 1, padding: 12,
                        callbacks: { label: ctx => `${ctx.label}: ${ctx.parsed.toFixed(2)} kg CO₂` }
                    }
                }
            }
        });
    }

    /* ── COMPARE ── */
    function initCompare() {
        const section = document.getElementById('compare-section');
        if (!section) return;

        buildCompareModeSelectors();
        document.getElementById('run-compare')?.addEventListener('click', runComparison);
    }

    function buildCompareModeSelectors() {
        const { EMISSION_DATA } = window.EcoMiles;
        ['compare-mode-a', 'compare-mode-b'].forEach(id => {
            const sel = document.getElementById(id);
            if (!sel) return;
            sel.innerHTML = Object.entries(EMISSION_DATA)
                .map(([k, d]) => `<option value="${k}">${d.icon} ${d.label}</option>`)
                .join('');
        });
        const selA = document.getElementById('compare-mode-a');
        const selB = document.getElementById('compare-mode-b');
        if (selA) selA.value = 'carPetrol';
        if (selB) selB.value = 'train';
    }

    let compareChart = null;
    function runComparison() {
        const { Calculator, EMISSION_DATA, Utils } = window.EcoMiles;
        const modeA = document.getElementById('compare-mode-a')?.value;
        const modeB = document.getElementById('compare-mode-b')?.value;
        const dist  = parseFloat(document.getElementById('compare-distance')?.value) || 100;
        const pass  = parseInt(document.getElementById('compare-passengers')?.value) || 1;

        if (modeA === modeB) { Utils.showToast('Pick two different transport modes', 'error'); return; }

        const resultA = Calculator.calculate({ mode: modeA, distance: dist, passengers: pass, roundTrip: false });
        const resultB = Calculator.calculate({ mode: modeB, distance: dist, passengers: pass, roundTrip: false });

        document.getElementById('compare-results')?.classList.remove('hidden');

        renderCompareSide('A', resultA);
        renderCompareSide('B', resultB);
        renderCompareChart(resultA, resultB);
        renderCompareWinner(resultA, resultB);

        /* All-modes bar chart */
        renderAllModesBar(dist, pass);
    }

    function renderCompareSide(side, result) {
        const { Utils } = window.EcoMiles;
        const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
        set(`cmp-${side}-mode`,   result.data.label);
        set(`cmp-${side}-icon`,   result.data.icon);
        set(`cmp-${side}-co2`,    `${result.totalCO2} kg`);
        set(`cmp-${side}-person`, `${result.co2Person} kg/person`);
        set(`cmp-${side}-trees`,  `${result.treesNeeded} 🌳`);
        set(`cmp-${side}-cost`,   result.fuelCost > 0 ? `₹${result.fuelCost}` : 'N/A');
        set(`cmp-${side}-score`,  `${result.ecoScore.grade} — ${result.ecoScore.label}`);
        const scoreEl = document.getElementById(`cmp-${side}-score`);
        if (scoreEl) scoreEl.style.color = result.ecoScore.color;
    }

    function renderCompareWinner(a, b) {
        const winner = document.getElementById('compare-winner');
        if (!winner) return;
        const diff = Math.abs(a.co2Person - b.co2Person);
        const pct  = a.co2Person > 0 ? ((diff / a.co2Person) * 100).toFixed(0) : 100;

        if (a.co2Person < b.co2Person) {
            winner.innerHTML = `🏆 <strong>${a.data.label}</strong> is the eco winner — it emits <span style="color:var(--c-primary)">${diff.toFixed(3)} kg less CO₂/person</span> (${pct}% cleaner) per trip.`;
        } else if (b.co2Person < a.co2Person) {
            const diffBA = Math.abs(b.co2Person - a.co2Person);
            const pctBA  = a.co2Person > 0 ? ((diffBA / a.co2Person) * 100).toFixed(0) : 100;
            winner.innerHTML = `🏆 <strong>${b.data.label}</strong> is the eco winner — it emits <span style="color:var(--c-primary)">${diffBA.toFixed(3)} kg less CO₂/person</span> (${pctBA}% cleaner) per trip.`;
        } else {
            winner.innerHTML = `🤝 Both modes are equally eco-friendly for this trip!`;
        }
    }

    function renderCompareChart(a, b) {
        const canvas = document.getElementById('compare-chart');
        if (!canvas || !window.Chart) return;
        if (compareChart) compareChart.destroy();

        compareChart = new Chart(canvas, {
            type: 'bar',
            data: {
                labels: ['Total CO₂ (kg)', 'CO₂/person (kg)', 'Trees to offset'],
                datasets: [
                    {
                        label: a.data.label,
                        data: [a.totalCO2, a.co2Person, a.treesNeeded],
                        backgroundColor: a.data.color + 'cc',
                        borderColor: a.data.color,
                        borderWidth: 2, borderRadius: 8,
                    },
                    {
                        label: b.data.label,
                        data: [b.totalCO2, b.co2Person, b.treesNeeded],
                        backgroundColor: b.data.color + 'cc',
                        borderColor: b.data.color,
                        borderWidth: 2, borderRadius: 8,
                    }
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: {
                    legend: { labels: { color: '#7fa882', font: { family: 'DM Sans' } } },
                    tooltip: { backgroundColor: '#1a2a1a', borderColor: 'rgba(74,197,107,0.3)', borderWidth: 1, padding: 12 }
                },
                scales: {
                    x: { grid: { color: 'rgba(74,197,107,0.08)' }, ticks: { color: '#7fa882' } },
                    y: { grid: { color: 'rgba(74,197,107,0.08)' }, ticks: { color: '#7fa882' } }
                },
                animation: { duration: 700, easing: 'easeOutQuart' }
            }
        });
    }

    function renderAllModesBar(distance, passengers) {
        const { Calculator } = window.EcoMiles;
        const comparison = Calculator.compareAll(distance, passengers);
        const container  = document.getElementById('all-modes-bars');
        if (!container) return;

        const max = Math.max(...comparison.map(c => c.co2Person));
        container.innerHTML = comparison.map(c => {
            const pct = max > 0 ? (c.co2Person / max * 100) : 0;
            return `
        <div class="compare-bar-wrap">
          <div class="compare-bar-label">
            <span>${c.icon} ${c.label}</span>
            <span class="font-mono" style="font-size:0.82rem;color:var(--c-text-muted)">${c.co2Person} kg</span>
          </div>
          <div class="compare-bar-bg">
            <div class="compare-bar-fill" style="width:${pct}%;background:${c.color}"></div>
          </div>
        </div>
      `;
        }).join('');

        /* Animate bars in */
        setTimeout(() => {
            container.querySelectorAll('.compare-bar-fill').forEach((bar, i) => {
                bar.style.transition = `width 0.6s ${i * 80}ms cubic-bezier(0.4,0,0.2,1)`;
            });
        }, 50);
    }

})();