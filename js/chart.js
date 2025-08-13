async function fetchMenuItemStatistics() {
    try {
        const response = await fetch('http://127.0.0.1:8080/api/statistic/chart');
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        const data = await response.json();

        // Extract keys (labels) and values (counts)
        const labels = Object.keys(data);
        const values = Object.values(data);

        createChart(labels, values);
    } catch (error) {
        console.error('Error fetching menu item statistics:', error);
    }
}

function createChart(labels, values) {
    const ctx = document.getElementById('menuItemChart').getContext('2d');

    // Shades of green
    const greenShades = [
        '#2e7d32', // dark green
        '#388e3c',
        '#43a047',
        '#4caf50',
        '#66bb6a',
        '#81c784',
        '#a5d6a7',
        '#c8e6c9'
    ];

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Menu Item Count',
                data: values,
                backgroundColor: greenShades.slice(0, labels.length),
                borderColor: greenShades.slice(0, labels.length),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

// Fetch data and generate chart on page load
fetchMenuItemStatistics();
