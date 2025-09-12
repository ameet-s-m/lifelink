document.addEventListener('DOMContentLoaded', () => {
    const SERVER_URL = 'https://lifelink-90wf.onrender.com';

    // --- Initialize Heatmap ---
    async function initHeatmap() {
        const response = await fetch(`${SERVER_URL}/api/analytics/locations`);
        const locations = await response.json();

        const map = L.map('heatmap-container').setView([20.5937, 78.9629], 5);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        if (locations.length > 0) {
            const heatPoints = locations.map(loc => [loc.latitude, loc.longitude, 1]); // latitude, longitude, intensity
            L.heatLayer(heatPoints, { radius: 25 }).addTo(map);
        }
    }

    // --- Initialize Response Time Chart ---
    async function initResponseChart() {
        const response = await fetch(`${SERVER_URL}/api/analytics/responsetimes`);
        const data = await response.json();

        const ctx = document.getElementById('response-time-chart').getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Minimum', 'Average', 'Maximum'],
                datasets: [{
                    label: 'Response Time in Seconds',
                    data: [data.min, data.avg, data.max],
                    backgroundColor: [
                        'rgba(40, 167, 69, 0.6)', // Green
                        'rgba(255, 193, 7, 0.6)',  // Yellow
                        'rgba(220, 53, 69, 0.6)'   // Red
                    ],
                    borderColor: [
                        'rgba(40, 167, 69, 1)',
                        'rgba(255, 193, 7, 1)',
                        'rgba(220, 53, 69, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    // --- Load all analytics on page load ---
    initHeatmap();
    initResponseChart();
});