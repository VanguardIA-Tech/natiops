# Documentação dos Endpoints – NatiOps API

Base URL (local): `http://localhost:3000`

A API também expõe Swagger em `/docs` para testes interativos.

---

## Produtos

### POST /products

Retorna o(s) produto(s) cujo nome corresponde ao informado no corpo.

**Request body**

```json
{
  "nome": "BC601719 - Botao Cristal - Diversos"
}
```

| Campo | Tipo   | Obrigatório | Descrição                    |
|-------|--------|-------------|------------------------------|
| nome  | string | Não         | Nome completo ou parcial     |

**Response 200**

Array de objetos:

| Campo     | Tipo   |
|-----------|--------|
| externalId| string |
| nome      | string |

---

### GET /products/:externalId

Retorna dados completos do produto pelo identificador externo.

**Parâmetros de path**

| Nome      | Tipo   | Descrição                    |
|-----------|--------|------------------------------|
| externalId| string | Identificador externo único  |

**Response 200**

Objeto com: `id`, `externalId`, `name`, `idProduto`, `idGradeProduto`, `idGradeProdutoEstoque`, `cor`, `tamanho`, `grupo`, `marca`, `colecao`, `quantidade`, `quantidadeReal`, `quantidadeComprometida`, `valor`, `valorCusto`, `stockTotal`, `reservedStock`, `idArmazenador`, `armazenador`, `createdAt`, `updatedAt`.

**Response 404** – Produto não encontrado.

---

### GET /products/details/:id

Retorna detalhes completos do produto pelo id interno.

**Parâmetros de path**

| Nome | Tipo   | Descrição       |
|------|--------|-----------------|
| id   | string | Id interno (UUID)|

**Response 200** – Mesmo formato do GET `/products/:externalId`.

**Response 404** – Produto não encontrado.

---

### GET /capacity

Resumo dos totais de estoque e reservas.

**Response 200**

```json
{
  "stockTotal": 100,
  "reservedStock": 20,
  "availableStock": 80
}
```

---

## Reservas (Holds)

### POST /holds

Cria uma nova reserva de produto.

**Request body**

```json
{
  "externalId": "PROD-123",
  "email": "cliente@nativa.com.br",
  "quantity": 2,
  "expiresAt": "2026-02-05T23:59:59Z"
}
```

| Campo     | Tipo   | Obrigatório | Descrição                          |
|-----------|--------|-------------|------------------------------------|
| externalId| string | Sim         | Identificador externo do produto   |
| email     | string | Sim         | Email do cliente (válido)          |
| quantity  | number | Sim         | Quantidade (inteiro positivo)      |
| expiresAt | string | Sim         | Data de expiração em ISO 8601      |

**Response 201**

Objeto: `id`, `productId`, `email`, `quantity`, `expiresAt`, `status`, `createdAt`, `updatedAt`.

**Response 400** – Quantidade inválida ou estoque insuficiente.

**Response 404** – Produto não encontrado.

---

### PATCH /holds/:id/cancel

Cancela uma reserva ativa.

**Parâmetros de path**

| Nome | Tipo   | Descrição (ex.: UUID da reserva) |
|------|--------|----------------------------------|
| id   | string | Identificador da reserva         |

**Response 200** – Reserva cancelada (mesmo formato de resposta do POST /holds).

**Response 400** – Reserva já finalizada ou inválida.

**Response 404** – Reserva não encontrada.

---

### PATCH /holds/:id/renew

Renova a data de expiração de uma reserva.

**Parâmetros de path**

| Nome | Tipo   | Descrição         |
|------|--------|-------------------|
| id   | string | Id da reserva     |

**Request body**

```json
{
  "expiresAt": "2026-02-10T23:59:59Z"
}
```

| Campo    | Tipo   | Obrigatório | Descrição (ISO 8601)     |
|----------|--------|-------------|--------------------------|
| expiresAt| string | Sim         | Nova data de expiração   |

