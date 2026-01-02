# DeskUp - Sistema di Gestione Tickets di Consulenza

DeskUp è un'applicazione web per la gestione di tickets di consulenza con sistema di autenticazione basato su ruoli.

## Tecnologie

- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS
- **Backend**: Next.js Server Actions, Prisma ORM
- **Database**: PostgreSQL (Neon Serverless)
- **Linguaggio**: TypeScript
- **Autenticazione**: Cookie-based sessions

## Prerequisiti

- Node.js 18.17 o superiore
- PostgreSQL (già configurato con Neon)
- npm o yarn

## Setup Iniziale

1. **Installa le dipendenze**:
   ```bash
   npm install
   ```

2. **Il database è già configurato**:
   - Le credenziali Neon sono in `.env`
   - Lo schema è già sincronizzato

3. **Avvia il server di sviluppo**:
   ```bash
   npm run dev
   ```

L'applicazione sarà disponibile su http://localhost:3000

## Credenziali di Accesso

### Amministratore (role = 0)
- Email: `guidetti@softintime.com`
- Password: `Guido2025!`

### Utente (role = 2)
- Email: `esempio@softintime.com`
- Password: `Esempio2025!`

## Comandi Disponibili

### Sviluppo
```bash
npm run dev          # Avvia il server di sviluppo
npm run build        # Crea la build di produzione
npm start            # Avvia il server di produzione
npm run lint         # Esegue ESLint
```

### Database
```bash
npm run db:generate  # Genera il Prisma Client
npm run db:push      # Sincronizza lo schema con il database
npm run db:migrate   # Crea e applica una migration
npm run db:studio    # Apre Prisma Studio (GUI per il database)
```

## Struttura dell'Applicazione

### Sistema di Autenticazione
- Login page: `/login`
- Logout: Form in ogni dashboard
- Sessioni: Cookie-based (7 giorni di validità)

### Dashboard Amministratore (role = 0)
Menu disponibili:
- **Utenti**: Visualizza e gestisci tutti gli utenti
- **Clienti**: Visualizza e gestisci i clienti
- **Carnets**: Visualizza e gestisci i carnets
- **Tickets**: Gestione tickets (in attesa di specifiche)

### Dashboard Utente (role = 2)
Menu disponibili:
- **Apri un nuovo Ticket**: Crea nuove richieste (in attesa di specifiche)
- **Consulta i tuoi Tickets**: Visualizza i propri tickets (in attesa di specifiche)

## Struttura del Database

### Tabelle Principali

**users**: Utenti del sistema
- `usr_id`: ID auto-incrementale
- `usr_name`: Nome utente
- `usr_mail`: Email (usata per login)
- `usr_pwd`: Password (plain text - da migliorare in produzione)
- `usr_role`: Ruolo (0 = Admin, 2 = Utente)
- `usr_cust_id`: Riferimento opzionale al cliente

**customers**: Clienti
- `cust_id`: ID auto-incrementale
- `cust_name`: Nome cliente
- `cust_address`: Indirizzo
- `cust_city`: Città
- `cust_state`: Provincia/Stato
- `cust_country`: Paese (default: ITALY)

**carnets**: Carnets
- `carn_id`: ID auto-incrementale
- `carn_des`: Descrizione
- `carn_um`: Unità di misura (G=Giornate, H=Ore, T=Tickets)
- `carn_qta`: Quantità
- `carn_price`: Prezzo
- `carn_note`: Note

Vedere `DATABASE.md` per documentazione completa del database.

## Struttura del Progetto

```
deskup/
├── prisma/
│   └── schema.prisma           # Schema del database
├── src/
│   ├── app/
│   │   ├── actions/
│   │   │   └── auth.ts         # Server Actions per autenticazione
│   │   ├── login/              # Pagina di login
│   │   ├── dashboard/
│   │   │   ├── admin/          # Dashboard amministratore
│   │   │   │   ├── users/      # Gestione utenti
│   │   │   │   ├── customers/  # Gestione clienti
│   │   │   │   ├── carnets/    # Gestione carnets
│   │   │   │   └── tickets/    # Gestione tickets (placeholder)
│   │   │   └── user/           # Dashboard utente
│   │   │       └── tickets/    # Sezione tickets utente (placeholder)
│   │   ├── layout.tsx          # Layout principale
│   │   └── page.tsx            # Homepage (redirect)
│   ├── components/
│   │   └── dashboard-layout.tsx # Layout dashboard
│   └── lib/
│       ├── auth.ts             # Utilities autenticazione
│       ├── prisma.ts           # Client Prisma
│       └── utils.ts            # Funzioni utility
└── public/                     # File statici
```

## Flusso di Autenticazione

1. L'utente accede a `/login`
2. Inserisce email e password
3. Il server verifica le credenziali contro il database
4. Se valide, crea una sessione cookie
5. Redirige alla dashboard appropriata:
   - role = 0 → `/dashboard/admin`
   - role = 2 → `/dashboard/user`
6. Ogni pagina protetta verifica la sessione e il ruolo

## Sicurezza

⚠️ **Note di Sicurezza**:
- Le password sono attualmente in **plain text** nel database
- In produzione usare **bcrypt** o **argon2** per l'hashing
- Le sessioni sono salvate in cookie HttpOnly
- Implementare CSRF protection per produzione

## Prossimi Sviluppi

- [ ] Implementare sistema completo tickets (seguiranno specifiche)
- [ ] Hash delle password con bcrypt
- [ ] Form CRUD per Utenti, Clienti e Carnets
- [ ] Filtri e ricerca avanzata
- [ ] Notifiche email
- [ ] Report e statistiche
- [ ] Sistema di permessi più granulare
