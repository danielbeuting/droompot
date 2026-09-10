# Droompot v0.7

Nieuwe product-UX:
- Nieuw openingsscherm met:
  - Ga naar Droompot
  - Ga naar verlanglijstje
- Op de Droompot-home staat nu ook een duidelijke knop naar het verlanglijstje.
- Terminologie aangepast naar 'verlanglijstje'.

Spaardoelen:
- Elk normaal spaardoel toont nu hoeveel geld er nog nodig is.
- Bij een behaald doel staat 'Doel behaald ✓'.
- De doorstreeplijn bij behaalde doelen is dikker.
- Behaalde doelen verdwijnen uit de spaardoel-dropdown.
- Behaalde doelen blijven wel zichtbaar in het overzicht als afgeronde droom.

Animatie:
- Spaarvarken is nu een eigen zijaanzicht in plaats van een emoji.
- Munt is groter en het bedrag erop is nadrukkelijker zichtbaar.
- Bij het behalen van een doel verandert de bedanktekst naar een expliciete melding dat het doel behaald is.
- Feestmodus blijft behouden.

Geen echte betalingen; alles blijft lokale browserdata.


## v0.7.1
- Spaarvarken in de animatie visueel aangepast richting de echte Droompot: rond, compact, roze, snuit, oren en gleuf bovenop.
- Op het verlanglijstje staat nu een knop 'Ga naar Droompot'.
- Navigatie werkt nu beide kanten op.
- Terminologie verder gestandaardiseerd naar 'verlanglijstje'.


## v0.8
- De aangeleverde Droompot-varkensafbeelding wordt nu als echte merkasset gebruikt.
- De zwarte D linksboven is vervangen door het Droompot-varkentje.
- Ook op het openingsscherm staat nu het echte Droompot-varkentje centraal.
- De animatie gebruikt nu de echte varkensafbeelding in plaats van het CSS-varkentje.
- De knop 'Ga naar Droompot' op het verlanglijstje gebruikt nu eveneens het echte varkentje.
- Startknoppen hebben veel sterker contrast gekregen.
- Donateurs houden bewust hun letter-avatar; het varkentje wordt daar niet herhaald om visuele overdaad te voorkomen.


## v0.9
- Animatietekst en bedanktekst volledig gecentreerd.
- Verder-knop gecentreerd direct onder het Droompot-varkentje.
- Varkentje in de knop op het verlanglijstje wordt niet meer afgesneden.
- Droompot-profielkaart bevat nu korte uitleg.
- Geboortedatum toegevoegd aan instellingen.
- Leeftijd + aantal dagen tot verjaardag zichtbaar bij Robin.
- Spaardoel-kaarten sluiten qua achtergrond aan op de rest van de app.
- Spaardoelen-menu is nu uitleg in plaats van praktisch beheer.
- Spaarrekening-menu legt het belang van sparen uit.
- Over Droompot bevat visie op sparen, bewuste cadeaus, kwaliteit en veiligheid.
- Nieuwe pagina 'Waar gaat het geld heen?'.
- Nieuwe Referral-programma-pagina met kopieerbare demo-link.
- Contactpagina met Annejet & Daniël, e-mail en telefoonnummer.
- Bij bijdragen aan de algemene spaarrekening wordt geen spaardoel meer genoemd in de betaalflow.


## v1.0 — final polish
- Geboortedatum blijft netjes binnen de settings-card op mobiel.
- Schaduw en afwijkende achtergrond van de swipebare spaardoelen verwijderd.
- Bedrag op het muntje blijft tijdens de animatie recht leesbaar.
- Verder-knop staat direct onder het varken; bedanktekst daarna.
- Algemene spaarrekening staat als laatste in de spaardoelen.
- Navigatiedots onder de spaardoelen bewegen betrouwbaarder mee met swipen.
- Dots zijn nu ook klikbaar om direct naar een doel te gaan.
- Gouden melding 'spaardoel behaald' verdwijnt automatisch na circa 2,5 seconde.


## v1.1
- Standaardkind gewijzigd naar Noï.
- Standaard geboortedatum: 26 september 2024.
- Nieuwe meegeleverde profielfoto van Noï.
- Profielfoto op Droompot-home groter gemaakt.
- Geboortedatuminput extra mobiel begrensd.
- Spaardoel-dots worden tijdens het swipen continu bijgewerkt.
- Donatie-animatie heeft vaste schermposities: Verder staat direct onder het varken.
- Settings heeft een demo-login: Annejet / yuki.
- Verlanglijstje-producten worden nu in Settings beheerd.
- Productpagina kan via metadata worden uitgelezen voor titel + productafbeelding; emoji is fallback.
- Spaarrekening heeft een rente-op-rente calculator met 1,6% per jaar tot de 18e verjaardag.