**Response 200** – Reserva renovada (mesmo formato de resposta do POST /holds).

**Response 400** – Reserva não está ativa.

**Response 404** – Reserva não encontrada.

---

### GET /holds

Lista reservas ativas por email.

**Request body**

```json
{
  "email": "cliente@nativa.com.br"
}
```

| Campo | Tipo   | Obrigatório | Descrição     |
|-------|--------|-------------|---------------|
| email | string | Sim         | Email do cliente |

**Response 200**

```json
{
  "holds": [
    {
      "id": "...",
      "email": "...",
      "quantity": 2,
      "expiresAt": "...",
      "status": "...",
      "createdAt": "...",
      "updatedAt": "...",
      "product": { ... }
    }
  ],
  "total": 1,
  "message": "..."
}
```

**Response 400** – Email inválido ou ausente.

---

## Catálogo

### GET /catalogo/:referencia/images

Retorna as URLs das imagens de um item de catálogo.

**Parâmetros de path**

| Nome       | Tipo   | Descrição                 |
|------------|--------|---------------------------|
| referencia | string | Referência do item        |

**Response 200** – Array de strings (URLs de imagens).

**Response 404** – Item de catálogo não encontrado.

---

### GET /catalogo/:referencia/details

Retorna os detalhes de um item de catálogo.

**Parâmetros de path**

| Nome       | Tipo   | Descrição                 |
|------------|--------|---------------------------|
| referencia | string | Referência do item        |

**Response 200**

Objeto: `externalId`, `referencia`, `descricaoFabrica`, `status`, `unidadeDeMedida`.

**Response 404** – Item de catálogo não encontrado.

---

## Sincronização

### GET /sync/runs

Lista execuções de sincronização.

**Query**

| Nome   | Tipo   | Obrigatório | Default | Descrição              |
|--------|--------|-------------|---------|------------------------|
| limit  | number | Não         | 20      | Máximo de runs         |
| offset | number | Não         | 0       | Deslocamento (página)  |

**Response 200**

Array de objetos: `id`, `type`, `status`, `createdAt`, `startedAt`, `finishedAt`, `currentPage`, `currentItemId`, `errorMessage`, `auditEntries`, `checkpoints`.

---

### GET /sync/runs/:id

Retorna uma execução de sincronização pelo ID.

**Parâmetros de path**

| Nome | Tipo   | Descrição        |
|------|--------|------------------|
| id   | string | Id da execução   |

**Response 200** – Objeto da execução (mesmo formato dos itens de GET /sync/runs).

**Response 404** – Execução não encontrada.

---

### POST /sync/runs/full

Cria uma execução FULL em estado pendente.

**Response 200** – Execução criada ou já existente pendente (objeto de run).

**Response 409** – Já existe sincronização em andamento.

---

### POST /sync/runs/full/process

Despacha o worker para processar a fila FULL.

**Response 200**

```json
{
  "status": "processed"
}
```

---

## Resumo por método e path

| Método | Path                      | Descrição                          |
|--------|---------------------------|------------------------------------|
| GET    | /capacity                 | Resumo estoque/reservas            |
| GET    | /catalogo/:ref/details    | Detalhes item catálogo             |
| GET    | /catalogo/:ref/images     | URLs imagens item catálogo         |
| GET    | /holds                    | Reservas por email (body: email)   |
| POST   | /products                 | Busca produto por nome             |
| GET    | /products/details/:id     | Detalhes produto por id interno    |
| GET    | /products/:externalId     | Detalhes produto por externalId    |
| POST   | /holds                    | Criar reserva                      |
| PATCH  | /holds/:id/cancel         | Cancelar reserva                   |
| PATCH  | /holds/:id/renew          | Renovar reserva                    |
| GET    | /sync/runs                | Listar execuções (limit, offset)   |
| GET    | /sync/runs/:id            | Uma execução por id                |
| POST   | /sync/runs/full           | Agendar run FULL                   |
| POST   | /sync/runs/full/process   | Processar fila FULL                |
