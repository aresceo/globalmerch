// Inizializzazione Telegram Web App
let tg = window.Telegram.WebApp;
let userId = null;
let userData = null;

// Configurazione iniziale
tg.ready();
tg.expand();

// Gestione del caricamento iniziale
document.addEventListener('DOMContentLoaded', function() {
    // Ottieni l'ID utente da Telegram
    if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
        userId = tg.initDataUnsafe.user.id;
        console.log('User ID:', userId);
        
        // Carica o registra l'utente
        initializeUser();
    } else {
        // Fallback per testing senza Telegram
        userId = 'test_user_' + Date.now();
        initializeUser();
    }
});

// Inizializzazione utente
async function initializeUser() {
    try {
        // Carica il database
        const database = await loadDatabase();
        
        // Controlla se l'utente esiste già
        if (database.users && database.users[userId]) {
            userData = database.users[userId];
            showHomepage();
        } else {
            showRegistrationForm();
            // Precompila l'username dal profilo Telegram
            populateUsername();
        }
        
        hideLoading();
    } catch (error) {
        console.error('Errore inizializzazione:', error);
        hideLoading();
        showRegistrationForm();
        populateUsername();
    }
}

// Precompila l'username dal profilo Telegram
function populateUsername() {
    const usernameField = document.getElementById('username');
    
    if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
        const telegramUser = tg.initDataUnsafe.user;
        // Prova username, poi first_name, poi fallback
        const username = telegramUser.username || 
                        telegramUser.first_name || 
                        `user_${telegramUser.id}`;
        usernameField.value = username;
    } else {
        // Fallback per testing
        usernameField.value = `test_user_${Date.now()}`;
    }
}

// Caricamento database
async function loadDatabase() {
    try {
        const response = await fetch('database.json');
        if (response.ok) {
            return await response.json();
        }
    } catch (error) {
        console.log('Database non trovato, creazione nuovo database');
    }
    
    // Ritorna database vuoto se non esiste
    return {
        users: {},
        articles: getDefaultArticles()
    };
}

// Articoli di default per demo
function getDefaultArticles() {
    return [
        {
            id: 1,
            title: "iPhone 15 Pro Max",
            description: "Smartphone Apple ultimo modello, condizioni eccellenti",
            image: "https://via.placeholder.com/300x200/007bff/ffffff?text=iPhone+15",
            price: "€1.200",
            stock: 3,
            seller: "TechStore Milano",
            verified: true
        },
        {
            id: 2,
            title: "MacBook Air M2",
            description: "Laptop Apple con chip M2, 8GB RAM, 256GB SSD",
            image: "https://via.placeholder.com/300x200/28a745/ffffff?text=MacBook+Air",
            price: "€1.050",
            stock: 2,
            seller: "ComputerShop",
            verified: true
        },
        {
            id: 3,
            title: "AirPods Pro 2",
            description: "Auricolari wireless con cancellazione del rumore",
            image: "https://via.placeholder.com/300x200/dc3545/ffffff?text=AirPods+Pro",
            price: "€280",
            stock: 10,
            seller: "AudioWorld",
            verified: false
        },
        {
            id: 4,
            title: "PlayStation 5",
            description: "Console Sony PS5 con controller DualSense incluso",
            image: "https://via.placeholder.com/300x200/6f42c1/ffffff?text=PlayStation+5",
            price: "€550",
            stock: 1,
            seller: "GameZone",
            verified: true
        },
        {
            id: 5,
            title: "Samsung Galaxy S24",
            description: "Smartphone Android flagship con fotocamera professionale",
            image: "https://via.placeholder.com/300x200/fd7e14/ffffff?text=Galaxy+S24",
            price: "€899",
            stock: 5,
            seller: "MobileCenter",
            verified: true
        },
        {
            id: 6,
            title: "Nintendo Switch",
            description: "Console portatile con Joy-Con e giochi inclusi",
            image: "https://via.placeholder.com/300x200/e83e8c/ffffff?text=Nintendo+Switch",
            price: "€320",
            stock: 7,
            seller: "RetroGaming",
            verified: false
        }
    ];
}

// Salvataggio database
async function saveDatabase(database) {
    try {
        // In un'app reale, questo dovrebbe essere una chiamata API
        // Per ora simuliamo il salvataggio in localStorage
        localStorage.setItem('marketplace_db', JSON.stringify(database));
        console.log('Database salvato con successo');
        return true;
    } catch (error) {
        console.error('Errore salvataggio database:', error);
        return false;
    }
}

// Mostra/nascondi elementi
function hideLoading() {
    document.getElementById('loading-overlay').style.display = 'none';
}

function showRegistrationForm() {
    document.getElementById('registration-form').style.display = 'flex';
}

function showHomepage() {
    document.getElementById('homepage').style.display = 'block';
    loadArticles();
    setupUserProfile();
}

function showSettings() {
    document.getElementById('homepage').style.display = 'none';
    document.getElementById('settings-page').style.display = 'block';
    loadCurrentProfilePic();
}

function backToHomepage() {
    document.getElementById('settings-page').style.display = 'none';
    document.getElementById('homepage').style.display = 'block';
}

