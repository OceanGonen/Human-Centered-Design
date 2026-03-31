const tekstArtikel     = document.getElementById('text');
const annotatiesSectie = document.getElementById('notes');
const annotatieLijst   = document.getElementById('annotation-list');
const liveRegio        = document.getElementById('live-region');

let zinnen         = [];   
let actieveZin     = null; 
let actieveKaart   = null; 
let huidigScherm   = 'tekst';
let onthoudenzin   = null;


// ── Zinnen splitsen 

function maakZinnen() {
  const alineas = Array.from(tekstArtikel.querySelectorAll('p:not(.text-meta)'));

  alineas.forEach(function (alinea) {
    const tekst = alinea.textContent.trim();
    const delen = tekst.match(/[^.!?]+[.!?]+\s*/g) || [tekst];

    const nieuweZinnen = delen
      .map(function (z) { return z.trim(); })
      .filter(function (z) { return z.length > 0; })
      .map(function (z) {
        const p = document.createElement('p');
        p.className = 'sentence';
        p.textContent = z;
        return p;
      });

    alinea.replaceWith(...nieuweZinnen);
    zinnen = zinnen.concat(nieuweZinnen);
  });

  zinnen.forEach(function (zin, i) {
    zin.id = 'zin-' + i;
  });

  var titel  = tekstArtikel.querySelector('h1').textContent.trim();
  var auteur = tekstArtikel.querySelector('.text-meta').textContent.split('·')[0].trim();
  var hoofdElement = document.querySelector('main');
  hoofdElement.setAttribute('role', 'none');
  hoofdElement.setAttribute('aria-label', titel + ' by ' + auteur + ",");

  tekstArtikel.setAttribute('role', 'application');
  tekstArtikel.setAttribute('aria-roledescription', 'literature');
  tekstArtikel.setAttribute('tabindex', '0');
  tekstArtikel.addEventListener('keydown', handleTekstToets);

  if (zinnen.length > 0) {
    actieveZin = zinnen[0];
    zinnen[0].classList.add('active');
  }

  tekstArtikel.addEventListener('focus', function () {
    if (actieveZin) {
      liveRegio.textContent = '';
      setTimeout(function () {
        liveRegio.textContent = actieveZin.textContent;
      }, 50);
    }
  });
}


// ── Zin activeren 

function activeerZin(zin) {
  if (actieveZin) {
    actieveZin.classList.remove('active');
  }
  actieveZin = zin;
  zin.classList.add('active');
  zin.scrollIntoView({ block: 'nearest' });

  liveRegio.textContent = '';
  setTimeout(function () {
    liveRegio.textContent = zin.textContent;
  }, 50);
}


// ── Tekst navigatie 

function handleTekstToets(e) {
  if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
    e.preventDefault();
    var index = zinnen.indexOf(actieveZin);
    if (index < zinnen.length - 1) activeerZin(zinnen[index + 1]);
  }
  if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
    e.preventDefault();
    var index = zinnen.indexOf(actieveZin);
    if (index > 0) activeerZin(zinnen[index - 1]);
  }
  if (e.key === 'Enter') {
    e.preventDefault();
    openAnnotatieVenster();
  }
}


// ── Annotaties navigatie 
// Zelfde patroon als tekst: de sectie is focusbaar,
// pijltoetsen wisselen de actieve kaart, Enter opent de kaart.

function initAnnotatiesNavigatie() {
  annotatiesSectie.setAttribute('role', 'application');
  annotatiesSectie.setAttribute('tabindex', '0');
  annotatiesSectie.addEventListener('keydown', handleAnnotatieToets);
}

function handleAnnotatieToets(e) {
  var kaarten = Array.from(annotatieLijst.querySelectorAll('.annotation-card'));
  if (kaarten.length === 0) return;

  if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
    e.preventDefault();
    var index = kaarten.indexOf(actieveKaart);
    var volgende = kaarten[index + 1] || kaarten[0];
    activeerKaart(volgende);
  }
  if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
    e.preventDefault();
    var index = kaarten.indexOf(actieveKaart);
    var vorige = kaarten[index - 1] || kaarten[kaarten.length - 1];
    activeerKaart(vorige);
  }
  if (e.key === 'Enter' && actieveKaart) {
    e.preventDefault();
    openBewerkVenster(actieveKaart);
  }
}

function activeerKaart(kaart) {
  if (actieveKaart) {
    actieveKaart.classList.remove('active');
  }
  actieveKaart = kaart;
  kaart.classList.add('active');
  kaart.scrollIntoView({ block: 'nearest' });

  liveRegio.textContent = '';
  setTimeout(function () {
    liveRegio.textContent = kaart.querySelector('.annotation-zin').textContent;
  }, 50);
}

// Eerste kaart activeren zodra de sectie focus krijgt
annotatiesSectie.addEventListener('focus', function () {
  var kaarten = Array.from(annotatieLijst.querySelectorAll('.annotation-card'));
  if (kaarten.length > 0 && !actieveKaart) {
    activeerKaart(kaarten[0]);
  }
  if (kaarten.length > 0 && actieveKaart) {
    activeerKaart(actieveKaart); 
  }
});


// ── Nieuwe Annotatie venster 

