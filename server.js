const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;
const DATABASE_FILE = path.join(__dirname, 'database.json');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Initialize database if it doesn't exist
async function initializeDatabase() {
    try {
        await fs.access(DATABASE_FILE);
    } catch (error) {
        const defaultDatabase = {
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
        
        await fs.writeFile(DATABASE_FILE, JSON.stringify(defaultDatabase, null, 2));
        console.log('Database initialized with default data');
    }
}

// Get database
app.get('/api/database', async (req, res) => {
    try {
        const data = await fs.readFile(DATABASE_FILE, 'utf8');
        res.json(JSON.parse(data));
    } catch (error) {
        console.error('Error reading database:', error);
        res.status(500).json({ error: 'Failed to read database' });
    }
});

// Save database
app.post('/api/database', async (req, res) => {
    try {
        await fs.writeFile(DATABASE_FILE, JSON.stringify(req.body, null, 2));
        res.json({ success: true });
    } catch (error) {
        console.error('Error saving database:', error);
        res.status(500).json({ error: 'Failed to save database' });
    }
});

// Notify admin (integrate with Telegram bot)
app.post('/api/notify-admin', async (req, res) => {
    try {
        const { adminId, message } = req.body;
        
        // Here you would integrate with your Telegram bot
        // For now, we'll just log it and save to a notifications file
        console.log(`Admin notification for ${adminId}: ${message}`);
        
        // You can also send this to your Telegram bot
        // await sendTelegramMessage(adminId, message);
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error sending admin notification:', error);
        res.status(500).json({ error: 'Failed to send notification' });
    }
});

// Update seller request status
app.post('/api/update-seller-request', async (req, res) => {
    try {
        const { requestId, status } = req.body;
        const data = await fs.readFile(DATABASE_FILE, 'utf8');
        const database = JSON.parse(data);
        
        // Trova e aggiorna la richiesta
        const request = database.sellerRequests.find(r => r.id == requestId);
        if (request) {
            request.status = status;
            await fs.writeFile(DATABASE_FILE, JSON.stringify(database, null, 2));
            res.json({ success: true });
        } else {
            res.status(404).json({ error: 'Request not found' });
        }
    } catch (error) {
        console.error('Error updating seller request:', error);
        res.status(500).json({ error: 'Failed to update request' });
    }
});

// Add notification
app.post('/api/add-notification', async (req, res) => {
    try {
        const { userId, title, message } = req.body;
        const data = await fs.readFile(DATABASE_FILE, 'utf8');
        const database = JSON.parse(data);
        
        const notification = {
            id: Date.now(),
            userId: userId,
            title: title,
            message: message,
            date: new Date().toISOString(),
            read: false
        };
        
        database.notifications.push(notification);
        await fs.writeFile(DATABASE_FILE, JSON.stringify(database, null, 2));
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error adding notification:', error);
        res.status(500).json({ error: 'Failed to add notification' });
    }
});

// Send seller request to Telegram bot
app.post('/api/send-seller-request', async (req, res) => {
    try {
        const requestData = req.body;
        
        // In un'implementazione reale, qui invieresti i dati al bot Telegram
        // Per ora loggiamo e simuliamo l'invio
        console.log('Sending seller request to Telegram bot:', requestData);
        
        // Simula l'invio al bot (in produzione useresti webhook o chiamate dirette)
        // await sendToTelegramBot(requestData);
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error sending seller request to bot:', error);
        res.status(500).json({ error: 'Failed to send request to bot' });
    }
});

// Serve the main app
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
async function startServer() {
    await initializeDatabase();
    
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running on port ${PORT}`);
        console.log(`Web app available at: http://localhost:${PORT}`);
    });
}

startServer().catch(console.error);
