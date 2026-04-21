'use strict';

const textArticle    = document.getElementById('text');
const annotationsSec = document.getElementById('notes');
const annotationList = document.getElementById('annotation-list');
const liveRegion     = document.getElementById('live-region');
const pageIndicator  = document.getElementById('page-indicator');
const prevBtn        = document.getElementById('prev-page');
const nextBtn        = document.getElementById('next-page');
const chapterFilter  = document.getElementById('chapter-filter');

let sentences        = [];
let activeSentence   = null;
let activeCard       = null;
let currentScreen    = 'text';
let rememberedSen    = null;
let annotations      = [];
let activeFilter     = 'all';
let activeFilterIndex = 0;
let suppressNextFocusAnnounce = false;

const pages = Array.from(document.querySelectorAll('.page'));
let currentPageIndex = 0;


// ── Helpers

function announce(text) {
  liveRegion.textContent = '';
  setTimeout(function () { liveRegion.textContent = text; }, 50);
}

function currentPage() {
  return pages[currentPageIndex];
}

var romanToWord = {
  'I': 'one', 'II': 'two', 'III': 'three', 'IV': 'four',
  'V': 'five', 'VI': 'six', 'VII': 'seven', 'VIII': 'eight',
  'IX': 'nine', 'X': 'ten'
};

function chapterLabel(ch) {
  return romanToWord[ch] || ch;
}


// ── Page navigation

function showPage(index) {
  pages.forEach(function (p) { p.hidden = true; });
  pages[index].hidden = false;

  sentences = [];
  activeSentence = null;
  buildSentences(pages[index]);

  var page    = pages[index];
  var pageNum = page.dataset.page;
  var chapter = page.dataset.chapter;
  var total   = pages.length;

  pageIndicator.textContent =
    'Chapter ' + chapter + ', page ' + pageNum + ' of ' + total;

  prevBtn.disabled = index === 0;
  nextBtn.disabled = index === pages.length - 1;

  markAnnotatedSentences();
  announce(
    'Chapter ' + chapterLabel(chapter) + ', page ' + pageNum + ' of ' + total + '. ' +
    (sentences[0] ? sentences[0].textContent : '')
  );
  suppressNextFocusAnnounce = true;
  textArticle.focus();
}

prevBtn.addEventListener('click', function () {
  if (currentPageIndex > 0) {
    currentPageIndex--;
    showPage(currentPageIndex);
  }
});

nextBtn.addEventListener('click', function () {
  if (currentPageIndex < pages.length - 1) {
    currentPageIndex++;
    showPage(currentPageIndex);
  }
});


// ── Build sentences for the current page

function buildSentences(page) {
  var paragraphs = Array.from(page.querySelectorAll('p:not(.text-meta)'));

  paragraphs.forEach(function (paragraph) {
    var text  = paragraph.textContent.trim();
    var parts = text.match(/[^.!?]+[.!?]+\s*/g) || [text];

    var newSentences = parts
      .map(function (s) { return s.trim(); })
      .filter(function (s) { return s.length > 0; })
      .map(function (s) {
        var p = document.createElement('p');
        p.className = 'sentence';
        p.textContent = s;
        return p;
      });

    paragraph.replaceWith.apply(paragraph, newSentences);
    sentences = sentences.concat(newSentences);
  });

  sentences.forEach(function (sentence, i) {
    sentence.id = 'sentence-' + i;
  });

  textArticle.setAttribute('role', 'application');
  textArticle.setAttribute('aria-roledescription', 'reading area');
  textArticle.setAttribute('tabindex', '0');
  textArticle.addEventListener('keydown', handleTextKey);

  if (sentences.length > 0) {
    activeSentence = sentences[0];
    sentences[0].classList.add('active');
  }

  textArticle.addEventListener('focus', function () {
    if (suppressNextFocusAnnounce) {
      suppressNextFocusAnnounce = false;
      return;
    }
    if (activeSentence) announce(activeSentence.textContent);
  });
}


// ── Activate a sentence

function activateSentence(sentence) {
  if (activeSentence) activeSentence.classList.remove('active');
  activeSentence = sentence;
  sentence.classList.add('active');
  sentence.scrollIntoView({ block: 'nearest' });
  announce(sentence.textContent);
}


// ── Text keyboard handler

function handleTextKey(e) {
  var index = sentences.indexOf(activeSentence);

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (index < sentences.length - 1) {
      activateSentence(sentences[index + 1]);
    } else if (currentPageIndex < pages.length - 1) {
      currentPageIndex++;
      showPage(currentPageIndex);
    }
  }

  if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (index > 0) {
      activateSentence(sentences[index - 1]);
    } else if (currentPageIndex > 0) {
      currentPageIndex--;
      showPage(currentPageIndex);
      setTimeout(function () {
        if (sentences.length > 0) activateSentence(sentences[sentences.length - 1]);
      }, 50);
    }
  }

  if (e.key === 'Enter') {
    e.preventDefault();
    openAnnotationDialog();
  }
}


