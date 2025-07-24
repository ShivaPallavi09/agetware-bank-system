# AGETWARE Backend Assignment: Bank Lending System

This project is a RESTful API for a simple bank lending system, built as per the AGETWARE backend assignment requirements. It allows for creating loans, recording payments, and viewing financial statements.

## System Design

-   **Backend**: Built with **Node.js** and the **Express.js** framework for a lightweight and robust API.
-   **Database**: Uses **SQLite**, a serverless, file-based SQL database. This choice makes the project self-contained and easy for an evaluator to run without any external database setup.
-   **Architecture**: The code is structured following standard practices, with separation of concerns for routes, controllers, and services.

## Features / API Endpoints

| Feature            | Method | Endpoint                             | Description                       |
| ------------------ | ------ | ------------------------------------ | --------------------------------- |
| **LEND** | `POST` | `/api/v1/loans`                      | Create a new loan.                |
| **PAYMENT** | `POST` | `/api/v1/loans/{loan_id}/payments`   | Record a payment for a loan.      |
| **LEDGER** | `GET`  | `/api/v1/loans/{loan_id}/ledger`     | View transaction history for a loan. |
| **ACCOUNT OVERVIEW** | `GET`  | `/api/v1/customers/{customer_id}/overview` | Get a summary of all loans for a customer. |

## Setup and Running the Project

1.  **Clone the repository:**
    ```bash
    git clone <your-repo-url>
    cd agetware-bank-system
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run the server:**
    ```bash
    npm start
    ```

The server will start on `http://localhost:3001`. The port was set to `3001` to avoid potential conflicts with other services that commonly use port `3000`.

## API Testing Guide

The API can be tested using any API client like **Postman** (recommended) or with **`curl`** on the command line.

### Using `curl` on Windows

Testing on the Windows command line can be tricky due to how PowerShell handles quotes. The most reliable method is to save the request body to a `.json` file and reference it in the command.

**1. Create a Loan:**
   - Create a file `body.json`:
     ```json
     {
       "customer_id": "cust_101",
       "loan_amount": 50000,
       "loan_period_years": 2,
       "interest_rate_yearly": 10
     }
     ```
   - Run the command:
     ```bash
     curl.exe -X POST -H "Content-Type: application/json" -d '@body.json' http://localhost:3001/api/v1/loans
     ```
   - **Note the `loan_id` from the response.**

**2. Make a Payment:**
   - Create a file `payment_body.json`:
     ```json
     {
       "amount": 2291.67,
       "payment_type": "EMI"
     }
     ```
   - Run the command (replace `{loan_id}`):
     ```bash
     curl.exe -X POST -H "Content-Type: application/json" -d '@payment_body.json' http://localhost:3001/api/v1/loans/{loan_id}/payments
     ```

**3. View Ledger & Overview (replace `{loan_id}` and `{customer_id}`):**
   ```bash
   # Get Loan Ledger
   curl.exe http://localhost:3001/api/v1/loans/{loan_id}/ledger

   # Get Customer Overview
   curl.exe http://localhost:3001/api/v1/customers/{customer_id}/overview
   ```
