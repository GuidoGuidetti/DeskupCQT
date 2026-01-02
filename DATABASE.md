# DeskUp - Documentazione Database

## Informazioni di Connessione

**Provider:** Neon PostgreSQL (Serverless)
**Database:** deskup
**Host:** ep-icy-cell-agnol06t-pooler.c-2.eu-central-1.aws.neon.tech
**SSL Mode:** require

Le credenziali complete sono archiviate nel file `.env` (non committare questo file in Git).

## Schema Overview

Il database DeskUp utilizza una struttura relazionale con 5 tabelle principali:

```
Partner (1) ──→ (N) User (1) ──→ (N) Ticket
                 │
                 └──→ (0..1) Customer

Customer ←──── (0..1) Ticket
```

### Relazioni Principali
- **Partner**: Aziende partner che utilizzano il sistema
- **User**: Utenti del sistema (Admin, Partner, Utente) - possono avere un Partner associato
- **Customer**: Clienti finali dei partner
- **Ticket**: Richieste di supporto create dagli utenti
- **Carnet**: Pacchetti di servizi disponibili

## Tabelle

### 1. `users` - Utenti del Sistema

Gestisce tutti gli utenti che accedono al sistema con diversi ruoli.

| Colonna | Tipo | Nullable | Default | Descrizione |
|---------|------|----------|---------|-------------|
| `usr_id` | integer | NO | auto-increment | ID utente (Primary Key) |
| `usr_name` | varchar(50) | YES | - | Nome completo utente |
| `usr_mail` | varchar(50) | YES | - | Email (usata per login) |
| `usr_pwd` | varchar(50) | YES | - | Password (plain text - migrare a hash) |
| `usr_role` | integer | YES | 2 | Ruolo: 0=Admin, 1=Partner, 2=Utente |
| `usr_note` | text | YES | - | Note aggiuntive sull'utente |
| `usr_cust_id` | integer | YES | - | ID cliente associato (FK → customers) |
| `usr_part_id` | integer | YES | - | ID partner associato (FK → partners) |

**Indexes:**
- PRIMARY KEY: `usr_id`

**Foreign Keys:**
- `usr_cust_id` → `customers.cust_id`
- `usr_part_id` → `partners.part_id`

**Relazioni:**
- Appartiene a un `customer` (opzionale, N:1)
- Appartiene a un `partner` (opzionale, N:1)
- Ha molti `tickets` (1:N)

**Ruoli:**
- **0 - Amministratore**: Accesso completo a tutto il sistema
- **1 - Partner**: Accesso a clienti, carnets e tickets (no gestione utenti)
- **2 - Utente**: Può solo creare e visualizzare i propri tickets

---

### 2. `partners` - Aziende Partner

Memorizza le informazioni delle aziende partner che utilizzano DeskUp.

| Colonna | Tipo | Nullable | Default | Descrizione |
|---------|------|----------|---------|-------------|
| `part_id` | integer | NO | auto-increment | ID partner (Primary Key) |
| `part_name` | varchar(255) | NO | - | Nome dell'azienda partner |
| `part_data` | text | YES | - | Dati/descrizione aggiuntiva del partner |
| `part_logo` | varchar(255) | YES | - | Nome file logo (es. "logo-partner.png") |

**Indexes:**
- PRIMARY KEY: `part_id`

**Relazioni:**
- Ha molti `users` (1:N)

**Note:**
- Il logo del partner viene mostrato come sfondo watermark nelle pagine degli utenti con usr_role > 0
- `part_data` viene mostrato nell'header della dashboard sotto il nome del partner

---

### 3. `customers` - Clienti

Anagrafica dei clienti finali.

| Colonna | Tipo | Nullable | Default | Descrizione |
|---------|------|----------|---------|-------------|
| `cust_id` | integer | NO | auto-increment | ID cliente (Primary Key) |
| `cust_name` | text | YES | - | Nome o Ragione Sociale |
| `cust_address` | text | YES | - | Indirizzo completo |
| `cust_state` | varchar(20) | YES | - | Provincia/Stato |
| `cust_city` | varchar(50) | YES | - | Città |
| `cust_country` | varchar(50) | YES | ITALY | Paese |

**Indexes:**
- PRIMARY KEY: `cust_id`

**Relazioni:**
- Ha molti `users` (1:N)
- Ha molti `tickets` (1:N)

---

### 4. `carnets` - Pacchetti di Servizi

Definisce i pacchetti di servizi disponibili (giornate, ore, tickets).

| Colonna | Tipo | Nullable | Default | Descrizione |
|---------|------|----------|---------|-------------|
| `carn_id` | integer | NO | auto-increment | ID carnet (Primary Key) |
| `carn_des` | text | YES | - | Descrizione del pacchetto |
| `carn_um` | varchar(2) | YES | - | Unità di misura: G=Giornate, H=Ore, T=Tickets |
| `carn_qta` | integer | YES | - | Quantità disponibile |
| `carn_price` | decimal | YES | - | Prezzo in Euro |
| `carn_note` | varchar | YES | - | Note aggiuntive |

**Indexes:**
- PRIMARY KEY: `carn_id`

**Unità di Misura:**
- **G** - Giornate di consulenza
- **H** - Ore di consulenza
- **T** - Numero di tickets

---

### 5. `tickets` - Richieste di Supporto

Gestisce tutte le richieste di supporto create dagli utenti.

