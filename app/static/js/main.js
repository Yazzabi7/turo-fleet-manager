document.addEventListener('DOMContentLoaded', function() {
    const root = document.getElementById('root');
    let currentTab = 0;
    
    function createLoginForm() {
        root.innerHTML = `
            <div class="container">
                <div class="paper">
                    <div class="logo">
                        <svg class="car-icon" viewBox="0 0 24 24" width="40" height="40">
                            <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
                        </svg>
                        <h1>Turo Fleet Manager</h1>
                    </div>
                    <div class="tabs">
                        <button onclick="switchTab(0)" class="${currentTab === 0 ? 'active' : ''}">Connexion</button>
                        <button onclick="switchTab(1)" class="${currentTab === 1 ? 'active' : ''}">Inscription</button>
                    </div>
                    <div class="form">
                        ${currentTab === 0 ? createLoginTab() : createRegisterTab()}
                    </div>
                </div>
            </div>
        `;
    }

    function createLoginTab() {
        return `
            <form onsubmit="handleLogin(event)">
                <div class="field">
                    <input type="email" id="email" placeholder="Email" required>
                </div>
                <div class="field password-field">
                    <input type="password" id="password" placeholder="Mot de passe" required>
                    <span class="visibility-toggle" onclick="togglePassword()">👁️</span>
                </div>
                <button type="submit" class="submit">Se connecter</button>
            </form>
        `;
    }

    function createRegisterTab() {
        return `
            <form onsubmit="handleRegister(event)">
                <div class="field">
                    <input type="text" id="name" placeholder="Nom" required>
                </div>
                <div class="field">
                    <input type="email" id="email" placeholder="Email" required>
                </div>
                <div class="field password-field">
                    <input type="password" id="password" placeholder="Mot de passe" required>
                    <span class="visibility-toggle" onclick="togglePassword()">👁️</span>
                </div>
                <div class="field password-field">
                    <input type="password" id="confirmPassword" placeholder="Confirmer le mot de passe" required>
                </div>
                <button type="submit" class="submit">S'inscrire</button>
            </form>
        `;
    }

    window.switchTab = function(tab) {
        currentTab = tab;
        createLoginForm();
    };

    window.togglePassword = function() {
        const passwordInput = document.getElementById('password');
        const type = passwordInput.type === 'password' ? 'text' : 'password';
        passwordInput.type = type;
    };

    window.handleLogin = async function(event) {
        event.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('token', data.token);
                window.location.href = '/dashboard';
            } else {
                const error = await response.json();
                showError(error.message || 'Erreur de connexion');
            }
        } catch (error) {
            showError('Erreur de connexion au serveur');
        }
    };

    window.handleRegister = async function(event) {
        event.preventDefault();
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (password !== confirmPassword) {
            showError('Les mots de passe ne correspondent pas');
            return;
        }

        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, email, password }),
            });

            if (response.ok) {
                switchTab(0);
                showSuccess('Inscription réussie ! Vous pouvez maintenant vous connecter.');
            } else {
                const error = await response.json();
                showError(error.message || 'Erreur lors de l\'inscription');
            }
        } catch (error) {
            showError('Erreur de connexion au serveur');
        }
    };

    function showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error';
        errorDiv.textContent = message;
        document.querySelector('.form').appendChild(errorDiv);
        setTimeout(() => errorDiv.remove(), 5000);
    }

    function showSuccess(message) {
        const successDiv = document.createElement('div');
        successDiv.className = 'success';
        successDiv.textContent = message;
        document.querySelector('.form').appendChild(successDiv);
        setTimeout(() => successDiv.remove(), 5000);
    }

    // Initialize the login form
    createLoginForm();
});
