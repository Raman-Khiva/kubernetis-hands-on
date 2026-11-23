# Stage 3 — One URL. Three replicas. Still one machine.

You asked for: keep “restart for me” **and** unify the hostname.

Stage 3 puts **nginx** in front of three Quote API containers via Docker Compose.
Clients hit **one** address: `http://localhost:8080`

No Kubernetes yet. Still only this laptop/VM.

---

## Tasks (do these in order)

### 1. Bring the stack up
If Stage 2 containers are still around, clean them first:
```bash
docker stop quote-1 quote-2 quote-3 2>/dev/null
docker rm quote-1 quote-2 quote-3 2>/dev/null
```

Then:
```bash
docker compose up --build -d
docker compose ps
```

You should see `quote-1`, `quote-2`, `quote-3`, and `proxy`.

### 2. One hostname
```bash
curl -s http://localhost:8080/health | jq
curl -si http://localhost:8080/health | grep -i x-instance
```

Hit health several times:
```bash
for i in 1 2 3 4 5 6; do curl -si http://localhost:8080/health | grep -i x-instance; done
```

**Write down:** do you still pick ports 3000/3001/3002? Which replica answers each time?

### 3. Shared URL ≠ shared memory
Add a quote through the single URL:
```bash
curl -s -X POST http://localhost:8080/quotes \
  -H 'content-type: application/json' \
  -d '{"text":"Behind the proxy","author":"Me"}' | jq
```

Then list quotes several times:
```bash
for i in 1 2 3 4 5 6; do
  echo "--- request $i ---"
  curl -s http://localhost:8080/quotes | jq '{instance, count}'
done
```

**Write down:** does `count` stay the same on every request? Why / why not?

### 4. Crash one replica through the proxy
```bash
curl -s -X POST http://localhost:8080/crash | jq
sleep 2
docker compose ps
for i in 1 2 3 4 5 6; do curl -si http://localhost:8080/health | grep -iE 'HTTP/|x-instance'; done
```

**Write down:**
- Did the whole site die, or only one replica?
- While that replica was restarting, did some requests fail?
- Who brought the dead replica back?

### 5. Cleanup (when done)
```bash
docker compose down
```

---

## Reflection (bring these answers back)

1. What did the proxy buy you vs Stage 2’s three separate ports?
2. What pain is still there around **data**?
3. This whole stack still lives on **one machine**. If that machine dies, what happens — and what would you want a tool to own next (many machines, place replicas, heal across hosts, roll out new versions…)?

When you’re done, tell me your answers. Next we either fix shared data (Redis) or step into Kubernetes — depending on which pain you want to attack first.
