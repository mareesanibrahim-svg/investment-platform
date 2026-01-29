const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { initDb, query } = require('./db');

const app = express();

// Security Middleware
app.use(helmet()); // Secure HTTP Headers
app.use(cors()); // Allow CORS
app.use(express.json({ limit: '10kb' })); // Body limit to prevent DOS

// Rate Limiting (Global)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Strict Rate Limiting for Auth/Payment
const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Limit 5 attempts per 15 min
  message: 'Too many attempts, please try again later'
});

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-123'; // In production use env var

// Middleware to authenticate user
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Initialize DB
initDb().catch(console.error);

// Routes

// Register
app.post('/api/register', async (req, res) => {
  const { name, email, password } = req.body;
  
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await query(
      'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id',
      [name, email, hashedPassword]
    );
    res.json({ success: true, userId: result.rows[0].id });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'Email already exists or invalid data' });
  }
});

// Login
app.post('/api/login', strictLimiter, async (req, res) => {
  const { email, password } = req.body;
  
  try {
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) return res.status(400).json({ error: 'User not found' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ error: 'Invalid password' });

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET);
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, balance: parseFloat(user.balance) } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get Profile (Balance)
app.get('/api/me', authenticateToken, async (req, res) => {
  try {
    const result = await query('SELECT id, name, email, balance FROM users WHERE id = $1', [req.user.id]);
    const user = result.rows[0];
    if (user) {
      user.balance = parseFloat(user.balance); // Ensure number type
    }
    res.json(user);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

// Deposit (Simulation with Security Checks)
app.post('/api/deposit', strictLimiter, authenticateToken, async (req, res) => {
  const { amount, paymentMethod, paymentToken } = req.body;
  
  if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });

  // Security Check: Ensure payment token exists (Simulation of verified payment)
  if (!paymentToken) {
    return res.status(400).json({ error: 'Payment verification failed (Missing Token)' });
  }

  try {
    await query('UPDATE users SET balance = balance + $1 WHERE id = $2', [amount, req.user.id]);
    await query('INSERT INTO transactions (user_id, type, amount) VALUES ($1, $2, $3)', [req.user.id, 'deposit', amount]);
    
    res.json({ success: true, message: `Deposit of ${amount} AED via ${paymentMethod} successful` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Deposit failed' });
  }
});

// Withdraw
app.post('/api/withdraw', authenticateToken, async (req, res) => {
  const { amount, bankName, accountHolder, iban } = req.body;
  
  if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });
  if (!bankName || !accountHolder || !iban) return res.status(400).json({ error: 'Missing bank details' });

  // Basic UAE IBAN validation
  if (!iban.startsWith('AE') || iban.length < 23) {
      return res.status(400).json({ error: 'Invalid UAE IBAN (Must start with AE and be 23 characters)' });
  }

  try {
    const result = await query('SELECT balance FROM users WHERE id = $1', [req.user.id]);
    const user = result.rows[0];

    if (parseFloat(user.balance) < amount) return res.status(400).json({ error: 'Insufficient funds' });

    // Deduct balance
    await query('UPDATE users SET balance = balance - $1 WHERE id = $2', [amount, req.user.id]);
    
    // Create Withdrawal Request
    await query(
      'INSERT INTO withdrawal_requests (user_id, amount, bank_name, account_holder, iban) VALUES ($1, $2, $3, $4, $5)',
      [req.user.id, amount, bankName, accountHolder, iban]
    );

    // Record Transaction
    await query('INSERT INTO transactions (user_id, type, amount) VALUES ($1, $2, $3)', [req.user.id, 'withdraw_request', amount]);
    
    res.json({ success: true, message: 'Withdrawal request submitted for processing' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Withdrawal failed' });
  }
});

// Create Investment
app.post('/api/invest', authenticateToken, async (req, res) => {
  const { amount } = req.body;
  
  // Rule: Minimum 15 AED
  if (amount < 15) return res.status(400).json({ error: 'Minimum investment is 15 AED' });

  try {
    const result = await query('SELECT balance FROM users WHERE id = $1', [req.user.id]);
    const user = result.rows[0];

    if (parseFloat(user.balance) < amount) return res.status(400).json({ error: 'Insufficient funds' });

    // Deduct from balance
    await query('UPDATE users SET balance = balance - $1 WHERE id = $2', [amount, req.user.id]);
    
    // Create investment
    await query(
      'INSERT INTO investments (user_id, amount, start_time, last_claim_time) VALUES ($1, $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
      [req.user.id, amount]
    );
    
    await query('INSERT INTO transactions (user_id, type, amount) VALUES ($1, $2, $3)', [req.user.id, 'invest', amount]);

    res.json({ success: true, message: 'Investment started' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Investment failed' });
  }
});

// Get Investments
app.get('/api/investments', authenticateToken, async (req, res) => {
  try {
    const result = await query('SELECT * FROM investments WHERE user_id = $1 AND status = $2', [req.user.id, 'active']);
    const investments = result.rows;
    
    // Calculate potential profit for display
    const now = new Date();
    const investmentsWithProfit = investments.map(inv => {
      const lastClaim = new Date(inv.last_claim_time);
      const diffMs = now - lastClaim;
      const diffMinutes = Math.floor(diffMs / 60000);
      // 1% per minute
      const profit = parseFloat(inv.amount) * 0.01 * diffMinutes; 
      return { ...inv, pending_profit: profit, amount: parseFloat(inv.amount) };
    });

    res.json(investmentsWithProfit);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

// Claim Profit
app.post('/api/claim', authenticateToken, async (req, res) => {
  const { investmentId } = req.body;
  
  try {
    const result = await query('SELECT * FROM investments WHERE id = $1 AND user_id = $2', [investmentId, req.user.id]);
    const inv = result.rows[0];

    if (!inv) return res.status(404).json({ error: 'Investment not found' });
    if (inv.status !== 'active') return res.status(400).json({ error: 'Investment not active' });

    const now = new Date();
    const lastClaim = new Date(inv.last_claim_time);
    const diffMs = now - lastClaim;
    const diffMinutes = Math.floor(diffMs / 60000);

    if (diffMinutes < 1) return res.status(400).json({ error: 'No profit to claim yet (wait 1 min)' });

    const profit = parseFloat(inv.amount) * 0.01 * diffMinutes;

    // Add profit to balance
    await query('UPDATE users SET balance = balance + $1 WHERE id = $2', [profit, req.user.id]);
    
    // Update last claim time
    await query('UPDATE investments SET last_claim_time = CURRENT_TIMESTAMP WHERE id = $1', [investmentId]);
    
    // Record transaction
    await query('INSERT INTO transactions (user_id, type, amount) VALUES ($1, $2, $3)', [req.user.id, 'profit', profit]);

    res.json({ success: true, profit, message: `Claimed ${profit.toFixed(2)} AED` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Claim failed' });
  }
});

// Get Transactions
app.get('/api/transactions', authenticateToken, async (req, res) => {
  try {
    const result = await query('SELECT * FROM transactions WHERE user_id = $1 ORDER BY timestamp DESC LIMIT 50', [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

const PORT = process.env.PORT || 3001;
// Start Server
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
