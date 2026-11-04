/**
 * File: js/calc__matching-funnel__scripts.js
 * Version: v5.2
 * Date: 2026-11-04
 * Changelog:
 * - Removed card-skipping condition in fixFixedFooterContainment to unblock fixed footer on mobile WebKit.
 * - Enforced visible-only contact validation guard (preserves Back button and unblocks Age step progression).
 * - Preserved GTM telemetry bridge and Make.com webhook sync on form submission.
 */

(() => {
  'use strict';

  // ==========================================================================
  // 1. CONFIGURATION & STATE
  // ==========================================================================
  const CALC_ID = 'Pft6XRWtt33uTcLlc';
  const MAKE_WEBHOOK_URL =
    'https://hook.us2.make.com/k1fops9sqlck1ed7yknccr64nswmv76w';

  let sessionPushed = false;
  let interactionPushed = false;
  let submitPushed = false;
  let lastSubmitTime = 0;
  let lastRedirectTime = 0;
  let storedEmailValue = '';
  let webhookTriggered = false;

  window.dataLayer = window.dataLayer || [];

  // ==========================================================================
  // 2. DOM & STRING UTILITIES
  // ==========================================================================
  const isElementVisible = (el) => {
    if (!el) return false;
    return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
  };

  const isResultsScreenActive = () => {
    const bodyText = document.body ? document.body.innerText : '';
    return (
      bodyText.includes("We've found the best therapists for you") ||
      bodyText.includes('Since these results are preliminary') ||
      document.querySelector('.form_final-section') !== null
    );
  };

  const isInsideCalculator = (target) => {
    if (!target || !target.closest) return false;
    return !!(
      target.closest('.calculator') ||
      target.closest('.cc-calculator') ||
      target.closest('.cc') ||
      target.closest('[class*="cc__"]') ||
      target.closest('[data-calc-id]') ||
      target.closest('.header_start-btn') ||
      target.closest('.form_header-wrapper')
    );
  };

  const isValidEmail = (email) => {
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
  };

  const getHubspotUTK = () => {
    const name = 'hubspotutk=';
    const decodedCookie = decodeURIComponent(document.cookie);
    const cookieArray = decodedCookie.split(';');
    for (let i = 0; i < cookieArray.length; i++) {
      const cookie = cookieArray[i].trim();
      if (cookie.indexOf(name) === 0) return cookie.substring(name.length);
    }
    return '';
  };

  const getUTMParams = () => {
    const params = {};
    const urlParams = new URLSearchParams(window.location.search);
    const keys = [
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'utm_term',
      'utm_content',
    ];
    keys.forEach((key) => {
      if (urlParams.has(key)) params[key] = urlParams.get(key);
    });
    return params;
  };

  // ==========================================================================
  // 3. MOBILE SAFARI & IOS CHROME FIXED FOOTER CONTAINMENT GUARD
  // ==========================================================================
  const fixFixedFooterContainment = () => {
    if (!window.matchMedia('(max-width: 768px)').matches) return;

    const footer = document.querySelector('.form-get-started_footer');
    if (!footer) return;

    let parent = footer.parentElement;
    while (parent && parent !== document.body) {
      parent.style.setProperty('z-index', '9999', 'important');
      parent.style.setProperty('transform', 'none', 'important');
      parent.style.setProperty('-webkit-transform', 'none', 'important');
      parent.style.setProperty('filter', 'none', 'important');
      parent.style.setProperty('perspective', 'none', 'important');
      parent.style.setProperty('contain', 'none', 'important');
      parent.style.setProperty('will-change', 'auto', 'important');

      const style = window.getComputedStyle(parent);
      if (
        style.overflow === 'hidden' ||
        style.overflowX === 'hidden' ||
        style.overflowY === 'hidden'
      ) {
        parent.style.setProperty('overflow', 'visible', 'important');
      }

      parent = parent.parentElement;
    }
  };

  // ==========================================================================
  // 4. CONTACT FIELD LABELS & PREMATURE SUBMISSION RESOLUTION
  // ==========================================================================
  const formatContactFieldLabels = () => {
    const emailWrapper = document.querySelector(
      '.cc__email-question-wrapper, [data-selector-element-id="skmnhnMbwC9izFcHX"]',
    );
    if (emailWrapper) {
      const label = emailWrapper.querySelector('label');
      if (label && !label.querySelector('.cc__label-subtext')) {
        if (/matches will be sent/i.test(label.textContent)) {
          label.innerHTML = `What's your email?* <span class="cc__label-subtext">This is where your matches will be sent.</span>`;
        }
      }
    }

    const phoneWrapper = document.querySelector(
      '.cc__phone-question-wrapper, [data-selector-element-id="PQKXBcPxBxMKTQj7D"]',
    );
    if (phoneWrapper) {
      const label = phoneWrapper.querySelector('label');
      if (label && !label.querySelector('.cc__label-subtext')) {
        const text = label.textContent;
        if (/Optional/i.test(text)) {
          const prefix = /What/i.test(text)
            ? "What's your phone number?"
            : 'Phone number';
          label.innerHTML = `${prefix} <span class="cc__label-subtext">(Optional)</span>`;
        }
      }
    }
  };

  const fixFooterNavigationButtons = () => {
    const submitWrapper = document.querySelector(
      '[data-selector-element-id="vRmc2iNqECKf3CrsA"]',
    );
    const nextWrapper = document.querySelector(
      '[data-selector-element-id="4QrXupMkZZFqbNLLA"]',
    );
    const seeResultsWrapper = document.querySelector(
      '[data-selector-element-id="P2DRnZJbuvYuLmo6f"]',
    );
    const progressBar = document.querySelector('.footer_progress-bar');

    const isSeeResultsActive =
      seeResultsWrapper &&
      window.getComputedStyle(seeResultsWrapper).display !== 'none' &&
      !seeResultsWrapper.classList.contains('cc__element--hidden');

    if (isSeeResultsActive) {
      if (nextWrapper)
        nextWrapper.style.setProperty('display', 'none', 'important');
      if (submitWrapper)
        submitWrapper.style.setProperty('display', 'none', 'important');

      if (window.matchMedia('(max-width: 479px)').matches && progressBar) {
        progressBar.style.setProperty('display', 'none', 'important');
      }
      return;
    }

    if (progressBar && progressBar.style.display === 'none') {
      progressBar.style.removeProperty('display');
    }

    if (submitWrapper && nextWrapper) {
      const hasSubmittedCallout = submitWrapper.querySelector(
        '.cc__submission-response, .cc__submission-response-success, .cc__callout.success',
      );

      if (hasSubmittedCallout) {
        submitWrapper.style.setProperty('display', 'none', 'important');
        nextWrapper.style.setProperty('display', 'block', 'important');
        nextWrapper.classList.remove('cc__element--hidden');

        const nextBtn = nextWrapper.querySelector('button, a');
        if (nextBtn) {
          nextBtn.removeAttribute('disabled');
          nextBtn.style.setProperty('pointer-events', 'auto', 'important');
          nextBtn.style.setProperty('cursor', 'pointer', 'important');
        }
      }
    }
  };

  // ==========================================================================
  // 5. THERAPIST TITLE & CREDENTIALS PARSER
  // ==========================================================================
  const formatTherapistTitles = () => {
    const titleContainers = document.querySelectorAll('.final_title');
    titleContainers.forEach((container) => {
      const targetEl =
        container.querySelector('.cc__formula-result-text') ||
        container.querySelector('p') ||
        container.querySelector('.cc__formula-result');

      if (!targetEl || targetEl.querySelector('.therapist-name-parsed')) return;

      const rawText = targetEl.textContent.trim();
      if (!rawText || rawText === '...' || rawText.length < 3) return;

      const commaIdx = rawText.indexOf(',');
      if (commaIdx !== -1) {
        const namePart = rawText.substring(0, commaIdx).trim();
        const credPart = rawText.substring(commaIdx + 1).trim();

        if (namePart && credPart) {
          targetEl.innerHTML = `
            <div class="therapist-name-parsed">${namePart}</div>
            <div class="therapist-credentials-parsed">${credPart}</div>
          `;
        }
      }
    });
  };

  // ==========================================================================
  // 6. INLINE VALIDATION & FORM NAVIGATION INTERCEPTOR
  // ==========================================================================
  const setInlineFieldError = (input, hasError, customMsg) => {
    const questionWrapper = input.closest('.cc__question');
    if (!questionWrapper) return;

    const label = questionWrapper.querySelector('label');
    if (!label) return;

    let inlineError = label.querySelector('.cc__inline-error');
    if (!inlineError) {
      inlineError = document.createElement('span');
      inlineError.className = 'cc__inline-error';
      label.appendChild(inlineError);
    }

    if (hasError) {
      inlineError.textContent = customMsg || 'This is a required field.';
      inlineError.style.setProperty('display', 'inline-block', 'important');
      input.classList.add('has-field-error');
    } else {
      inlineError.textContent = '';
      inlineError.style.setProperty('display', 'none', 'important');
      input.classList.remove('has-field-error');
    }

    const oldError = questionWrapper.querySelector('.cc__element-error');
    if (oldError) {
      oldError.style.setProperty('display', 'none', 'important');
    }
  };

  // ==========================================================================
  // 7. BATCHED MUTATION OBSERVER & FORM RUNTIME INITIALIZATION
  // ==========================================================================
  let rafId = null;
  const runBatchedUpdates = () => {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => {
      fixFixedFooterContainment();
      formatContactFieldLabels();
      fixFooterNavigationButtons();
      formatTherapistTitles();
    });
  };

  const formObserver = new MutationObserver(runBatchedUpdates);
  formObserver.observe(document.body, { childList: true, subtree: true });

  window.addEventListener('resize', fixFixedFooterContainment, {
    passive: true,
  });
  runBatchedUpdates();

  // Capture-phase navigation click listener
  document.addEventListener(
    'click',
    (e) => {
      // 1. Unrestricted Back / Previous Navigation
      const prevButton = e.target.closest('button, a');
      if (
        prevButton &&
        (/previous/i.test(prevButton.textContent) ||
          prevButton.closest('[data-selector-element-id="73KXcMA4EKc8LnCGM"]'))
      ) {
        runBatchedUpdates();
        return;
      }

      // 2. Next Button Interception
      const nextButton = e.target.closest(
        '.footer_content button, .footer_content a, .form-get-started_footer button, .form-get-started_footer a, .cc__button, [class*="viewBreak"] button',
      );
      if (!nextButton) return;

      const firstNameInput = document.querySelector(
        'input[name="zSgtwjtKZeREtsPEN"]',
      );
      const lastNameInput = document.querySelector(
        'input[name="7mfrPtuZfZbwd5yke"]',
      );
      const emailInput = document.querySelector(
        'input[name="skmnhnMbwC9izFcHX"]',
      );

      // Critical Check: Only validate contacts when they are physically visible on screen
      const isContactStepActive =
        firstNameInput && isElementVisible(firstNameInput);

      if (
        isContactStepActive &&
        firstNameInput &&
        lastNameInput &&
        emailInput
      ) {
        const isFirstEmpty = !firstNameInput.value.trim();
        const isLastEmpty = !lastNameInput.value.trim();
        const emailValue = emailInput.value.trim();
        const isEmailInvalid = !emailValue || !emailValue.includes('@');

        if (isFirstEmpty || isLastEmpty || isEmailInvalid) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();

          setInlineFieldError(
            firstNameInput,
            isFirstEmpty,
            'This is a required field.',
          );
          setInlineFieldError(
            lastNameInput,
            isLastEmpty,
            'This is a required field.',
          );
          setInlineFieldError(
            emailInput,
            isEmailInvalid,
            !emailValue
              ? 'This is a required field.'
              : 'Please enter a valid email.',
          );

          if (isFirstEmpty) {
            firstNameInput.focus();
          } else if (isLastEmpty) {
            lastNameInput.focus();
          } else if (isEmailInvalid) {
            emailInput.focus();
          }
        }
      }
    },
    true,
  );

  // Instant error clearing during active typing
  ['zSgtwjtKZeREtsPEN', '7mfrPtuZfZbwd5yke', 'skmnhnMbwC9izFcHX'].forEach(
    (fieldName) => {
      document.addEventListener('input', (e) => {
        if (e.target && e.target.name === fieldName) {
          const questionWrapper = e.target.closest('.cc__question');
          if (questionWrapper) {
            const inlineError =
              questionWrapper.querySelector('.cc__inline-error');
            if (inlineError && e.target.value.trim()) {
              inlineError.textContent = '';
              inlineError.style.setProperty('display', 'none', 'important');
              e.target.classList.remove('has-field-error');
            }
          }
        }
      });
    },
  );

  // ==========================================================================
  // 8. CTA BUTTON CLICK, UI ELEMENT HIDING & DECORATIVE ARROW
  // ==========================================================================
  const hideFunnelElements = () => {
    const selectorsToHide = [
      '#start-page_questionnaire-form_text-bottom',
      '.start-page-ads_qst-form_text-bottom',
      '#start-page_questionnaire-form_content-left',
      '.start-page-ads_qst-form_content-left',
      '#start-page_questionnaire-form_content-left_heading-mobile',
      '.start-page-ads_heading-mobile',
      '#clinic-form_arrow-wrap-left',
      '.clinic-form_arrow-wrap-left',
      '#clinic-form_arrow-wrap-right',
      '.clinic-form_arrow-wrap-right',
    ];

    selectorsToHide.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      elements.forEach((el) => {
        el.style.display = 'none';
      });
    });
  };

  document.addEventListener('click', (event) => {
    const targetButton = event.target.closest(
      '.header_start-btn .cc__button, .header_start-btn button',
    );
    if (targetButton) {
      hideFunnelElements();
    }
  });

  const injectArrowOnce = (button) => {
    if (
      !button ||
      button.parentElement.querySelector('.start-page_button-arrow')
    ) {
      return;
    }

    const arrowImg = document.createElement('img');
    arrowImg.src =
      'https://cdn.prod.website-files.com/625ea83f782e7712faae42df/699ef72f01b0cf73dbed4bb0_cta-button_arrow.svg';
    arrowImg.width = 150;
    arrowImg.height = 150;
    arrowImg.alt = 'Decorative arrow';
    arrowImg.className = 'start-page_button-arrow';

    button.parentElement.insertBefore(arrowImg, button);
  };

  const initArrowInjection = () => {
    const existingButton = document.querySelector(
      '.header_start-btn .cc__button',
    );
    if (existingButton) {
      injectArrowOnce(existingButton);
      return;
    }

    const arrowObserver = new MutationObserver((mutations, obs) => {
      const btn = document.querySelector('.header_start-btn .cc__button');
      if (btn) {
        injectArrowOnce(btn);
        obs.disconnect();
      }
    });

    arrowObserver.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => arrowObserver.disconnect(), 10000);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initArrowInjection);
  } else {
    initArrowInjection();
  }

  // ==========================================================================
  // 9. TELEMETRY BRIDGE (GTM / DATALAYER)
  // ==========================================================================
  const pushStartSession = () => {
    if (sessionPushed) return;
    sessionPushed = true;
    window.dataLayer.push({
      event: 'convertcalculator.startSession',
      calculator_id: CALC_ID,
    });
  };

  const pushInteraction = (ref) => {
    if (interactionPushed) return;
    interactionPushed = true;
    window.dataLayer.push({
      event: 'convertcalculator.interaction',
      calculator_id: CALC_ID,
      question: ref || 'user_interaction',
    });
  };

  window.pushCCSubmit = (source) => {
    const now = Date.now();
    if (now - lastSubmitTime < 4000) return;
    if (submitPushed) return;
    if (!interactionPushed) return;

    let alreadyInDL = false;
    if (window.dataLayer && window.dataLayer.length) {
      for (
        let i = window.dataLayer.length - 1;
        i >= 0 && i >= window.dataLayer.length - 6;
        i--
      ) {
        if (
          window.dataLayer[i] &&
          window.dataLayer[i].event === 'convertcalculator.submit'
        ) {
          alreadyInDL = true;
          break;
        }
      }
    }

    submitPushed = true;
    lastSubmitTime = now;

    if (!alreadyInDL) {
      window.dataLayer.push({
        event: 'convertcalculator.submit',
        calculator_id: CALC_ID,
        submission_source: source || 'form_complete',
      });
    }

    if (typeof window.fireTikTokPixel === 'function') {
      window.fireTikTokPixel();
    }
  };

  const bindCCApi = () => {
    if (!window.cc || typeof window.cc.getInstance !== 'function') return false;
    const ccInstance = window.cc.getInstance(CALC_ID);
    if (!ccInstance || !ccInstance.calculator) return false;

    pushStartSession();

    ccInstance.calculator.on('interaction', (response) => {
      pushInteraction(response ? response.questionReference : null);
    });

    ccInstance.calculator.on('submit', () => {
      window.pushCCSubmit('api_event');
    });

    return true;
  };

  if (!bindCCApi()) {
    window.addEventListener('ccloaded', bindCCApi);
    let pollCount = 0;
    const pollInterval = setInterval(() => {
      pollCount++;
      if (bindCCApi() || pollCount > 10) clearInterval(pollInterval);
    }, 500);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', pushStartSession);
  } else {
    pushStartSession();
  }

  ['click', 'input', 'change'].forEach((eventType) => {
    document.addEventListener(
      eventType,
      (e) => {
        if (isInsideCalculator(e.target)) {
          if (!isResultsScreenActive()) {
            pushInteraction(`user_${eventType}`);
          }
        }
      },
      true,
    );
  });

  const resultsObserver = new MutationObserver((mutations, obs) => {
    if (isResultsScreenActive() && interactionPushed && !submitPushed) {
      window.pushCCSubmit('results_dom');
      obs.disconnect();
    }
  });

  resultsObserver.observe(document.body, { childList: true, subtree: true });

  // Outbound Results Redirection Telemetry
  document.addEventListener(
    'click',
    (e) => {
      const target = e.target.closest('a, button');
      if (!target) return;
      if (!isResultsScreenActive()) return;

      const btnText = (target.innerText || '').trim().toLowerCase();
      const rawHref = target.getAttribute('href') || target.href || '';
      const href = rawHref.toLowerCase();

      const isResultsCTA =
        btnText.includes('book a session') ||
        btnText.includes('meet & greet') ||
        btnText.includes('learn more') ||
        href.includes('janeapp.com') ||
        href.includes('getmaple.ca') ||
        href.includes('maple') ||
        href.includes('/therapists/');

      if (isResultsCTA) {
        const now = Date.now();
        if (now - lastRedirectTime < 2500) return;

        let alreadyInDL = false;
        if (window.dataLayer && window.dataLayer.length) {
          for (
            let i = window.dataLayer.length - 1;
            i >= 0 && i >= window.dataLayer.length - 4;
            i--
          ) {
            if (
              window.dataLayer[i] &&
              window.dataLayer[i].event === 'convertcalculator.redirect'
            ) {
              alreadyInDL = true;
              break;
            }
          }
        }

        lastRedirectTime = now;

        if (!alreadyInDL) {
          window.dataLayer.push({
            event: 'convertcalculator.redirect',
            click_url: target.href || rawHref,
            click_text: (target.innerText || '').trim(),
          });
        }
      }
    },
    true,
  );

  // ==========================================================================
  // 10. MAKE.COM WEBHOOK & HUBSPOT DATA DISPATCH (FETCH INTERCEPTOR)
  // ==========================================================================
  const sendDataToWebhook = (emailValue) => {
    const formData = {
      hubspotutk: getHubspotUTK(),
      utm_params: getUTMParams(),
      email: emailValue,
      page_uri: window.location.href,
      page_name: document.title,
    };

    fetch(MAKE_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    }).catch((err) => {
      console.warn('Webhook dispatch failed:', err);
    });
  };

  const monitorEmailField = () => {
    const emailInput = document.querySelector(
      "input[name='skmnhnMbwC9izFcHX']",
    );
    if (emailInput) {
      emailInput.addEventListener('input', (event) => {
        const enteredEmail = event.target.value.trim();
        storedEmailValue = isValidEmail(enteredEmail) ? enteredEmail : '';
      });
    } else {
      setTimeout(monitorEmailField, 1000);
    }
  };

  (() => {
    const originalFetch = window.fetch;

    window.fetch = function (...args) {
      const rawUrl = args[0];
      const url =
        typeof rawUrl === 'string'
          ? rawUrl
          : rawUrl && rawUrl.url
            ? rawUrl.url
            : '';
      const options = args[1] || {};
      const method = (
        options.method ||
        (rawUrl && rawUrl.method) ||
        'GET'
      ).toUpperCase();

      const isConvertCalculatorAPI =
        url.includes('https://www.convertcalculator.com/api/') ||
        url.includes('convertcalculator.com/api/');
      const isExcludedAPI = url.includes('embed/create-visit/');
      const isSubmissionRequest =
        method === 'POST' &&
        (url.includes('/submissions') || url.includes('/submit')) &&
        !url.includes('/response');

      return originalFetch.apply(this, args).then((response) => {
        if (isConvertCalculatorAPI && !isExcludedAPI && isSubmissionRequest) {
          if (window.pushCCSubmit) {
            window.pushCCSubmit('api_confirmed');
          }
          if (isValidEmail(storedEmailValue) && !webhookTriggered) {
            sendDataToWebhook(storedEmailValue);
            webhookTriggered = true;
          }
        }
        return response;
      });
    };
  })();

  const waitForFormToLoad = () => {
    const formElement = document.querySelector(
      "input[name='skmnhnMbwC9izFcHX']",
    );
    if (formElement) {
      monitorEmailField();
    } else {
      setTimeout(waitForFormToLoad, 1000);
    }
  };

  waitForFormToLoad();
})();