const dialoogElement  = document.getElementById('dialog');
const dialoogZinTekst = document.getElementById('dialog-sentence');
const annuleerKnop    = document.getElementById('cancel-btn');
const opslaanKnop     = document.getElementById('save-btn');
const notitieTekstvak = document.getElementById('note');
const recordKnop      = document.getElementById('record-btn');
const recordStatus    = document.getElementById('record-status');

let mediaRecorder  = null;
let audioChunks    = [];
let opgenomenAudio = null; 

// ── Spraakopname 

recordKnop.addEventListener('click', function () {
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    mediaRecorder.stop();
  } else {
    startOpname();
  }
});

async function startOpname() {
  try {
    var stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];

    mediaRecorder.ondataavailable = function (e) {
      audioChunks.push(e.data);
    };

    mediaRecorder.onstop = function () {
      var blob = new Blob(audioChunks, { type: 'audio/webm' });
      stream.getTracks().forEach(function (t) { t.stop(); });

      var reader = new FileReader();
      reader.onloadend = function () {
        opgenomenAudio = reader.result;
      };
      reader.readAsDataURL(blob);

      recordKnop.textContent = 'Record again';
      recordStatus.textContent = 'Recording saved.';
    };

    mediaRecorder.start();
    recordKnop.textContent = 'Stop recording';
    recordStatus.textContent = 'Recording…';

  } catch (err) {
    recordStatus.textContent = 'Microphone not available.';
  }
}

function resetOpname() {
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    mediaRecorder.stop();
  }
  mediaRecorder  = null;
  audioChunks    = [];
  opgenomenAudio = null;
  recordKnop.textContent = 'Record voice note';
  recordStatus.textContent = '';
}


function openAnnotatieVenster() {
  dialoogZinTekst.textContent = actieveZin.textContent;
  notitieTekstvak.value = '';
  resetOpname();
  dialoogElement.showModal();
}

function openBewerkVenster(kaart) {
  // Vul het dialoog met de bestaande teksten uit de kaart
  dialoogZinTekst.textContent = kaart.querySelector('.annotation-zin').textContent;
  notitieTekstvak.value = kaart.querySelector('.annotation-text').textContent;

  // Sla de kaart op zodat de opslaan-knop weet wat hij moet bijwerken
  dialoogElement.dataset.bewerkKaart = Array.from(annotatieLijst.querySelectorAll('.annotation-card')).indexOf(kaart);

  dialoogElement.showModal();
}

function sluitAnnotatieVenster() {
  dialoogElement.close();
  if (huidigScherm === 'annotaties') {
    annotatiesSectie.focus();
  } else {
    tekstArtikel.focus();
  }
}

annuleerKnop.addEventListener('click', function () {
  resetOpname();
  sluitAnnotatieVenster();
});

dialoogElement.addEventListener('close', function () {
  delete dialoogElement.dataset.bewerkKaart;
  if (huidigScherm === 'annotaties') {
    annotatiesSectie.focus();
  } else {
    tekstArtikel.focus();
  }
});


// ── Annotatie opslaan 

opslaanKnop.addEventListener('click', function () {
  var notitie = notitieTekstvak.value.trim();
  var bewerkIndex = dialoogElement.dataset.bewerkKaart;

  if (bewerkIndex !== undefined) {
    // Bestaande kaart bijwerken
    var kaarten = Array.from(annotatieLijst.querySelectorAll('.annotation-card'));
    var kaart = kaarten[parseInt(bewerkIndex)];
    kaart.querySelector('.annotation-text').textContent = notitie;
  } else {
    // Nieuwe kaart toevoegen
    voegAnnotatieToe(actieveZin.textContent, notitie, opgenomenAudio);
  }

  notitieTekstvak.value = '';
  sluitAnnotatieVenster();
});

function voegAnnotatieToe(zinTekst, notitie, audio) {
  var lege = annotatieLijst.querySelector('li');
  if (lege && lege.textContent === 'No annotations yet.') {
    annotatieLijst.removeChild(lege);
  }

  var li      = document.createElement('li');
  var artikel = document.createElement('article');
  artikel.className = 'annotation-card';

  var zinPreview = document.createElement('p');
  zinPreview.className = 'annotation-zin';
  zinPreview.textContent = zinTekst;

  var notitieAlinea = document.createElement('p');
  notitieAlinea.className = 'annotation-text';
  notitieAlinea.textContent = notitie;

  artikel.appendChild(zinPreview);
  artikel.appendChild(notitieAlinea);

  if (audio) {
    var audioEl = document.createElement('audio');
    audioEl.controls = true;
    audioEl.setAttribute('aria-label', 'Voice note');
    audioEl.src = audio;
    artikel.appendChild(audioEl);
  }

  li.appendChild(artikel);
  annotatieLijst.appendChild(li);
  resetOpname();
}


// ── Alt+A: wisselen 

document.addEventListener('keydown', function (e) {
  if (e.altKey && e.key === 'a') {
    e.preventDefault();
    wisselScherm();
  }
});

function wisselScherm() {
  if (huidigScherm === 'tekst') {
    onthoudenzin = actieveZin;
    huidigScherm = 'annotaties';
    annotatiesSectie.focus();
  } else {
    huidigScherm = 'tekst';
    if (onthoudenzin) activeerZin(onthoudenzin);
    tekstArtikel.focus();
  }
}


// ── Start 

document.addEventListener('DOMContentLoaded', function () {
  maakZinnen();
  initAnnotatiesNavigatie();
});
