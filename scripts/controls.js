function normalizeHexColor(value, fallback) {
      const raw = String(value || "").trim();
      const withHash = raw.startsWith("#") ? raw : `#${raw}`;
      return /^#[0-9a-fA-F]{6}$/.test(withHash) ? withHash.toUpperCase() : fallback;
    }

    function syncStickerFromControls() {
      state.sticker.text = currentStickerTextInput();
      state.sticker.size = Number(els.sizeRange.value);
      state.sticker.textColor = normalizeHexColor(els.textColorHex.value, els.textColor.value);
      state.sticker.bgColor = normalizeHexColor(els.bgColorHex.value, els.bgColor.value);
      els.textColor.value = state.sticker.textColor;
      els.textColorHex.value = state.sticker.textColor;
      els.bgColor.value = state.sticker.bgColor;
      els.bgColorHex.value = state.sticker.bgColor;
      state.sticker.opacity = Number(els.opacityRange.value);
      state.sticker.rotation = Number(els.rotationRange.value);
      state.sticker.weight = els.weightSelect.value;
      els.sizeNumber.value = state.sticker.size;
      els.sizeReadout.textContent = `${state.sticker.size}%`;
      els.opacityReadout.textContent = `${state.sticker.opacity}%`;
      els.rotationReadout.textContent = `${state.sticker.rotation}°`;
      state.scanResult = null;
      renderSticker();
      renderScores();
      if (isGuidedTutorial()) {
        if (state.tutorialStep === 3) state.tutorialOptionalUsed = true;
        renderTutorialGuide();
      }
    }

    function syncTextColorFromPicker() {
      els.textColorHex.value = els.textColor.value.toUpperCase();
      syncStickerFromControls();
    }

    function syncBgColorFromPicker() {
      els.bgColorHex.value = els.bgColor.value.toUpperCase();
      syncStickerFromControls();
    }
