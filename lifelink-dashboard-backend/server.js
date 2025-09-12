// server.js (Final version serving frontend files)

const express = require('express');
const mysql = require('mysql2/promise');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Parser } = require('json2csv');
const dotenv = require('dotenv');
dotenv.config();

const app = express();
const PORT = 3000;

// --- Middleware ---
app.use(cors());
app.use(bodyParser.json());

// NEW: Serve all frontend files from the 'public' folder
app.use(express.static('public'));

// --- Database Connection ---
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: process.env.DB_PORT,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// --- API Routes (Endpoints) ---

// POST: Receives a new alert from the Android app
app.post('/api/alert', async (req, res) => {
    try {
        const { name, age, phone, bloodGroup, phoneBattery, location, message, currentMedicalIssue, priority } = req.body;
        const { latitude, longitude } = location;

        const sql = `INSERT INTO alerts (name, age, phone, bloodGroup, phoneBattery, latitude, longitude, message, currentMedicalIssue, priority) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        
        const [result] = await pool.execute(sql, [name, age, phone, bloodGroup, phoneBattery, latitude, longitude, message, currentMedicalIssue, priority || 'Medium']);
        
        res.status(201).send({ message: 'Alert received successfully!', insertedId: result.insertId });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).send({ message: 'Error receiving alert', error: error });
    }
});

// GET: Sends all alerts to the dashboard
app.get('/api/alerts', async (req, res) => {
    try {
        const sql = `SELECT id as _id, name, age, phone, bloodGroup, phoneBattery, latitude, longitude, message, status, timestamp, 
                     currentMedicalIssue as currentmedicalissue, priority, notes, solvedTimestamp 
                     FROM alerts ORDER BY timestamp DESC`;
        
        const [rows] = await pool.query(sql);
        
        const alerts = rows.map(alert => ({
            ...alert,
            location: {
                latitude: alert.latitude,
                longitude: alert.longitude
            }
        }));

        res.status(200).send(alerts);
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).send({ message: 'Error fetching alerts', error: error });
    }
});

// PUT: Updates the status of an alert
app.put('/api/alert/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        let sql = `UPDATE alerts SET status = ? WHERE id = ?`;
        
        if (status === 'Solved') {
            sql = `UPDATE alerts SET status = ?, solvedTimestamp = NOW() WHERE id = ? AND solvedTimestamp IS NULL`;
        }
        
        const [result] = await pool.execute(sql, [status, id]);
        if (result.affectedRows === 0 && status === 'Solved') {
            await pool.execute(`UPDATE alerts SET status = ? WHERE id = ?`, [status, id]);
        }
        res.status(200).send({ message: 'Status updated!' });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).send({ message: 'Error updating status', error: error });
    }
});

// PUT: Update priority for an alert
app.put('/api/alert/priority/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { priority } = req.body;
        const sql = `UPDATE alerts SET priority = ? WHERE id = ?`;
        await pool.execute(sql, [priority, id]);
        res.status(200).send({ message: 'Priority updated!' });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).send({ message: 'Error updating priority', error: error });
    }
});

// PUT: Update notes for an alert
app.put('/api/alert/notes/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { notes } = req.body;
        const sql = `UPDATE alerts SET notes = ? WHERE id = ?`;
        await pool.execute(sql, [notes, id]);
        res.status(200).send({ message: 'Notes updated!' });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).send({ message: 'Error updating notes', error: error });
    }
});

// --- Analytics & Reporting Routes ---

// GET: All locations for the heatmap
app.get('/api/analytics/locations', async (req, res) => {
    try {
        const [rows] = await pool.query(`SELECT latitude, longitude FROM alerts`);
        res.status(200).send(rows);
    } catch (error) {
        res.status(500).send({ message: 'Error fetching locations', error });
    }
});

// GET: Response time calculations
app.get('/api/analytics/responsetimes', async (req, res) => {
    try {
        const sql = `SELECT TIMESTAMPDIFF(SECOND, timestamp, solvedTimestamp) as duration FROM alerts WHERE status = 'Solved' AND solvedTimestamp IS NOT NULL`;
        const [rows] = await pool.query(sql);
        
        if (rows.length === 0) {
            return res.status(200).send({ avg: 0, min: 0, max: 0 });
        }

        const durations = rows.map(r => r.duration);
        const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
        const min = Math.min(...durations);
        const max = Math.max(...durations);

        res.status(200).send({ avg, min, max });
    } catch (error) {
        res.status(500).send({ message: 'Error calculating response times', error });
    }
});

// GET: Export all data as CSV
app.get('/api/export/csv', async (req, res) => {
    try {
        const [rows] = await pool.query(`SELECT * FROM alerts`);
        const json2csvParser = new Parser();
        const csv = json2csvParser.parse(rows);

        res.header('Content-Type', 'text/csv');
        res.attachment('lifelink-report.csv');
        res.send(csv);
    } catch (error) {
        res.status(500).send({ message: 'Error exporting data', error });
    }
});

// --- Start the Server ---
app.listen(PORT, () => {
    console.log(`LifeLink server running on http://localhost:${PORT}`);
});