// ── Annotations panel navigation

function initAnnotationsNav() {
  annotationsSec.setAttribute('role', 'application');
  annotationsSec.setAttribute('tabindex', '0');
  annotationsSec.addEventListener('keydown', handleAnnotationKey);
}

function handleAnnotationKey(e) {
  var filterBtns = Array.from(chapterFilter.querySelectorAll('.filter-btn'));
  var focusOnFilter = document.activeElement && document.activeElement.classList.contains('filter-btn');

  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
    e.preventDefault();
    var next = e.key === 'ArrowRight'
      ? (activeFilterIndex + 1) % filterBtns.length
      : (activeFilterIndex - 1 + filterBtns.length) % filterBtns.length;
    activeFilterIndex = next;
    filterBtns[next].click();
    filterBtns[next].focus();
    return;
  }

  if (focusOnFilter) return;
  var cards = visibleCards();
  if (cards.length === 0) return;

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    var index = cards.indexOf(activeCard);
    activateCard(cards[(index + 1) % cards.length]);
  }

  if (e.key === 'ArrowUp') {
    e.preventDefault();
    var index = cards.indexOf(activeCard);
    activateCard(cards[(index - 1 + cards.length) % cards.length]);
  }

  if (e.key === 'Enter' && activeCard) {
    e.preventDefault();
    jumpToPage(activeCard);
  }

  if ((e.key === 'e' || e.key === 'E') && activeCard) {
    e.preventDefault();
    var ann = annotations.find(function (a) { return a.id === activeCard.dataset.annId; });
    if (ann) openEditDialog(ann);
  }
}

function visibleCards() {
  return Array.from(annotationList.querySelectorAll('.annotation-card:not([hidden])'));
}

function activateCard(card) {
  if (activeCard) activeCard.classList.remove('active');
  activeCard = card;
  card.classList.add('active');
  card.scrollIntoView({ block: 'nearest' });

  var ann = annotations.find(function (a) { return a.id === card.dataset.annId; });
  if (ann) {
    announce('Chapter ' + chapterLabel(ann.chapter) + ', page ' + ann.page + '. ' + ann.sentence + '. Press E to edit.');
  }
}

function clearActiveCard() {
  if (activeCard) {
    activeCard.classList.remove('active');
  }
}

annotationsSec.addEventListener('focus', function () {
  if (suppressNextFocusAnnounce) {
    suppressNextFocusAnnounce = false;
    return;
  }
  var cards = visibleCards();
  if (cards.length > 0) {
    activateCard(activeCard && cards.includes(activeCard) ? activeCard : cards[0]);
  }
});


// ── Jump to page from annotation card

function jumpToPage(card) {
  var ann = annotations.find(function (a) { return a.id === card.dataset.annId; });
  if (!ann) return;

  var targetIndex = pages.findIndex(function (p) {
    return p.dataset.page === String(ann.page) &&
           p.dataset.chapter === String(ann.chapter);
  });

  if (targetIndex === -1) return;

  currentPageIndex = targetIndex;
  currentScreen = 'text';
  document.getElementById('sidebar').setAttribute('aria-hidden', 'true');
  showPage(currentPageIndex);

  setTimeout(function () {
    var target = sentences.find(function (s) {
      return s.textContent.trim() === ann.sentence.trim();
    });
    if (target) {
      suppressNextFocusAnnounce = true;
      activateSentence(target);
    } else {
      announce('Page loaded. Sentence no longer found.');
    }
  }, 80);
}


// ── Dialog

var dialogEl      = document.getElementById('dialog');
var dialogSenEl   = document.getElementById('dialog-sentence');
var dialogLocEl   = document.getElementById('dialog-location');
var cancelBtn     = document.getElementById('cancel-btn');
var saveBtn       = document.getElementById('save-btn');
var noteTextarea  = document.getElementById('note');
var recordBtn     = document.getElementById('record-btn');
var recordStatus  = document.getElementById('record-status');

noteTextarea.addEventListener('keydown', function (e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    saveBtn.click();
  }
});

var mediaRecorder  = null;
var audioChunks    = [];
var recordedAudio  = null;
var editAnnotId    = null;

recordBtn.addEventListener('click', function () {
  if (mediaRecorder && mediaRecorder.state === 'recording') mediaRecorder.stop();
  else startRecording();
});

