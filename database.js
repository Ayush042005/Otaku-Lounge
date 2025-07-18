import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import path from 'path';
import { fileURLToPath } from 'url';

// Helper to get directory name in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function setupDatabase() {
    const file = path.join(__dirname, 'db.json');
    const adapter = new JSONFile(file);
    // Set a default structure for our database if the file is empty
    const defaultData = { chats: {} };
    const db = new Low(adapter, defaultData);

    await db.read(); // Read data from db.json
    await db.write(); // Write if file was missing

    console.log('Database connected.');
    return db;
}
