// src/app.js
const express = require('express');
const apiRoutes = require('./routes/api.routes');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware to parse JSON bodies
app.use(express.json());

// Mount the API routes
app.use('/api/v1', apiRoutes);

// Simple health check route
app.get('/', (req, res) => {
    res.send('Bank Lending System API is running!');
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});