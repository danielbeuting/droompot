# Droompot V2 — V1.5.1 is de source of truth

Vanaf dit punt wordt V2 niet als nieuw ontwerp doorontwikkeld. De aangeleverde Droompot v1.5.1 is de vaste basis voor UX, layout, styling, animaties, teksten en bestaande functies.

## Niet opnieuw ontwerpen
De publieke Droompot, het startscherm, profiel, spaardoelen, algemene spaarrekening, bijdrageflow, succes- en muntanimatie, verlanglijstje, menu, informatiepagina's en instellingen worden 1-op-1 vanuit v1.5.1 geporteerd. Geen 'ongeveer dezelfde stijl', maar dezelfde DOM/visuele componenten en dezelfde interacties waar technisch mogelijk.

## Alleen de onderkant verandert
V2 vervangt lokale/demo-techniek door Supabase voor accounts, sessies, data, media en beveiliging. Eén account kan meerdere Droompotten beheren. Publieke links laden de juiste Droompot uit de database.

## Nieuwe schermen
Onboarding, registreren, e-mail bevestigd/check-mail, inloggen, wachtwoordherstel en Mijn Droompotten bestaan niet in v1.5.1. Deze schermen worden daarom nieuw toegevoegd, maar uitsluitend met dezelfde design tokens, typografie, knoppen, kaarten, spacing, mobiele app-shell en merkassets van v1.5.1.

## Migratieregel
Bij twijfel wint v1.5.1. Bestaande v1.5.1 functionaliteit mag niet verdwijnen door de V2-migratie. Nieuwe platformfuncties worden toegevoegd zonder de bestaande gebruikerservaring opnieuw te ontwerpen.
