const db = require('./Database/db');
const express = require("express");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = 5000;
const SECRET = "supersecretkey";

// =====================
// MIDDLEWARE
// =====================
app.use(express.json());

// Serve frontend
const frontendPath = path.join(__dirname, "..", "frontend");
app.use(express.static(frontendPath));

// =====================
// USERS FILE
// =====================
const USERS_FILE = path.join(__dirname, "users.json");

function getUsers() {
  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify([]));
  }
  return JSON.parse(fs.readFileSync(USERS_FILE));
}

function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// =====================
// ROUTES
// =====================

// ROOT
app.get("/", (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

// DASHBOARD
app.get("/dashboard", (req, res) => {
  res.sendFile(path.join(frontendPath, "dashboard.html"));
});

// =====================
// AUTH
// =====================

// SIGNUP
app.post("/signup", async (req, res) => {
  const { email, password, preferredName } = req.body;

  const users = getUsers();
  if (users.find(u => u.email === email)) {
    return res.status(400).json({ message: "Email already exists" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = {
    id: Date.now(),
    email,
    password: hashedPassword,
    preferredName
  };

  users.push(newUser);
  saveUsers(users);

  const token = jwt.sign({ email }, SECRET, { expiresIn: "1h" });
  res.json({ token, preferredName, user_id: newUser.id });
});

// LOGIN
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const users = getUsers();
  const user = users.find(u => u.email === email);

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  const token = jwt.sign({ email }, SECRET, { expiresIn: "1h" });
  res.json({ token, preferredName: user.preferredName, user_id: user.id });
});

// =====================
// USER ORDERS
// =====================

// Place Order
app.post("/orders", (req, res) => {
  const { user_id, type, title, description } = req.body;

  db.run(
    `INSERT INTO orders (user_id, type, title, description, status)
     VALUES (?, ?, ?, ?, 'Pending')`,
    [user_id, type, title, description],
    function (err) {
      if (err) return res.status(400).json({ error: err.message });
      res.json({ order_id: this.lastID, status: "Pending" });
    }
  );
});

// Get User Orders
app.get("/orders/:user_id", (req, res) => {
  db.all(
    `SELECT order_id, type, title, status, file_url, created_at
     FROM orders
     WHERE user_id = ?
     ORDER BY created_at DESC`,
    [req.params.user_id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// Download completed work
app.get("/orders/download/:order_id", (req, res) => {
  db.get(
    `SELECT file_url FROM orders
     WHERE order_id = ? AND status = 'Completed'`,
    [req.params.order_id],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row || !row.file_url) {
        return res.status(404).json({ message: "File not available yet" });
      }
      res.download(path.join(__dirname, row.file_url));
    }
  );
});

// =====================
// START SERVER
// =====================
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