## v1.2
- Droompot-varken hoger gecentreerd tussen uitgelicht doel en Verder.
- Productmetadata loopt via een Netlify serverfunctie met directe OpenGraph/Twitter-image extractie en Microlink fallback.
- Netlify Blobs backend toegevoegd voor gedeelde centrale Droompot-data.
- Settings kan centraal opslaan zodra Netlify Functions actief zijn.
- Publieke app probeert bij openen automatisch de centrale data te laden.


## v1.2.1 metadata hotfix
- Productmetadata-extractor uitgebreid met JSON-LD Product schema.
- Ondersteunt `link rel=image_src`.
- Speciale herkenning voor productafbeeldingen op `media.s-bol.com`.
- Extra herkenning van EAN/GTIN op productpagina's.
- Microlink blijft fallback.
- Als een webshop geautomatiseerd uitlezen blokkeert, blijft de emoji-fallback actief.


## v1.2.2
- Productprijs wordt nu ook automatisch uit productmetadata / JSON-LD gehaald.
- Gevonden prijs wordt automatisch ingevuld in Settings.
- Als geen prijs wordt gevonden, moet die handmatig worden ingevuld.
- Emoji-optie bij het toevoegen van producten verwijderd.
- Als geen productfoto beschikbaar is, wordt het Droompot-varkentje gebruikt.
- Prijs wordt opgeslagen en op het verlanglijstje weergegeven.


## v1.3
- Na één succesvolle settings-login blijft de beheerder ingelogd op dat apparaat.
- Optionele foto toegevoegd aan een bijdrage; deze verschijnt als ronde avatar bij recente bijdragen.
- Zonder foto blijft de eerste letter zichtbaar.
- Zowel CONTANT als DIGITAAL hebben nu een label.
- Spaardoelen kunnen in Settings worden toegevoegd, aangepast en verwijderd.
- Algemene spaarrekening is vast en kan niet worden verwijderd.
- Optionele korte beschrijving per spaardoel toegevoegd.
- Spaardoel-kaarten hebben meer kleur/contrast en design.
- Droompot-varkentje linksboven groter en zonder witte achtergrond.
- Recente bijdragen kunnen in Settings worden verwijderd voor moderatie.
- Settings heeft nu aparte secties: Profiel, Stijl, Spaardoelen, Verlanglijstje en Bijdragen.
- Statische Robin-tekst bij het profiel is vervangen door dynamische naamtekst.

## v1.4
- Sync-status verborgen; één algemene Opslaan-knop blijft leidend.
- Na Opslaan blijf je in Settings en verschijnt een duidelijke bevestiging.
- Nieuwste spaardoel bovenaan; algemene spaarrekening blijft achteraan.
- Verlanglijstje tekst/prijs groter; bijdragen en verlanglijstje begrensd en scrollbaar.
- Renteperiode rekent met resterende jaren tot 18.
- Spaardoelen meer in stijl van profielkaart; spaarrekening met goud accent.
- Neutralere gloed bij doelkeuze; muntbedrag horizontaal leesbaar.
- Deelknop heeft label en deelt droompot.nl met kind-specifieke tekst.
- Extra thema's: geel, paars, beige, dieren, auto en boerderij.
- Bedankmoment bij afstrepen van een cadeau.


## v1.4.2
- Losse Opslaan-knop naast de naam verwijderd; alleen de onderste algemene Opslaan-knop blijft.
- Gewone spaardoelen visueel gelijkgetrokken met de donkere/gekleurde profielkaart.
- Algemene spaarrekening heeft een eigen donkere premiumstijl met gouden rand/accenten.
- 'Je draagt nu bij aan'-dropdown heeft nu een neutrale witte/grijze gloed, in lijn met Digitaal geven / Contant in de pot.


## v1.4.3
- De normale spaardoel-kaarten gebruiken nu letterlijk dezelfde achtergrondbehandeling als het Droompot-eigenaar-vak.
- Alleen formaat/decoratieve positionering is aangepast aan de bredere swipe-kaarten.
- De algemene spaarrekening blijft bewust afwijkend met donker/goud.
