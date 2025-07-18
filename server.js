// Import necessary libraries
import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import { setupDatabase } from './database.js';

// --- Setup ---
const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });
const PORT = process.env.PORT || 3000;
const db = await setupDatabase();

// --- Path Configuration ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Middleware ---
// Serve static files (HTML, CSS, client.js) from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// --- API Endpoint: Get Chat History ---
app.get('/chats/:animeId', async (req, res) => {
    const { animeId } = req.params;
    // Ensure the anime entry exists in the database before trying to read it
    if (!db.data.chats[animeId]) {
        db.data.chats[animeId] = [];
        await db.write();
    }
    res.json(db.data.chats[animeId]);
});

// --- WebSocket Logic ---
wss.on('connection', (ws) => {
    console.log('Client connected');

    // Handle incoming messages from a client
    ws.on('message', async (message) => {
        try {
            const parsedMessage = JSON.parse(message);
            const { animeId, text } = parsedMessage;

            if (!animeId || !text) return;
            
            const newMessage = { user: 'User', text, timestamp: new Date().toISOString() };

            // Save the new message to the database
            db.data.chats[animeId].push(newMessage);
            await db.write();

            // Broadcast the new message to ALL connected clients
            wss.clients.forEach((client) => {
                if (client.readyState === 1) { // 1 means WebSocket.OPEN
                    client.send(JSON.stringify({
                        type: 'newMessage',
                        animeId: animeId,
                        message: newMessage
                    }));
                }
            });
        } catch (error) {
            console.error('Failed to process message:', error);
        }
    });

    ws.on('close', () => console.log('Client disconnected'));
});

// --- Start Server ---
server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
