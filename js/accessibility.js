/**
 * MUNICIPALIDAD DE PADRE LAS CASAS — PORTAL ACCESIBLE PARA ADULTOS MAYORES
 * accessibility.js — Sistema integral de accesibilidad WCAG 2.1 AAA
 * Incluye:
 * 1. Selector de temas: Modo Claro, Modo Oscuro (paleta municipal) y Alto Contraste Suave (sin amarillo eléctrico)
 * 2. Control de tamaño de texto (A- / A / A+)
 * 3. Modo Guiado / Asistente para la Tercera Edad
 * 4. Tooltips explicativos en lenguaje claro (¿Qué es? y ¿Para qué sirve?)
 * 5. Asistente de lectura por voz (Web Speech API) en español
 */

(function () {
  'use strict';

  // ==========================================
  // ESTADO Y CONFIGURACIÓN
  // ==========================================
  const FONT_SIZES = ['normal', 'grande', 'muy-grande'];
  let currentFontIndex = 0; // 0: normal, 1: grande, 2: muy-grande
  
  // Temas soportados: 'light', 'dark', 'contrast'
  let currentTheme = 'light';
  let isGuidedMode = true; // Por defecto activo para orientar al adulto mayor
  let isVoiceEnabled = false;
  let currentUtterance = null;

  // Cargar preferencias guardadas desde localStorage
  try {
    const savedFont = localStorage.getItem('plc_font_size');
    if (savedFont && FONT_SIZES.includes(savedFont)) {
      currentFontIndex = FONT_SIZES.indexOf(savedFont);
    }

    const savedTheme = localStorage.getItem('plc_theme');
    if (savedTheme && ['light', 'dark', 'contrast'].includes(savedTheme)) {
      currentTheme = savedTheme;
    } else {
      // Compatibilidad si venía guardado el flag anterior
      const oldHighContrast = localStorage.getItem('plc_high_contrast');
      if (oldHighContrast === 'true') {
        currentTheme = 'contrast';
      }
    }

    const savedGuided = localStorage.getItem('plc_guided_mode');
    if (savedGuided !== null) {
      isGuidedMode = savedGuided === 'true';
    }

    const savedVoice = localStorage.getItem('plc_voice_mode');
    if (savedVoice !== null) {
      isVoiceEnabled = savedVoice === 'true';
    }
  } catch (e) {
    console.warn('Almacenamiento local no disponible:', e);
  }

  // ==========================================
  // INICIALIZACIÓN AL CARGAR EL DOM
  // ==========================================
  document.addEventListener('DOMContentLoaded', () => {
    applyFontSize();
    applyTheme(currentTheme, false); // Aplicar tema sin locución inicial
    createLiveAnnouncer();
    createTooltipElement();
    createGuidedHelpDrawer();
    initAccessibilityToolbar();
    initGuidedElements();
    announceToScreenReader('Portal accesible de la Municipalidad de Padre Las Casas cargado.');
  });

  // ==========================================
  // 1. SELECTOR DE TAMAÑO DE TEXTO (A- / A / A+)
  // ==========================================
  function applyFontSize() {
    const sizeName = FONT_SIZES[currentFontIndex];
    document.documentElement.setAttribute('data-font-size', sizeName);

    const btnDecrease = document.getElementById('btn-font-decrease');
    const btnReset = document.getElementById('btn-font-reset');
    const btnIncrease = document.getElementById('btn-font-increase');
    const fontIndicator = document.getElementById('font-size-indicator');

    if (btnDecrease) btnDecrease.setAttribute('aria-pressed', currentFontIndex === 0 ? 'false' : 'true');
    if (btnReset) btnReset.setAttribute('aria-pressed', currentFontIndex === 0 ? 'true' : 'false');
    if (btnIncrease) btnIncrease.setAttribute('aria-pressed', currentFontIndex === 2 ? 'true' : 'false');

    if (fontIndicator) {
      const labels = ['Texto Normal (100%)', 'Texto Grande (120%)', 'Texto Muy Grande (140%)'];
      fontIndicator.textContent = labels[currentFontIndex];
    }

    try {
      localStorage.setItem('plc_font_size', sizeName);
    } catch (e) {}
  }

  window.increaseFontSize = function () {
    if (currentFontIndex < FONT_SIZES.length - 1) {
      currentFontIndex++;
      applyFontSize();
      const labels = ['Texto Normal', 'Texto Grande', 'Texto Muy Grande'];
      announceToScreenReader(`Tamaño de letra aumentado a: ${labels[currentFontIndex]}`);
      if (isVoiceEnabled) speakText(`Tamaño de letra aumentado a ${labels[currentFontIndex]}`);
    } else {
      announceToScreenReader('Tamaño de letra máximo alcanzado.');
      if (isVoiceEnabled) speakText('Ha llegado al tamaño de letra máximo');
    }
  };

  window.decreaseFontSize = function () {
    if (currentFontIndex > 0) {
      currentFontIndex--;
      applyFontSize();
      const labels = ['Texto Normal', 'Texto Grande', 'Texto Muy Grande'];
      announceToScreenReader(`Tamaño de letra reducido a: ${labels[currentFontIndex]}`);
      if (isVoiceEnabled) speakText(`Tamaño de letra reducido a ${labels[currentFontIndex]}`);
    } else {
      announceToScreenReader('Tamaño de letra mínimo alcanzado.');
      if (isVoiceEnabled) speakText('Ha llegado al tamaño de letra normal');
    }
  };

  window.resetFontSize = function () {
    currentFontIndex = 0;
    applyFontSize();
    announceToScreenReader('Tamaño de letra restablecido a tamaño normal.');
    if (isVoiceEnabled) speakText('Tamaño de letra normal');
  };

  // ==========================================
  // 2. GESTOR DE TEMAS: CLARO / OSCURO / CONTRASTE SUAVE
  // ==========================================
  function applyTheme(theme, notify = true) {
    currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);

    if (theme === 'contrast') {
      document.documentElement.setAttribute('data-contrast', 'high');
    } else {
      document.documentElement.removeAttribute('data-contrast');
    }

    // Actualizar botones de la barra superior
    const btnLight = document.getElementById('btn-theme-light');
    const btnDark = document.getElementById('btn-theme-dark');
    const btnContrast = document.getElementById('btn-theme-contrast');

    if (btnLight) {
      const isActive = theme === 'light';
      btnLight.setAttribute('aria-pressed', isActive ? 'true' : 'false');
      btnLight.classList.toggle('active', isActive);
    }

    if (btnDark) {
      const isActive = theme === 'dark';
      btnDark.setAttribute('aria-pressed', isActive ? 'true' : 'false');
      btnDark.classList.toggle('active', isActive);
    }

    if (btnContrast) {
      const isActive = theme === 'contrast';
      btnContrast.setAttribute('aria-pressed', isActive ? 'true' : 'false');
      btnContrast.classList.toggle('active', isActive);
    }

    // Compatibilidad con botón único previo si existiera
    const legacyContrastBtn = document.getElementById('btn-toggle-contrast');
    if (legacyContrastBtn) {
      const isHigh = theme === 'contrast';
      legacyContrastBtn.setAttribute('aria-pressed', isHigh ? 'true' : 'false');
      legacyContrastBtn.classList.toggle('active', isHigh);
      const label = legacyContrastBtn.querySelector('.toolbar-btn-text');
      if (label) {
        label.textContent = isHigh ? 'Modo Normal' : 'Alto Contraste';
      }
    }

    try {
      localStorage.setItem('plc_theme', theme);
      localStorage.setItem('plc_high_contrast', (theme === 'contrast').toString());
    } catch (e) {}

    if (notify) {
      let msg = '';
      if (theme === 'light') {
        msg = 'Modo Claro activado: fondo blanco y limpio con textos oscuros.';
      } else if (theme === 'dark') {
        msg = 'Modo Oscuro activado: fondo azul noche municipal con acentos cian y textos claros legibles.';
      } else if (theme === 'contrast') {
        msg = 'Modo Alto Contraste activado: fondo oscuro con textos blanco y crema suave, sin tonos amarillos chillones.';
      }
      announceToScreenReader(msg);
      if (isVoiceEnabled) speakText(msg);
    }
  }

  window.setTheme = function (theme) {
    if (['light', 'dark', 'contrast'].includes(theme)) {
      applyTheme(theme, true);
    }
  };

  // Alternar entre Claro y Oscuro
  window.toggleLightDarkMode = function () {
    const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(nextTheme, true);
  };

  // Compatibilidad con botón de alto contraste previo
  window.toggleHighContrast = function () {
    if (currentTheme === 'contrast') {
      applyTheme('light', true);
    } else {
      applyTheme('contrast', true);
    }
  };

  // ==========================================
  // 3. MODO GUIADO / ASISTENTE
  // ==========================================
  window.toggleGuidedMode = function () {
    isGuidedMode = !isGuidedMode;
    document.documentElement.classList.toggle('guided-mode-active', isGuidedMode);

    const btn = document.getElementById('btn-toggle-guided');
    if (btn) {
      btn.setAttribute('aria-pressed', isGuidedMode ? 'true' : 'false');
      btn.classList.toggle('active', isGuidedMode);
      const label = btn.querySelector('.toolbar-btn-text');
      if (label) {
        label.textContent = isGuidedMode ? 'Modo Guiado: ACTIVO' : 'Modo Guiado: INACTIVO';
      }
    }

    try {
      localStorage.setItem('plc_guided_mode', isGuidedMode.toString());
    } catch (e) {}

    const msg = isGuidedMode
      ? 'Modo Asistente Guiado activado. Se mostrarán explicaciones detalladas en cada elemento.'
      : 'Modo Asistente desactivado.';
    announceToScreenReader(msg);
    if (isVoiceEnabled) speakText(msg);
  };

  // ==========================================
  // 4. LECTURA POR VOZ (Web Speech API)
  // ==========================================
  window.toggleVoice = function () {
    if (!('speechSynthesis' in window)) {
      alert('Su navegador no soporta lectura por voz automática. Puede usar su lector de pantalla habitual.');
      return;
    }

    isVoiceEnabled = !isVoiceEnabled;
    const btn = document.getElementById('btn-toggle-voice');
    if (btn) {
      btn.setAttribute('aria-pressed', isVoiceEnabled ? 'true' : 'false');
      btn.classList.toggle('active', isVoiceEnabled);
      const label = btn.querySelector('.toolbar-btn-text');
      if (label) {
        label.textContent = isVoiceEnabled ? 'Voz: ACTIVADA' : 'Voz: DESACTIVADA';
      }
    }

    try {
      localStorage.setItem('plc_voice_mode', isVoiceEnabled.toString());
    } catch (e) {}

    if (isVoiceEnabled) {
      speakText('Asistente de voz activado. Al pasar el cursor o seleccionar cualquier botón o campo, escucharé la explicación para ayudarle.');
      announceToScreenReader('Asistente de voz activado.');
    } else {
      stopVoice();
      announceToScreenReader('Asistente de voz silenciado.');
    }
  };

  function speakText(text) {
    if (!('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel(); // Detener locución anterior
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-CL'; // Español chileno o latinoamericano
      utterance.rate = 0.92; // Velocidad pausada y comprensible para adultos mayores
      utterance.pitch = 1.0;

      const voices = window.speechSynthesis.getVoices();
      const spanishVoice = voices.find(v => v.lang.startsWith('es'));
      if (spanishVoice) utterance.voice = spanishVoice;

      utterance.onstart = () => {
        showSpeakingIndicator(true);
      };
      utterance.onend = () => {
        showSpeakingIndicator(false);
      };
      utterance.onerror = () => {
        showSpeakingIndicator(false);
      };

      currentUtterance = utterance;
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Error al reproducir voz:', err);
    }
  }

  window.stopVoice = function () {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    showSpeakingIndicator(false);
  };

  function showSpeakingIndicator(isSpeaking) {
    const indicator = document.getElementById('speaking-banner');
    if (indicator) {
      indicator.style.display = isSpeaking ? 'flex' : 'none';
    }
  }

  // ==========================================
  // 5. REGISTRO Y GESTIÓN DE TOOLTIPS CLAROS
  // ==========================================
  let tooltipEl = null;
  let activeElement = null;
  let hideTooltipTimeout = null;

  function createTooltipElement() {
    tooltipEl = document.createElement('div');
    tooltipEl.id = 'accessible-tooltip';
    tooltipEl.className = 'plc-tooltip';
    tooltipEl.setAttribute('role', 'tooltip');
    tooltipEl.setAttribute('aria-hidden', 'true');
    tooltipEl.innerHTML = `
      <div class="tooltip-header">
        <span class="tooltip-badge">💡 Ayuda para usted</span>
        <button type="button" class="tooltip-speak-btn" id="btn-tooltip-speak" aria-label="Escuchar explicación en voz alta" title="Escuchar">
          🔊 Escuchar
        </button>
      </div>
      <div class="tooltip-body">
        <div class="tooltip-question">
          <strong class="q-tag">1. ¿Qué es este elemento?</strong>
          <p class="tooltip-what" id="tt-what"></p>
        </div>
        <div class="tooltip-question mt-sm">
          <strong class="q-tag">2. ¿Para qué sirve al hacer clic?</strong>
          <p class="tooltip-action" id="tt-action"></p>
        </div>
      </div>
      <div class="tooltip-footer">
        <span class="tooltip-hint">Presione la tecla <strong>Escape (ESC)</strong> para cerrar esta ayuda.</span>
      </div>
    `;

    document.body.appendChild(tooltipEl);

    const speakBtn = tooltipEl.querySelector('#btn-tooltip-speak');
    if (speakBtn) {
      speakBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (activeElement) {
          const what = activeElement.getAttribute('data-tooltip-what') || '';
          const action = activeElement.getAttribute('data-tooltip-action') || '';
          speakText(`${what}. ${action}`);
        }
      });
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        hideTooltip();
        stopVoice();
      }
    });
  }

  function initGuidedElements() {
    const elements = document.querySelectorAll('[data-tooltip-what]');

    elements.forEach((el, index) => {
      const helpId = `guide-help-${index}`;
      el.setAttribute('data-guide-id', helpId);

      el.addEventListener('pointerenter', () => {
        showTooltip(el);
      });

      el.addEventListener('pointerleave', () => {
        scheduleHideTooltip();
      });

      el.addEventListener('focus', () => {
        showTooltip(el);
      });

      el.addEventListener('blur', () => {
        scheduleHideTooltip();
      });
    });

    if (tooltipEl) {
      tooltipEl.addEventListener('pointerenter', () => {
        if (hideTooltipTimeout) clearTimeout(hideTooltipTimeout);
      });
      tooltipEl.addEventListener('pointerleave', () => {
        scheduleHideTooltip();
      });
    }
  }

  function showTooltip(el) {
    if (!tooltipEl) return;
    if (hideTooltipTimeout) clearTimeout(hideTooltipTimeout);

    activeElement = el;

    const what = el.getAttribute('data-tooltip-what') || 'Elemento interactivo del portal.';
    const action = el.getAttribute('data-tooltip-action') || 'Al pulsar este botón podrá realizar la acción correspondiente.';

    const whatEl = tooltipEl.querySelector('#tt-what');
    const actionEl = tooltipEl.querySelector('#tt-action');

    if (whatEl) whatEl.textContent = what;
    if (actionEl) actionEl.textContent = action;

    el.setAttribute('aria-describedby', 'accessible-tooltip');
    tooltipEl.setAttribute('aria-hidden', 'false');
    tooltipEl.classList.add('visible');

    positionTooltip(el);

    if (isVoiceEnabled) {
      const label = el.getAttribute('aria-label') || el.innerText || '';
      const textToRead = `${label ? label + '. ' : ''}${what}. ${action}`;
      speakText(textToRead);
    }
  }

  function positionTooltip(target) {
    if (!tooltipEl || !target) return;

    const rect = target.getBoundingClientRect();
    const tooltipRect = tooltipEl.getBoundingClientRect();
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;
    const scrollX = window.pageXOffset || document.documentElement.scrollLeft;

    let top = rect.bottom + scrollY + 12;
    let left = rect.left + scrollX + (rect.width / 2) - (tooltipRect.width / 2);

    if (left + tooltipRect.width > window.innerWidth - 16) {
      left = window.innerWidth - tooltipRect.width - 16;
    }

    if (left < 16) {
      left = 16;
    }

    if (rect.bottom + tooltipRect.height + 20 > window.innerHeight && rect.top > tooltipRect.height + 20) {
      top = rect.top + scrollY - tooltipRect.height - 12;
      tooltipEl.classList.add('pos-top');
      tooltipEl.classList.remove('pos-bottom');
    } else {
      tooltipEl.classList.add('pos-bottom');
      tooltipEl.classList.remove('pos-top');
    }

    tooltipEl.style.top = `${Math.max(10, top)}px`;
    tooltipEl.style.left = `${Math.max(10, left)}px`;
  }

  function scheduleHideTooltip() {
    if (hideTooltipTimeout) clearTimeout(hideTooltipTimeout);
    hideTooltipTimeout = setTimeout(() => {
      hideTooltip();
    }, 250);
  }

  function hideTooltip() {
    if (!tooltipEl) return;
    tooltipEl.classList.remove('visible');
    tooltipEl.setAttribute('aria-hidden', 'true');
    if (activeElement) {
      activeElement.removeAttribute('aria-describedby');
    }
    activeElement = null;
  }

  // ==========================================
  // 6. ANUNCIADOR PARA LECTORES DE PANTALLA
  // ==========================================
  let announcerEl = null;
  function createLiveAnnouncer() {
    announcerEl = document.createElement('div');
    announcerEl.id = 'plc-live-announcer';
    announcerEl.className = 'sr-only';
    announcerEl.setAttribute('aria-live', 'polite');
    announcerEl.setAttribute('aria-atomic', 'true');
    document.body.appendChild(announcerEl);
  }

  function announceToScreenReader(message) {
    if (announcerEl) {
      announcerEl.textContent = '';
      setTimeout(() => {
        announcerEl.textContent = message;
      }, 50);
    }
  }

  // ==========================================
  // 7. BARRA SUPERIOR DE ACCESIBILIDAD (VINCULACIÓN)
  // ==========================================
  function initAccessibilityToolbar() {
    const btnDec = document.getElementById('btn-font-decrease');
    const btnRes = document.getElementById('btn-font-reset');
    const btnInc = document.getElementById('btn-font-increase');
    const btnGui = document.getElementById('btn-toggle-guided');
    const btnVoi = document.getElementById('btn-toggle-voice');

    // Botones de temas
    const btnLight = document.getElementById('btn-theme-light');
    const btnDark = document.getElementById('btn-theme-dark');
    const btnContrast = document.getElementById('btn-theme-contrast');

    if (btnDec) btnDec.addEventListener('click', window.decreaseFontSize);
    if (btnRes) btnRes.addEventListener('click', window.resetFontSize);
    if (btnInc) btnInc.addEventListener('click', window.increaseFontSize);
    if (btnGui) btnGui.addEventListener('click', window.toggleGuidedMode);
    if (btnVoi) btnVoi.addEventListener('click', window.toggleVoice);

    if (btnLight) btnLight.addEventListener('click', () => applyTheme('light', true));
    if (btnDark) btnDark.addEventListener('click', () => applyTheme('dark', true));
    if (btnContrast) btnContrast.addEventListener('click', () => applyTheme('contrast', true));

    // Botón legado de contraste si existe
    const legacyContrastBtn = document.getElementById('btn-toggle-contrast');
    if (legacyContrastBtn) legacyContrastBtn.addEventListener('click', window.toggleHighContrast);

    const stopAudioBtn = document.getElementById('btn-stop-speech');
    if (stopAudioBtn) {
      stopAudioBtn.addEventListener('click', window.stopVoice);
    }
  }

  // ==========================================
  // 8. PANEL DE AYUDA RÁPIDA / DRAWER ASISTENTE
  // ==========================================
  function createGuidedHelpDrawer() {
    const helpBtn = document.getElementById('btn-floating-help');
    const helpModal = document.getElementById('asistente-modal');
    if (helpBtn && helpModal) {
      helpBtn.addEventListener('click', () => {
        helpModal.classList.add('open');
        helpModal.setAttribute('aria-hidden', 'false');
        const firstFocus = helpModal.querySelector('button, [href], input');
        if (firstFocus) firstFocus.focus();
        if (isVoiceEnabled) {
          speakText('Ha abierto el panel de ayuda y teléfonos directos.');
        }
      });

      const closeBtns = helpModal.querySelectorAll('.btn-close-modal');
      closeBtns.forEach(b => {
        b.addEventListener('click', () => {
          helpModal.classList.remove('open');
          helpModal.setAttribute('aria-hidden', 'true');
          helpBtn.focus();
          stopVoice();
        });
      });
    }
  }

  // Exponer API global
  window.PLCAccessibility = {
    increaseFontSize: window.increaseFontSize,
    decreaseFontSize: window.decreaseFontSize,
    resetFontSize: window.resetFontSize,
    setTheme: window.setTheme,
    toggleLightDarkMode: window.toggleLightDarkMode,
    toggleHighContrast: window.toggleHighContrast,
    toggleGuidedMode: window.toggleGuidedMode,
    toggleVoice: window.toggleVoice,
    speakText: speakText,
    stopVoice: window.stopVoice
  };

})();