async function startRecording() {
  try {
    var stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];

    mediaRecorder.ondataavailable = function (e) { audioChunks.push(e.data); };
    mediaRecorder.onstop = function () {
      var blob = new Blob(audioChunks, { type: 'audio/webm' });
      stream.getTracks().forEach(function (t) { t.stop(); });
      var reader = new FileReader();
      reader.onloadend = function () { recordedAudio = reader.result; };
      reader.readAsDataURL(blob);
      recordBtn.textContent = 'Record again';
      recordStatus.textContent = 'Recording saved.';
    };

    mediaRecorder.start();
    recordBtn.textContent = 'Stop recording';
    recordStatus.textContent = 'Recording\u2026';
  } catch (err) {
    recordStatus.textContent = 'Microphone not available.';
  }
}

function resetRecording() {
  if (mediaRecorder && mediaRecorder.state === 'recording') mediaRecorder.stop();
  mediaRecorder = null;
  audioChunks = [];
  recordedAudio = null;
  recordBtn.textContent = 'Record voice note';
  recordStatus.textContent = '';
}

function openAnnotationDialog() {
  deleteBtn.style.display = 'none';

  var page = currentPage();
  dialogSenEl.textContent = activeSentence.textContent;
  dialogLocEl.textContent = 'Chapter ' + page.dataset.chapter + ', page ' + page.dataset.page;
  noteTextarea.value = '';
  editAnnotId = null;
  resetRecording();
  dialogEl.showModal();
  noteTextarea.focus();
}

function openEditDialog(ann) {
  deleteBtn.style.display = '';
  dialogSenEl.textContent = ann.sentence;
  dialogLocEl.textContent = 'Chapter ' + ann.chapter + ', page ' + ann.page;
  noteTextarea.value = ann.note;
  editAnnotId = ann.id;
  resetRecording();
  dialogEl.showModal();
  noteTextarea.focus();
}

function closeDialog() {
  dialogEl.close();
  if (currentScreen === 'annotations') annotationsSec.focus();
  else textArticle.focus();
}

cancelBtn.addEventListener('click', function () {
  resetRecording();
  closeDialog();
});

dialogEl.addEventListener('close', function () {
  editAnnotId = null;
  if (currentScreen === 'annotations') annotationsSec.focus();
  else textArticle.focus();
});

saveBtn.addEventListener('click', function () {
  var note = noteTextarea.value.trim();
  var page = currentPage();

  if (editAnnotId) {
    var ann = annotations.find(function (a) { return a.id === editAnnotId; });
    if (ann) ann.note = note;
  } else {
    annotations.push({
      id:       'ann-' + Date.now(),
      sentence: activeSentence.textContent.trim(),
      note:     note,
      audio:    recordedAudio,
      chapter:  page.dataset.chapter,
      page:     page.dataset.page,
    });
  }

  noteTextarea.value = '';
  closeDialog();
  renderAnnotationList();
  renderChapterFilter();
  markAnnotatedSentences();
  suppressNextFocusAnnounce = true;
  switchScreen();
  announce('Annotation saved.');
});


// ── Mark annotated sentences in DOM

function markAnnotatedSentences() {
  sentences.forEach(function (s) {
    var text = s.textContent.trim();
    var isAnnotated = annotations.some(function (a) { return a.sentence.trim() === text; });
    s.classList.toggle('annotated', isAnnotated);
  });
}


// ── Chapter filter

function allChapters() {
  return Array.from(new Set(annotations.map(function (a) { return a.chapter; }))).sort();
}

function renderChapterFilter() {
  chapterFilter.innerHTML = '';

  function makeFilterBtn(label, value, announceText) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = label;
    btn.className = 'filter-btn' + (activeFilter === value ? ' filter-btn--active' : '');
    btn.setAttribute('aria-pressed', String(activeFilter === value));
    btn.addEventListener('click', function () {
      activeFilter = value;
      var allBtns = Array.from(chapterFilter.querySelectorAll('.filter-btn'));
      activeFilterIndex = allBtns.indexOf(this);
      renderAnnotationList();
      renderChapterFilter();
      announce(announceText);
      suppressNextFocusAnnounce = true;
      annotationsSec.focus();
    });
    chapterFilter.appendChild(btn);
  }

  makeFilterBtn('All', 'all', 'Showing all annotations.');

  allChapters().forEach(function (ch) {
    makeFilterBtn('Chapter ' + ch, ch, 'Filter: chapter ' + chapterLabel(ch) + '.');
  });
}


// ── Render annotation list

