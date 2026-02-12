# NatiOps v2

## Fluxo de Sincronização (Sync)

### 1. Trigger

**Cron (GitHub Actions)** — 3x/dia às 06h, 11h, 20h UTC:
```
POST /sync/runs/incremental         → cria run INCREMENTAL
POST /sync/runs/incremental/process  → dispara o worker
```

**Manual via API** — quando precisar recarregar tudo:
```
POST /sync/runs/full
POST /sync/runs/full/process
```

---

### 2. Ciclo de vida do SyncRun

```
PENDING → RUNNING → SUCCESS / FAILED
```

1. `createPendingRun()` — cria com status `PENDING` (bloqueia se já existe PENDING/RUNNING)
2. `acquirePendingRun()` — pega o mais antigo PENDING, muda para `RUNNING` (transação)
3. `executeRun()` — processa as páginas
4. `completeRun()` → `SUCCESS` | `failRun()` → `FAILED`

---

### 3. FULL vs INCREMENTAL

|                | FULL               | INCREMENTAL                             |
|----------------|--------------------|-----------------------------------------|
| Quando         | Manual             | Cron 3x/dia                             |
| Filtro de data | Nenhum (traz tudo) | DataInicial + DataFinal condicional     |
| Pré-requisito  | Nenhum             | Precisa de um sync com sucesso anterior |

#### Lógica de datas do INCREMENTAL

```
dataInicial = data do último sync bem-sucedido (T00:00:00)
dataFinal   = hoje (T00:00:00) — SÓ se dataInicial ≠ hoje
```

**Exemplo prático** (FULL rodou em 10/02):

| Horário     | DataInicial           | DataFinal             | O que busca   |
|-------------|-----------------------|-----------------------|---------------|
| 06h (11/02) | 2026-02-10T00:00:00   | 2026-02-11T00:00:00   | 10/02 + 11/02 |
| 11h (11/02) | 2026-02-11T00:00:00   | (omitido)             | Só 11/02      |
| 20h (11/02) | 2026-02-11T00:00:00   | (omitido)             | Só 11/02      |

---

### 4. Rate Limiting

| Config                          | Default | Descrição                          |
|---------------------------------|---------|------------------------------------|
| `SYNC_PAGE_SIZE`                | 200     | Items por página                   |
| `SYNC_PAGE_CONCURRENCY`        | 2       | Workers paralelos                  |
| `SYNC_REQUEST_INTERVAL_SECONDS`| 30      | Intervalo entre requests (2 req/min)|
| `SYNC_MAX_RETRIES`             | 3       | Máximo de tentativas               |
| `SYNC_429_PAUSE_MINUTES`       | 15      | Pausa ao receber 429               |

---

### 5. Processamento de páginas

**Fase 1** — Processar todas:
- Página 1 com `fetchWithRetry` (até 3 tentativas)
- Páginas 2..N com 2 workers + RateLimiter (30s entre requests)
- Erros persistidos no banco (`SyncPageError` → `PENDING_RETRY`)
- HTTP 429 → pausa global de 15 min + retry imediato

**Fase 2** — Retry das falhas:
- Até 3 tentativas com backoff crescente (5s, 10s, 15s)
- Concurrency: 2, intervalo dobrado: 60s
- Esgotou → `PERMANENT_FAILURE`

---

### 6. Chamada à API DAPIC

```
GET /v1/armazenadores/produtos
  ?Pagina=1
  &RegistrosPorPagina=200
  &DataInicial=2026-02-10T00:00:00    ← só no INCREMENTAL
  &DataFinal=2026-02-11T00:00:00      ← só quando dataInicial ≠ hoje
```

Cada página → `bulkUpsert` nos produtos (insere ou atualiza pelo `externalId`).
