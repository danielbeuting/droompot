# Droompot v1.2 — centrale Netlify-opslag

Deze versie is voorbereid op Netlify Functions + Netlify Blobs.

## Belangrijk
De oude drag-and-drop upload van alleen de statische map is niet voldoende voor deze centrale versie.
Netlify moet de `netlify/functions` map en de npm dependency `@netlify/blobs` kunnen bouwen.

## Environment variables
Maak in Netlify twee environment variables aan:
- ADMIN_USERNAME = Annejet
- ADMIN_PASSWORD = yuki

De browser stuurt deze login alleen mee wanneer instellingen worden opgeslagen.
De serverfunctie controleert de gegevens voordat centrale data mag worden gewijzigd.

## Wat wordt centraal opgeslagen?
Eén JSON-object met de actuele Droompot:
- naam en geboortedatum
- foto
- kleurthema
- spaardoelen en bedragen
- transacties
- verlanglijstje

De publieke app leest dit object bij het openen. Wijzigingen vanuit Settings worden na Opslaan naar dezelfde centrale opslag geschreven.

## Productafbeeldingen
De browser vraagt `/.netlify/functions/product-metadata` om een productpagina server-side op te halen.
De functie probeert eerst Open Graph / Twitter metadata rechtstreeks van de productpagina te lezen.
Als dat niet lukt, gebruikt hij Microlink als fallback.
Sommige webshops kunnen externe metadata-opvraging blokkeren; er is daarom altijd een emoji-fallback.