function renderAnnotationList() {
  annotationList.innerHTML = '';

  var filtered = activeFilter === 'all'
    ? annotations
    : annotations.filter(function (a) { return a.chapter === activeFilter; });

  if (filtered.length === 0) {
    var li = document.createElement('li');
    li.textContent = activeFilter === 'all'
      ? 'No annotations yet.'
      : 'No annotations in chapter ' + activeFilter + '.';
    annotationList.appendChild(li);
    return;
  }

  var groups = {};
  filtered.forEach(function (ann) {
    if (!groups[ann.chapter]) groups[ann.chapter] = [];
    groups[ann.chapter].push(ann);
  });

  Object.keys(groups).sort().forEach(function (chapter) {
    var groupLi = document.createElement('li');
    groupLi.setAttribute('role', 'presentation');
    var h3 = document.createElement('h3');
    h3.textContent = 'Chapter ' + chapter;
    h3.className = 'annotation-group-heading';
    groupLi.appendChild(h3);
    annotationList.appendChild(groupLi);

    groups[chapter]
      .slice()
      .sort(function (a, b) { return Number(a.page) - Number(b.page); })
      .forEach(function (ann) {
        var li      = document.createElement('li');
        var article = document.createElement('article');
        article.className = 'annotation-card';
        article.dataset.annId = ann.id;
        // No aria-label — announce() handles all reading when navigating to a card
        article.setAttribute('tabindex', '-1');
        article.setAttribute('aria-hidden', 'true');

        var location = document.createElement('p');
        location.className = 'annotation-location';
        location.textContent = 'Ch. ' + ann.chapter + ' \u00b7 p. ' + ann.page;

        var sentPreview = document.createElement('p');
        sentPreview.className = 'annotation-zin';
        sentPreview.textContent = ann.sentence;

        article.appendChild(location);
        article.appendChild(sentPreview);

        if (ann.note) {
          var noteEl = document.createElement('p');
          noteEl.className = 'annotation-text';
          noteEl.textContent = ann.note;
          article.appendChild(noteEl);
        }

        if (ann.audio) {
          var audioEl = document.createElement('audio');
          audioEl.controls = true;
          audioEl.setAttribute('aria-label', 'Voice note');
          audioEl.src = ann.audio;
          article.appendChild(audioEl);
        }

        var editBtn = document.createElement('button');
        editBtn.textContent = 'Edit  [E]';
        editBtn.className = 'edit-btn';
        editBtn.setAttribute('aria-label', 'Edit annotation on page ' + ann.page);
        editBtn.setAttribute('tabindex', '-1');
        editBtn.addEventListener('click', function (e) {
          e.stopPropagation();
          openEditDialog(ann);
        });
        article.appendChild(editBtn);

        article.addEventListener('keydown', function (e) {
          if (e.key === 'Enter') { e.preventDefault(); jumpToPage(article); }
        });
        article.addEventListener('click', function () { jumpToPage(article); });

        li.appendChild(article);
        annotationList.appendChild(li);
      });
  });
}


// ── Global shortcuts

document.addEventListener('keydown', function (e) {
  var tag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
  var inInput = tag === 'textarea' || tag === 'input';
  var inDialog = dialogEl.open;
  var inAnnotations = currentScreen === 'annotations';

  if (!inInput && !inDialog && !inAnnotations) {
    if (e.key === 'ArrowRight' || e.key === 'PageDown') {
      e.preventDefault();
      if (currentPageIndex < pages.length - 1) {
        currentPageIndex++;
        showPage(currentPageIndex);
      }
      return;
    }
    if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
      e.preventDefault();
      if (currentPageIndex > 0) {
        currentPageIndex--;
        showPage(currentPageIndex);
      }
      return;
    }
  }

  if (!inInput && !inDialog) {
    if (e.key === 'q' || e.key === 'Q' || (e.altKey && e.key === 'a')) {
      e.preventDefault();
      switchScreen();
      return;
    }
  }
});

function switchScreen() {
  var sidebar = document.getElementById('sidebar');
  if (currentScreen === 'text') {
    rememberedSen = activeSentence;
    currentScreen = 'annotations';
    if (activeSentence) {
      activeSentence.classList.remove('active');
      activeSentence.classList.add('remembered');
    }
    sidebar.removeAttribute('aria-hidden');
    annotationsSec.focus();
  } else {
    currentScreen = 'text';
    sidebar.setAttribute('aria-hidden', 'true');
    clearActiveCard();
    if (rememberedSen) {
      rememberedSen.classList.remove('remembered');
    }
    if (rememberedSen) activateSentence(rememberedSen);
    textArticle.focus();
  }
}


// ── Init

document.addEventListener('DOMContentLoaded', function () {
  showPage(0);
  initAnnotationsNav();
  renderChapterFilter();
});



var deleteBtn = document.getElementById('delete-btn');

deleteBtn.addEventListener('click', function () {
  if (!editAnnotId) return;
  annotations = annotations.filter(function (a) { return a.id !== editAnnotId; });
  closeDialog();
  renderAnnotationList();
  renderChapterFilter();
  markAnnotatedSentences();
  activeCard = null;
  announce('Annotation deleted.');
});


// in openAnnotationDialog:
deleteBtn.style.display = 'none';

