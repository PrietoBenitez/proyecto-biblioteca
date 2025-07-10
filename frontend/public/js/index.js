// JS para mostrar los conteos dinámicos en las tarjetas del index

document.addEventListener('DOMContentLoaded', async function() {
    try {
        const res = await fetch('/api/dashboard/counts');
        const data = await res.json();
        // Selecciona las tarjetas por orden (ajusta si cambias el orden en el HTML)
        const cards = document.querySelectorAll('.summary-card');
        if (cards[0]) cards[0].querySelector('h3').textContent = data.sociosActivos ?? '-';
        if (cards[1]) cards[1].querySelector('h3').textContent = data.totalMateriales ?? '-';
        if (cards[2]) cards[2].querySelector('h3').textContent = data.prestamosActivos ?? '-';
        if (cards[3]) cards[3].querySelector('h3').textContent = data.totalDonantes ?? '-';
    } catch (err) {
        // Si hay error, muestra guiones
        document.querySelectorAll('.summary-card h3').forEach(el => el.textContent = '-');
    }
});
