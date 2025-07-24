// src/services/database.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../../database/bank.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        createTables();
    }
});

const createTables = () => {
    const sql = `
    CREATE TABLE IF NOT EXISTS Customers (
        customer_id TEXT PRIMARY KEY,
        name TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS Loans (
        loan_id TEXT PRIMARY KEY,
        customer_id TEXT NOT NULL,
        principal_amount REAL NOT NULL,
        total_amount REAL NOT NULL,
        interest_rate REAL NOT NULL,
        loan_period_years INTEGER NOT NULL,
        monthly_emi REAL NOT NULL,
        status TEXT DEFAULT 'ACTIVE',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES Customers (customer_id)
    );

    CREATE TABLE IF NOT EXISTS Payments (
        payment_id TEXT PRIMARY KEY,
        loan_id TEXT NOT NULL,
        amount REAL NOT NULL,
        payment_type TEXT CHECK(payment_type IN ('EMI', 'LUMP_SUM')),
        payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (loan_id) REFERENCES Loans (loan_id)
    );`;

    db.exec(sql, (err) => {
        if (err) {
            console.error('Error creating tables:', err.message);
        }
    });
};

module.exports = db;