// ============================================
// AI 영상 프롬프트 메이커 - Frontend Logic
// ============================================

(function () {
  'use strict';

  // ── DOM References ──
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const els = {
    // Inputs
    character: $('#inputCharacter'),
    action: $('#inputAction'),
    background: $('#inputBackground'),
    style: $('#selectStyle'),
    shot: $('#selectShot'),
    camera: $('#selectCamera'),
    lens: $('#selectLens'),
    lighting: $('#selectLighting'),
    film: $('#selectFilm'),
    color: $('#selectColor'),
    mood: $('#selectMood'),
    aspect: $('#selectAspect'),
    negative: $('#inputNegative'),
    audio: $('#inputAudio'),
    notes: $('#inputNotes'),

    // Buttons
    generateBtn: $('#generateBtn'),
    savePresetBtn: $('#savePresetBtn'),
    copyEnglishBtn: $('#copyEnglishBtn'),
    copyAllBtn: $('#copyAllBtn'),
    regenerateBtn: $('#regenerateBtn'),
    advancedToggle: $('#advancedToggle'),
    randomInspirationBtn: $('#randomInspirationBtn'),

    // Sections
    loadingOverlay: $('#loadingOverlay'),
    loadingText: $('#loadingText'),
    resultSection: $('#resultSection'),
    advancedSection: $('#advancedSection'),
    advancedArrow: $('#advancedArrow'),

    // Results
    promptEnglish: $('#promptEnglish'),
    promptKoreanPrompt: $('#promptKoreanPrompt'),
    promptKorean: $('#promptKorean'),
    promptNegative: $('#promptNegative'),

    // Toast
    copyToast: $('#copyToast'),

    // Preset Modal
    savePresetModal: $('#savePresetModal'),
    presetNameInput: $('#presetNameInput'),
    cancelPresetBtn: $('#cancelPresetBtn'),
    confirmSavePresetBtn: $('#confirmSavePresetBtn'),
    savedPresetsList: $('#savedPresetsList'),
    presetBar: $('#presetBar'),
  };

  // ── Built-in Presets ──
  const BUILT_IN_PRESETS = {
    cinematic: {
      style: '시네마틱 실사',
      shot: '미디엄 클로즈업',
      camera: '천천히 줌인',
      lens: '50mm 표준 렌즈',
      lighting: '골든아워',
      film: '35mm 필름 그레인',
      color: '틸앤오렌지',
      mood: '평화로운',
      aspect: '16:9 시네마틱',
    },
    anime: {
      style: '2D 애니메이션',
      shot: '미디엄 샷',
      camera: '고정 샷',
      lens: '35mm 스탠다드 렌즈',
      lighting: '소프트 자연광',
      film: '클린 디지털',
      color: '고대비 비비드',
      mood: '몽환적',
      aspect: '16:9 시네마틱',
    },
    pixar: {
      style: '3D 픽사 스타일',
      shot: '미디엄 샷',
      camera: '천천히 줌인',
      lens: '35mm 스탠다드 렌즈',
      lighting: '스튜디오 소프트박스',
      film: '클린 디지털',
      color: '고대비 비비드',
      mood: '장난스러운',
      aspect: '16:9 시네마틱',
    },
    noir: {
      style: '필름 누아르',
      shot: '클로즈업',
      camera: '고정 샷',
      lens: '50mm 표준 렌즈',
      lighting: '로우키 어두운 조명',
      film: '35mm 필름 그레인',
      color: '모던 누아르',
      mood: '미스터리',
      aspect: '16:9 시네마틱',
    },
    commercial: {
      style: '하이퍼리얼리스틱',
      shot: '미디엄 클로즈업',
      camera: '좌에서 우로 패닝',
      lens: '85mm 인물용 렌즈',
      lighting: '스튜디오 소프트박스',
      film: '클린 디지털',
      color: '내추럴',
      mood: '에너지틱',
      aspect: '16:9 시네마틱',
    },
    dreamy: {
      style: '시네마틱 실사',
      shot: '와이드 샷',
      camera: '천천히 줌아웃',
      lens: '85mm 인물용 렌즈',
      lighting: '블루아워',
      film: '씨네스틸 800T',
      color: '파스텔 톤',
      mood: '몽환적',
      aspect: '16:9 시네마틱',
    },
    documentary: {
      style: '다큐멘터리',
      shot: '미디엄 샷',
      camera: '핸드헬드',
      lens: '35mm 스탠다드 렌즈',
      lighting: '소프트 자연광',
      film: '35mm 필름 그레인',
      color: '디세추레이티드',
      mood: '',
      aspect: '16:9 시네마틱',
    },
    retro: {
      style: '빈티지 레트로',
      shot: '미디엄 샷',
      camera: '트래킹 샷',
      lens: '50mm 표준 렌즈',
      lighting: '골든아워',
      film: '슈퍼 8mm 레트로',
      color: '빈티지 테크니컬러',
      mood: '향수 어린',
      aspect: '4:3 클래식',
    },
  };

  // ── State ──
  let savedPresets = JSON.parse(localStorage.getItem('saved_presets') || '{}');
  let promptHistory = JSON.parse(localStorage.getItem('prompt_history') || '[]');
  let lastResult = null;
  let sequenceData = { enabled: false, previousPrompt: null, sceneNumber: 1 };
  const uploadedImages = { MainChar: null, TargetChar: null, Location: null };

  // ── Initialize ──
  function init() {
    setupPresets();
    setupEventListeners();
    setupImageUpload();
    setupExpertToggle();
    setupHistoryToggle();
    setupSequenceMode();
    renderSavedPresets();
    renderHistory();
  }

  // ── Expert Panel Toggle ──
  function setupExpertToggle() {
    const toggle = $('#expertToggle');
    const card = $('#expertCard');
    if (toggle && card) {
      toggle.addEventListener('click', () => card.classList.toggle('open'));
    }
  }

  // ── History Panel Toggle ──
  function setupHistoryToggle() {
    const toggle = $('#historyToggle');
    const card = $('#historyCard');
    if (toggle && card) {
      toggle.addEventListener('click', () => card.classList.toggle('open'));
    }
  }

  // ── Image Upload Setup ──
  function setupImageUpload() {
    ['MainChar', 'TargetChar', 'Location'].forEach(type => {
      const box = $(`#upload${type}`);
      const fileInput = $(`#file${type}`);
      const placeholder = $(`#placeholder${type}`);
      const preview = $(`#preview${type}`);
      const img = $(`#img${type}`);

      // Click to upload
      box.addEventListener('click', (e) => {
        if (e.target.classList.contains('image-upload-remove')) return;
        fileInput.click();
      });

      // File selected
      fileInput.addEventListener('change', (e) => {
        if (e.target.files[0]) handleImageFile(e.target.files[0], type);
      });

      // Drag and drop
      box.addEventListener('dragover', (e) => {
        e.preventDefault();
        box.classList.add('dragover');
      });
      box.addEventListener('dragleave', () => box.classList.remove('dragover'));
      box.addEventListener('drop', (e) => {
        e.preventDefault();
        box.classList.remove('dragover');
        if (e.dataTransfer.files[0]) handleImageFile(e.dataTransfer.files[0], type);
      });
    });

    // Remove buttons
    document.querySelectorAll('.image-upload-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const type = btn.dataset.target;
        removeImage(type);
      });
    });
  }

  function handleImageFile(file, type) {
    if (!file.type.startsWith('image/')) {
      showToast('⚠️ 이미지 파일만 업로드 가능합니다');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showToast('⚠️ 파일 크기는 10MB 이하로 제한됩니다');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      uploadedImages[type] = {
        data: dataUrl.split(',')[1], // base64 data only
        mimeType: file.type
      };

      // Show preview
      $(`#img${type}`).src = dataUrl;
      $(`#placeholder${type}`).style.display = 'none';
      $(`#preview${type}`).style.display = 'block';
      $(`#upload${type}`).classList.add('has-image');

      const labels = { MainChar: '주인공', TargetChar: '대상 인물', Location: '장소' };
      showToast(`📸 ${labels[type]} 사진이 업로드되었습니다`);
    };
    reader.readAsDataURL(file);
  }

  function removeImage(type) {
    uploadedImages[type] = null;
    $(`#file${type}`).value = '';
    $(`#placeholder${type}`).style.display = 'flex';
    $(`#preview${type}`).style.display = 'none';
    $(`#upload${type}`).classList.remove('has-image');
    showToast('🗑️ 사진이 제거되었습니다');
  }

  // ── Image Analysis ──
  function setupImageAnalysis() {
    document.querySelectorAll('.image-upload-analyze').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const target = btn.dataset.target;
        const type = btn.dataset.type;
        const imageData = uploadedImages[target];
        if (!imageData) {
          showToast('⚠️ 먼저 사진을 업로드해주세요');
          return;
        }

        btn.textContent = '⏳';
        btn.disabled = true;

        try {
          const response = await fetch('/api/analyze-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: imageData, type })
          });

          const data = await response.json();
          if (data.success) {
            // 인물 사진이면 인물 필드에, 장소 사진이면 배경 필드에 채움
            if (type === 'location') {
              els.background.value = data.description;
              showToast('✅ 장소 분석이 배경 필드에 입력되었습니다');
            } else {
              els.character.value = (els.character.value ? els.character.value + '\n' : '') + data.description;
              showToast('✅ 인물 분석이 인물 필드에 입력되었습니다');
            }
          } else {
            throw new Error(data.error);
          }
        } catch (error) {
          showToast(`❌ 분석 실패: ${error.message}`);
        } finally {
          btn.textContent = '🔍';
          btn.disabled = false;
        }
      });
    });
  }

  // ── Event Listeners ──
  function setupEventListeners() {
    // Generate
    els.generateBtn.addEventListener('click', handleGenerate);

    // Regenerate
    els.regenerateBtn.addEventListener('click', handleGenerate);

    // Random Inspiration
    els.randomInspirationBtn.addEventListener('click', handleRandomInspiration);

    // Advanced toggle
    els.advancedToggle.addEventListener('click', () => {
      els.advancedSection.classList.toggle('open');
      els.advancedArrow.classList.toggle('open');
    });

    // Copy buttons
    els.copyEnglishBtn.addEventListener('click', () => {
      if (lastResult) {
        copyToClipboard(lastResult.englishPrompt);
        showToast('✅ 프롬프트가 복사되었습니다!');
      }
    });

    els.copyAllBtn.addEventListener('click', () => {
      if (lastResult) {
        const fullText = `[영문 프롬프트]\n${lastResult.englishPrompt}\n\n[한글 프롬프트]\n${lastResult.koreanPrompt || ''}\n\n[기법 해설]\n${lastResult.koreanExplanation}\n\n[부정 프롬프트]\n${lastResult.negativePrompt}`;
        copyToClipboard(fullText);
        showToast('✅ 전체 내용이 복사되었습니다!');
      }
    });

    // Tab copy buttons
    $$('.tab-copy-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!lastResult) return;
        const type = btn.dataset.copy;
        let text = '';
        if (type === 'english') text = lastResult.englishPrompt;
        else if (type === 'koreanPrompt') text = lastResult.koreanPrompt || '';
        else if (type === 'korean') text = lastResult.koreanExplanation;
        else if (type === 'negative') text = lastResult.negativePrompt;
        if (text) {
          copyToClipboard(text);
          showToast('✅ 복사되었습니다!');
        }
      });
    });

    // History clear
    $('#clearHistoryBtn').addEventListener('click', () => {
      promptHistory = [];
      localStorage.setItem('prompt_history', '[]');
      renderHistory();
      showToast('🗑️ 기록이 모두 삭제되었습니다');
    });

    // Image analysis buttons
    setupImageAnalysis();

    // Tabs
    $$('.result-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        $$('.result-tab').forEach((t) => t.classList.remove('active'));
        $$('.prompt-display').forEach((d) => d.classList.remove('active'));
        tab.classList.add('active');
        const tabId = tab.dataset.tab;
        $(`#display${tabId.charAt(0).toUpperCase() + tabId.slice(1)}`).classList.add('active');
      });
    });

    // Preset bar
    $$('.preset-btn[data-preset]').forEach((btn) => {
      btn.addEventListener('click', () => applyPreset(btn.dataset.preset));
    });

    // Save preset
    els.savePresetBtn.addEventListener('click', () => {
      els.savePresetModal.classList.add('visible');
      els.presetNameInput.value = '';
      els.presetNameInput.focus();
      renderSavedPresetsInModal();
    });

    els.cancelPresetBtn.addEventListener('click', () => {
      els.savePresetModal.classList.remove('visible');
    });

    els.confirmSavePresetBtn.addEventListener('click', handleSavePreset);

    // Close modal on overlay click
    els.savePresetModal.addEventListener('click', (e) => {
      if (e.target === els.savePresetModal) {
        els.savePresetModal.classList.remove('visible');
      }
    });

    // Enter key in preset name input
    els.presetNameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleSavePreset();
    });
  }

  // ── Preset System ──
  function setupPresets() {
    renderSavedPresetButtons();
  }

  function applyPreset(presetId) {
    // Check built-in presets first
    let preset = BUILT_IN_PRESETS[presetId];

    // Then check saved presets
    if (!preset && savedPresets[presetId]) {
      preset = savedPresets[presetId].settings;
    }

    if (!preset) return;

    // Apply to form
    if (preset.style) els.style.value = preset.style;
    if (preset.shot) els.shot.value = preset.shot;
    if (preset.camera) els.camera.value = preset.camera;
    if (preset.lens) els.lens.value = preset.lens;
    if (preset.lighting) els.lighting.value = preset.lighting;
    if (preset.film) els.film.value = preset.film;
    if (preset.color) els.color.value = preset.color;
    if (preset.mood) els.mood.value = preset.mood;
    if (preset.aspect) els.aspect.value = preset.aspect;

    // Highlight active preset
    $$('.preset-btn').forEach((b) => b.classList.remove('active'));
    const activeBtn = $(`[data-preset="${presetId}"]`);
    if (activeBtn) activeBtn.classList.add('active');

    // Visual feedback
    showToast(`⚡ "${getPresetName(presetId)}" 프리셋이 적용되었습니다!`);
  }

  function getPresetName(presetId) {
    const names = {
      cinematic: '시네마틱 실사',
      anime: '애니메이션',
      pixar: '3D 픽사',
      noir: '필름 누아르',
      commercial: '광고/커머셜',
      dreamy: '몽환적 판타지',
      documentary: '다큐멘터리',
      retro: '레트로 빈티지',
    };
    if (names[presetId]) return names[presetId];
    if (savedPresets[presetId]) return savedPresets[presetId].name;
    return presetId;
  }

  function getCurrentSettings() {
    return {
      style: els.style.value,
      shot: els.shot.value,
      camera: els.camera.value,
      lens: els.lens.value,
      lighting: els.lighting.value,
      film: els.film.value,
      color: els.color.value,
      mood: els.mood.value,
      aspect: els.aspect.value,
    };
  }

  function handleSavePreset() {
    const name = els.presetNameInput.value.trim();
    if (!name) {
      els.presetNameInput.style.borderColor = 'var(--danger)';
      setTimeout(() => (els.presetNameInput.style.borderColor = ''), 1500);
      return;
    }

    const id = 'user_' + Date.now();
    savedPresets[id] = {
      name: name,
      settings: getCurrentSettings(),
      createdAt: new Date().toISOString(),
    };

    localStorage.setItem('saved_presets', JSON.stringify(savedPresets));
    renderSavedPresetButtons();
    renderSavedPresetsInModal();
    els.savePresetModal.classList.remove('visible');
    showToast(`💾 "${name}" 프리셋이 저장되었습니다!`);
  }

  function renderSavedPresetButtons() {
    // Remove existing user preset buttons
    els.presetBar.querySelectorAll('.preset-btn--user').forEach((b) => b.remove());

    Object.entries(savedPresets).forEach(([id, preset]) => {
      const btn = document.createElement('button');
      btn.className = 'preset-btn preset-btn--user';
      btn.dataset.preset = id;
      btn.innerHTML = `<span class="preset-btn__icon">⭐</span> ${preset.name}`;
      btn.addEventListener('click', () => applyPreset(id));
      els.presetBar.appendChild(btn);
    });
  }

  function renderSavedPresetsInModal() {
    const entries = Object.entries(savedPresets);
    if (entries.length === 0) {
      els.savedPresetsList.innerHTML = '<p style="color: var(--text-muted); font-size: 12px; text-align: center; padding: 12px;">저장된 프리셋이 없습니다</p>';
      return;
    }

    els.savedPresetsList.innerHTML = '<p style="color: var(--text-secondary); font-size: 12px; margin-bottom: 8px; font-weight: 600;">저장된 프리셋:</p>';
    entries.forEach(([id, preset]) => {
      const item = document.createElement('div');
      item.className = 'saved-preset-item';
      item.innerHTML = `
        <span class="saved-preset-item__name">⭐ ${preset.name}</span>
        <button class="saved-preset-item__delete" data-id="${id}" title="삭제">✕</button>
      `;

      // Click to load
      item.addEventListener('click', (e) => {
        if (!e.target.classList.contains('saved-preset-item__delete')) {
          applyPreset(id);
          els.savePresetModal.classList.remove('visible');
        }
      });

      // Delete button
      item.querySelector('.saved-preset-item__delete').addEventListener('click', (e) => {
        e.stopPropagation();
        delete savedPresets[id];
        localStorage.setItem('saved_presets', JSON.stringify(savedPresets));
        renderSavedPresetButtons();
        renderSavedPresetsInModal();
        showToast('🗑️ 프리셋이 삭제되었습니다');
      });

      els.savedPresetsList.appendChild(item);
    });
  }

  // ── Generate Prompt ──
  async function handleGenerate() {
    const character = els.character.value.trim();
    const action = els.action.value.trim();

    if (!character || !action) {
      highlightRequired();
      showToast('⚠️ 인물과 행동은 필수 입력입니다!');
      return;
    }


    // Show loading
    showLoading(true);
    els.generateBtn.disabled = true;

    // Collect form data
    const formData = {
      character,
      action,
      background: els.background.value.trim(),
      style: els.style.value,
      shotType: els.shot.value,
      cameraMove: els.camera.value,
      lens: els.lens.value,
      lighting: els.lighting.value,
      filmStock: els.film.value,
      colorGrade: els.color.value,
      mood: els.mood.value,
      aspectRatio: els.aspect.value,
      negativeInput: els.negative.value.trim(),
      audioInput: els.audio.value.trim(),
      additionalNotes: els.notes.value.trim(),
      // 참조 이미지
      images: {},
      // 시퀀스 모드
      sequenceMode: sequenceData.enabled,
      previousPrompt: sequenceData.enabled ? sequenceData.previousPrompt : null,
      sceneNumber: sequenceData.enabled ? sequenceData.sceneNumber : null
    };

    // 이미지 추가
    if (uploadedImages.MainChar) formData.images.mainChar = uploadedImages.MainChar;
    if (uploadedImages.TargetChar) formData.images.targetChar = uploadedImages.TargetChar;
    if (uploadedImages.Location) formData.images.location = uploadedImages.Location;

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || '서버 오류가 발생했습니다.');
      }

      const data = await response.json();

      if (data.success) {
        lastResult = data;
        displayResult(data);
      } else {
        throw new Error(data.error || '프롬프트 생성에 실패했습니다.');
      }
    } catch (error) {
      console.error('Generation error:', error);
      showToast(`❌ ${error.message}`);
    } finally {
      showLoading(false);
      els.generateBtn.disabled = false;
    }
  }

  // ── Display Result ──
  function displayResult(data) {
    els.promptEnglish.textContent = data.englishPrompt || '(프롬프트 생성 실패)';
    els.promptKoreanPrompt.textContent = data.koreanPrompt || '(한글 프롬프트 없음)';
    els.promptKorean.textContent = data.koreanExplanation || '(한글 해설 없음)';
    els.promptNegative.textContent = data.negativePrompt || '(부정 프롬프트 없음)';

    // Show result section with animation
    els.resultSection.classList.add('visible');

    // Scroll to result
    setTimeout(() => {
      els.resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);

    // Reset to english tab
    $$('.result-tab').forEach((t) => t.classList.remove('active'));
    $$('.prompt-display').forEach((d) => d.classList.remove('active'));
    $('#tabEnglish').classList.add('active');
    $('#displayEnglish').classList.add('active');

    // Save to history
    saveToHistory(data);

    // If sequence mode is on, auto-increment scene number
    if (sequenceData.enabled && data.englishPrompt) {
      sequenceData.previousPrompt = data.englishPrompt;
      sequenceData.sceneNumber++;
      updateSequenceUI();
    }
  }

  // ── Sequence Mode ──
  function setupSequenceMode() {
    const checkbox = $('#sequenceCheckbox');
    const useBtn = $('#useForSequenceBtn');
    const clearBtn = $('#clearSequenceBtn');

    checkbox.addEventListener('change', () => {
      sequenceData.enabled = checkbox.checked;
      if (!sequenceData.enabled) {
        // Turning off - clear sequence data
        sequenceData.previousPrompt = null;
        sequenceData.sceneNumber = 1;
      }
      updateSequenceUI();
    });

    useBtn.addEventListener('click', () => {
      if (!lastResult || !lastResult.englishPrompt) {
        showToast('⚠️ 먼저 프롬프트를 생성해주세요');
        return;
      }
      sequenceData.enabled = true;
      sequenceData.previousPrompt = lastResult.englishPrompt;
      sequenceData.sceneNumber = 2;
      checkbox.checked = true;
      updateSequenceUI();
      showToast('🔗 시퀀스 모드 활성화! 다음 씬을 입력하세요');
      // Scroll to form
      document.querySelector('.form-grid').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    clearBtn.addEventListener('click', () => {
      sequenceData.previousPrompt = null;
      sequenceData.sceneNumber = 1;
      sequenceData.enabled = false;
      checkbox.checked = false;
      updateSequenceUI();
      showToast('🔓 시퀀스 연결이 해제되었습니다');
    });
  }

  function updateSequenceUI() {
    const preview = $('#sequencePreview');
    const text = $('#sequenceText');
    const number = $('#sequenceNumber');

    if (sequenceData.enabled && sequenceData.previousPrompt) {
      preview.style.display = 'block';
      text.textContent = sequenceData.previousPrompt.substring(0, 200) + '...';
      number.textContent = sequenceData.sceneNumber;
    } else {
      preview.style.display = 'none';
    }
  }

  // ── Random Inspiration ──
  async function handleRandomInspiration() {
    els.randomInspirationBtn.disabled = true;
    els.randomInspirationBtn.textContent = '⏳ 생성중...';

    try {
      const response = await fetch('/api/random-inspiration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      if (data.success) {
        if (data.character) els.character.value = data.character;
        if (data.action) els.action.value = data.action;
        if (data.background) els.background.value = data.background;
        showToast('✨ 랜덤 시나리오가 채워졌습니다! 수정 후 생성하세요');
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      showToast(`❌ 영감 생성 실패: ${error.message}`);
    } finally {
      els.randomInspirationBtn.disabled = false;
      els.randomInspirationBtn.textContent = '🎲 랜덤 영감';
    }
  }

  // ── Prompt History ──
  function saveToHistory(data) {
    const entry = {
      id: Date.now(),
      date: new Date().toLocaleString('ko-KR'),
      input: {
        character: els.character.value.trim().substring(0, 50),
        action: els.action.value.trim().substring(0, 50)
      },
      englishPrompt: data.englishPrompt,
      koreanPrompt: data.koreanPrompt || '',
      koreanExplanation: data.koreanExplanation,
      negativePrompt: data.negativePrompt
    };

    promptHistory.unshift(entry);
    if (promptHistory.length > 20) promptHistory = promptHistory.slice(0, 20);
    localStorage.setItem('prompt_history', JSON.stringify(promptHistory));
    renderHistory();
  }

  function renderHistory() {
    const list = $('#historyList');
    const countEl = $('#historyCount');
    if (!list) return;

    countEl.textContent = `${promptHistory.length}개`;

    if (promptHistory.length === 0) {
      list.innerHTML = '<div class="history-empty">아직 생성된 프롬프트가 없습니다</div>';
      return;
    }

    list.innerHTML = promptHistory.map(entry => `
      <div class="history-item" data-id="${entry.id}">
        <div class="history-item__input-badge">📝 ${entry.input.character || ''} · ${entry.input.action || ''}</div>
        <div class="history-item__preview">${entry.englishPrompt.substring(0, 120)}...</div>
        <div class="history-item__header">
          <span class="history-item__date">${entry.date}</span>
          <div class="history-item__actions">
            <button class="history-item__btn" onclick="window.__copyHistory(${entry.id})">📋 복사</button>
            <button class="history-item__btn history-item__btn--delete" onclick="window.__deleteHistory(${entry.id})">✕</button>
          </div>
        </div>
      </div>
    `).join('');
  }

  // Global handlers for history buttons
  window.__copyHistory = function(id) {
    const entry = promptHistory.find(e => e.id === id);
    if (entry) {
      copyToClipboard(entry.englishPrompt);
      showToast('✅ 프롬프트가 복사되었습니다!');
    }
  };

  window.__deleteHistory = function(id) {
    promptHistory = promptHistory.filter(e => e.id !== id);
    localStorage.setItem('prompt_history', JSON.stringify(promptHistory));
    renderHistory();
    showToast('🗑️ 기록이 삭제되었습니다');
  };

  // ── Utilities ──
  function showLoading(visible) {
    if (visible) {
      els.loadingOverlay.classList.add('visible');
      animateLoadingText();
    } else {
      els.loadingOverlay.classList.remove('visible');
    }
  }

  function animateLoadingText() {
    const messages = [
      '제미나이가 전문 프롬프트를 작성 중입니다...',
      '촬영 기법과 조명 키워드를 분석하고 있습니다...',
      '컬러 그레이딩을 적용하고 있습니다...',
      '필름 스톡 텍스처를 선택하고 있습니다...',
      '최종 프롬프트를 다듬고 있습니다...',
    ];
    let index = 0;
    const interval = setInterval(() => {
      if (!els.loadingOverlay.classList.contains('visible')) {
        clearInterval(interval);
        return;
      }
      index = (index + 1) % messages.length;
      els.loadingText.textContent = messages[index];
    }, 2000);
  }

  function highlightRequired() {
    [els.character, els.action].forEach((el) => {
      if (!el.value.trim()) {
        el.style.borderColor = 'var(--danger)';
        el.style.boxShadow = '0 0 0 3px rgba(255, 77, 106, 0.2)';
        setTimeout(() => {
          el.style.borderColor = '';
          el.style.boxShadow = '';
        }, 2000);
      }
    });
  }

  function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text);
    } else {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
  }

  function showToast(message) {
    els.copyToast.textContent = message;
    els.copyToast.classList.add('visible');
    setTimeout(() => els.copyToast.classList.remove('visible'), 2500);
  }

  // ── Start ──
  init();
})();
