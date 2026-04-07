// API integration with Open-Meteo

const GEOCODE_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const WEATHER_URL = 'https://api.open-meteo.com/v1/forecast';

/**
 * Fetch cities based on search query
 */
async function searchCities(query) {
    if (!query) return [];
    try {
        const response = await fetch(`${GEOCODE_URL}?name=${encodeURIComponent(query)}&count=5&language=en&format=json`);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        return data.results || [];
    } catch (error) {
        console.error('Error searching cities:', error);
        return [];
    }
}

/**
 * Fetch weather data for given coordinates
 */
async function getWeatherData(lat, lon) {
    try {
        // Fetch current, daily forecast, and hourly (for charts)
        const params = new URLSearchParams({
            latitude: lat,
            longitude: lon,
            current: 'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m',
            hourly: 'temperature_2m,precipitation_probability',
            daily: 'weather_code,temperature_2m_max,temperature_2m_min,uv_index_max,sunrise,sunset,precipitation_sum',
            timezone: 'auto',
            past_days: 0,
            forecast_days: 7
        });

        const response = await fetch(`${WEATHER_URL}?${params.toString()}`);
        if (!response.ok) throw new Error('Network response was not ok');
        return await response.json();
    } catch (error) {
        console.error('Error fetching weather data:', error);
        throw error;
    }
}

/**
 * Fetch air quality data for given coordinates
 */
async function getAirQualityData(lat, lon) {
    try {
        const params = [
            'us_aqi', 'pm10', 'pm2_5',
            'carbon_monoxide', 'nitrogen_dioxide', 'sulphur_dioxide', 'ozone',
            'us_aqi_pm2_5', 'us_aqi_pm10',
            'us_aqi_nitrogen_dioxide', 'us_aqi_ozone',
            'us_aqi_carbon_monoxide', 'us_aqi_sulphur_dioxide'
        ].join(',');
        const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=${params}&timezone=auto`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Network response was not ok');
        return await response.json();
    } catch (error) {
        console.error('Error fetching air quality data:', error);
        return null;
    }
}

/**
 * Reverse Geocode (get city name from coords)
 * Note: Open-Meteo doesn't have a direct free reverse geocoding API, 
 * using BigDataCloud free client-side API for best effort fallback.
 */
async function getCityNameFromCoords(lat, lon) {
    try {
        const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
        const data = await response.json();
        return `${data.city || data.locality || 'Unknown Location'}, ${data.countryCode}`;
    } catch (error) {
        console.error("Reverse geocoding failed", error);
        return `Lat: ${lat.toFixed(2)}, Lon: ${lon.toFixed(2)}`;
    }
}
