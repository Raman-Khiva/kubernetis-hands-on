# Stage 2 — Containers. Still one machine. You still babysit a bit.

You already felt:
- process dies → service dies
- memory dies with the process
- N copies = N ports + you watching them

Stage 2 packages the app as a **container image**. Docker can restart a crashed container for you — but only on **this** machine, and scaling still gets awkward by hand.

No Kubernetes yet.

## Prerequisites

```bash
docker --version
```

If that fails, install Docker Desktop / Engine first, then come back.

---

## Tasks (do these in order)

### 1. Build the image
From the project root:

```bash
docker build -t quote-api:stage2 .
```

**Write down:** what did you just create — a running server, or a reusable package?

### 2. Run one container
```bash
docker run --name quote-1 -p 3000:3000 quote-api:stage2
```

In another terminal:
```bash
curl -s http://localhost:3000/health | jq
curl -s -X POST http://localhost:3000/quotes \
  -H 'content-type: application/json' \
  -d '{"text":"Inside a container","author":"Me"}' | jq
```

Stop it with `Ctrl+C` in the container terminal (or `docker stop quote-1` from elsewhere).

Clean up if needed:
```bash
docker rm quote-1
```

### 3. Auto-restart on crash (partial relief)
```bash
docker run -d --name quote-1 --restart unless-stopped -p 3000:3000 quote-api:stage2
```

Confirm it’s up, add a quote, then crash it:
```bash
curl -s http://localhost:3000/quotes | jq
curl -s -X POST http://localhost:3000/crash
sleep 2
curl -s http://localhost:3000/health | jq
curl -s http://localhost:3000/quotes | jq
docker ps --filter name=quote-1
```

**Write down:**
- Did something bring the process back without you typing `npm start`?
- Did your quotes survive the crash? Why / why not?

### 4. Three copies by hand (the port tax)
Stop/remove the single container first:
```bash
docker stop quote-1 && docker rm quote-1
```

Start three:
```bash
docker run -d --name quote-1 --restart unless-stopped -p 3000:3000 quote-api:stage2
docker run -d --name quote-2 --restart unless-stopped -p 3001:3000 quote-api:stage2
docker run -d --name quote-3 --restart unless-stopped -p 3002:3000 quote-api:stage2
```

Hit each:
```bash
curl -s http://localhost:3000/health | jq
curl -s http://localhost:3001/health | jq
curl -s http://localhost:3002/health | jq
```

Add a quote only on `:3000`. Check `:3001` and `:3002`.

**Write down:**
- Clients need which URL(s)?
- Do the three share memory?
- If `quote-2` dies at 3am, Docker may restart it — but who told traffic to avoid the dead one while it was down?

### 5. Cleanup
```bash
docker stop quote-1 quote-2 quote-3
docker rm quote-1 quote-2 quote-3
```

---

## Reflection (bring these answers back)

1. What did Docker improve vs Stage 1 (plain `npm start`)?
2. What pain is still unsolved (single URL, shared data, many machines, zero-downtime deploy…)?
3. If you could keep “restart for me” but also get **one hostname** in front of N copies, what would you want next?

When you’re done, tell me your answers. Stage 3 will add a load balancer / Compose — still not Kubernetes.