// Gestione registrazione
document.getElementById('reg-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const username = formData.get('username');
    const password = formData.get('password');
    
    // Validazione password
    if (password.length < 6) {
        if (tg.showAlert) {
            tg.showAlert('La password deve essere di almeno 6 caratteri');
        } else {
            alert('La password deve essere di almeno 6 caratteri');
        }
        return;
    }
    
    const newUser = {
        id: userId,
        username: username,
        password: password, // In un'app reale, questo dovrebbe essere hashato
        registrationDate: new Date().toISOString(),
        profilePicture: 'https://via.placeholder.com/80/007bff/ffffff?text=' + username.charAt(0).toUpperCase()
    };
    
    // Carica database attuale
    const database = await loadDatabase();
    
    // Aggiungi nuovo utente
    if (!database.users) database.users = {};
    database.users[userId] = newUser;
    
    // Salva database
    const saved = await saveDatabase(database);
    
    if (saved) {
        userData = newUser;
        document.getElementById('registration-form').style.display = 'none';
        showHomepage();
        
        // Notifica Telegram se disponibile
        if (tg.showAlert) {
            tg.showAlert('Registrazione completata con successo!');
        }
    } else {
        if (tg.showAlert) {
            tg.showAlert('Errore durante la registrazione. Riprova.');
        } else {
            alert('Errore durante la registrazione. Riprova.');
        }
    }
});

// Caricamento articoli
async function loadArticles() {
    const database = await loadDatabase();
    const articles = database.articles || getDefaultArticles();
    
    const articlesGrid = document.getElementById('articles-grid');
    articlesGrid.innerHTML = '';
    
    articles.forEach(article => {
        const articleCard = createArticleCard(article);
        articlesGrid.appendChild(articleCard);
    });
}

// Creazione card articolo
function createArticleCard(article) {
    const card = document.createElement('div');
    card.className = 'article-card';
    
    card.innerHTML = `
        <img src="${article.image}" alt="${article.title}" class="article-image">
        <div class="article-content">
            <h3 class="article-title">${article.title}</h3>
            <p class="article-description">${article.description}</p>
            <div class="article-info">
                <span class="stock-info">Stock: ${article.stock}</span>
            </div>
            <div class="seller-info">
                <span class="seller-name">${article.seller}</span>
                ${article.verified ? '<span class="verified-badge">Verificato</span>' : ''}
            </div>
            <div class="article-price">${article.price}</div>
        </div>
    `;
    
    return card;
}

// Setup profilo utente
function setupUserProfile() {
    const profilePic = document.getElementById('profile-pic');
    const dropdownMenu = document.getElementById('dropdown-menu');
    
    if (userData && userData.profilePicture) {
        profilePic.src = userData.profilePicture;
    }
    
    // Toggle dropdown menu
    profilePic.addEventListener('click', function(e) {
        e.stopPropagation();
        dropdownMenu.classList.toggle('show');
    });
    
    // Chiudi menu quando si clicca fuori
    document.addEventListener('click', function() {
        dropdownMenu.classList.remove('show');
    });
    
    // Link impostazioni
    document.getElementById('settings-link').addEventListener('click', function(e) {
        e.preventDefault();
        dropdownMenu.classList.remove('show');
        showSettings();
    });
}

// Gestione impostazioni
document.getElementById('back-btn').addEventListener('click', backToHomepage);

document.getElementById('profile-upload').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('current-profile-pic').src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
});

document.getElementById('save-settings').addEventListener('click', async function() {
    const fileInput = document.getElementById('profile-upload');
    
    if (fileInput.files.length > 0) {
        const reader = new FileReader();
        reader.onload = async function(e) {
            const newProfilePic = e.target.result;
            
            // Aggiorna database
            const database = await loadDatabase();
            if (database.users && database.users[userId]) {
                database.users[userId].profilePicture = newProfilePic;
                userData.profilePicture = newProfilePic;
                
                const saved = await saveDatabase(database);
                
                if (saved) {
                    // Aggiorna l'immagine nell'header
                    document.getElementById('profile-pic').src = newProfilePic;
                    
                    if (tg.showAlert) {
                        tg.showAlert('Foto profilo aggiornata!');
                    } else {
                        alert('Foto profilo aggiornata!');
                    }
                    
                    backToHomepage();
                }
            }
        };
        reader.readAsDataURL(fileInput.files[0]);
    } else {
        if (tg.showAlert) {
            tg.showAlert('Seleziona una foto prima di salvare.');
        } else {
            alert('Seleziona una foto prima di salvare.');
        }
    }
});

function loadCurrentProfilePic() {
    const currentPic = document.getElementById('current-profile-pic');
    if (userData && userData.profilePicture) {
        currentPic.src = userData.profilePicture;
    }
}

// Gestione errori globali
window.addEventListener('error', function(e) {
    console.error('Errore applicazione:', e.error);
});

// Debug: funzioni per testing
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    window.debugFunctions = {
        loadDatabase,
        saveDatabase,
        userData: () => userData,
        userId: () => userId
    };
}
