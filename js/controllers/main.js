document.addEventListener('DOMContentLoaded', () => {
    // Initialize components
    if (window.appControllers) window.appControllers.init();
    if (window.cadastrosController) window.cadastrosController.init();
    if (window.cronogramaController) window.cronogramaController.init();
    
    // Test initial mock data to populate UI
    try {
        window.cadastrosController.renderMateriasSelect();
    } catch(e) { }
});
