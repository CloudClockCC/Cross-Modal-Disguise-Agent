function renderSticker() {
      els.sticker.classList.toggle("visible", state.stickerAdded);
      els.sticker.textContent = state.sticker.text || defaultStickerText();
      els.sticker.style.left = `${state.sticker.x}%`;
      els.sticker.style.top = `${state.sticker.y}%`;
      els.sticker.style.fontSize = `${Math.max(10, Math.min(88, state.sticker.size * 1.15))}px`;
      els.sticker.style.color = state.sticker.textColor;
      els.sticker.style.backgroundColor = state.sticker.bgColor;
      els.sticker.style.opacity = state.sticker.opacity / 100;
      els.sticker.style.transform = `rotate(${state.sticker.rotation}deg)`;
      els.sticker.style.fontWeight = state.sticker.weight;
    }

    function stealthScore() {
      const sizePenalty = Math.max(0, state.sticker.size - 28) * .85;
      const centerDistance = Math.hypot(state.sticker.x - 50, state.sticker.y - 50);
      const centerPenalty = Math.max(0, 38 - centerDistance) * .7;
      const opacityPenalty = Math.max(0, state.sticker.opacity - 82) * .2;
      return Math.round(Math.max(8, Math.min(100, 100 - sizePenalty - centerPenalty - opacityPenalty)));
    }

    function normalizeLabel(label) {
      return String(label || "").trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
    }

    function labelsMatch(a, b) {
      const left = normalizeLabel(a);
      const right = normalizeLabel(b);
      return left === right;
    }

    function scoreForProbabilities(probabilities, label) {
      const key = Object.keys(probabilities || {}).find((item) => normalizeLabel(item) === normalizeLabel(label));
      return Math.round(Number(probabilities?.[key] || 0) * 100);
    }

    function maxScoreForLabels(probabilities, labels) {
      return Math.max(0, ...(labels || []).map((label) => scoreForProbabilities(probabilities, label)));
    }

    function topMatches(result, labels) {
      return (labels || []).some((label) => labelsMatch(result.top, label));
    }

    function stickerUsesExactTarget(level) {
      return normalizeLabel(state.sticker.text).includes(normalizeLabel(level.target));
    }

    function stickerUsesAnyWord(words) {
      const text = normalizeLabel(state.sticker.text);
      return (words || []).some((word) => text.includes(normalizeLabel(word)));
    }

    function stickerRectPercent() {
      const textLength = Math.max(4, String(state.sticker.text || "").length);
      const width = Math.min(62, Math.max(10, state.sticker.size * (0.38 + textLength * 0.055)));
      const height = Math.min(30, Math.max(5, state.sticker.size * 0.38));
      return {
        xMin: state.sticker.x - width / 2,
        xMax: state.sticker.x + width / 2,
        yMin: state.sticker.y - height / 2,
        yMax: state.sticker.y + height / 2
      };
    }

    function overlapRatio(rect, zone) {
      if (!zone) return 0;
      const overlapWidth = Math.max(0, Math.min(rect.xMax, zone.xMax) - Math.max(rect.xMin, zone.xMin));
      const overlapHeight = Math.max(0, Math.min(rect.yMax, zone.yMax) - Math.max(rect.yMin, zone.yMin));
      const rectArea = Math.max(1, (rect.xMax - rect.xMin) * (rect.yMax - rect.yMin));
      return overlapWidth * overlapHeight / rectArea;
    }

    function subjectObstruction(level) {
      const zones = {
        E3: { xMin: 29, xMax: 72, yMin: 18, yMax: 84 },
        A3: { xMin: 35, xMax: 65, yMin: 18, yMax: 64 }
      };
      const ratio = overlapRatio(stickerRectPercent(), zones[level.id]);
      if (ratio >= 0.55) return { key: "severe", ratio, cap: "C" };
      if (ratio >= 0.28) return { key: "medium", ratio, cap: "B" };
      if (ratio >= 0.12) return { key: "light", ratio, cap: "A" };
      return { key: "none", ratio, cap: null };
    }

    function isWhiteLikeColor(value) {
      const hex = normalizeHexColor(value, "#ffffff").replace("#", "");
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return r >= 238 && g >= 238 && b >= 238;
    }

    function usesObviousWhiteSticker() {
      return isWhiteLikeColor(state.sticker.bgColor) && state.sticker.opacity >= 88 && state.sticker.size > 30;
    }

    function capGradeForScanLimit(level, grade) {
      if (!level.scanLimit || state.scansThisTrial <= level.scanLimit) return grade;
      return gradeRank(grade) > gradeRank("B") ? "B" : grade;
    }

    function capGrade(grade, cap) {
      if (!cap) return grade;
      return gradeRank(grade) > gradeRank(cap) ? cap : grade;
    }
