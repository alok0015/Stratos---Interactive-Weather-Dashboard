// DOM Manipulation and UI rendering

const UI = {
    isFahrenheit: false,

    elements: {
        locationName: document.getElementById('current-location-name'),
        currentDate: document.getElementById('current-date'),
        currentTemp: document.getElementById('current-temp'),
        currentIcon: document.getElementById('current-icon'),
        currentDesc: document.getElementById('current-desc'),
        feelsLike: document.getElementById('feels-like'),
        humidity: document.getElementById('humidity'),
        windSpeed: document.getElementById('wind-speed'),
        uvIndex: document.getElementById('uv-index'),
        aqi: document.getElementById('aqi'),
        sunrise: document.getElementById('sunrise'),
        sunset: document.getElementById('sunset'),
        aqiWidget: document.getElementById('aqi-widget'),
        aqiBadge: document.getElementById('aqi-badge'),
        aqiNumber: document.getElementById('aqi-number'),
        aqiRingFill: document.getElementById('aqi-ring-fill'),
        aqiLevelLabel: document.getElementById('aqi-level-label'),
        aqiHealthMsg: document.getElementById('aqi-health-msg'),
        aqiPollutants: document.getElementById('aqi-pollutants'),
        forecastList: document.getElementById('forecast-list'),
        loadingOverlay: document.getElementById('loading-overlay'),
        searchResults: document.getElementById('search-results'),
        unitSwitch: document.getElementById('unit-switch'),
        labelC: document.getElementById('label-c'),
        labelF: document.getElementById('label-f'),
        
        // Modal elements
        modal: document.getElementById('forecast-modal'),
        closeModalBtn: document.getElementById('close-modal'),
        modalDate: document.getElementById('modal-date'),
        modalIcon: document.getElementById('modal-icon'),
        modalDesc: document.getElementById('modal-desc'),
        modalMax: document.getElementById('modal-max'),
        modalMin: document.getElementById('modal-min'),
        modalUv: document.getElementById('modal-uv'),
        modalPrecip: document.getElementById('modal-precip'),
        modalSunrise: document.getElementById('modal-sunrise'),
        modalSunset: document.getElementById('modal-sunset')
    },

    formatTemp: function(celsius) {
        if (this.isFahrenheit) {
            return Math.round((celsius * 9/5) + 32);
        }
        return Math.round(celsius);
    },

    showLoading: function() {
        this.elements.loadingOverlay.classList.remove('hidden');
    },

    hideLoading: function() {
        this.elements.loadingOverlay.classList.add('hidden');
    },

    updateCurrentWeather: function(currentData, dailyData, isDay, cityName, aqiData) {
        if (cityName) {
            this.elements.locationName.textContent = cityName;
        }

        const now = new Date();
        this.elements.currentDate.textContent = formatDate(now);

        this.elements.currentTemp.textContent = this.formatTemp(currentData.temperature_2m) + '°';
        document.querySelector('.temp-display .unit').textContent = this.isFahrenheit ? 'F' : 'C';
        
        const weatherInfo = getWeatherIconAndDesc(currentData.weather_code, isDay);
        this.elements.currentIcon.className = weatherInfo.icon;
        this.elements.currentDesc.textContent = weatherInfo.desc;
        
        // Dynamically update the app background based on current weather
        document.body.style.backgroundImage = `url('${weatherInfo.bgImage}')`;

        this.elements.feelsLike.textContent = this.formatTemp(currentData.apparent_temperature) + '°';
        this.elements.humidity.textContent = currentData.relative_humidity_2m + '%';
        this.elements.windSpeed.textContent = currentData.wind_speed_10m + ' km/h';
        
        // UV index is daily max in Open-Meteo
        this.elements.uvIndex.textContent = dailyData.uv_index_max[0] ? dailyData.uv_index_max[0].toFixed(1) : '--';

        // Sunrise / Sunset
        this.elements.sunrise.textContent = dailyData.sunrise[0] ? formatTime(dailyData.sunrise[0]) : '--:--';
        this.elements.sunset.textContent = dailyData.sunset[0] ? formatTime(dailyData.sunset[0]) : '--:--';

        // AQI (small metric)
        if (aqiData && aqiData.current) {
            this.elements.aqi.textContent = aqiData.current.us_aqi;
        } else {
            this.elements.aqi.textContent = '--';
        }

        // AQI Widget (full section)
        this.updateAQIWidget(aqiData);
    },

    /**
     * Get AQI color, level label and health message based on US EPA breakpoints
     */
    getAQIInfo: function(aqi) {
        if (aqi <= 50) return { color: '#4ade80', label: 'Good', msg: 'Air quality is satisfactory. No health risk.' };
        if (aqi <= 100) return { color: '#facc15', label: 'Moderate', msg: 'Acceptable. May poses risk for sensitive individuals.' };
        if (aqi <= 150) return { color: '#fb923c', label: 'Unhealthy for Sensitive Groups', msg: 'Sensitive groups may experience health effects.' };
        if (aqi <= 200) return { color: '#f87171', label: 'Unhealthy', msg: 'Everyone may begin to experience health effects.' };
        if (aqi <= 300) return { color: '#c084fc', label: 'Very Unhealthy', msg: 'Health alert: increased risk for everyone.' };
        return { color: '#9f1239', label: 'Hazardous', msg: 'Emergency conditions. Entire population is affected.' };
    },

    /**
     * Render the full AQI widget with gauge and pollutant breakdown
     */
    updateAQIWidget: function(aqiData) {
        if (!aqiData || !aqiData.current) {
            this.elements.aqiNumber.textContent = '--';
            this.elements.aqiLevelLabel.textContent = '--';
            this.elements.aqiHealthMsg.textContent = 'Air quality data unavailable.';
            this.elements.aqiBadge.textContent = '--';
            this.elements.aqiPollutants.innerHTML = '';
            this.elements.aqiRingFill.style.strokeDashoffset = 327; // full circle
            return;
        }

        const current = aqiData.current;
        const aqiVal = current.us_aqi ?? 0;
        const info = this.getAQIInfo(aqiVal);

        // Gauge ring animation
        const circumference = 2 * Math.PI * 52; // ~326.7
        const pct = Math.min(aqiVal / 500, 1); // US AQI max is 500
        const offset = circumference * (1 - pct);

        this.elements.aqiRingFill.style.stroke = info.color;
        this.elements.aqiRingFill.style.strokeDasharray = circumference;
        this.elements.aqiRingFill.style.strokeDashoffset = offset;

        this.elements.aqiNumber.textContent = aqiVal;
        this.elements.aqiNumber.style.color = info.color;
        this.elements.aqiLevelLabel.textContent = info.label;
        this.elements.aqiLevelLabel.style.color = info.color;
        this.elements.aqiHealthMsg.textContent = info.msg;
        this.elements.aqiBadge.textContent = info.label;
        this.elements.aqiBadge.style.color = info.color;

        // Pollutant cards
        const pollutants = [
            { key: 'pm2_5', label: 'PM2.5', unit: 'μg/m³', aqiKey: 'us_aqi_pm2_5', icon: 'ph-fill ph-circles-three-plus' },
            { key: 'pm10', label: 'PM10', unit: 'μg/m³', aqiKey: 'us_aqi_pm10', icon: 'ph-fill ph-circles-four' },
            { key: 'ozone', label: 'O₃', unit: 'μg/m³', aqiKey: 'us_aqi_ozone', icon: 'ph-fill ph-sun-dim' },
            { key: 'nitrogen_dioxide', label: 'NO₂', unit: 'μg/m³', aqiKey: 'us_aqi_nitrogen_dioxide', icon: 'ph-fill ph-factory' },
            { key: 'carbon_monoxide', label: 'CO', unit: 'μg/m³', aqiKey: 'us_aqi_carbon_monoxide', icon: 'ph-fill ph-gas-pump' },
            { key: 'sulphur_dioxide', label: 'SO₂', unit: 'μg/m³', aqiKey: 'us_aqi_sulphur_dioxide', icon: 'ph-fill ph-flask' }
        ];

        this.elements.aqiPollutants.innerHTML = '';
        pollutants.forEach(p => {
            const val = current[p.key];
            const subAqi = current[p.aqiKey];
            if (val == null && subAqi == null) return;

            const subInfo = this.getAQIInfo(subAqi ?? 0);
            const barPct = Math.min((subAqi ?? 0) / 300, 1) * 100;

            const card = document.createElement('div');
            card.className = 'aqi-pollutant-card';
            card.innerHTML = `
                <div class="pollutant-header">
                    <i class="${p.icon}" style="color:${subInfo.color}"></i>
                    <span class="pollutant-name">${p.label}</span>
                    <span class="pollutant-value">${val != null ? val.toFixed(1) : '--'} <small>${p.unit}</small></span>
                </div>
                <div class="pollutant-bar-track">
                    <div class="pollutant-bar-fill" style="width:${barPct}%;background:${subInfo.color}"></div>
                </div>
                <span class="pollutant-aqi-label" style="color:${subInfo.color}">${subInfo.label} (${subAqi ?? '--'})</span>
            `;
            this.elements.aqiPollutants.appendChild(card);
        });
    },

    openModal: function(index, dailyData) {
        const date = new Date(dailyData.time[index]);
        this.elements.modalDate.textContent = formatDate(date);

        const iconInfo = getWeatherIconAndDesc(dailyData.weather_code[index], true);
        this.elements.modalIcon.src = iconInfo.imgSrc;
        this.elements.modalDesc.textContent = iconInfo.desc;

        this.elements.modalMax.textContent = this.formatTemp(dailyData.temperature_2m_max[index]) + '°';
        this.elements.modalMin.textContent = this.formatTemp(dailyData.temperature_2m_min[index]) + '°';
        this.elements.modalUv.textContent = dailyData.uv_index_max[index] ? dailyData.uv_index_max[index].toFixed(1) : '--';
        
        const precip = dailyData.precipitation_sum && dailyData.precipitation_sum[index] != null ? dailyData.precipitation_sum[index] : 0;
        this.elements.modalPrecip.textContent = precip + ' mm';
        
        this.elements.modalSunrise.textContent = dailyData.sunrise[index] ? formatTime(dailyData.sunrise[index]) : '--:--';
        this.elements.modalSunset.textContent = dailyData.sunset[index] ? formatTime(dailyData.sunset[index]) : '--:--';

        this.elements.modal.classList.remove('hidden');
    },

    updateForecast: function(dailyData) {
        this.elements.forecastList.innerHTML = ''; // Clear existing
        
        // Open-Meteo returns array of dates, min/max temps, weather code
        const dates = dailyData.time;
        const maxTemps = dailyData.temperature_2m_max;
        const minTemps = dailyData.temperature_2m_min;
        const codes = dailyData.weather_code;

        // Skip current day (index 0) and show next 7 days
        for (let i = 1; i < Math.min(8, dates.length); i++) {
            const date = new Date(dates[i]);
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
            const iconInfo = getWeatherIconAndDesc(codes[i], true); // Assume day icons for forecast
            
            const dayDiv = document.createElement('div');
            dayDiv.className = 'forecast-day glass-panel';
            dayDiv.style.cursor = 'pointer';
            dayDiv.innerHTML = `
                <span>${dayName}</span>
                <img src="${iconInfo.imgSrc}" alt="${iconInfo.desc}" />
                <div class="forecast-temps">
                    <span class="max">${this.formatTemp(maxTemps[i])}°</span>
                    <span class="min">${this.formatTemp(minTemps[i])}°</span>
                </div>
            `;
            
            dayDiv.addEventListener('click', () => {
                this.openModal(i, dailyData);
            });

            this.elements.forecastList.appendChild(dayDiv);
        }
    },

    renderSearchResults: function(results) {
        this.elements.searchResults.innerHTML = '';
        if (results.length === 0) {
            this.elements.searchResults.classList.add('hidden');
            return;
        }

        results.forEach(city => {
            const div = document.createElement('div');
            div.className = 'search-item';
            div.textContent = `${city.name}${city.admin1 ? ', ' + city.admin1 : ''}, ${city.country}`;
            div.dataset.lat = city.latitude;
            div.dataset.lon = city.longitude;
            div.dataset.name = city.name;
            
            div.addEventListener('click', () => {
                if(window.app && window.app.loadLocation) {
                    window.app.loadLocation(city.latitude, city.longitude, city.name);
                }
                this.elements.searchResults.classList.add('hidden');
                document.getElementById('location-search').value = '';
            });

            this.elements.searchResults.appendChild(div);
        });

        this.elements.searchResults.classList.remove('hidden');
    }
};

// Bind Modal Close globally
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('close-modal').addEventListener('click', () => {
        document.getElementById('forecast-modal').classList.add('hidden');
    });
    
    // Close on click outside modal content
    document.getElementById('forecast-modal').addEventListener('click', (e) => {
        if (e.target.id === 'forecast-modal') {
            e.target.classList.add('hidden');
        }
    });
});
