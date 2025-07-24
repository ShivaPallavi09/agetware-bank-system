// src/routes/api.routes.js
const express = require('express');
const router = express.Router();
const loanController = require('../controllers/loan.controller');

// Base URL: /api/v1

// 1. LEND
router.post('/loans', loanController.createLoan);

// 2. PAYMENT
router.post('/loans/:loan_id/payments', loanController.recordPayment);

// 3. LEDGER
router.get('/loans/:loan_id/ledger', loanController.getLedger);

// 4. ACCOUNT OVERVIEW
router.get('/customers/:customer_id/overview', loanController.getAccountOverview);

module.exports = router;