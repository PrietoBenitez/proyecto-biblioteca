// frontend/public/js/estadisticas.js

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const res = await fetch('/api/estadisticas/totales');
        const data = await res.json();
        renderCharts(data);
    } catch (err) {
        showAlert('Error al cargar estadísticas', 'danger');
    }
});

function renderCharts(data) {
    const labels = ['Socios', 'Materiales', 'Préstamos', 'Donantes'];
    const values = [data.socios, data.materiales, data.prestamos, data.donantes];
    const colors = [
        'rgba(54, 162, 235, 0.6)',
        'rgba(255, 206, 86, 0.6)',
        'rgba(75, 192, 192, 0.6)',
        'rgba(255, 99, 132, 0.6)'
    ];

    // Gráfico de barras
    new Chart(document.getElementById('estadisticasChartBar').getContext('2d'), {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Totales',
                data: values,
                backgroundColor: colors
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false },
                title: { display: true, text: 'Totales por categoría' }
            }
        }
    });

    // Gráfico de pastel
    new Chart(document.getElementById('estadisticasChartPie').getContext('2d'), {
        type: 'pie',
        data: {
            labels,
            datasets: [{
                label: 'Totales',
                data: values,
                backgroundColor: colors
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom' },
                title: { display: true, text: 'Distribución porcentual' }
            }
        }
    });

    // Gráfico de línea
    new Chart(document.getElementById('estadisticasChartLine').getContext('2d'), {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Totales',
                data: values,
                borderColor: 'rgba(54, 162, 235, 0.8)',
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                fill: true,
                tension: 0.3,
                pointBackgroundColor: colors
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false },
                title: { display: true, text: 'Evolución por categoría' }
            }
        }
    });
}

function showAlert(message, type) {
    alert(message);
}
