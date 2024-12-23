document.addEventListener('DOMContentLoaded', function() {
    // Gestionnaires d'événements pour les formulaires
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }

    // Gestion des onglets
    const loginTab = document.getElementById('loginTab');
    const registerTab = document.getElementById('registerTab');
    
    if (loginTab && registerTab) {
        loginTab.addEventListener('click', () => {
            document.getElementById('loginForm').style.display = 'block';
            document.getElementById('registerForm').style.display = 'none';
            loginTab.classList.add('active');
            registerTab.classList.remove('active');
        });

        registerTab.addEventListener('click', () => {
            document.getElementById('loginForm').style.display = 'none';
            document.getElementById('registerForm').style.display = 'block';
            registerTab.classList.add('active');
            loginTab.classList.remove('active');
        });
    }
});

async function handleLogin(event) {
    event.preventDefault();
    const username = document.getElementById('email').value;  // On utilise le champ email comme username
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        const data = await response.json();

        if (response.ok) {
            // Stocker le token dans le localStorage
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            // Afficher un message de succès
            showMessage('Connexion réussie !', 'success');
            
            // Rediriger vers le tableau de bord après un court délai
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 1000);
        } else {
            showMessage(data.error || 'Erreur lors de la connexion', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('Erreur lors de la connexion', 'error');
    }
}

async function handleRegister(event) {
    event.preventDefault();
    const username = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (password !== confirmPassword) {
        showMessage('Les mots de passe ne correspondent pas', 'error');
        return;
    }

    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, email, password }),
        });

        const data = await response.json();

        if (response.ok) {
            showMessage('Inscription réussie ! Vous pouvez maintenant vous connecter.', 'success');
            // Rediriger vers la page de connexion après un court délai
            setTimeout(() => {
                window.location.href = '/login';
            }, 1000);
        } else {
            showMessage(data.error || 'Erreur lors de l\'inscription', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('Erreur lors de l\'inscription', 'error');
    }
}

function showMessage(message, type) {
    const messageDiv = document.getElementById('message');
    if (messageDiv) {
        messageDiv.textContent = message;
        messageDiv.className = `message ${type}`;
        messageDiv.style.display = 'block';

        // Cacher le message après 3 secondes
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 3000);
    }
}
