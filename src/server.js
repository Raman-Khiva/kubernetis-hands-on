const express = require("express");
const { createClient } = require("redis");

const PORT = Number(process.env.PORT) || 3000;
const INSTANCE = process.env.INSTANCE_NAME || require("os").hostname();
const REDIS_URL = process.env.REDIS_URL || "";

const SEED_QUOTES = [
  { id: 1, text: "Simplicity is the ultimate sophistication.", author: "Leonardo da Vinci" },
  { id: 2, text: "Make it work, make it right, make it fast.", author: "Kent Beck" },
];

const app = express();
app.use(express.json());

app.use((_req, res, next) => {
  res.setHeader("X-Instance", INSTANCE);
  next();
});

/** @type {{ mode: "memory" | "redis", memoryQuotes?: any[], nextId?: number, redis?: import("redis").RedisClientType }} */
const store = { mode: "memory", memoryQuotes: [...SEED_QUOTES], nextId: 3 };

async function listQuotes() {
  if (store.mode === "redis") {
    const raw = await store.redis.get("quotes");
    return raw ? JSON.parse(raw) : [];
  }
  return store.memoryQuotes;
}

async function addQuote(text, author) {
  if (store.mode === "redis") {
    const quotes = await listQuotes();
    const nextId = Number((await store.redis.get("quotes:nextId")) || "1");
    const quote = { id: nextId, text, author };
    quotes.push(quote);
    await store.redis.set("quotes", JSON.stringify(quotes));
    await store.redis.set("quotes:nextId", String(nextId + 1));
    return quote;
  }

  const quote = {
    id: store.nextId++,
    text,
    author,
  };
  store.memoryQuotes.push(quote);
  return quote;
}

async function initStore() {
  if (!REDIS_URL) {
    console.log("store=memory (set REDIS_URL to share data across replicas)");
    return;
  }

  const redis = createClient({ url: REDIS_URL });
  redis.on("error", (err) => console.error("redis error", err));
  await redis.connect();

  const existing = await redis.get("quotes");
  if (!existing) {
    await redis.set("quotes", JSON.stringify(SEED_QUOTES));
    await redis.set("quotes:nextId", "3");
  }

  store.mode = "redis";
  store.redis = redis;
  console.log(`store=redis (${REDIS_URL})`);
}

app.get("/health", async (_req, res) => {
  res.json({
    status: "ok",
    instance: INSTANCE,
    store: store.mode,
    uptimeSeconds: Math.floor(process.uptime()),
  });
});

app.get("/quotes", async (_req, res) => {
  const quotes = await listQuotes();
  res.json({ instance: INSTANCE, store: store.mode, count: quotes.length, quotes });
});

app.post("/quotes", async (req, res) => {
  const { text, author } = req.body || {};

  if (!text || typeof text !== "string") {
    return res.status(400).json({ error: "body.text is required (string)" });
  }

  const quote = await addQuote(
    text.trim(),
    author ? String(author).trim() : "Anonymous"
  );
  res.status(201).json({ instance: INSTANCE, store: store.mode, quote });
});

app.post("/crash", (_req, res) => {
  res.status(500).json({ instance: INSTANCE, error: "crashing on purpose..." });
  setTimeout(() => {
    console.error(`💥 intentional crash on ${INSTANCE}`);
    process.exit(1);
  }, 100);
});

initStore()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Quote API (${INSTANCE}) listening on http://localhost:${PORT}`);
      console.log(`pid=${process.pid}`);
    });
  })
  .catch((err) => {
    console.error("failed to start", err);
    process.exit(1);
  });
