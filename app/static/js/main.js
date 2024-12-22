// Configuration
const API_URL = '';  // L'URL de base de l'API (vide si même domaine)

// Gestionnaire de token
const TokenManager = {
    setToken(token) {
        localStorage.setItem('token', token);
        this.updateNavigation(true);
    },
    
    getToken() {
        return localStorage.getItem('token');
    },
    
    removeToken() {
        localStorage.removeItem('token');
        this.updateNavigation(false);
    },
    
    updateNavigation(isLoggedIn) {
        const loginNav = document.getElementById('loginNav');
        const logoutNav = document.getElementById('logoutNav');
        
        if (isLoggedIn) {
            loginNav.classList.add('d-none');
            logoutNav.classList.remove('d-none');
        } else {
            loginNav.classList.remove('d-none');
            logoutNav.classList.add('d-none');
        }
    }
};

// Gestionnaire d'API
const ApiClient = {
    async fetch(endpoint, options = {}) {
        const token = TokenManager.getToken();
        const headers = {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            ...options.headers
        };
        
        try {
            const response = await fetch(API_URL + endpoint, {
                ...options,
                headers
            });
            
            if (response.status === 401) {
                TokenManager.removeToken();
                loadPage('login');
                throw new Error('Non autorisé');
            }
            
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Une erreur est survenue');
            }
            
            return data;
        } catch (error) {
            showError(error.message);
            throw error;
        }
    }
};

// Gestionnaire de pages
async function loadPage(pageName) {
    const content = document.getElementById('content');
    content.innerHTML = '<div class="loader"></div>';
    
    try {
        switch (pageName) {
            case 'login':
                await loadLoginPage();
                break;
            case 'vehicles':
                await loadVehiclesPage();
                break;
            case 'maintenance':
                await loadMaintenancePage();
                break;
            case 'rentals':
                await loadRentalsPage();
                break;
            default:
                content.innerHTML = '<h1>Page non trouvée</h1>';
        }
    } catch (error) {
        showError('Erreur lors du chargement de la page');
    }
}

// Pages spécifiques
async function loadLoginPage() {
    const content = document.getElementById('content');
    content.innerHTML = `
        <div class="row justify-content-center">
            <div class="col-md-6">
                <div class="card">
                    <div class="card-body">
                        <h3 class="card-title text-center">Connexion</h3>
                        <form id="loginForm">
                            <div class="mb-3">
                                <label for="email" class="form-label">Email</label>
                                <input type="email" class="form-control" id="email" required>
                            </div>
                            <div class="mb-3">
                                <label for="password" class="form-label">Mot de passe</label>
                                <input type="password" class="form-control" id="password" required>
                            </div>
                            <button type="submit" class="btn btn-primary w-100">Se connecter</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        try {
            const response = await ApiClient.fetch('/api/login', {
                method: 'POST',
                body: JSON.stringify({ email, password })
            });
            
            TokenManager.setToken(response.token);
            loadPage('vehicles');
        } catch (error) {
            showError('Erreur de connexion');
        }
    });
}

async function loadVehiclesPage() {
    if (!TokenManager.getToken()) {
        loadPage('login');
        return;
    }
    
    try {
        const vehicles = await ApiClient.fetch('/api/vehicles');
        const content = document.getElementById('content');
        
        content.innerHTML = `
            <h2>Véhicules</h2>
            <button class="btn btn-primary mb-3" onclick="showAddVehicleForm()">Ajouter un véhicule</button>
            <div class="table-responsive">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Marque</th>
                            <th>Modèle</th>
                            <th>Année</th>
                            <th>Statut</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${vehicles.map(vehicle => `
                            <tr>
                                <td>${vehicle.brand}</td>
                                <td>${vehicle.model}</td>
                                <td>${vehicle.year}</td>
                                <td>${vehicle.status}</td>
                                <td>
                                    <button class="btn btn-sm btn-info" onclick="viewVehicle(${vehicle.id})">Voir</button>
                                    <button class="btn btn-sm btn-warning" onclick="editVehicle(${vehicle.id})">Modifier</button>
                                    <button class="btn btn-sm btn-danger" onclick="deleteVehicle(${vehicle.id})">Supprimer</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } catch (error) {
        showError('Erreur lors du chargement des véhicules');
    }
}

// Utilitaires
function showError(message) {
    const content = document.getElementById('content');
    const alert = document.createElement('div');
    alert.className = 'alert alert-danger alert-dismissible fade show';
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    content.insertBefore(alert, content.firstChild);
}

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    // Gestionnaire de navigation
    document.querySelectorAll('[data-page]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            loadPage(e.target.dataset.page);
        });
    });
    
    // Gestionnaire de déconnexion
    document.getElementById('logoutBtn').addEventListener('click', (e) => {
        e.preventDefault();
        TokenManager.removeToken();
        loadPage('login');
    });
    
    // Vérification de l'authentification et chargement initial
    const token = TokenManager.getToken();
    TokenManager.updateNavigation(!!token);
    loadPage(token ? 'vehicles' : 'login');
});
