# Human Centered Design — Accessible Annotation Tool

Dit project draait om de ontwikkeling van een toegankelijke annotatietool, specifiek ontworpen vanuit de principes van Human Centered Design voor Roger. Roger is een filosoof met maculadegeneratie die volledig afhankelijk is van een screenreader. Zijn wens is filosofische teksten lezen en per zin aantekeningen kunnen maken in de vorm van tekst of spraakopnames.

## Maandag 30/03

Vandaag heb ik het fundement van deze tool neergezet. Aangezien ik Roger nog niet heb ontmoet, heb ik nog niet zijn persoonlijke functies of wensen kunnen toevoegen. Maar ik heb met een aantal aannames wel wat navigatie shortcuts geimplementeerd en design keuzes gemaakt op basis van persoonlijke aannames.
<img width="1321" height="791" alt="image" src="https://github.com/user-attachments/assets/9090f089-7061-4faa-9df5-a220fa8d6236" />

<img width="1317" height="796" alt="image" src="https://github.com/user-attachments/assets/074d8ce8-ab7c-4069-9797-27189796e143" />




Om de leeservaring voor Roger zo rustig mogelijk te houden, is de tekst opgedeeld in losse zinnen, elk verpakt in een eigen p-element. De volledige applicatie is voorzien van de role="application". Dit is een bewuste technische keuze: hierdoor vangen we de pijltjestoetsen direct op in de browser, in plaats van dat de schermlezer deze gebruikt voor zijn eigen navigatie commando's.

Met de boven en onder pijltjestoetsen kan Roger nu door de zinnen op en neer navigeren. Zodra hij op een zin landt, wordt deze gehighlight met een gele achtergrond en een blauwe rand aan de linkerkant. Voor de auditieve feedback gebruiken we een aria-live="polite" regio. Dit zorgt ervoor dat de schermlezer de zin direct voorleest zonder storende extra informatie zoals "1 van de 80", wat de aandacht van de filosofische inhoud zou weghalen.

Heb nog een beetje styling toegevoegd, vooral voor de lay out.

![Top of Webpage](image.png)

De eerste interface is opgebouwd uit twee kolommen: de tekst/literatuur aan de linkerkant en de annotaties aan de rechterkant. Het annotatiepaneel werkt volgens exact dezelfde logica als de tekstsectie. Met de pijltjestoetsen navigeer je tussen de verschillende 'kaarten' met aantekeningen, en met een druk op Enter open je een kaart om deze te bewerken. Beide panelen krijgen een duidelijke blauwe omlijning wanneer ze gefocust zijn, wat helpt bij de oriëntatie.

Het toevoegen van een annotatie is simpel gehouden. Wanneer Roger op een zin staat en op Enter drukt, opent er een dialoogvenster. 
![Dialog popup to create annotations](image-1.png)


Hier kan hij een tekstnotitie typen of een spraakbericht opnemen. Na het opslaan verschijnt de annotatie als een kaart in het rechterpaneel. Bestaande annotaties kunnen op dezelfde manier worden geopend en gewijzigd.
![Annotation navigation](image-2.png)


Dit zijn de eerste set vaste sneltoetsen dien ik heb geïmplementeerd:

- Pijltjestoetsen: Navigeren door zinnen of annotatiekaarten.
  
- Enter: Annotatie creeren op een geselecteerde zin.

- Alt + A: Snel schakelen tussen de tekst en de annotaties.


## Dinsdag 31/03
### 1ste User test met Roger (59) 

**Belangrijkste Bevindingen**
- Visuele Belasting: Hij kan een paar woorden lezen, maar dit kost veel energie en focus, is onprettig

- Lichtgevoeligheid: Hij is gevoelig voor wit licht; Dark Mode voor gebruiksgemak.

- Typen: Hij kan blind typen, maar het tempo ligt niet erg hoog.

- Voorkeuren: Hij geeft de voorkeur aan een mobiel formaat en werkt graag met spraak-naar-tekst om notities te maken in plaats van audio-opnames.

**Te Implementeren**

- Dark Mode: Standaardinstelling om visuele vermoeidheid en overprikkeling te voorkomen.

- Spraak-naar-tekst Integratie: Voor het efficiënt toevoegen van tekstuele notities zonder te hoeven typen.

- Sortering: De mogelijkheid om annotaties terug te halen op boek en paginanummer.

- Contextuele Annotaties: Elke annotatie wordt gekoppeld aan de specifieke zin in de literatuur. (Wanneer de gebruiker over een geannoteerde zin "hovert" (of deze selecteert), wordt direct zichtbaar dat er een notitie bij hoort)



Na de eerste test ben ik aan de slag gegaan met Dark mode, aangezien wit licht erg onprettig is voor Roger. En de spraakopname zit er nu ook in, zodat hij zijn notities kan inspreken in plaats van typen.

<img width="1915" height="898" alt="image" src="https://github.com/user-attachments/assets/42d17039-9277-4417-8582-a9b8ff2ed9c2" />
<img width="1859" height="792" alt="image" src="https://github.com/user-attachments/assets/f608ded8-24a9-4975-bec8-d874135ce2e7" />

Ik heb ook de meta data van het litertuur, pagina en hoofd toegevoegd 

## Dinsdag 07/04
### 2de User test met Roger
**Belangrijkste Bevindingen**
- Navigatie: De Enter-toets als snelkoppeling voor het aanmaken van annotaties voelt intuïtief en werd positief ontvangen.
  
- Annotatiestrategie: Eén zin annoteren is voldoende voor Roger, mits de context snel teruggevonden kan worden via hoofdstuk en paginanummer.
  
- Leesbaarheid: Het lettertype was te klein voor comfortabel gebruik gegeven zijn beperkte gezichtsscherpte.

Na de tweede test ben ik aan de slag gegaan met een paar dingen. Als subtiel detail heb ik een denkwolkje toegevoegd naast zinnen die al geannoteerd zijn, wat Roger een erg leuk detail vond. Daarnaast heb ik gewerkt aan het terugvinden van annotaties: ze zijn nu gegroepeerd per hoofdstuk en je kan er op filteren. Deze navigeer je met de pijltoetsen op dezelfde manier als de literatuur sectie. Leek mij makkelijk voor Roger omdat het consistent is.

<img width="1891" height="858" alt="image" src="https://github.com/user-attachments/assets/a04844d2-14c4-4fb4-ae54-63770ce4b549" />
<img width="1896" height="840" alt="image" src="https://github.com/user-attachments/assets/3f5435d5-0b5a-4f97-9bb5-1ed2ac9c5a8d" />


Testbevindingen (sessie 3)
Roger kon goed navigeren. De pijltjestoetsen voor zinnen en pagina's voelden intuïtief. Vier verbeterpunten kwamen naar voren:

- Focusborder — bij het wisselen tussen leesgebied en annotaties was niet duidelijk waar hij zich bevond.
- Highlight blijft staan — de blauwe kaartachtergrond bleef zichtbaar na terugkeren naar het leesgebied, was verwarrend waar de focus lag. 
- Edit-knop niet bereikbaar — alleen via muis, niet via toetsenbord.
- Lettertype te klein — voor Roger's verminderd zicht was de tekst te klein.

<img width="1918" height="1075" alt="image" src="https://github.com/user-attachments/assets/27a3b06e-79c4-42fe-9081-bcc65d70c3c6" />


<img width="798" height="619" alt="image" src="https://github.com/user-attachments/assets/1e160d74-e0d9-47fa-abf3-4b75a85ad1c8" />


