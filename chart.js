// Chart.js initialization and operations

let tempChartInstance = null;
let currentHourlyData = null;

/**
 * Initialize or update the Temperature Chart (Next 24 hours)
 */
function updateChart(hourlyData) {
    if (hourlyData) {
        currentHourlyData = hourlyData;
    } else if (currentHourlyData) {
        hourlyData = currentHourlyData;
    } else {
        return;
    }

    const ctx = document.getElementById('temp-chart').getContext('2d');
    
    // Get next 24 hours data
    const times = hourlyData.time.slice(0, 24).map(t => {
        const d = new Date(t);
        return `${d.getHours()}:00`;
    });
    
    const temps = hourlyData.temperature_2m.slice(0, 24).map(t => {
        return window.UI ? window.UI.formatTemp(t) : Math.round(t);
    });
    
    const unitSymbol = (window.UI && window.UI.isFahrenheit) ? '°F' : '°C';

    if (tempChartInstance) {
        // Update data
        tempChartInstance.data.labels = times;
        tempChartInstance.data.datasets[0].data = temps;
        tempChartInstance.data.datasets[0].label = `Temperature (${unitSymbol})`;
        tempChartInstance.update();
        return;
    }

    // Create gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(59, 130, 246, 0.5)'); // Blue
    gradient.addColorStop(1, 'rgba(59, 130, 246, 0.0)');

    // Create chart
    Chart.defaults.color = '#9ca3af';
    Chart.defaults.font.family = "'Outfit', sans-serif";

    tempChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: times,
            datasets: [{
                label: `Temperature (${unitSymbol})`,
                data: temps,
                borderColor: '#3b82f6',
                backgroundColor: gradient,
                borderWidth: 2,
                pointBackgroundColor: '#fff',
                pointBorderColor: '#3b82f6',
                pointHoverBackgroundColor: '#3b82f6',
                pointHoverBorderColor: '#fff',
                pointRadius: 3,
                pointHoverRadius: 5,
                fill: true,
                tension: 0.4 // Smooth curves
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(25, 30, 45, 0.9)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderWidth: 1,
                    padding: 10,
                    displayColors: false,
                    callbacks: {
                        label: function(context) {
                            const sym = (window.UI && window.UI.isFahrenheit) ? '°F' : '°C';
                            return `${context.parsed.y}${sym}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)',
                        drawBorder: false
                    },
                    ticks: {
                        callback: function(value) {
                            return value + '°';
                        }
                    }
                },
                x: {
                    grid: {
                        display: false,
                        drawBorder: false
                    },
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45
                    }
                }
            }
        }
    });
}
