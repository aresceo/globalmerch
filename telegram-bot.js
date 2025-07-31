const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');

// Configurazione del bot
const BOT_TOKEN = '8242478903:AAErEamLTLdnHU-03Jtcb7ISnzNqHiZwugI';
const MINI_APP_URL = 'https://globalmerch.vercel.app/';
const ADMIN_TELEGRAM_ID = '7839114402';

// Percorso del file database JSON
const DATABASE_FILE = path.join(__dirname, 'database.json');

// Inizializza il database
let database = {
  users: [],
  articles: [
    {
      id: '1',
      title: 'Smartphone Pro',
      description: 'Latest smartphone with advanced features',
      price: 299,
      image: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300',
      sellerId: 'seller1',
      views: 234,
      rating: 5,
      createdAt: new Date().toISOString()
    },
    {
      id: '2',
      title: 'T-Shirt Premium',
      description: 'High quality cotton t-shirt',
      price: 29,
      image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300',
      sellerId: 'seller1',
      views: 156,
      rating: 4,
      createdAt: new Date().toISOString()
    },
    {
      id: '3',
      title: 'Lampada Design',
      description: 'Modern design lamp for home decoration',
      price: 89,
      image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300',
      sellerId: 'seller1',
      views: 89,
      rating: 5,
      createdAt: new Date().toISOString()
    },
    {
      id: '4',
      title: 'Scarpe Running',
      description: 'Professional running shoes',
      price: 129,
      image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300',
      sellerId: 'seller1',
      views: 201,
      rating: 4,
      createdAt: new Date().toISOString()
    }
  ],
  sellerRequests: [],
  notifications: []
};

// Carica il database se esiste
function loadDatabase() {
  try {
    if (fs.existsSync(DATABASE_FILE)) {
      const data = fs.readFileSync(DATABASE_FILE, 'utf8');
      database = JSON.parse(data);
      console.log('Database caricato dal file JSON');
    } else {
      saveDatabase();
      console.log('Nuovo database creato');
    }
  } catch (error) {
    console.error('Errore nel caricamento del database:', error);
  }
}

// Salva il database
function saveDatabase() {
  try {
    fs.writeFileSync(DATABASE_FILE, JSON.stringify(database, null, 2));
  } catch (error) {
    console.error('Errore nel salvataggio del database:', error);
  }
}

// Genera un ID univoco
function generateId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

// Crea il bot
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// Messaggio di benvenuto
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const username = msg.from?.username || 'utente';

  const options = {
    reply_markup: {
      inline_keyboard: [[
        {
          text: 'Apri MiniApp',
          web_app: { url: MINI_APP_URL }
        }
      ]]
    }
  };

  bot.sendMessage(
    chatId, 
    `Benvenuto nel bot, @${username}!\n\nApri la miniapp per iniziare a esplorare i prodotti.`, 
    options
  );
});

// Gestione dei callback delle richieste venditore
bot.on('callback_query', async (callbackQuery) => {
  const action = callbackQuery.data;
  const chatId = callbackQuery.message?.chat.id;
  const messageId = callbackQuery.message?.message_id;

  if (!action || !chatId || !messageId) return;

  if (action.startsWith('approve_seller_')) {
    const requestId = action.replace('approve_seller_', '');
    
    try {
      // Trova la richiesta
      const requestIndex = database.sellerRequests.findIndex(r => r.id === requestId);
      if (requestIndex === -1) {
        bot.answerCallbackQuery(callbackQuery.id, { text: 'Richiesta non trovata' });
        return;
      }

      const request = database.sellerRequests[requestIndex];
      request.status = 'approved';

      // Aggiorna l'utente come venditore
      const userIndex = database.users.findIndex(u => u.id === request.userId);
      if (userIndex !== -1) {
        database.users[userIndex].isSeller = true;
      }

      // Crea notifica per l'utente
      const notification = {
        id: generateId(),
        userId: request.userId,
        title: 'Richiesta Approvata ✅',
        message: 'La tua richiesta per diventare venditore è stata approvata! Puoi ora iniziare a vendere i tuoi prodotti.',
        isRead: false,
        createdAt: new Date().toISOString()
      };
      database.notifications.push(notification);

      // Salva nel database
      saveDatabase();

      // Invia notifica Telegram all'utente
      const user = database.users[userIndex];
      if (user) {
        bot.sendMessage(
          user.telegramId, 
          '🎉 La tua richiesta per diventare venditore è stata approvata!\n\nHai una notifica non letta, apri la mini app per leggerla.'
        );
      }

      bot.editMessageText('✅ Richiesta approvata con successo!', {
        chat_id: chatId,
        message_id: messageId
      });
    } catch (error) {
      console.error('Errore nell\'approvazione della richiesta:', error);
      bot.answerCallbackQuery(callbackQuery.id, { text: 'Errore nell\'approvazione della richiesta' });
    }
  } else if (action.startsWith('reject_seller_')) {
    const requestId = action.replace('reject_seller_', '');
    
    try {
      // Trova la richiesta
      const requestIndex = database.sellerRequests.findIndex(r => r.id === requestId);
      if (requestIndex === -1) {
        bot.answerCallbackQuery(callbackQuery.id, { text: 'Richiesta non trovata' });
        return;
      }

      const request = database.sellerRequests[requestIndex];
      request.status = 'rejected';

      // Crea notifica per l'utente
      const notification = {
        id: generateId(),
        userId: request.userId,
        title: 'Richiesta Rifiutata ❌',
        message: 'La tua richiesta per diventare venditore è stata rifiutata. Puoi riprovare in futuro.',
        isRead: false,
        createdAt: new Date().toISOString()
      };
      database.notifications.push(notification);

      // Salva nel database
      saveDatabase();

      // Invia notifica Telegram all'utente
      const user = database.users.find(u => u.id === request.userId);
      if (user) {
        bot.sendMessage(
          user.telegramId, 
          '❌ La tua richiesta per diventare venditore è stata rifiutata.\n\nHai una notifica non letta, apri la mini app per leggerla.'
        );
      }

      bot.editMessageText('❌ Richiesta rifiutata.', {
        chat_id: chatId,
        message_id: messageId
      });
    } catch (error) {
      console.error('Errore nel rifiuto della richiesta:', error);
      bot.answerCallbackQuery(callbackQuery.id, { text: 'Errore nel rifiuto della richiesta' });
    }
  }

  bot.answerCallbackQuery(callbackQuery.id);
});

