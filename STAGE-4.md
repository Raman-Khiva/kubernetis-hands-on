# Stage 4 — Shared data. Still one machine.

Stage 3 gave you one URL. Replicas still lied to users because each kept its own memory.

Stage 4 adds **Redis** as a shared store. All three APIs read/write the same quotes.
Compose still runs on **one** machine — that limit is intentional. Kubernetes is next.

---

## Tasks (do these in order)

### 1. Rebuild with the Redis-aware app
```bash
docker compose down
docker compose up --build -d
docker compose ps
```

You should now see `redis` plus the three APIs and `proxy`.

### 2. Confirm the store mode
```bash
curl -s http://localhost:8080/health | jq
```

You want `"store": "redis"`. Hit it a few times — `instance` may change; `store` should stay `redis`.

### 3. One write, every replica agrees
```bash
curl -s -X POST http://localhost:8080/quotes \
  -H 'content-type: application/json' \
  -d '{"text":"Shared at last","author":"Me"}' | jq

for i in 1 2 3 4 5 6; do
  echo "--- request $i ---"
  curl -s http://localhost:8080/quotes | jq '{instance, store, count}'
done
```

**Write down:** does `count` stay stable across instances now?

### 4. Crash a replica — data should survive
```bash
curl -s -X POST http://localhost:8080/crash | jq
sleep 3
curl -s http://localhost:8080/quotes | jq '{instance, store, count}'
```

**Write down:** API process died and came back — did the new quote survive? What held the data?

### 5. Cleanup (when done)
```bash
docker compose down
```

---

## Where this leaves you

You have auto-restart, shared memory (Redis), and one URL (nginx) — but it’s still **one machine**, wired with Compose + a few separate tools. Spreading the same setup across several bare-metal machines means repeating that work by hand on each host.

That’s the open problem. Next steps you’ll drive yourself when you’re ready.
