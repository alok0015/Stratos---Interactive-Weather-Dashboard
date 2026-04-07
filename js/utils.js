// Utility functions 

/**
 * Map WMO Weather codes to Phosphor Icons and Descriptions
 * https://open-meteo.com/en/docs
 */
function getWeatherIconAndDesc(code, isDay = true) {
    const defaultIcon = isDay ? 'ph-sun' : 'ph-moon';
    const defaultImg = isDay ? '01d' : '01n';
    
    const bgClearDay = 'https://images.unsplash.com/photo-1622396481328-9b1b78cdd9fd?q=80&w=1920&auto=format&fit=crop';
    const bgClearNight = 'https://images.unsplash.com/photo-1531306728370-53bf9ce45f74?q=80&w=1920&auto=format&fit=crop';
    const bgCloudy = 'https://images.unsplash.com/photo-1534088568595-a066f410cbda?q=80&w=1920&auto=format&fit=crop';
    const bgRain = 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?q=80&w=1920&auto=format&fit=crop';
    const bgSnow = 'https://images.unsplash.com/photo-1478265409131-1f65c88f965c?q=80&w=1920&auto=format&fit=crop';
    const bgThunder = 'https://images.unsplash.com/photo-1605727216801-e27ce1d0ce5c?q=80&w=1920&auto=format&fit=crop';
    const bgFog = 'https://images.unsplash.com/photo-1487621167305-5d248087c724?q=80&w=1920&auto=format&fit=crop';

    const defaultBg = isDay ? bgClearDay : bgClearNight;
    
    // Helper to get day/night background version if needed, or default
    const getBg = (type) => {
        switch(type) {
            case 'clear': return isDay ? bgClearDay : bgClearNight;
            case 'clouds': return bgCloudy;
            case 'rain': return bgRain;
            case 'snow': return bgSnow;
            case 'thunder': return bgThunder;
            case 'fog': return bgFog;
            default: return defaultBg;
        }
    };

    const weatherMap = {
        0: { desc: 'Clear sky', icon: isDay ? 'ph-sun' : 'ph-moon', imgCode: isDay ? '01d' : '01n', bgImage: getBg('clear') },
        1: { desc: 'Mainly clear', icon: isDay ? 'ph-sun' : 'ph-moon', imgCode: isDay ? '02d' : '02n', bgImage: getBg('clear') },
        2: { desc: 'Partly cloudy', icon: 'ph-cloud-sun', imgCode: isDay ? '03d' : '03n', bgImage: getBg('clouds') },
        3: { desc: 'Overcast', icon: 'ph-cloud', imgCode: isDay ? '04d' : '04n', bgImage: getBg('clouds') },
        45: { desc: 'Fog', icon: 'ph-cloud-fog', imgCode: isDay ? '50d' : '50n', bgImage: getBg('fog') },
        48: { desc: 'Depositing rime fog', icon: 'ph-cloud-fog', imgCode: isDay ? '50d' : '50n', bgImage: getBg('fog') },
        51: { desc: 'Light Drizzle', icon: 'ph-cloud-rain', imgCode: isDay ? '09d' : '09n', bgImage: getBg('rain') },
        53: { desc: 'Moderate Drizzle', icon: 'ph-cloud-rain', imgCode: isDay ? '09d' : '09n', bgImage: getBg('rain') },
        55: { desc: 'Dense Drizzle', icon: 'ph-cloud-rain', imgCode: isDay ? '09d' : '09n', bgImage: getBg('rain') },
        56: { desc: 'Light Freezing Drizzle', icon: 'ph-cloud-snow', imgCode: isDay ? '13d' : '13n', bgImage: getBg('snow') },
        57: { desc: 'Dense Freezing Drizzle', icon: 'ph-cloud-snow', imgCode: isDay ? '13d' : '13n', bgImage: getBg('snow') },
        61: { desc: 'Slight Rain', icon: 'ph-cloud-rain', imgCode: isDay ? '10d' : '10n', bgImage: getBg('rain') },
        63: { desc: 'Moderate Rain', icon: 'ph-cloud-rain', imgCode: isDay ? '10d' : '10n', bgImage: getBg('rain') },
        65: { desc: 'Heavy Rain', icon: 'ph-cloud-rain', imgCode: isDay ? '10d' : '10n', bgImage: getBg('rain') },
        66: { desc: 'Light Freezing Rain', icon: 'ph-cloud-snow', imgCode: isDay ? '13d' : '13n', bgImage: getBg('snow') },
        67: { desc: 'Heavy Freezing Rain', icon: 'ph-cloud-snow', imgCode: isDay ? '13d' : '13n', bgImage: getBg('snow') },
        71: { desc: 'Slight Snow fall', icon: 'ph-cloud-snow', imgCode: isDay ? '13d' : '13n', bgImage: getBg('snow') },
        73: { desc: 'Moderate Snow fall', icon: 'ph-cloud-snow', imgCode: isDay ? '13d' : '13n', bgImage: getBg('snow') },
        75: { desc: 'Heavy Snow fall', icon: 'ph-cloud-snow', imgCode: isDay ? '13d' : '13n', bgImage: getBg('snow') },
        77: { desc: 'Snow grains', icon: 'ph-snowflake', imgCode: isDay ? '13d' : '13n', bgImage: getBg('snow') },
        80: { desc: 'Slight Rain showers', icon: 'ph-cloud-rain', imgCode: isDay ? '09d' : '09n', bgImage: getBg('rain') },
        81: { desc: 'Moderate Rain showers', icon: 'ph-cloud-rain', imgCode: isDay ? '09d' : '09n', bgImage: getBg('rain') },
        82: { desc: 'Violent Rain showers', icon: 'ph-cloud-lightning', imgCode: isDay ? '11d' : '11n', bgImage: getBg('thunder') },
        85: { desc: 'Slight Snow showers', icon: 'ph-cloud-snow', imgCode: isDay ? '13d' : '13n', bgImage: getBg('snow') },
        86: { desc: 'Heavy Snow showers', icon: 'ph-cloud-snow', imgCode: isDay ? '13d' : '13n', bgImage: getBg('snow') },
        95: { desc: 'Thunderstorm', icon: 'ph-cloud-lightning', imgCode: isDay ? '11d' : '11n', bgImage: getBg('thunder') },
        96: { desc: 'Thunderstorm with slight hail', icon: 'ph-cloud-lightning', imgCode: isDay ? '11d' : '11n', bgImage: getBg('thunder') },
        99: { desc: 'Thunderstorm with heavy hail', icon: 'ph-cloud-lightning', imgCode: isDay ? '11d' : '11n', bgImage: getBg('thunder') }
    };

    const entry = weatherMap[code] || { desc: 'Unknown', icon: defaultIcon, imgCode: defaultImg, bgImage: defaultBg };
    // Make icon solid
    entry.icon = entry.icon.startsWith('ph-') ? `ph-fill ${entry.icon}` : entry.icon;
    entry.imgSrc = `https://openweathermap.org/img/wn/${entry.imgCode}@2x.png`;
    return entry;
}

/**
 * Format Date to "Weekday, Mon DD"
 */
function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

/**
 * Format Time to HH:MM AM/PM
 */
function formatTime(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

/**
 * Debounce utility for search input
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
