document.addEventListener('DOMContentLoaded', function() {
    const toggle = document.getElementById('theme-toggle');
    const currentTheme = localStorage.getItem('theme');
    
    // Aplicar tema guardado
    if (currentTheme === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
        toggle.checked = true;
    }
    
    // Escuchar cambios en el toggle
    toggle.addEventListener('change', function() {
        if (this.checked) {
            document.body.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.body.removeAttribute('data-theme');
            localStorage.setItem('theme', 'light');
        }
    });
});