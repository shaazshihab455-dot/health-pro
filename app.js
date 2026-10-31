// Medicine Leaflet Explainer Frontend Engine

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const leafletText = document.getElementById('leaflet-text');
  const btnExplain = document.getElementById('btn-explain');
  const btnClear = document.getElementById('btn-clear');
  const btnPaste = document.getElementById('btn-paste');
  const fileInput = document.getElementById('file-input');
  const dropZone = document.getElementById('drop-zone');
  const imagePreviewContainer = document.getElementById('image-preview-container');
  const imagePreview = document.getElementById('image-preview');
  const btnRemoveImage = document.getElementById('btn-remove-image');
  const sampleButtons = document.getElementById('sample-buttons');

  const loadingState = document.getElementById('loading-state');
  const outputSection = document.getElementById('output-section');
  const emergencyAlert = document.getElementById('emergency-alert');
  const emergencyMessage = document.getElementById('emergency-message');
  const unclearAlert = document.getElementById('unclear-alert');
  const unclearMessage = document.getElementById('unclear-message');
  const explanationCards = document.getElementById('explanation-cards');

  const expPurpose = document.getElementById('exp-purpose');
  const expDose = document.getElementById('exp-dose');
  const expWarnings = document.getElementById('exp-warnings');
  const expSeMild = document.getElementById('exp-se-mild');
  const expSeSerious = document.getElementById('exp-se-serious');
  const expQuestions = document.getElementById('exp-questions');
  const finalDisclaimer = document.getElementById('final-disclaimer');

  const btnSpeak = document.getElementById('btn-speak');
  const speakText = document.getElementById('speak-text');
  const speakIcon = document.getElementById('speak-icon');
  const btnCopy = document.getElementById('btn-copy');
  const btnPrint = document.getElementById('btn-print');

  // Accessibility Buttons
  const btnFontDec = document.getElementById('btn-font-decrease');
  const btnFontReset = document.getElementById('btn-font-reset');
  const btnFontInc = document.getElementById('btn-font-increase');
  const btnContrast = document.getElementById('btn-contrast-toggle');
  const btnDyslexic = document.getElementById('btn-dyslexic-toggle');
  const langSelect = document.getElementById('lang-select');

  let samplesData = {};
  let currentSpeech = null;
  let isSpeaking = false;

  // Font Size Handling
  const fontSizes = ['font-sm', 'font-normal', 'font-lg', 'font-xl'];
  let currentFontIdx = 1;

  function updateFontSize(idx) {
    fontSizes.forEach(cls => document.body.classList.remove(cls));
    currentFontIdx = Math.max(0, Math.min(fontSizes.length - 1, idx));
    document.body.classList.add(fontSizes[currentFontIdx]);
    localStorage.setItem('mle_font_idx', currentFontIdx);
  }

  btnFontDec.addEventListener('click', () => updateFontSize(currentFontIdx - 1));
  btnFontReset.addEventListener('click', () => updateFontSize(1));
  btnFontInc.addEventListener('click', () => updateFontSize(currentFontIdx + 1));

  // High Contrast Mode
  btnContrast.addEventListener('click', () => {
    document.body.classList.toggle('theme-contrast');
    btnContrast.classList.toggle('active');
    localStorage.setItem('mle_contrast', document.body.classList.contains('theme-contrast'));
  });

  // Dyslexia Friendly Font Mode
  btnDyslexic.addEventListener('click', () => {
    document.body.classList.toggle('font-dyslexic');
    btnDyslexic.classList.toggle('active');
    localStorage.setItem('mle_dyslexic', document.body.classList.contains('font-dyslexic'));
  });

  // Load saved preferences
  if (localStorage.getItem('mle_font_idx') !== null) {
    updateFontSize(parseInt(localStorage.getItem('mle_font_idx'), 10));
  }
  if (localStorage.getItem('mle_contrast') === 'true') {
    document.body.classList.add('theme-contrast');
    btnContrast.classList.add('active');
  }
  if (localStorage.getItem('mle_dyslexic') === 'true') {
    document.body.classList.add('font-dyslexic');
    btnDyslexic.classList.add('active');
  }

  // Load samples from samples.json
  fetch('samples.json')
    .then(res => res.json())
    .then(data => {
      if (data && data.samples) {
        data.samples.forEach(s => {
          samplesData[s.id] = s;
        });
      }
    })
    .catch(err => console.warn("Could not load samples.json:", err));

  // Sample pill click
  sampleButtons.addEventListener('click', (e) => {
    const btn = e.target.closest('.pill-btn');
    if (!btn) return;
    const sampleId = btn.getAttribute('data-sample');
    if (samplesData[sampleId]) {
      leafletText.value = samplesData[sampleId].text;
      explainLeaflet();
    }
  });

  // Clear button
  btnClear.addEventListener('click', () => {
    leafletText.value = '';
    outputSection.classList.add('hidden');
    removeUploadedImage();
    stopAudio();
    leafletText.focus();
  });

  // Paste clipboard button
  btnPaste.addEventListener('click', async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        leafletText.value = text;
        explainLeaflet();
      }
    } catch (err) {
      alert("Unable to read clipboard. Please paste manually into the text box.");
    }
  });

  // Drag and Drop & Image Upload Handling
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  });

  btnRemoveImage.addEventListener('click', () => {
    removeUploadedImage();
  });

  function removeUploadedImage() {
    fileInput.value = '';
    imagePreview.src = '';
    imagePreviewContainer.classList.add('hidden');
  }

  function handleFile(file) {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        imagePreview.src = e.target.result;
        imagePreviewContainer.classList.remove('hidden');
        // If text is empty, provide a helpful prompt
        if (!leafletText.value.trim()) {
          leafletText.value = "Photo of medicine leaflet loaded: " + file.name + "\n[Note: If you have text extracted from this photo, you can paste or type it here. You can also click 'Amoxicillin' above to test a scanned leaflet sample!]";
        }
      };
      reader.readAsDataURL(file);
    } else if (file.type === 'text/plain') {
      const reader = new FileReader();
      reader.onload = (e) => {
        leafletText.value = e.target.result;
        explainLeaflet();
      };
      reader.readAsText(file);
    }
  }

  // Explain Button Action
  btnExplain.addEventListener('click', explainLeaflet);

  async function explainLeaflet() {
    const text = leafletText.value.trim();
    if (!text) {
      alert("Please paste or type the medicine leaflet text first.");
      leafletText.focus();
      return;
    }

    stopAudio();
    loadingState.classList.remove('hidden');
    outputSection.classList.add('hidden');
    emergencyAlert.classList.add('hidden');
    unclearAlert.classList.add('hidden');
    explanationCards.classList.remove('hidden');

    try {
      const response = await fetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text,
          language: langSelect.value
        })
      });

      if (!response.ok) {
        throw new Error("Server returned status " + response.status);
      }

      const data = await response.json();
      renderExplanation(data);
    } catch (err) {
      console.warn("API request failed, running offline client-side fallback:", err);
      // Fallback offline engine if server is unreachable
      const fallbackResult = runClientSideExplainer(text);
      renderExplanation(fallbackResult);
    } finally {
      loadingState.classList.add('hidden');
      outputSection.classList.remove('hidden');
      outputSection.scrollIntoView({ behavior: 'smooth' });
    }
  }

  function renderExplanation(data) {
    // 1. Emergency handling
    if (data.isEmergency) {
      emergencyAlert.classList.remove('hidden');
      emergencyMessage.innerHTML = `<strong>STOP & CALL EMERGENCY SERVICES IMMEDIATELY:</strong><br>${data.emergencyAlert || data.emergencyMessage}`;
      explanationCards.classList.add('hidden');
      finalDisclaimer.innerHTML = "<strong>Please Note:</strong> This explains the leaflet only. It is not medical advice. If you're unsure, ask a pharmacist or doctor.";
      return;
    }

    // 2. Unclear text handling
    if (data.isUnclear) {
      unclearAlert.classList.remove('hidden');
      unclearMessage.textContent = data.message;
      explanationCards.classList.add('hidden');
      finalDisclaimer.innerHTML = "<strong>Please Note:</strong> This explains the leaflet only. It is not medical advice. If you're unsure, ask a pharmacist or doctor.";
      return;
    }

    // Normal explanation presentation
    explanationCards.classList.remove('hidden');

    // Section 1: What this medicine is for
    expPurpose.textContent = data.whatFor || "This leaflet doesn't say clearly what this medicine is for.";

    // Section 2: How it is usually taken
    expDose.textContent = data.howTaken || "This leaflet doesn't say how this medicine is taken.";

    // Section 3: Important warnings
    expWarnings.innerHTML = '';
    if (data.warnings && data.warnings.length) {
      data.warnings.forEach(w => {
        const item = document.createElement('div');
        item.className = 'bullet-item';
        item.innerHTML = `<span class="bullet-icon">⚠️</span><span>${escapeHtml(w)}</span>`;
        expWarnings.appendChild(item);
      });
    } else {
      expWarnings.innerHTML = '<div class="bullet-item"><span>This leaflet doesn't specify who should avoid it.</span></div>';
    }

    // Section 4: Side effects
    expSeMild.innerHTML = '';
    if (data.sideEffects && data.sideEffects.mild && data.sideEffects.mild.length) {
      const ul = document.createElement('ul');
      ul.style.paddingLeft = '1.25rem';
      data.sideEffects.mild.forEach(m => {
        const li = document.createElement('li');
        li.textContent = m;
        ul.appendChild(li);
      });
      expSeMild.appendChild(ul);
    } else {
      expSeMild.textContent = "This leaflet doesn't mention mild side effects.";
    }

    expSeSerious.innerHTML = '';
    if (data.sideEffects && data.sideEffects.serious && data.sideEffects.serious.length) {
      const ul = document.createElement('ul');
      ul.style.paddingLeft = '1.25rem';
      data.sideEffects.serious.forEach(s => {
        const li = document.createElement('li');
        li.textContent = s;
        ul.appendChild(li);
      });
      expSeSerious.appendChild(ul);
    } else {
      expSeSerious.textContent = "This leaflet doesn't list serious side effects, but seek urgent care for breathing trouble, rash, or facial swelling.";
    }

    // Section 5: Questions to ask doctor or pharmacist
    expQuestions.innerHTML = '';
    const questions = data.questions || [
      "How many days should I take this medicine, and should I finish the whole pack?",
      "Should I take this medicine before, during, or after food?",
      "Is it safe to take this with my other medicines?",
      "What should I do if I forget a dose?"
    ];
    questions.forEach((q, idx) => {
      const li = document.createElement('li');
      li.className = 'question-item';
      li.innerHTML = `
        <input type="checkbox" id="q-check-${idx}" class="question-checkbox">
        <label for="q-check-${idx}" class="question-label">${escapeHtml(q)}</label>
      `;
      expQuestions.appendChild(li);
    });

    // Mandatory Disclaimer
    finalDisclaimer.innerHTML = `<strong>Please Note:</strong> ${data.disclaimer || "This explains the leaflet only. It is not medical advice. If you're unsure, ask a pharmacist or doctor."}`;
  }

  // Audio Text-to-Speech
  btnSpeak.addEventListener('click', () => {
    if (isSpeaking) {
      stopAudio();
    } else {
      startAudio();
    }
  });

  function startAudio() {
    if (!('speechSynthesis' in window)) {
      alert("Text-to-speech is not supported on this browser.");
      return;
    }

    window.speechSynthesis.cancel();

    // Check emergency first
    if (!emergencyAlert.classList.contains('hidden')) {
      speakContent("Emergency Warning: Signs of an emergency were detected. Please call emergency services immediately.");
      return;
    }

    const textToSpeak = `
      Medicine Leaflet Explanation.
      What this medicine is for: ${expPurpose.textContent}.
      How it is usually taken: ${expDose.textContent}.
      Important warnings: ${Array.from(expWarnings.querySelectorAll('.bullet-item')).map(el => el.textContent).join('. ')}.
      Common mild side effects: ${expSeMild.textContent}.
      Serious side effects: ${expSeSerious.textContent}.
      Questions for your doctor or pharmacist: ${Array.from(expQuestions.querySelectorAll('.question-label')).map(el => el.textContent).join('. ')}.
      This explains the leaflet only. It is not medical advice. If you are unsure, ask a pharmacist or doctor.
    `;

    speakContent(textToSpeak);
  }

  function speakContent(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9; // Slightly slower for clarity
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const naturalVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('David')));
    if (naturalVoice) utterance.voice = naturalVoice;

    utterance.onstart = () => {
      isSpeaking = true;
      speakIcon.textContent = '⏹️';
      speakText.textContent = 'Stop Audio';
      btnSpeak.classList.add('playing');
    };

    utterance.onend = () => {
      stopAudio();
    };

    utterance.onerror = () => {
      stopAudio();
    };

    window.speechSynthesis.speak(utterance);
    currentSpeech = utterance;
  }

  function stopAudio() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    isSpeaking = false;
    speakIcon.textContent = '🔊';
    speakText.textContent = 'Listen Aloud';
    btnSpeak.classList.remove('playing');
  }

  // Copy Explanation
  btnCopy.addEventListener('click', async () => {
    let copyText = "";
    if (!emergencyAlert.classList.contains('hidden')) {
      copyText = emergencyMessage.textContent;
    } else {
      copyText = `MEDICINE LEAFLET EXPLANATION (Plain Language)

1. What this medicine is for:
${expPurpose.textContent}

2. How it is usually taken:
${expDose.textContent}

3. Important warnings:
${Array.from(expWarnings.querySelectorAll('.bullet-item')).map(el => '- ' + el.textContent.replace('⚠️', '').trim()).join('\n')}

4. Possible side effects:
- Common and mild:
${expSeMild.textContent.trim()}
- Serious (get medical help):
${expSeSerious.textContent.trim()}

5. Questions to ask your doctor or pharmacist:
${Array.from(expQuestions.querySelectorAll('.question-label')).map((el, idx) => `${idx + 1}. ${el.textContent}`).join('\n')}

${finalDisclaimer.textContent.trim()}
`;
    }

    try {
      await navigator.clipboard.writeText(copyText);
      const originalText = btnCopy.textContent;
      btnCopy.textContent = "✅ Copied!";
      setTimeout(() => { btnCopy.textContent = originalText; }, 2000);
    } catch (e) {
      alert("Could not copy automatically. You can copy the text manually.");
    }
  });

  // Print / Save PDF
  btnPrint.addEventListener('click', () => {
    window.print();
  });

  // Client-Side Emergency Detection
  function checkEmergencyClient(text) {
    const clean = text.trim();
    const isFormalLeaflet = /(?:package leaflet|patient information leaflet|summary of product characteristics|\b1\.\s*what|\b2\.\s*before|\b3\.\s*how to|\b4\.\s*possible side effects)/i.test(clean);

    const activeDistressSignals = [
      /\b(i am|i'm|i have|my|he has|he's|she has|she's|child|baby|father|mother|brother|sister|son|daughter|someone|we)\b.*?\b(trouble breathing|can't breathe|cannot breathe|difficulty breathing|shortness of breath|swelling|swollen|chest pain|overdose|seizure|convulsion|fainted|passed out|unconscious|choking)\b/i,
      /\b(need (urgent|emergency) help|please help|this is an emergency|call 911|call 999|call 112)\b/i,
      /\b(accidentally took|took too much|swallowed (the whole|too many|a bottle)|poisoned)\b/i,
      /\b(chest pain|chest pressure|crushing chest)\b/i,
      /\b(seizure|convulsions?)\b/i,
      /\b(passed out|loss of consciousness|unconscious)\b/i
    ];
    for (const pattern of activeDistressSignals) {
      if (pattern.test(clean)) return true;
    }

    if (!isFormalLeaflet) {
      const acute = [/\btrouble breathing\b/i, /\bcan('t| not) breathe\b/i, /\bswelling of (the )?(face|throat|tongue|lips)\b/i, /\bsevere allergic reaction\b/i, /\banaphylaxis\b/i, /\bsuspected overdose\b/i];
      for (const pattern of acute) {
        if (pattern.test(clean)) return true;
      }
    }
    return false;
  }

  // Client-Side Offline Parsing Fallback
  function runClientSideExplainer(text) {
    if (checkEmergencyClient(text)) {
      return {
        isEmergency: true,
        emergencyAlert: "Signs of an acute medical emergency were detected (such as trouble breathing, chest pain, face swelling, or overdose). Stop reading and call emergency services (e.g. 911 / 999 / 112) or go to the hospital right away.",
        disclaimer: "This explains the leaflet only. It is not medical advice. If you're unsure, ask a pharmacist or doctor."
      };
    }

    if (text.length < 25) {
      return {
        isUnclear: true,
        message: "The leaflet text provided is too short, cut off, or unclear. Please share a clearer, complete version.",
        disclaimer: "This explains the leaflet only. It is not medical advice. If you're unsure, ask a pharmacist or doctor."
      };
    }

    return {
      isEmergency: false,
      whatFor: "This medicine is used to treat the conditions stated in your leaflet. (Please refer to the original packaging for exact medical indications).",
      howTaken: "Take as directed in your prescription or leaflet with water. Never change or adjust your dose on your own. Always ask your pharmacist or doctor.",
      warnings: [
        "Do not take this if you are allergic to any of the ingredients.",
        "Talk to your doctor if you are pregnant, planning to have a baby, or breastfeeding.",
        "Check with your pharmacist before drinking alcohol or driving while taking this."
      ],
      sideEffects: {
        mild: ["Mild stomach upset or nausea (feeling sick)", "Mild headache or dizziness"],
        serious: ["Signs of allergic reaction (swelling of face, lips, or tongue)", "Trouble breathing or severe rash"]
      },
      questions: [
        "How many times a day should I take this, and with or without food?",
        "Should I finish the entire course even if I feel better?",
        "Will this medicine interfere with any of my regular prescriptions?"
      ],
      disclaimer: "This explains the leaflet only. It is not medical advice. If you're unsure, ask a pharmacist or doctor."
    };
  }

  function escapeHtml(string) {
    const div = document.createElement('div');
    div.textContent = string;
    return div.innerHTML;
  }
});
