// Telegram Web App API
const tg = window.Telegram?.WebApp;
let currentUser = null;
let currentPage = 'home';

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    initializeTelegramWebApp();
    setupEventListeners();
    checkAuthentication();
});

function initializeTelegramWebApp() {
    if (tg) {
        tg.ready();
        tg.expand();
        console.log('Telegram WebApp initialized');
    } else {
        console.log('Running in development mode');
    }
}

function setupEventListeners() {
    // Navigation
    document.getElementById('notifications-btn').addEventListener('click', () => showPage('notifications'));
    document.getElementById('seller-btn').addEventListener('click', () => showPage('seller-form'));
    document.getElementById('profile-btn').addEventListener('click', toggleProfileDropdown);
    document.getElementById('settings-btn').addEventListener('click', () => showPage('settings'));
    
    // Back buttons
    document.getElementById('back-from-settings').addEventListener('click', () => showPage('home'));
    document.getElementById('back-from-seller').addEventListener('click', () => showPage('home'));
    document.getElementById('back-from-notifications').addEventListener('click', () => showPage('home'));
    document.getElementById('back-to-home-btn').addEventListener('click', () => showPage('home'));
    
    // Forms
    document.getElementById('registration-form').addEventListener('submit', handleRegistration);
    document.getElementById('seller-form').addEventListener('submit', handleSellerRequest);
    document.getElementById('save-settings-btn').addEventListener('click', handleSaveSettings);
    
    // Search
    document.getElementById('search-input').addEventListener('input', handleSearch);
    
    // Mark all notifications as read
    document.getElementById('mark-all-read-btn').addEventListener('click', markAllNotificationsAsRead);
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(event) {
        const dropdown = document.getElementById('profile-dropdown');
        const button = document.getElementById('profile-btn');
        if (!dropdown.contains(event.target) && !button.contains(event.target)) {
            dropdown.classList.add('hidden');
        }
    });
}

function getTelegramUser() {
    if (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) {
        return tg.initDataUnsafe.user;
    }
    // Fallback for development
    return {
        id: 123456789,
        first_name: 'Test',
        last_name: 'User',
        username: 'testuser'
    };
}

async function checkAuthentication() {
    hideLoading();
    const telegramUser = getTelegramUser();
    
    if (!telegramUser) {
        showError('Dati Telegram non disponibili');
        return;
    }
    
    try {
        const response = await fetch('/api/auth/me', {
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            currentUser = data.user;
            showMainApp();
            loadContent();
        } else {
            showLoginForm(telegramUser);
        }
    } catch (error) {
        console.error('Authentication check failed:', error);
        showLoginForm(telegramUser);
    }
}

function showLoginForm(telegramUser) {
    document.getElementById('loading').classList.add('hidden');
    document.getElementById('login-form').classList.remove('hidden');
    
    const username = telegramUser.username || `${telegramUser.first_name}${telegramUser.last_name || ''}`;
    document.getElementById('username').value = username;
}

function showMainApp() {
    document.getElementById('loading').classList.add('hidden');
    document.getElementById('login-form').classList.add('hidden');
    document.getElementById('main-app').classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loading').classList.add('hidden');
}

async function handleRegistration(event) {
    event.preventDefault();
    
    const telegramUser = getTelegramUser();
    const password = document.getElementById('password').value;
    
    if (!password.trim()) {
        showAlert('La password è obbligatoria');
        return;
    }
    
    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
                telegramId: telegramUser.id.toString(),
                username: telegramUser.username || `${telegramUser.first_name}${telegramUser.last_name || ''}`,
                password: password
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            currentUser = data.user;
            showMainApp();
            loadContent();
            showAlert('Registrazione completata! Benvenuto in GlobalMerch!');
        } else {
            const error = await response.json();
            showAlert(error.message || 'Errore durante la registrazione');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showAlert('Errore di connessione');
    }
}

