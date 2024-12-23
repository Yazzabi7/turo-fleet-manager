document.addEventListener('DOMContentLoaded', function() {
    // Vérifier l'authentification
    if (!isAuthenticated()) {
        window.location.href = '/login';
        return;
    }

    // Récupérer les informations de l'utilisateur
    const user = JSON.parse(localStorage.getItem('user'));
    
    // Mettre à jour le nom de l'utilisateur dans la navbar
    const userNameElement = document.getElementById('userName');
    if (userNameElement && user) {
        userNameElement.textContent = user.username;
    }

    // Gestionnaire pour le bouton de déconnexion
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', logout);
    }

    // Charger les données du dashboard
    loadDashboardData();
});

async function loadDashboardData() {
    try {
        const response = await fetch('/api/dashboard', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            updateDashboard(data);
        } else {
            showMessage('Erreur lors du chargement des données', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('Erreur lors du chargement des données', 'error');
    }
}

function updateDashboard(data) {
    // Mettre à jour les statistiques
    document.getElementById('totalVehicles').textContent = data.total_vehicles || 0;
    document.getElementById('availableVehicles').textContent = data.available_vehicles || 0;
    document.getElementById('rentedVehicles').textContent = data.rented_vehicles || 0;
    document.getElementById('maintenanceVehicles').textContent = data.maintenance_vehicles || 0;
}
