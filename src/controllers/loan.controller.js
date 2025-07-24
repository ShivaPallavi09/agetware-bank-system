// src/controllers/loan.controller.js
const db = require('../services/database');
const { v4: uuidv4 } = require('uuid');

// Helper to run DB queries with Promises for cleaner async/await syntax
const dbRun = (sql, params = []) => new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve(this);
    });
});

const dbGet = (sql, params = []) => new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
    });
});

const dbAll = (sql, params = []) => new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
    });
});


// 1. LEND: Create a new loan
exports.createLoan = async (req, res) => {
    const { customer_id, loan_amount, loan_period_years, interest_rate_yearly } = req.body;

    if (!customer_id || !loan_amount || !loan_period_years || !interest_rate_yearly) {
        return res.status(400).json({ error: 'Missing required fields.' });
    }

    // Assumption: Customer must exist. Let's create one if not found for simplicity.
    let customer = await dbGet('SELECT * FROM Customers WHERE customer_id = ?', [customer_id]);
    if (!customer) {
        await dbRun('INSERT INTO Customers (customer_id, name) VALUES (?, ?)', [customer_id, `Customer ${customer_id}`]);
    }

    const P = parseFloat(loan_amount);
    const N = parseFloat(loan_period_years);
    const R = parseFloat(interest_rate_yearly);

    const totalInterest = P * N * (R / 100);
    const totalAmountPayable = P + totalInterest;
    const monthlyEMI = totalAmountPayable / (N * 12);
    const loan_id = uuidv4();

    const sql = `INSERT INTO Loans (loan_id, customer_id, principal_amount, total_amount, interest_rate, loan_period_years, monthly_emi)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`;
    await dbRun(sql, [loan_id, customer_id, P, totalAmountPayable, R, N, monthlyEMI]);

    res.status(201).json({
        loan_id: loan_id,
        customer_id: customer_id,
        total_amount_payable: totalAmountPayable,
        monthly_emi: monthlyEMI
    });
};

// 2. PAYMENT: Record a payment
exports.recordPayment = async (req, res) => {
    const { loan_id } = req.params;
    const { amount, payment_type } = req.body;

    const loan = await dbGet('SELECT * FROM Loans WHERE loan_id = ?', [loan_id]);
    if (!loan) return res.status(404).json({ error: 'Loan not found.' });

    const payment_id = uuidv4();
    await dbRun('INSERT INTO Payments (payment_id, loan_id, amount, payment_type) VALUES (?, ?, ?, ?)', [payment_id, loan_id, amount, payment_type]);

    const payments = await dbAll('SELECT SUM(amount) AS total_paid FROM Payments WHERE loan_id = ?', [loan_id]);
    const amountPaid = payments[0].total_paid || 0;
    const remainingBalance = loan.total_amount - amountPaid;
    const emisLeft = Math.ceil(remainingBalance / loan.monthly_emi);

    if (remainingBalance <= 0) {
        await dbRun("UPDATE Loans SET status = 'PAID_OFF' WHERE loan_id = ?", [loan_id]);
    }
    
    res.status(200).json({
        payment_id,
        loan_id,
        message: 'Payment recorded successfully.',
        remaining_balance: remainingBalance,
        emis_left: emisLeft > 0 ? emisLeft : 0,
    });
};

// 3. LEDGER: View loan details
exports.getLedger = async (req, res) => {
    const { loan_id } = req.params;
    const loan = await dbGet('SELECT * FROM Loans WHERE loan_id = ?', [loan_id]);
    if (!loan) return res.status(404).json({ error: 'Loan not found.' });

    const payments = await dbAll('SELECT * FROM Payments WHERE loan_id = ? ORDER BY payment_date DESC', [loan_id]);
    const totalPaidResult = await dbGet('SELECT SUM(amount) as total FROM Payments WHERE loan_id = ?', [loan_id]);
    const amountPaid = totalPaidResult.total || 0;
    
    const balanceAmount = loan.total_amount - amountPaid;
    const emisLeft = Math.ceil(balanceAmount / loan.monthly_emi);

    res.status(200).json({
        loan_id: loan.loan_id,
        customer_id: loan.customer_id,
        principal: loan.principal_amount,
        total_amount: loan.total_amount,
        monthly_emi: loan.monthly_emi,
        amount_paid: amountPaid,
        balance_amount: balanceAmount,
        emis_left: emisLeft > 0 ? emisLeft : 0,
        transactions: payments.map(p => ({
            transaction_id: p.payment_id,
            date: p.payment_date,
            amount: p.amount,
            type: p.payment_type
        }))
    });
};

// 4. ACCOUNT OVERVIEW: View all loans for a customer
exports.getAccountOverview = async (req, res) => {
    const { customer_id } = req.params;
    const loans = await dbAll('SELECT * FROM Loans WHERE customer_id = ?', [customer_id]);
    if (!loans.length) return res.status(404).json({ error: 'No loans found for this customer.' });

    const customerOverview = {
        customer_id,
        total_loans: loans.length,
        loans: []
    };

    for (const loan of loans) {
        const totalPaidResult = await dbGet('SELECT SUM(amount) as total FROM Payments WHERE loan_id = ?', [loan.loan_id]);
        const amountPaid = totalPaidResult.total || 0;
        const balanceAmount = loan.total_amount - amountPaid;
        const emisLeft = Math.ceil(balanceAmount / loan.monthly_emi);

        customerOverview.loans.push({
            loan_id: loan.loan_id,
            principal: loan.principal_amount,
            total_amount: loan.total_amount,
            total_interest: loan.total_amount - loan.principal_amount,
            emi_amount: loan.monthly_emi,
            amount_paid: amountPaid,
            emis_left: emisLeft > 0 ? emisLeft : 0,
        });
    }

    res.status(200).json(customerOverview);
};