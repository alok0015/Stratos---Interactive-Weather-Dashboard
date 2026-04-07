// Main Application Controller

const App = {
    currentWeatherData: null,
    currentCityName: null,
    currentAqiData: null,
    
    init: function() {
        this.setupEventListeners();
        
        // Initialize Global Warming Monitor (fetches data independently)
        ClimateMonitor.init();
        
        // Try getting user's location, else default to New York
        this.geolocateUser();
    },

    setupEventListeners: function() {
        const searchInput = document.getElementById('location-search');
        
        searchInput.addEventListener('input', debounce(async (e) => {
            const query = e.target.value.trim();
            if (query.length > 0) {  // Changed to suggest after 1 letter
                const results = await searchCities(query);
                UI.renderSearchResults(results);
            } else {
                UI.renderSearchResults([]);
            }
        }, 300)); // Also slightly lowered debounce time for quicker perceived suggestions

        // Hide search results when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-container')) {
                UI.elements.searchResults.classList.add('hidden');
            }
        });

        document.getElementById('btn-locate').addEventListener('click', () => {
            this.geolocateUser(true);
        });

        // Unit Toggle
        UI.elements.unitSwitch.addEventListener('change', (e) => {
            UI.isFahrenheit = e.target.checked;
            
            if (UI.isFahrenheit) {
                UI.elements.labelC.classList.remove('active');
                UI.elements.labelF.classList.add('active');
            } else {
                UI.elements.labelC.classList.add('active');
                UI.elements.labelF.classList.remove('active');
            }

            // Repaint UI with existing data
            if (this.currentWeatherData) {
                this.repaintUI();
            }
        });
    },

    repaintUI: function() {
        const isDay = this.currentWeatherData.current.is_day === 1;
        UI.updateCurrentWeather(this.currentWeatherData.current, this.currentWeatherData.daily, isDay, this.currentCityName, this.currentAqiData);
        UI.updateForecast(this.currentWeatherData.daily);
        updateChart(this.currentWeatherData.hourly);
        WeatherAlerts.renderAlerts(this.currentWeatherData, this.currentAqiData);
        // Update climate alerts with local AQI from searched city
        ClimateMonitor.updateLocalAlerts(this.currentAqiData);
    },

    geolocateUser: function(forceUpdate = false) {
        UI.showLoading();
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const lat = position.coords.latitude;
                    const lon = position.coords.longitude;
                    const cityName = await getCityNameFromCoords(lat, lon);
                    this.loadLocation(lat, lon, cityName);
                },
                (error) => {
                    console.warn("Geolocation denied or failed", error);
                    if (!forceUpdate) {
                        // Default to New York
                        this.loadLocation(40.71, -74.01, "New York, US");
                    } else {
                        UI.hideLoading();
                        alert("Could not get your location. Please check browser permissions.");
                    }
                }
            );
        } else {
            console.warn("Geolocation not supported");
            if (!forceUpdate) {
                this.loadLocation(40.71, -74.01, "New York, US");
            } else {
                UI.hideLoading();
            }
        }
    },

    loadLocation: async function(lat, lon, cityName) {
        UI.showLoading();
        try {
            const [weatherData, aqiData] = await Promise.all([
                getWeatherData(lat, lon),
                getAirQualityData(lat, lon)
            ]);
            
            this.currentWeatherData = weatherData;
            this.currentAqiData = aqiData;
            this.currentCityName = cityName;
            
            this.repaintUI();
            updateMap(lat, lon, cityName);

        } catch (error) {
            alert('Failed to load weather data. Please try again.');
            console.error(error);
        } finally {
            UI.hideLoading();
        }
    }
};

// Make App globally available so UI callbacks can access it
window.app = App;

// Start app on load
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
