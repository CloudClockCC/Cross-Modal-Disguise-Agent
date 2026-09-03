function attachEvents() {
      els.navBack.addEventListener("click", goBack);
      introComicBack.addEventListener("click", () => showIntroComicPanel(introComicIndex - 1));
      introComicNext.addEventListener("click", () => showIntroComicPanel(introComicIndex + 1));
      $("#nav-home").addEventListener("click", goHome);
      $("#nav-levels").addEventListener("click", () => showView("levels"));
      $$("[data-view-target]").forEach((button) => button.addEventListener("click", () => showView(button.dataset.viewTarget)));
      $$("[data-lang]").forEach((button) => button.addEventListener("click", () => {
        const previousLanguage = state.language;
        state.language = button.dataset.lang;
        syncDefaultStickerLanguage(previousLanguage);
        renderStaticText();
        renderGlossary();
        showView(state.view, { replace: true });
      }));
      $$("[data-action]").forEach((node) => node.addEventListener("click", () => {
        const action = node.dataset.action;
        if (action === "start-game") showView("intro");
        if (action === "intro-skip") showView("levels");
        if (action === "intro-open-file") openIntroAgentFile();
        if (action === "intro-back-comic") backToIntroComic();
        if (action === "toggle-language") {
          const previousLanguage = state.language;
          state.language = state.language === "zh" ? "en" : "zh";
          syncDefaultStickerLanguage(previousLanguage);
          renderStaticText();
          renderGlossary();
          showView(state.view, { replace: true });
        }
        if (action === "enter-challenge") showView("challenge");
        if (action === "add-sticker") addSticker();
        if (action === "reset-sticker") resetSticker();
        if (action === "run-scan") runScan();
        if (action === "submit-level") submitLevel();
        if (action === "retry-level") retryLevel();
        if (action === "tutorial-prev") tutorialPrevious();
        if (action === "tutorial-next") tutorialNext();
        if (action === "tutorial-skip") skipTutorialGuide();
        if (action === "next-level") nextLevel();
        if (action === "export-csv") exportCsv();
        if (action === "open-glossary") els.glossaryModal.classList.add("open");
        if (action === "close-glossary") els.glossaryModal.classList.remove("open");
        if (action === "close-title-unlock") els.titleUnlockModal.classList.remove("open");
        if (action === "view-agent-profile") {
          els.titleUnlockModal.classList.remove("open");
          showView("history");
        }
      }));
      [els.stickerText, els.sizeRange, els.opacityRange, els.rotationRange, els.weightSelect].forEach((input) => input.addEventListener("input", syncStickerFromControls));
      els.textColor.addEventListener("input", syncTextColorFromPicker);
      els.bgColor.addEventListener("input", syncBgColorFromPicker);
      els.textColorHex.addEventListener("change", syncStickerFromControls);
      els.bgColorHex.addEventListener("change", syncStickerFromControls);
      els.sizeNumber.addEventListener("input", () => {
        els.sizeRange.value = els.sizeNumber.value;
        syncStickerFromControls();
      });
      els.sticker.addEventListener("pointerdown", (event) => {
        els.sticker.setPointerCapture(event.pointerId);
        updateStickerPosition(event);
      });
      els.sticker.addEventListener("pointermove", (event) => {
        if (event.buttons) updateStickerPosition(event);
      });
    }

    function updateStickerPosition(event) {
      const rect = els.imageCard.getBoundingClientRect();
      state.sticker.x = Math.max(0, Math.min(100, (event.clientX - rect.left) / rect.width * 100));
      state.sticker.y = Math.max(0, Math.min(100, (event.clientY - rect.top) / rect.height * 100));
      state.scanResult = null;
      renderSticker();
      renderScores();
      if (isGuidedTutorial()) renderTutorialGuide();
    }

    renderStaticText();
    renderGlossary();
    attachEvents();
    resetTrialState();
    showView("home", { replace: true });
