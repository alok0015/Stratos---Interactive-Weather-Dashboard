// Weather Alerts Engine
// Derives real-time alerts from current weather, forecast, and AQI data

const WeatherAlerts = {
    /**
     * Alert threshold definitions
     * Each threshold defines a condition, severity, and icon
     */
    thresholds: {
        extremeHeat: { min: 40, severity: 'critical', icon: 'ph-fill ph-thermometer-hot', title: 'Extreme Heat Warning' },
        highHeat: { min: 35, severity: 'warning', icon: 'ph-fill ph-thermometer-hot', title: 'Heat Advisory' },
        extremeCold: { max: -10, severity: 'critical', icon: 'ph-fill ph-snowflake', title: 'Extreme Cold Warning' },
        freezing: { max: 0, severity: 'warning', icon: 'ph-fill ph-snowflake', title: 'Freezing Conditions' },
        strongWind: { min: 50, severity: 'warning', icon: 'ph-fill ph-wind', title: 'Strong Wind Advisory' },
        severeWind: { min: 80, severity: 'critical', icon: 'ph-fill ph-tornado', title: 'Severe Wind Warning' },
        heavyRain: { min: 20, severity: 'warning', icon: 'ph-fill ph-cloud-rain', title: 'Heavy Rain Alert' },
        severeRain: { min: 50, severity: 'critical', icon: 'ph-fill ph-cloud-lightning', title: 'Severe Rainfall Warning' },
        highUV: { min: 8, severity: 'warning', icon: 'ph-fill ph-sun', title: 'High UV Index' },
        extremeUV: { min: 11, severity: 'critical', icon: 'ph-fill ph-sun', title: 'Extreme UV Warning' },
        poorAQI: { min: 101, severity: 'warning', icon: 'ph-fill ph-mask-sad', title: 'Poor Air Quality' },
        hazardousAQI: { min: 201, severity: 'critical', icon: 'ph-fill ph-skull', title: 'Hazardous Air Quality' },
        storm: { codes: [95, 96, 99], severity: 'critical', icon: 'ph-fill ph-cloud-lightning', title: 'Thunderstorm Warning' },
        snow: { codes: [71, 73, 75, 77, 85, 86], severity: 'info', icon: 'ph-fill ph-snowflake', title: 'Snowfall Expected' },
        fog: { codes: [45, 48], severity: 'info', icon: 'ph-fill ph-cloud-fog', title: 'Fog Advisory' },
    },

    /**
     * Severity config for styling
     */
    severityConfig: {
        critical: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.3)', label: 'CRITICAL' },
        warning: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.3)', label: 'WARNING' },
        info: { color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.12)', border: 'rgba(59, 130, 246, 0.3)', label: 'INFO' },
        good: { color: '#4ade80', bg: 'rgba(74, 222, 128, 0.12)', border: 'rgba(74, 222, 128, 0.3)', label: 'ALL CLEAR' },
    },

    /**
     * Analyze weather data and generate alerts
     */
    generateAlerts: function(weatherData, aqiData) {
        const alerts = [];

        if (!weatherData) return alerts;

        const current = weatherData.current;
        const daily = weatherData.daily;

        // --- Temperature Alerts ---
        const temp = current.temperature_2m;
        if (temp >= this.thresholds.extremeHeat.min) {
            alerts.push(this._createAlert(this.thresholds.extremeHeat, `Current temperature is ${temp}°C. Stay hydrated, avoid outdoor activities, and seek shade.`));
        } else if (temp >= this.thresholds.highHeat.min) {
            alerts.push(this._createAlert(this.thresholds.highHeat, `Temperature has reached ${temp}°C. Drink plenty of water and limit sun exposure.`));
        }

        if (temp <= this.thresholds.extremeCold.max) {
            alerts.push(this._createAlert(this.thresholds.extremeCold, `Temperature has dropped to ${temp}°C. Risk of frostbite. Stay indoors if possible.`));
        } else if (temp <= this.thresholds.freezing.max) {
            alerts.push(this._createAlert(this.thresholds.freezing, `Temperature is ${temp}°C. Roads may be icy. Dress warmly.`));
        }

        // --- Wind Alerts ---
        const wind = current.wind_speed_10m;
        if (wind >= this.thresholds.severeWind.min) {
            alerts.push(this._createAlert(this.thresholds.severeWind, `Wind speeds of ${wind} km/h detected. Secure loose objects and avoid travel.`));
        } else if (wind >= this.thresholds.strongWind.min) {
            alerts.push(this._createAlert(this.thresholds.strongWind, `Wind speeds reaching ${wind} km/h. Exercise caution outdoors.`));
        }

        // --- Precipitation Alerts ---
        if (daily && daily.precipitation_sum) {
            const todayPrecip = daily.precipitation_sum[0] || 0;
            if (todayPrecip >= this.thresholds.severeRain.min) {
                alerts.push(this._createAlert(this.thresholds.severeRain, `Expected ${todayPrecip} mm of rain today. Flooding risk. Avoid low-lying areas.`));
            } else if (todayPrecip >= this.thresholds.heavyRain.min) {
                alerts.push(this._createAlert(this.thresholds.heavyRain, `${todayPrecip} mm of rain expected today. Carry an umbrella.`));
            }
        }

        // --- UV Index Alerts ---
        if (daily && daily.uv_index_max) {
            const uv = daily.uv_index_max[0];
            if (uv >= this.thresholds.extremeUV.min) {
                alerts.push(this._createAlert(this.thresholds.extremeUV, `UV index of ${uv.toFixed(1)}. Avoid sun exposure between 10 AM - 4 PM. Wear SPF 50+.`));
            } else if (uv >= this.thresholds.highUV.min) {
                alerts.push(this._createAlert(this.thresholds.highUV, `UV index of ${uv.toFixed(1)}. Apply sunscreen and wear protective clothing.`));
            }
        }

        // --- AQI Alerts ---
        if (aqiData && aqiData.current) {
            const aqi = aqiData.current.us_aqi;
            if (aqi >= this.thresholds.hazardousAQI.min) {
                alerts.push(this._createAlert(this.thresholds.hazardousAQI, `AQI is ${aqi}. Stay indoors. Use air purifiers. Avoid all outdoor activity.`));
            } else if (aqi >= this.thresholds.poorAQI.min) {
                alerts.push(this._createAlert(this.thresholds.poorAQI, `AQI is ${aqi}. Sensitive groups should reduce outdoor exertion.`));
            }
        }

        // --- Weather Code Alerts (storms, snow, fog) ---
        const weatherCode = current.weather_code;
        if (this.thresholds.storm.codes.includes(weatherCode)) {
            alerts.push(this._createAlert(this.thresholds.storm, 'Active thunderstorm detected. Seek shelter immediately. Avoid open areas.'));
        }
        if (this.thresholds.snow.codes.includes(weatherCode)) {
            alerts.push(this._createAlert(this.thresholds.snow, 'Snowfall is occurring. Roads may be slippery. Drive carefully.'));
        }
        if (this.thresholds.fog.codes.includes(weatherCode)) {
            alerts.push(this._createAlert(this.thresholds.fog, 'Foggy conditions. Reduced visibility. Use fog lights while driving.'));
        }

        // Sort: critical first, then warning, then info
        const order = { critical: 0, warning: 1, info: 2 };
        alerts.sort((a, b) => order[a.severity] - order[b.severity]);

        return alerts;
    },

    _createAlert: function(threshold, message) {
        return {
            title: threshold.title,
            severity: threshold.severity,
            icon: threshold.icon,
            message: message,
            time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        };
    },

    /**
     * Render alerts into the DOM
     */
    renderAlerts: function(weatherData, aqiData) {
        const container = document.getElementById('alerts-list');
        const countBadge = document.getElementById('alerts-count');
        if (!container) return;

        const alerts = this.generateAlerts(weatherData, aqiData);
        container.innerHTML = '';

        if (alerts.length === 0) {
            const conf = this.severityConfig.good;
            countBadge.textContent = '0';
            countBadge.style.background = conf.bg;
            countBadge.style.color = conf.color;
            container.innerHTML = `
                <div class="alert-card" style="border-color:${conf.border};background:${conf.bg}">
                    <div class="alert-icon" style="color:${conf.color}">
                        <i class="ph-fill ph-check-circle"></i>
                    </div>
                    <div class="alert-body">
                        <div class="alert-header">
                            <span class="alert-title" style="color:${conf.color}">All Clear</span>
                        </div>
                        <p class="alert-message">No weather alerts at this time. Conditions are safe.</p>
                    </div>
                </div>
            `;
            return;
        }

        countBadge.textContent = alerts.length;
        const topSeverity = this.severityConfig[alerts[0].severity];
        countBadge.style.background = topSeverity.bg;
        countBadge.style.color = topSeverity.color;

        alerts.forEach((alert, i) => {
            const conf = this.severityConfig[alert.severity];
            const card = document.createElement('div');
            card.className = 'alert-card';
            card.style.borderColor = conf.border;
            card.style.background = conf.bg;
            card.style.animationDelay = `${i * 0.1}s`;

            card.innerHTML = `
                <div class="alert-icon" style="color:${conf.color}">
                    <i class="${alert.icon}"></i>
                </div>
                <div class="alert-body">
                    <div class="alert-header">
                        <span class="alert-severity-badge" style="background:${conf.color}">${conf.label}</span>
                        <span class="alert-title">${alert.title}</span>
                        <span class="alert-time">${alert.time}</span>
                    </div>
                    <p class="alert-message">${alert.message}</p>
                </div>
            `;

            container.appendChild(card);
        });
    }
};