// Funzione per inviare richiesta venditore all'admin
function sendSellerRequestToAdmin(request, user) {
  const message = `❗ NUOVA RICHIESTA VENDITORE:\n\n` +
    `👤 Username: ${user.username}\n` +
    `📝 Descrizione: ${request.description}\n` +
    `📢 Canale Feedback: ${request.reviewChannel || 'Non specificato'}\n` +
    `🕒 Data: ${new Date(request.createdAt).toLocaleString('it-IT')}`;

  const options = {
    reply_markup: {
      inline_keyboard: [[
        {
          text: '✅ Accetta',
          callback_data: `approve_seller_${request.id}`
        },
        {
          text: '❌ Rifiuta',
          callback_data: `reject_seller_${request.id}`
        }
      ]]
    }
  };

  bot.sendMessage(ADMIN_TELEGRAM_ID, message, options)
    .catch(error => {
      console.error('Errore nell\'invio della richiesta all\'admin:', error);
    });
}

// Funzione per inviare notifica generica all'utente
function sendNotificationToUser(telegramId, message) {
  bot.sendMessage(telegramId, message)
    .catch(error => {
      console.error('Errore nell\'invio della notifica all\'utente:', error);
    });
}

// API functions per integrare con il server web
const api = {
  // User operations
  getUserByTelegramId: (telegramId) => {
    return database.users.find(user => user.telegramId === telegramId);
  },

  createUser: (userData) => {
    const user = {
      id: generateId(),
      ...userData,
      isSeller: false,
      createdAt: new Date().toISOString()
    };
    database.users.push(user);
    saveDatabase();
    return user;
  },

  updateUser: (id, updates) => {
    const userIndex = database.users.findIndex(user => user.id === id);
    if (userIndex === -1) return null;
    
    database.users[userIndex] = { ...database.users[userIndex], ...updates };
    saveDatabase();
    return database.users[userIndex];
  },

  // Article operations
  getAllArticles: () => {
    return database.articles.sort((a, b) => b.views - a.views);
  },

  searchArticles: (query) => {
    const lowerQuery = query.toLowerCase();
    return database.articles.filter(article => 
      article.title.toLowerCase().includes(lowerQuery) ||
      article.description?.toLowerCase().includes(lowerQuery)
    );
  },

  getArticle: (id) => {
    return database.articles.find(article => article.id === id);
  },

  updateArticleViews: (id) => {
    const articleIndex = database.articles.findIndex(article => article.id === id);
    if (articleIndex !== -1) {
      database.articles[articleIndex].views = (database.articles[articleIndex].views || 0) + 1;
      saveDatabase();
    }
  },

  // Seller request operations
  createSellerRequest: (requestData) => {
    const request = {
      id: generateId(),
      ...requestData,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    database.sellerRequests.push(request);
    saveDatabase();

    // Invia notifica all'admin
    const user = database.users.find(u => u.id === requestData.userId);
    if (user) {
      sendSellerRequestToAdmin(request, user);
    }

    return request;
  },

  // Notification operations
  createNotification: (notificationData) => {
    const notification = {
      id: generateId(),
      ...notificationData,
      isRead: false,
      createdAt: new Date().toISOString()
    };
    database.notifications.push(notification);
    saveDatabase();
    return notification;
  },

  getUserNotifications: (userId) => {
    return database.notifications
      .filter(notification => notification.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  markNotificationAsRead: (id) => {
    const notificationIndex = database.notifications.findIndex(n => n.id === id);
    if (notificationIndex !== -1) {
      database.notifications[notificationIndex].isRead = true;
      saveDatabase();
    }
  },

  markAllNotificationsAsRead: (userId) => {
    const userNotifications = database.notifications.filter(n => n.userId === userId);
    userNotifications.forEach(notification => {
      notification.isRead = true;
    });
    saveDatabase();
  }
};

// Inizializza il database
loadDatabase();

console.log('Telegram bot avviato con successo');
console.log(`Database salvato in: ${DATABASE_FILE}`);

// Esporta le funzioni API per l'uso con il server web
module.exports = {
  bot,
  api,
  sendSellerRequestToAdmin,
  sendNotificationToUser
};
