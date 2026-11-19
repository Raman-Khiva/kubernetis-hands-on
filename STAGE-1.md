# Stage 1 — One process. You are the orchestrator.

Goal: run the Quote API as a normal Node process and feel what breaks when nobody is watching it.

No Docker. No Kubernetes. Just you, a terminal, and `curl`.

## Setup

```bash
npm install
npm start
```

You should see something like:

```text
Quote API listening on http://localhost:3000
pid=12345
```

Leave that terminal running. Open a **second** terminal for the tasks below.

---

## Tasks (do these in order)

### 1. Prove it works
```bash
curl -s http://localhost:3000/health | jq
curl -s http://localhost:3000/quotes | jq
```

### 2. Add a quote (you own this data… for now)
```bash
curl -s -X POST http://localhost:3000/quotes \
  -H 'content-type: application/json' \
  -d '{"text":"My first quote","author":"Me"}' | jq

curl -s http://localhost:3000/quotes | jq
```

Confirm your quote is there. Note the `count`.

### 3. Kill it the hard way
In the server terminal, press `Ctrl+C`.

Then:
```bash
curl -s http://localhost:3000/health
```

**Write down:** what happened? Who is responsible for bringing it back?

### 4. Restart and check your data
```bash
npm start
curl -s http://localhost:3000/quotes | jq
```

**Write down:** is your quote still there? Why / why not?

### 5. Crash from outside (no Ctrl+C)
With the server running again, add another quote, then:

```bash
curl -s -X POST http://localhost:3000/crash
curl -s http://localhost:3000/health
```

Look at the server terminal. Restart it yourself. Check quotes again.

**Write down:** in production, at 3am, who does step “restart it yourself”?

### 6. Two copies (optional stretch)
In two terminals, try:
```bash
PORT=3000 npm start
PORT=3001 npm start
```

Hit both:
```bash
curl -s http://localhost:3000/health
curl -s http://localhost:3001/health
```

Add a quote only to `:3000`. Check `:3001`.

**Write down:** are they sharing state? If traffic grows, how would a user know which port to call?

---

## Reflection (bring these answers back)

1. What fails when the process dies?
2. What happens to in-memory data after a crash?
3. If you needed **3** copies + auto-restart + one URL for clients — what would you want a tool to do for you?

When you’re done, tell me your answers. Then we move to Stage 2 (containers) only after this pain is clear.
