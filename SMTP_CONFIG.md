# Configurazione SMTP per l'Invio Email

Quando viene creato un nuovo ticket, il sistema invia automaticamente una email al partner dell'utente (se configurato).

## Configurazione nel file .env

Aggiungi le seguenti variabili al tuo file `.env`:

```env
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@example.com
SMTP_PASS=your-smtp-key
SMTP_FROM=noreply@yourdomain.com

# Email del partner (destinatario notifiche)
PARTNER_EMAIL=partner@example.com
```

## Servizi SMTP Gratuiti Consigliati

### 1. Brevo (ex Sendinblue) - **CONSIGLIATO**
- **Limite gratuito**: 300 email/giorno
- **Registrazione**: https://www.brevo.com/
- **Configurazione**:
  ```env
  SMTP_HOST=smtp-relay.brevo.com
  SMTP_PORT=587
  SMTP_SECURE=false
  SMTP_USER=your-brevo-email@example.com
  SMTP_PASS=your-smtp-key-from-brevo
  ```

**Come ottenere le credenziali Brevo:**
1. Registrati su https://www.brevo.com/
2. Vai in "Settings" → "SMTP & API"
3. Copia le credenziali SMTP mostrate
4. Crea una nuova SMTP Key se necessario

### 2. Resend
- **Limite gratuito**: 100 email/giorno, 3.000 email/mese
- **Registrazione**: https://resend.com/
- **Configurazione**:
  ```env
  SMTP_HOST=smtp.resend.com
  SMTP_PORT=587
  SMTP_SECURE=false
  SMTP_USER=resend
  SMTP_PASS=your-resend-api-key
  ```

### 3. Gmail SMTP
- **Limite**: Circa 500 email/giorno
- **Richiede**: App Password (2FA deve essere attivo)
- **Configurazione**:
  ```env
  SMTP_HOST=smtp.gmail.com
  SMTP_PORT=587
  SMTP_SECURE=false
  SMTP_USER=your-gmail@gmail.com
  SMTP_PASS=your-16-char-app-password
  ```

**Come ottenere App Password di Gmail:**
1. Attiva la verifica in due passaggi su Google Account
2. Vai su https://myaccount.google.com/apppasswords
3. Seleziona "App: Mail" e "Dispositivo: Windows Computer"
4. Copia la password di 16 caratteri generata

## Formato Email Inviata

Quando un utente crea un ticket, viene inviata una email con:

**Oggetto**: `Nuovo Ticket #123: Titolo del ticket`

**Corpo**:
- Nome utente che ha creato il ticket
- Partner associato
- Titolo del ticket
- Descrizione
- Priorità
- ID del ticket
- Numero di allegati (se presenti)

**Allegati**: Tutti i file caricati dall'utente vengono allegati all'email.

## Testing

Se le variabili SMTP non sono configurate:
- Il ticket verrà creato normalmente
- Gli allegati saranno salvati
- L'email NON verrà inviata (verrà solo loggato un warning nella console)

## Troubleshooting

**Email non vengono inviate:**
1. Controlla che tutte le variabili SMTP siano configurate nel file .env
2. Verifica i log del server per eventuali errori
3. Controlla che la password SMTP sia corretta
4. Assicurati che PARTNER_EMAIL sia configurato

**Errore "535 Authentication failed":**
- Verifica username e password SMTP
- Se usi Gmail, assicurati di usare una App Password, non la tua password normale

**Errore "Connection timeout":**
- Verifica che la porta SMTP sia corretta (587 per la maggior parte dei servizi)
- Controlla il firewall/antivirus

## Note Importanti

- La funzionalità email è **opzionale**: il sistema funziona anche senza configurazione SMTP
- Per ambiente di sviluppo puoi usare servizi come Ethereal (solo testing): https://ethereal.email/
- In produzione, usa sempre servizi professionali per garantire la deliverability
