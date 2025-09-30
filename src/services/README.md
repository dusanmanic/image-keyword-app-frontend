# API Services

Ovaj folder sadrži sve API pozive organizovane po domenima.

## Struktura

### `authService.js`
Servisi za autentifikaciju korisnika:
- `loginUser(email, password)` - Login korisnika
- `registerUser(email, password)` - Registracija novog korisnika
- `getAuthToken()` - Dobijanje auth tokena iz localStorage
- `getAuthHeaders()` - Dobijanje headers sa auth tokenom

### `analyzeService.js`
Servisi za analizu slika pomoću AI:
- `analyzeImage(imageBlob, maxKeywords, prompt)` - Analiza slike i generisanje metapodataka (title, description, keywords)

### `tsvService.js`
Servisi za TSV fajlove i sales podatke:
- `parseTsvFile(file)` - Parsiranje TSV fajla
- `getSalesData()` - Dobijanje sales podataka iz baze

## Konfiguracija API URL-a

API URL se konfigurište preko environment varijabli u `.env` fajlu:

```bash
# .env - Za lokalni backend
VITE_API_URL=http://localhost:3001

# .env - Za production backend (Railway)
VITE_API_URL=https://image-keyword-app-backend-production.up.railway.app
```

### Kako radi

Ako je `VITE_API_URL` postavljen u `.env`:
- Aplikacija će **direktno** komunicirati sa tim backend URL-om
- Primer: `https://image-keyword-app-backend-production.up.railway.app/analyze`

Ako `VITE_API_URL` NIJE postavljen:
- U development modu koristi Vite proxy (relativni URL-ovi)
- Vite proxy automatski preusmjerava na `localhost:3001`

**⚠️ VAŽNO**: Nakon izmene `.env` fajla, MORA se restartovati dev server!

```bash
# Zaustavi server (Ctrl+C)
npm run dev  # Pokreni ponovo
```

Konfiguracija se učitava preko `/src/config/api.js` modula.

## Napomena

Fetch pozivi za učitavanje slika (image blob-ova) nisu izdvojeni u services, već ostaju u komponentama pošto su specifični za rad sa slikama.

## Upotreba

```javascript
// Primer za auth
import { loginUser, getAuthHeaders } from '../services/authService.js';

// Primer za analizu
import { analyzeImage } from '../services/analyzeService.js';

// Primer za TSV
import { parseTsvFile, getSalesData } from '../services/tsvService.js';
```