function showPage(pageName) {
    // Hide all pages
    const pages = ['home-page', 'settings-page', 'seller-form-page', 'success-page', 'notifications-page'];
    pages.forEach(page => {
        document.getElementById(page).classList.add('hidden');
    });
    
    // Hide profile dropdown
    document.getElementById('profile-dropdown').classList.add('hidden');
    
    // Show requested page
    currentPage = pageName;
    
    switch(pageName) {
        case 'home':
            document.getElementById('home-page').classList.remove('hidden');
            loadArticles();
            break;
        case 'settings':
            document.getElementById('settings-page').classList.remove('hidden');
            loadUserSettings();
            break;
        case 'seller-form':
            document.getElementById('seller-form-page').classList.remove('hidden');
            loadSellerForm();
            break;
        case 'notifications':
            document.getElementById('notifications-page').classList.remove('hidden');
            loadNotifications();
            break;
        case 'success':
            document.getElementById('success-page').classList.remove('hidden');
            break;
    }
}

function toggleProfileDropdown() {
    const dropdown = document.getElementById('profile-dropdown');
    dropdown.classList.toggle('hidden');
}

async function loadContent() {
    await loadArticles();
    await loadNotifications();
}

async function loadArticles(searchQuery = '') {
    try {
        const url = searchQuery ? `/api/articles/search?q=${encodeURIComponent(searchQuery)}` : '/api/articles';
        const response = await fetch(url, { credentials: 'include' });
        
        if (response.ok) {
            const data = await response.json();
            displayArticles(data.articles || []);
        } else {
            console.error('Failed to load articles');
        }
    } catch (error) {
        console.error('Error loading articles:', error);
    }
}

function displayArticles(articles) {
    const grid = document.getElementById('articles-grid');
    
    if (articles.length === 0) {
        grid.innerHTML = '<div class="col-span-2 text-center py-8 text-gray-500">Nessun articolo trovato</div>';
        return;
    }
    
    grid.innerHTML = articles.map(article => `
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:shadow-md transition-shadow" onclick="viewArticle('${article.id}')">
            <img 
                src="${article.image || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300'}"
                alt="${article.title}"
                class="w-full h-32 object-cover"
            />
            <div class="p-3">
                <h3 class="font-medium text-gray-800 text-sm mb-1 line-clamp-2">${article.title}</h3>
                <p class="text-orange-500 font-semibold text-sm mb-2">€${article.price}</p>
                <div class="flex items-center justify-between">
                    <div class="flex">
                        ${generateStars(article.rating || 0)}
                    </div>
                    <span class="text-xs text-gray-500">(${article.views || 0})</span>
                </div>
            </div>
        </div>
    `).join('');
}

function generateStars(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        const filled = i <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300';
        stars += `<svg class="w-3 h-3 ${filled}" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>`;
    }
    return stars;
}

async function viewArticle(articleId) {
    try {
        const response = await fetch(`/api/articles/${articleId}`, { credentials: 'include' });
        if (response.ok) {
            const data = await response.json();
            console.log('Article viewed:', data.article);
            // TODO: Show article detail modal or navigate to detail page
        }
    } catch (error) {
        console.error('Error viewing article:', error);
    }
}

function handleSearch(event) {
    const query = event.target.value;
    loadArticles(query);
}

async function loadNotifications() {
    try {
        const response = await fetch('/api/notifications', { credentials: 'include' });
        
        if (response.ok) {
            const data = await response.json();
            const notifications = data.notifications || [];
            updateNotificationBadge(notifications);
            if (currentPage === 'notifications') {
                displayNotifications(notifications);
            }
        }
    } catch (error) {
        console.error('Error loading notifications:', error);
    }
}

function updateNotificationBadge(notifications) {
    const unreadCount = notifications.filter(n => !n.isRead).length;
    const badge = document.getElementById('notification-badge');
    
    if (unreadCount > 0) {
        badge.textContent = unreadCount > 9 ? '9+' : unreadCount;
        badge.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
    }
}

