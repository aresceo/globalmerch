class GlobalMerchApp {
    constructor() {
        this.currentUser = null;
        this.database = {
            users: [],
            articles: [],
            notifications: [],
            sellerRequests: []
        };
        this.init();
    }

    async init() {
        // Initialize Telegram WebApp
        if (window.Telegram && window.Telegram.WebApp) {
            window.Telegram.WebApp.ready();
            window.Telegram.WebApp.expand();
        }

        // Load database
        await this.loadDatabase();
        
        // Check if user is registered
        const telegramUser = this.getTelegramUser();
        if (telegramUser) {
            const existingUser = this.findUserById(telegramUser.id);
            if (existingUser) {
                this.currentUser = existingUser;
                this.showMainApp();
            } else {
                this.showRegistrationForm(telegramUser);
            }
        } else {
            // For testing without Telegram
            this.showRegistrationForm({ id: 'test_user', username: 'test_user' });
        }

        this.setupEventListeners();
        this.hideLoadingScreen();
    }

    getTelegramUser() {
        if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe.user) {
            return window.Telegram.WebApp.initDataUnsafe.user;
        }
        return null;
    }

    async loadDatabase() {
        try {
            const response = await fetch('/api/database');
            if (response.ok) {
                this.database = await response.json();
            }
        } catch (error) {
            console.log('Database not found, using default structure');
            this.initializeDefaultDatabase();
        }
    }

    initializeDefaultDatabase() {
        this.database = {
            users: [],
            articles: [
                {
                    id: 1,
                    title: "iPhone 15 Pro",
                    description: "Nuovo iPhone 15 Pro 256GB, colore Titanio Naturale",
                    price: "€1,199",
                    image: "📱",
                    views: 150,
                    category: "Tecnologia",
                    date: new Date().toISOString()
                },
                {
                    id: 2,
                    title: "Nike Air Jordan",
                    description: "Scarpe Nike Air Jordan 1 High, taglia 42",
                    price: "€180",
                    image: "👟",
                    views: 89,
                    category: "Abbigliamento",
                    date: new Date().toISOString()
                },
                {
                    id: 3,
                    title: "MacBook Pro M3",
                    description: "MacBook Pro 14\" con chip M3, 16GB RAM, 512GB SSD",
                    price: "€2,299",
                    image: "💻",
                    views: 203,
                    category: "Tecnologia",
                    date: new Date().toISOString()
                },
                {
                    id: 4,
                    title: "Rolex Submariner",
                    description: "Rolex Submariner Date, acciaio inossidabile",
                    price: "€8,500",
                    image: "⌚",
                    views: 45,
                    category: "Orologi",
                    date: new Date().toISOString()
                }
            ],
            notifications: [],
            sellerRequests: []
        };
    }

    async saveDatabase() {
        try {
            await fetch('/api/database', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(this.database)
            });
        } catch (error) {
            console.error('Error saving database:', error);
        }
    }

    findUserById(id) {
        return this.database.users.find(user => user.telegramId === id);
    }

    hideLoadingScreen() {
        document.getElementById('loading-screen').classList.add('hidden');
    }

    showRegistrationForm(telegramUser) {
        const form = document.getElementById('registration-form');
        const usernameInput = document.getElementById('username');
        
        usernameInput.value = telegramUser.username || `user_${telegramUser.id}`;
        form.classList.remove('hidden');
    }

    showMainApp() {
        document.getElementById('main-app').classList.remove('hidden');
        this.loadArticles();
        this.updateNotificationBadge();
    }

    setupEventListeners() {
        // Registration form
        document.getElementById('reg-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegistration();
        });

        // Header icons
        document.getElementById('profile-btn').addEventListener('click', () => {
            this.toggleProfileMenu();
        });

        document.getElementById('seller-btn').addEventListener('click', () => {
            this.showSellerModal();
        });

        document.getElementById('notifications-btn').addEventListener('click', () => {
            this.showNotificationsModal();
        });

        // Settings
        document.getElementById('settings-btn').addEventListener('click', () => {
            this.showSettingsModal();
        });

        // Modal close buttons
        document.querySelectorAll('.close-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.closeModal(e.target.closest('.modal'));
            });
        });

        // Forms
        document.getElementById('settings-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSettingsUpdate();
        });

        document.getElementById('seller-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSellerRequest();
        });

        // Search
        document.getElementById('search-btn').addEventListener('click', () => {
            this.handleSearch();
        });

        document.getElementById('search-bar').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleSearch();
            }
        });

        // Click outside to close dropdowns
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.icon-container')) {
                document.getElementById('profile-menu').classList.add('hidden');
            }
        });
    }

    async handleRegistration() {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        const telegramUser = this.getTelegramUser() || { id: 'test_user' };
        
        const newUser = {
            telegramId: telegramUser.id,
            username: username,
            password: password, // In produzione, hashare la password
            bio: '',
            profilePic: '',
            telegramChannel: '',
            registrationDate: new Date().toISOString(),
            viewedArticles: [],
            preferences: {}
        };

        this.database.users.push(newUser);
        this.currentUser = newUser;
        
        await this.saveDatabase();
        
        document.getElementById('registration-form').classList.add('hidden');
        this.showMainApp();
    }

    loadArticles() {
        const container = document.getElementById('articles-container');
        container.innerHTML = '';

        // Sort articles by views and date
        const sortedArticles = [...this.database.articles].sort((a, b) => {
            return b.views - a.views || new Date(b.date) - new Date(a.date);
        });

        sortedArticles.forEach(article => {
            const articleElement = this.createArticleElement(article);
            container.appendChild(articleElement);
        });
    }

    createArticleElement(article) {
        const div = document.createElement('div');
        div.className = 'article-card';
        div.innerHTML = `
            <div class="article-image">${article.image}</div>
            <div class="article-content">
                <div class="article-title">${article.title}</div>
                <div class="article-description">${article.description}</div>
                <div class="article-price">${article.price}</div>
                <div class="article-meta">
                    <span>👁 ${article.views} visualizzazioni</span>
                    <span>${article.category}</span>
                </div>
            </div>
        `;

        div.addEventListener('click', () => {
            this.viewArticle(article.id);
        });

        return div;
    }

    viewArticle(articleId) {
        const article = this.database.articles.find(a => a.id === articleId);
        if (article) {
            article.views++;
            if (this.currentUser && !this.currentUser.viewedArticles.includes(articleId)) {
                this.currentUser.viewedArticles.push(articleId);
            }
            this.saveDatabase();
            // Here you could show article details or redirect
            console.log('Viewing article:', article.title);
        }
    }

    toggleProfileMenu() {
        const menu = document.getElementById('profile-menu');
        menu.classList.toggle('hidden');
    }

    showSettingsModal() {
        const modal = document.getElementById('settings-modal');
        
        // Pre-fill current user data
        if (this.currentUser) {
            document.getElementById('bio').value = this.currentUser.bio || '';
            document.getElementById('telegram-channel').value = this.currentUser.telegramChannel || '';
        }
        
        modal.classList.remove('hidden');
        document.getElementById('profile-menu').classList.add('hidden');
    }

    showSellerModal() {
        const modal = document.getElementById('seller-modal');
        
        // Pre-fill username and channel
        if (this.currentUser) {
            document.getElementById('seller-username').value = this.currentUser.username;
            document.getElementById('feedback-channel').value = this.currentUser.telegramChannel || '';
        }
        
        modal.classList.remove('hidden');
    }

    showNotificationsModal() {
        const modal = document.getElementById('notifications-modal');
        this.loadNotifications();
        modal.classList.remove('hidden');
        this.markNotificationsAsRead();
    }

    loadNotifications() {
        const container = document.getElementById('notifications-list');
        const userNotifications = this.database.notifications.filter(
            n => n.userId === this.currentUser.telegramId
        );

        if (userNotifications.length === 0) {
            container.innerHTML = '<div class="no-notifications">Nessuna notifica recente</div>';
            return;
        }

        container.innerHTML = '';
        userNotifications.forEach(notification => {
            const div = document.createElement('div');
            div.className = 'notification-item';
            div.innerHTML = `
                <div class="notification-title">${notification.title}</div>
                <div class="notification-message">${notification.message}</div>
                <div class="notification-time">${this.formatDate(notification.date)}</div>
            `;
            container.appendChild(div);
        });
    }

    markNotificationsAsRead() {
        this.database.notifications.forEach(notification => {
            if (notification.userId === this.currentUser.telegramId) {
                notification.read = true;
            }
        });
        this.updateNotificationBadge();
        this.saveDatabase();
    }

    updateNotificationBadge() {
        const badge = document.getElementById('notification-badge');
        const unreadCount = this.database.notifications.filter(
            n => n.userId === this.currentUser.telegramId && !n.read
        ).length;

        if (unreadCount > 0) {
            badge.textContent = unreadCount;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    }

    async handleSettingsUpdate() {
        const bio = document.getElementById('bio').value;
        const telegramChannel = document.getElementById('telegram-channel').value;
        const profilePicFile = document.getElementById('profile-pic').files[0];

        if (this.currentUser) {
            this.currentUser.bio = bio;
            this.currentUser.telegramChannel = telegramChannel;
            
            if (profilePicFile) {
                // In a real app, you'd upload the file and store the URL
                this.currentUser.profilePic = `profile_${Date.now()}.jpg`;
            }

            await this.saveDatabase();
            this.closeModal(document.getElementById('settings-modal'));
            
            // Add success notification
            this.addNotification('Impostazioni aggiornate', 'Le tue impostazioni sono state salvate con successo.');
        }
    }

    async handleSellerRequest() {
        const whatSell = document.getElementById('what-sell').value;
        const feedbackChannel = document.getElementById('feedback-channel').value;
        const termsAccepted = document.getElementById('terms-accept').checked;

        if (!termsAccepted) {
            alert('Devi accettare i termini di servizio');
            return;
        }

        const request = {
            id: Date.now(),
            userId: this.currentUser.telegramId,
            username: this.currentUser.username,
            whatSell: whatSell,
            feedbackChannel: feedbackChannel,
            date: new Date().toISOString(),
            status: 'pending'
        };

        this.database.sellerRequests.push(request);
        await this.saveDatabase();

        // Send notification to admin (ID: 7839114402)
        await this.sendAdminNotification(request);

        this.closeModal(document.getElementById('seller-modal'));
        this.showSellerSuccess();
    }

    async sendAdminNotification(request) {
        try {
            // This would send a message to the Telegram bot
            const message = `❗NUOVA RICHIESTA:\nUsername: ${request.username}\nCosa vende: ${request.whatSell}\nCanale feedback: ${request.feedbackChannel}`;
            
            await fetch('/api/notify-admin', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    adminId: '7839114402',
                    message: message
                })
            });
        } catch (error) {
            console.error('Error sending admin notification:', error);
        }
    }

    showSellerSuccess() {
        const modal = document.getElementById('seller-success');
        modal.classList.remove('hidden');
        
        // Auto close after 3 seconds
        setTimeout(() => {
            this.closeModal(modal);
        }, 3000);
    }

    handleSearch() {
        const searchTerm = document.getElementById('search-bar').value.toLowerCase().trim();
        
        if (!searchTerm) {
            this.loadArticles();
            return;
        }

        const filteredArticles = this.database.articles.filter(article => 
            article.title.toLowerCase().includes(searchTerm) ||
            article.description.toLowerCase().includes(searchTerm) ||
            article.category.toLowerCase().includes(searchTerm)
        );

        const container = document.getElementById('articles-container');
        container.innerHTML = '';

        if (filteredArticles.length === 0) {
            container.innerHTML = '<div class="no-notifications">Nessun articolo trovato</div>';
            return;
        }

        filteredArticles.forEach(article => {
            const articleElement = this.createArticleElement(article);
            container.appendChild(articleElement);
        });
    }

    addNotification(title, message) {
        const notification = {
            id: Date.now(),
            userId: this.currentUser.telegramId,
            title: title,
            message: message,
            date: new Date().toISOString(),
            read: false
        };

        this.database.notifications.push(notification);
        this.updateNotificationBadge();
        this.saveDatabase();
    }

    closeModal(modal) {
        modal.classList.add('hidden');
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('it-IT') + ' ' + date.toLocaleTimeString('it-IT', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new GlobalMerchApp();
});
