# Droompot V2 deploy

Netlify build gebruikt deze publieke Vite-variabelen:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

De Supabase publishable key is bewust browser-publiek en mag in de gebouwde JavaScript-bundle terechtkomen. Zet deze daarom niet nogmaals in Netlify als een geheime variabele met een andere naam; Netlify secret scanning kan de build dan blokkeren wanneer dezelfde waarde in de frontend-bundle verschijnt.

Server-only secrets moeten nooit een `VITE_`-prefix krijgen en horen niet in clientcode.