function displayNotifications(notifications) {
    const list = document.getElementById('notifications-list');
    const noNotifications = document.getElementById('no-notifications');
    const markAllBtn = document.getElementById('mark-all-read-btn');
    
    if (notifications.length === 0) {
        noNotifications.classList.remove('hidden');
        markAllBtn.classList.add('hidden');
        return;
    }
    
    noNotifications.classList.add('hidden');
    
    const unreadCount = notifications.filter(n => !n.isRead).length;
    if (unreadCount > 0) {
        markAllBtn.classList.remove('hidden');
    } else {
        markAllBtn.classList.add('hidden');
    }
    
    list.innerHTML = notifications.map(notification => `
        <div class="bg-white border border-gray-100 rounded-xl p-4 shadow-sm cursor-pointer hover:bg-gray-50 transition-colors ${!notification.isRead ? 'border-l-4 border-l-blue-500' : ''}" onclick="markNotificationAsRead('${notification.id}')">
            <div class="flex items-start">
                ${!notification.isRead ? '<div class="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>' : ''}
                <div class="flex-1">
                    <h3 class="font-medium text-gray-800 mb-1 ${!notification.isRead ? 'font-semibold' : ''}">${notification.title}</h3>
                    <p class="text-gray-600 text-sm mb-2">${notification.message}</p>
                    <span class="text-xs text-gray-400">${formatTimeAgo(notification.createdAt)}</span>
                </div>
            </div>
        </div>
    `).join('');
}

function formatTimeAgo(date) {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffInHours = Math.floor((now.getTime() - notificationDate.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
        return "Ora";
    } else if (diffInHours < 24) {
        return `${diffInHours} ore fa`;
    } else {
        const diffInDays = Math.floor(diffInHours / 24);
        return `${diffInDays} giorni fa`;
    }
}

async function markNotificationAsRead(notificationId) {
    try {
        await fetch(`/api/notifications/${notificationId}/read`, {
            method: 'PATCH',
            credentials: 'include'
        });
        await loadNotifications();
    } catch (error) {
        console.error('Error marking notification as read:', error);
    }
}

async function markAllNotificationsAsRead() {
    try {
        await fetch('/api/notifications/read-all', {
            method: 'PATCH',
            credentials: 'include'
        });
        await loadNotifications();
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
    }
}

async function loadUserSettings() {
    if (!currentUser) return;
    
    document.getElementById('bio-input').value = currentUser.bio || '';
    document.getElementById('review-channel-input').value = currentUser.reviewChannel || '';
}

async function handleSaveSettings() {
    const bio = document.getElementById('bio-input').value;
    const reviewChannel = document.getElementById('review-channel-input').value;
    
    try {
        const response = await fetch('/api/auth/profile', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ bio, reviewChannel })
        });
        
        if (response.ok) {
            const data = await response.json();
            currentUser = data.user;
            showAlert('Impostazioni salvate con successo');
        } else {
            const error = await response.json();
            showAlert(error.message || 'Errore nel salvataggio');
        }
    } catch (error) {
        console.error('Error saving settings:', error);
        showAlert('Errore di connessione');
    }
}

function loadSellerForm() {
    if (!currentUser) return;
    
    document.getElementById('seller-username').value = currentUser.username || '';
    document.getElementById('seller-review-channel').value = currentUser.reviewChannel || '';
}

async function handleSellerRequest(event) {
    event.preventDefault();
    
    const description = document.getElementById('seller-description').value;
    const reviewChannel = document.getElementById('seller-review-channel').value;
    const acceptedTerms = document.getElementById('terms-checkbox').checked;
    
    if (!description.trim()) {
        showAlert('La descrizione è obbligatoria');
        return;
    }
    
    if (!acceptedTerms) {
        showAlert('Devi accettare i termini di servizio');
        return;
    }
    
    // Show loading for 1 second
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Invio in corso...';
    submitBtn.disabled = true;
    
    try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const response = await fetch('/api/seller/request', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ description, reviewChannel })
        });
        
        if (response.ok) {
            showPage('success');
        } else {
            const error = await response.json();
            showAlert(error.message || 'Errore nell\'invio della richiesta');
        }
    } catch (error) {
        console.error('Error submitting seller request:', error);
        showAlert('Errore di connessione');
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

function showAlert(message) {
    if (tg && tg.showAlert) {
        tg.showAlert(message);
    } else {
        alert(message);
    }
}

function showError(message) {
    console.error(message);
    showAlert(message);
}
