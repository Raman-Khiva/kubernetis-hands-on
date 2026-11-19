const express = require("express");

const PORT = Number(process.env.PORT) || 3000;
const app = express();

app.use(express.json());

// In-memory store on purpose — when the process dies, quotes die with it.
const quotes = [
  { id: 1, text: "Simplicity is the ultimate sophistication.", author: "Leonardo da Vinci" },
  { id: 2, text: "Make it work, make it right, make it fast.", author: "Kent Beck" },
];
let nextId = 3;

app.get("/health", (_req, res) => {
  res.json({ status: "ok", uptimeSeconds: Math.floor(process.uptime()) });
});

app.get("/quotes", (_req, res) => {
  res.json({ count: quotes.length, quotes });
});

app.post("/quotes", (req, res) => {
  const { text, author } = req.body || {};

  if (!text || typeof text !== "string") {
    return res.status(400).json({ error: "body.text is required (string)" });
  }

  const quote = {
    id: nextId++,
    text: text.trim(),
    author: author ? String(author).trim() : "Anonymous",
  };

  quotes.push(quote);
  res.status(201).json(quote);
});

// Deliberate crash switch — use this in the Stage 1 tasks.
app.post("/crash", (_req, res) => {
  res.status(500).json({ error: "crashing on purpose..." });
  setTimeout(() => {
    console.error("💥 intentional crash");
    process.exit(1);
  }, 100);
});

app.listen(PORT, () => {
  console.log(`Quote API listening on http://localhost:${PORT}`);
  console.log(`pid=${process.pid}`);
});
