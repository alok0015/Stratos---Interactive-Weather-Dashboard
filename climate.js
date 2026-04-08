// Global Warming Awareness & Monitoring Engine
// Uses global-warming.org APIs for temperature anomalies & CO₂ data

const ClimateMonitor = {
    // Cached data
    temperatureData: null,
    co2Data: null,
    climateAnalysis: null,
    tempChart: null,
    co2Chart: null,

    // ─── Data Fetching ───────────────────────────────────────────────

    fetchTemperatureData: async function () {
        try {
            const res = await fetch('https://global-warming.org/api/temperature-api');
            const json = await res.json();
            if (json.error) throw new Error('Temperature API error');
            // Process into yearly averages
            const yearlyMap = {};
            json.result.forEach(entry => {
                const year = Math.floor(parseFloat(entry.time));
                const station = parseFloat(entry.station);
                if (isNaN(station)) return;
                if (!yearlyMap[year]) yearlyMap[year] = { sum: 0, count: 0 };
                yearlyMap[year].sum += station;
                yearlyMap[year].count++;
            });
            const yearly = Object.entries(yearlyMap)
                .map(([year, data]) => ({
                    year: parseInt(year),
                    anomaly: parseFloat((data.sum / data.count).toFixed(3))
                }))
                .sort((a, b) => a.year - b.year);
            this.temperatureData = yearly;
            return yearly;
        } catch (err) {
            console.error('Failed to fetch temperature data:', err);
            return null;
        }
    },

    fetchCO2Data: async function () {
        try {
            const res = await fetch('https://global-warming.org/api/co2-api');
            const json = await res.json();
            if (!json.co2 || json.co2.length === 0) throw new Error('CO2 API error');
            // Extract monthly averages (take 1st of each month)
            const monthlyMap = {};
            json.co2.forEach(entry => {
                const key = `${entry.year}-${entry.month.padStart(2, '0')}`;
                if (!monthlyMap[key]) {
                    monthlyMap[key] = {
                        date: key,
                        year: parseInt(entry.year),
                        month: parseInt(entry.month),
                        trend: parseFloat(entry.trend)
                    };
                }
            });
            const monthly = Object.values(monthlyMap).sort((a, b) => a.date.localeCompare(b.date));
            this.co2Data = monthly;
            return monthly;
        } catch (err) {
            console.error('Failed to fetch CO2 data:', err);
            return null;
        }
    },

    // ─── Analysis ────────────────────────────────────────────────────

    analyzeClimate: function () {
        if (!this.temperatureData || !this.co2Data) return null;

        // Pre-industrial baseline (1880-1920 average)
        const baselineEntries = this.temperatureData.filter(d => d.year >= 1880 && d.year <= 1920);
        const baseline = baselineEntries.reduce((s, d) => s + d.anomaly, 0) / baselineEntries.length;

        // Current anomaly (latest year available)
        const latest = this.temperatureData[this.temperatureData.length - 1];
        const currentAnomaly = latest.anomaly;
        const tempAboveBaseline = currentAnomaly - baseline;

        // Decade-over-decade warming rate
        const lastDecade = this.temperatureData.filter(d => d.year >= latest.year - 10);
        const prevDecade = this.temperatureData.filter(d => d.year >= latest.year - 20 && d.year < latest.year - 10);
        const lastDecadeAvg = lastDecade.reduce((s, d) => s + d.anomaly, 0) / lastDecade.length;
        const prevDecadeAvg = prevDecade.reduce((s, d) => s + d.anomaly, 0) / prevDecade.length;
        const warmingRate = lastDecadeAvg - prevDecadeAvg;

        // CO₂ current
        const latestCO2 = this.co2Data[this.co2Data.length - 1];
        const co2Current = latestCO2.trend;
        const co2SafeThreshold = 350; // ppm

        // Status indicators
        let tempStatus, co2Status, overallStatus;

        if (tempAboveBaseline < 1.0) tempStatus = 'normal';
        else if (tempAboveBaseline < 1.5) tempStatus = 'elevated';
        else tempStatus = 'critical';

        if (co2Current < 400) co2Status = 'normal';
        else if (co2Current < 420) co2Status = 'elevated';
        else co2Status = 'critical';

        // Overall is the worst of the two
        const statusPriority = { normal: 0, elevated: 1, critical: 2 };
        overallStatus = statusPriority[tempStatus] >= statusPriority[co2Status] ? tempStatus : co2Status;

        this.climateAnalysis = {
            baseline: parseFloat(baseline.toFixed(3)),
            currentAnomaly,
            tempAboveBaseline: parseFloat(tempAboveBaseline.toFixed(2)),
            warmingRate: parseFloat(warmingRate.toFixed(3)),
            latestYear: latest.year,
            co2Current: parseFloat(co2Current.toFixed(1)),
            co2SafeThreshold,
            tempStatus,
            co2Status,
            overallStatus
        };

        return this.climateAnalysis;
    },

    // ─── Alert Generation ────────────────────────────────────────────

    generateClimateAlerts: function (aqiData) {
        const alerts = [];
        const a = this.climateAnalysis;
        if (!a) return alerts;

        // Temperature alert
        if (a.tempAboveBaseline >= 1.5) {
            alerts.push({
                severity: 'critical',
                icon: 'ph-thermometer-hot',
                title: 'Critical Global Warming',
                message: `Global temperature is +${a.tempAboveBaseline}°C above pre-industrial levels. The Paris Agreement target of 1.5°C has been exceeded.`
            });
        } else if (a.tempAboveBaseline >= 1.0) {
            alerts.push({
                severity: 'warning',
                icon: 'ph-thermometer-hot',
                title: 'Elevated Global Temperature',
                message: `Global temperature is +${a.tempAboveBaseline}°C above pre-industrial levels. Approaching the 1.5°C critical threshold.`
            });
        }

        // CO₂ alert
        if (a.co2Current >= 420) {
            alerts.push({
                severity: 'critical',
                icon: 'ph-factory',
                title: 'Dangerous CO₂ Levels',
                message: `Atmospheric CO₂ is at ${a.co2Current} ppm — far exceeding the safe limit of ${a.co2SafeThreshold} ppm. Urgent action needed.`
            });
        } else if (a.co2Current >= 400) {
            alerts.push({
                severity: 'warning',
                icon: 'ph-factory',
                title: 'Elevated CO₂ Levels',
                message: `Atmospheric CO₂ is at ${a.co2Current} ppm, above the ${a.co2SafeThreshold} ppm safe threshold.`
            });
        }

        // Warming rate
        if (a.warmingRate > 0.15) {
            alerts.push({
                severity: 'warning',
                icon: 'ph-trend-up',
                title: 'Accelerating Warming',
                message: `The warming rate has increased by +${a.warmingRate.toFixed(2)}°C/decade over the past 20 years.`
            });
        }

        // Local AQI integration
        if (aqiData && aqiData.current) {
            const usAqi = aqiData.current.us_aqi;
            if (usAqi > 200) {
                alerts.push({
                    severity: 'critical',
                    icon: 'ph-mask-sad',
                    title: 'Hazardous Local Air Quality',
                    message: `The searched city's AQI is ${usAqi} — hazardous levels. Pollution directly contributes to global warming.`
                });
            } else if (usAqi > 100) {
                alerts.push({
                    severity: 'warning',
                    icon: 'ph-mask-sad',
                    title: 'Unhealthy Local Air Quality',
                    message: `The searched city's AQI is ${usAqi}. Poor air quality indicates elevated emissions in this region.`
                });
            }
        }

        // If no alerts at all, add info
        if (alerts.length === 0) {
            alerts.push({
                severity: 'info',
                icon: 'ph-info',
                title: 'Climate Monitoring Active',
                message: 'Global indicators are within monitoring thresholds. Continue tracking for changes.'
            });
        }

        return alerts;
    },

    // ─── UI Rendering ────────────────────────────────────────────────

    renderDashboard: function (aqiData) {
        const a = this.climateAnalysis;
        if (!a) return;

        // KPI Cards
        this.renderKPIs(a);

        // Charts
        this.renderTempChart();
        this.renderCO2Chart();

        // Climate Alerts
        const alerts = this.generateClimateAlerts(aqiData);
        this.renderClimateAlerts(alerts);
    },

    renderKPIs: function (a) {
        const statusColors = {
            normal: { color: '#22c55e', label: 'Normal', bg: 'rgba(34,197,94,0.15)' },
            elevated: { color: '#f59e0b', label: 'Elevated', bg: 'rgba(245,158,11,0.15)' },
            critical: { color: '#ef4444', label: 'Critical', bg: 'rgba(239,68,68,0.15)' }
        };

        // Temperature KPI
        const tempKpi = document.getElementById('kpi-temp');
        if (tempKpi) {
            const s = statusColors[a.tempStatus];
            tempKpi.querySelector('.kpi-value').textContent = `+${a.tempAboveBaseline}°C`;
            tempKpi.querySelector('.kpi-status').textContent = s.label;
            tempKpi.querySelector('.kpi-status').style.color = s.color;
            tempKpi.querySelector('.kpi-status').style.background = s.bg;
            tempKpi.querySelector('.kpi-dot').style.background = s.color;
            tempKpi.querySelector('.kpi-dot').style.boxShadow = `0 0 8px ${s.color}`;
        }

        // CO₂ KPI
        const co2Kpi = document.getElementById('kpi-co2');
        if (co2Kpi) {
            const s = statusColors[a.co2Status];
            co2Kpi.querySelector('.kpi-value').textContent = `${a.co2Current} ppm`;
            co2Kpi.querySelector('.kpi-status').textContent = s.label;
            co2Kpi.querySelector('.kpi-status').style.color = s.color;
            co2Kpi.querySelector('.kpi-status').style.background = s.bg;
            co2Kpi.querySelector('.kpi-dot').style.background = s.color;
            co2Kpi.querySelector('.kpi-dot').style.boxShadow = `0 0 8px ${s.color}`;
        }

        // Warming Rate KPI
        const rateKpi = document.getElementById('kpi-rate');
        if (rateKpi) {
            const rateStatus = a.warmingRate > 0.15 ? 'critical' : a.warmingRate > 0.08 ? 'elevated' : 'normal';
            const s = statusColors[rateStatus];
            rateKpi.querySelector('.kpi-value').textContent = `+${a.warmingRate.toFixed(2)}°C`;
            rateKpi.querySelector('.kpi-status').textContent = s.label;
            rateKpi.querySelector('.kpi-status').style.color = s.color;
            rateKpi.querySelector('.kpi-status').style.background = s.bg;
            rateKpi.querySelector('.kpi-dot').style.background = s.color;
            rateKpi.querySelector('.kpi-dot').style.boxShadow = `0 0 8px ${s.color}`;
        }

        // Overall KPI
        const overallKpi = document.getElementById('kpi-overall');
        if (overallKpi) {
            const s = statusColors[a.overallStatus];
            overallKpi.querySelector('.kpi-value').textContent = s.label.toUpperCase();
            overallKpi.querySelector('.kpi-value').style.color = s.color;
            overallKpi.querySelector('.kpi-status').textContent = `Year ${a.latestYear}`;
            overallKpi.querySelector('.kpi-status').style.color = 'var(--text-secondary)';
            overallKpi.querySelector('.kpi-status').style.background = 'transparent';
            overallKpi.querySelector('.kpi-dot').style.background = s.color;
            overallKpi.querySelector('.kpi-dot').style.boxShadow = `0 0 12px ${s.color}`;
            // Pulse animation for critical
            if (a.overallStatus === 'critical') {
                overallKpi.querySelector('.kpi-dot').classList.add('pulse-critical');
            }
        }
    },

    renderTempChart: function () {
        const ctx = document.getElementById('climate-temp-chart');
        if (!ctx || !this.temperatureData) return;

        // Sample: show every 5th year for clean chart
        const sampled = this.temperatureData.filter((d, i) => d.year % 5 === 0 || i === this.temperatureData.length - 1);
        const labels = sampled.map(d => d.year.toString());
        const data = sampled.map(d => d.anomaly);

        if (this.tempChart) this.tempChart.destroy();

        this.tempChart = new Chart(ctx.getContext('2d'), {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'Temp Anomaly (°C)',
                    data,
                    borderColor: '#ef4444',
                    backgroundColor: (context) => {
                        const chart = context.chart;
                        const { ctx: c, chartArea } = chart;
                        if (!chartArea) return 'rgba(239,68,68,0.1)';
                        const gradient = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                        gradient.addColorStop(0, 'rgba(239,68,68,0.4)');
                        gradient.addColorStop(0.5, 'rgba(245,158,11,0.15)');
                        gradient.addColorStop(1, 'rgba(34,197,94,0.02)');
                        return gradient;
                    },
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 5,
                    pointHoverBackgroundColor: '#ef4444',
                    borderWidth: 2.5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { intersect: false, mode: 'index' },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(15,20,35,0.9)',
                        borderColor: 'rgba(255,255,255,0.1)',
                        borderWidth: 1,
                        titleFont: { family: 'Outfit' },
                        bodyFont: { family: 'Outfit' },
                        callbacks: {
                            label: (ctx) => `Anomaly: ${ctx.parsed.y > 0 ? '+' : ''}${ctx.parsed.y.toFixed(2)}°C`
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: { color: '#6b7280', font: { family: 'Outfit', size: 10 }, maxRotation: 45 },
                        grid: { color: 'rgba(255,255,255,0.04)' }
                    },
                    y: {
                        ticks: {
                            color: '#6b7280',
                            font: { family: 'Outfit', size: 10 },
                            callback: (v) => (v > 0 ? '+' : '') + v.toFixed(1) + '°C'
                        },
                        grid: { color: 'rgba(255,255,255,0.04)' }
                    }
                }
            }
        });
    },

    renderCO2Chart: function () {
        const ctx = document.getElementById('climate-co2-chart');
        if (!ctx || !this.co2Data) return;

        // Sample: take one entry per 3 months
        const sampled = this.co2Data.filter((d, i) => d.month % 3 === 1 || i === this.co2Data.length - 1);
        const labels = sampled.map(d => d.date);
        const data = sampled.map(d => d.trend);

        if (this.co2Chart) this.co2Chart.destroy();

        this.co2Chart = new Chart(ctx.getContext('2d'), {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'CO₂ Trend (ppm)',
                    data,
                    borderColor: '#8b5cf6',
                    backgroundColor: (context) => {
                        const chart = context.chart;
                        const { ctx: c, chartArea } = chart;
                        if (!chartArea) return 'rgba(139,92,246,0.1)';
                        const gradient = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                        gradient.addColorStop(0, 'rgba(139,92,246,0.35)');
                        gradient.addColorStop(1, 'rgba(139,92,246,0.02)');
                        return gradient;
                    },
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 5,
                    pointHoverBackgroundColor: '#8b5cf6',
                    borderWidth: 2.5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { intersect: false, mode: 'index' },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(15,20,35,0.9)',
                        borderColor: 'rgba(255,255,255,0.1)',
                        borderWidth: 1,
                        titleFont: { family: 'Outfit' },
                        bodyFont: { family: 'Outfit' },
                        callbacks: {
                            label: (ctx) => `CO₂: ${ctx.parsed.y.toFixed(1)} ppm`
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: { color: '#6b7280', font: { family: 'Outfit', size: 10 }, maxRotation: 45, maxTicksLimit: 12 },
                        grid: { color: 'rgba(255,255,255,0.04)' }
                    },
                    y: {
                        ticks: {
                            color: '#6b7280',
                            font: { family: 'Outfit', size: 10 },
                            callback: (v) => v + ' ppm'
                        },
                        grid: { color: 'rgba(255,255,255,0.04)' }
                    }
                }
            }
        });
    },

    renderClimateAlerts: function (alerts) {
        const container = document.getElementById('climate-alerts-list');
        if (!container) return;

        const severityConfig = {
            critical: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)', label: 'CRITICAL' },
            warning: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', label: 'WARNING' },
            info: { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.3)', label: 'INFO' }
        };

        container.innerHTML = alerts.map((alert, i) => {
            const cfg = severityConfig[alert.severity];
            return `
                <div class="climate-alert-card" style="--alert-color: ${cfg.color}; --alert-bg: ${cfg.bg}; --alert-border: ${cfg.border}; animation-delay: ${i * 0.1}s">
                    <div class="climate-alert-header">
                        <div class="climate-alert-icon-wrap" style="background: ${cfg.bg}">
                            <i class="ph-fill ${alert.icon}" style="color: ${cfg.color}"></i>
                        </div>
                        <div>
                            <span class="climate-alert-severity" style="color: ${cfg.color}">${cfg.label}</span>
                            <h4 class="climate-alert-title">${alert.title}</h4>
                        </div>
                    </div>
                    <p class="climate-alert-message">${alert.message}</p>
                </div>
            `;
        }).join('');
    },

    updateLocalAlerts: function (aqiData) {
        if (!this.climateAnalysis) return;
        const alerts = this.generateClimateAlerts(aqiData);
        this.renderClimateAlerts(alerts);
    },

    // ─── Initialization ──────────────────────────────────────────────

    init: async function () {
        // Show loading state
        const section = document.getElementById('climate-section');
        if (section) section.classList.add('loading');

        try {
            await Promise.all([
                this.fetchTemperatureData(),
                this.fetchCO2Data()
            ]);
            this.analyzeClimate();
            this.renderDashboard(null);
        } catch (err) {
            console.error('Climate Monitor init failed:', err);
        } finally {
            if (section) section.classList.remove('loading');
        }
    }
};