| Colonna | Tipo | Nullable | Default | Descrizione |
|---------|------|----------|---------|-------------|
| `tick_id` | integer | NO | auto-increment | ID ticket (Primary Key) |
| `tick_title` | varchar(255) | NO | - | Titolo del ticket |
| `tick_description` | text | YES | - | Descrizione dettagliata |
| `tick_status` | varchar(20) | NO | 'open' | Stato: open, in_progress, waiting, closed |
| `tick_priority` | varchar(20) | NO | 'medium' | Priorità: low, medium, high, urgent |
| `tick_usr_id` | integer | NO | - | Utente creatore (FK → users) |
| `tick_cust_id` | integer | YES | - | Cliente associato (FK → customers) |
| `tick_created_at` | timestamp | NO | CURRENT_TIMESTAMP | Data creazione |
| `tick_updated_at` | timestamp | NO | auto | Data ultimo aggiornamento |
| `tick_closed_at` | timestamp | YES | - | Data chiusura |
| `tick_note` | text | YES | - | Note aggiuntive |

**Indexes:**
- PRIMARY KEY: `tick_id`
- INDEX: `tick_usr_id`
- INDEX: `tick_cust_id`
- INDEX: `tick_status`

**Foreign Keys:**
- `tick_usr_id` → `users.usr_id`
- `tick_cust_id` → `customers.cust_id`

**Relazioni:**
- Appartiene a un `user` (N:1)
- Appartiene a un `customer` (opzionale, N:1)

**Stati Ticket:**
- **open**: Nuovo ticket, in attesa
- **in_progress**: In lavorazione
- **waiting**: In attesa (feedback cliente, risorse esterne)
- **closed**: Completato e chiuso

**Priorità:**
- **low**: Bassa priorità
- **medium**: Priorità normale (default)
- **high**: Priorità alta
- **urgent**: Urgente, richiede attenzione immediata

---

## Workflow Utenti e Ruoli

### Admin (usr_role = 0)
- ✅ Gestione Utenti (CRUD completo)
- ✅ Gestione Clienti (CRUD completo)
- ✅ Gestione Carnets (CRUD completo)
- ✅ Visualizza tutti i Tickets di tutti gli utenti
- ✅ Logo in header: `logo-admin.png`

### Partner (usr_role = 1)
- ❌ NO gestione Utenti
- ✅ Gestione Clienti (CRUD completo)
- ✅ Gestione Carnets (CRUD completo)
- ✅ Visualizza tutti i Tickets del sistema
- ✅ Mostra `part_name` e `part_data` in header
- ✅ Logo come watermark sfondo: da `part_logo`

### Utente (usr_role = 2)
- ❌ Nessuna gestione admin
- ✅ Crea nuovi tickets
- ✅ Visualizza solo i propri tickets
- ✅ Se ha partner, mostra `part_name` e `part_data` in header
- ✅ Se ha partner, logo come watermark sfondo: da `part_logo`

---

## Query Comuni

### Ottenere utente con dati partner
```typescript
const user = await prisma.user.findUnique({
  where: { usr_id: userId },
  include: {
    partner: true,
    customer: true,
  },
});
```

### Ottenere tutti i tickets con relazioni
```typescript
const tickets = await prisma.ticket.findMany({
  include: {
    user: {
      include: { partner: true },
    },
    customer: true,
  },
  orderBy: { tick_created_at: 'desc' },
});
```

### Ottenere tickets di un utente specifico
```typescript
const userTickets = await prisma.ticket.findMany({
  where: { tick_usr_id: userId },
  include: { customer: true },
  orderBy: { tick_created_at: 'desc' },
});
```

### Ottenere utenti di un partner
```typescript
const partnerUsers = await prisma.user.findMany({
  where: { usr_part_id: partnerId },
  include: { customer: true },
});
```

---

## Manutenzione Database

### Visualizzare il database in GUI
```bash
npm run db:studio
```
Apre Prisma Studio su http://localhost:5555

### Sincronizzare lo schema (Development)
```bash
npm run db:push
```
⚠️ Usare solo in development. Può causare perdita di dati.

### Creare una migration (Production-safe)
```bash
npm run db:migrate
```
Crea una migration versionata e sicura per production.

---

## Note Importanti

### Gestione ID
- Tutti gli ID usano **auto-increment** PostgreSQL
- Formato: integer sequenziale (1, 2, 3, ...)

### Timestamp
- `tick_created_at`: Impostato automaticamente alla creazione
- `tick_updated_at`: Aggiornato automaticamente da Prisma
- `tick_closed_at`: Deve essere impostato manualmente quando il ticket viene chiuso

### SSL Requirement
- Il database Neon richiede **SSL obbligatorio** (`sslmode=require`)
- Assicurarsi che la stringa di connessione includa `?sslmode=require`

### Performance
- Gli indici sono configurati su campi frequentemente filtrati
- `tick_status`, `tick_usr_id`, `tick_cust_id` sono indicizzati per query veloci

### Sicurezza Password
⚠️ **IMPORTANTE**: Le password sono attualmente in **plain text**
- In produzione, usare **bcrypt** o **argon2** per l'hashing
- Aggiornare il campo `usr_pwd` per contenere hash invece di testo

---

## Connection Pooling

Neon usa connection pooling di default (notare `-pooler` nell'hostname).

**Best Practices:**
- Non creare nuove istanze di `PrismaClient` - usare sempre il singleton in `src/lib/prisma.ts`
- In serverless environments, il pooling è gestito automaticamente
- Il numero massimo di connessioni è gestito da Neon

---

## Stato Attuale del Database

**Tabelle:** 5 (users, partners, customers, carnets, tickets)
**Foreign Keys:** 4 (con supporto per relazioni opzionali)
**Indexes:** 9 totali (inclusi primary keys)
