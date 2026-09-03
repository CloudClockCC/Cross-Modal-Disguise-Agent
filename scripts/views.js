function renderLevels() {
      els.levelSections.innerHTML = "";
      levelGroups.forEach((group) => {
        const section = document.createElement("section");
        section.className = "panel";
        section.innerHTML = `<h3>${group.title[state.language]}</h3><p class="muted">${group.description[state.language]}</p><div class="level-grid"></div>`;
        const grid = section.querySelector(".level-grid");
        group.levels.forEach((level, index) => {
          const complete = state.completed[level.id];
          const locked = !isLevelUnlocked({ ...level, groupId: group.id, group, index });
          const isTutorial = group.id === "tutorial";
          const cardTitle = level.why ? level.why[state.language] : `${level.source} → ${level.target}`;
          const cardKicker = isTutorial ? `${group.title[state.language]} · ${level.id}` : `${group.title[state.language]} · ${level.id}`;
          const cardMeta = level.why ? `${level.source} → ${level.target}` : level.candidates.join(" / ");
          const button = document.createElement("button");
          button.type = "button";
          button.className = `level-card${state.selectedLevelId === level.id ? " active" : ""}${complete ? " completed" : ""}${locked ? " locked" : ""}`;
          button.innerHTML = `
            <span class="level-kicker">${cardKicker}</span>
            <strong>${cardTitle}</strong>
            <span class="muted">${cardMeta}</span>
            <div class="badge-row" style="margin-top:8px;">
              <span class="badge ${locked ? "locked" : complete ? "success" : ""}">${levelStatus({ ...level, groupId: group.id, group, index })}</span>
            </div>
          `;
          button.disabled = locked;
          button.addEventListener("click", () => {
            state.selectedLevelId = level.id;
            resetTrialState();
            renderLevels();
            showView("briefing");
          });
          grid.appendChild(button);
        });
        els.levelSections.appendChild(section);
      });
    }

    function renderBriefing() {
      const level = currentLevel();
      els.briefTitle.textContent = level.training ? `${level.id} · ${level.training[state.language].title}` : `${level.id} · ${level.source} → ${level.target}`;
      els.briefSource.textContent = level.source;
      els.briefTarget.textContent = level.target;
      els.briefStatus.textContent = levelStatus(level);
      els.briefImage.src = `images_AIgen/${level.image}`;
      const hasBriefing = Boolean(level.why && level.explain);
      els.whyCard.style.display = hasBriefing ? "block" : "none";
      els.whyQuestion.textContent = hasBriefing ? level.why[state.language] : "";
      els.whyExplanation.textContent = hasBriefing ? level.explain[state.language] : "";
    }

    function resetTrialState() {
      state.stickerAdded = true;
      state.scanResult = null;
      state.scansThisTrial = 0;
      state.trialStart = Date.now();
      const level = currentLevel();
      state.sticker.text = defaultStickerText();
      state.sticker.x = 50;
      state.sticker.y = 72;
      state.sticker.size = 28;
      state.sticker.textColor = "#111827";
      state.sticker.bgColor = "#ffffff";
      state.sticker.opacity = 92;
      state.sticker.rotation = 0;
      state.sticker.weight = "900";
      state.tutorialStep = 0;
      state.tutorialSkipped = false;
      state.tutorialOptionalUsed = false;
    }

    function renderChallenge() {
      const level = currentLevel();
      const hasTraining = Boolean(level.training);
      document.body.classList.toggle("tutorial-challenge", isGuidedTutorial(level));
      state.stickerAdded = true;
      els.challengeImage.src = `images_AIgen/${level.image}`;
      els.trainingBanner.style.display = hasTraining ? "block" : "none";
      els.trainingTitle.textContent = hasTraining ? level.training[state.language].title : "";
      els.trainingBody.textContent = hasTraining ? level.training[state.language].body : "";
      els.stickerText.value = isDefaultStickerText(state.sticker.text) ? "" : state.sticker.text;
      const recommended = (level.recommendedWords || []).slice(0, 3).join(" / ");
      els.stickerText.placeholder = recommended
        ? (state.language === "zh" ? `请输入文本，可参考 ${recommended}` : `Enter text, hints: ${recommended}`)
        : defaultStickerText();
      els.sizeRange.value = state.sticker.size;
      els.sizeNumber.value = state.sticker.size;
      els.sizeReadout.textContent = `${state.sticker.size}%`;
      els.textColor.value = state.sticker.textColor;
      els.textColorHex.value = state.sticker.textColor.toUpperCase();
      els.bgColor.value = state.sticker.bgColor;
      els.bgColorHex.value = state.sticker.bgColor.toUpperCase();
      els.opacityRange.value = state.sticker.opacity;
      els.opacityReadout.textContent = `${state.sticker.opacity}%`;
      els.rotationRange.value = state.sticker.rotation;
      els.rotationReadout.textContent = `${state.sticker.rotation}°`;
      els.weightSelect.value = state.sticker.weight;
      renderSticker();
      renderScores();
      setCallout(t("scanIdle"));
      els.feedback.textContent = "";
      els.feedback.style.display = "none";
      els.feedback.className = "feedback-box";
      renderTutorialGuide();
    }

    function clearTutorialHighlights() {
      document.querySelectorAll(".tutorial-highlight").forEach((node) => node.classList.remove("tutorial-highlight"));
    }

    function renderTutorialGuide() {
      clearTutorialHighlights();
      if (!isGuidedTutorial() || state.tutorialSkipped || state.view !== "challenge") {
        els.tutorialOverlay.classList.remove("open");
        return;
      }
      const step = tutorialSteps[Math.min(state.tutorialStep, tutorialSteps.length - 1)];
      els.tutorialOverlay.classList.add("open");
      els.tutorialLabel.textContent = state.language === "zh" ? "特工大队长提示" : "Agent Captain Note";
      els.tutorialStepTitle.textContent = step.title[state.language];
      els.tutorialProgress.innerHTML = `${state.language === "zh" ? "已完成" : "Done"}<span>${Math.min(state.tutorialStep + 1, tutorialSteps.length)}/${tutorialSteps.length}</span>`;
      els.tutorialStepBody.textContent = step.body[state.language];
      els.tutorialPrev.textContent = state.language === "zh" ? "上一步" : "Back";
      els.tutorialNext.textContent = state.tutorialStep === tutorialSteps.length - 1 ? (state.language === "zh" ? "提交训练" : "Submit") : (state.language === "zh" ? "下一步" : "Next");
      els.tutorialSkip.textContent = state.language === "zh" ? "跳过引导" : "Skip";
      els.tutorialPrev.disabled = state.tutorialStep === 0;
      const target = tutorialTargetElement(step.target);
      if (target) target.classList.add("tutorial-highlight");
    }

    function advanceTutorialStep(minStep = state.tutorialStep + 1) {
      if (!isGuidedTutorial() || state.tutorialSkipped) return;
      state.tutorialStep = Math.max(state.tutorialStep, Math.min(minStep, tutorialSteps.length - 1));
      renderTutorialGuide();
    }

    function skipTutorialGuide() {
      state.tutorialSkipped = true;
      clearTutorialHighlights();
      els.tutorialOverlay.classList.remove("open");
    }

    function tutorialPrevious() {
      if (!isGuidedTutorial() || state.tutorialSkipped) return;
      state.tutorialStep = Math.max(0, state.tutorialStep - 1);
      renderTutorialGuide();
    }

    function tutorialNext() {
      if (!isGuidedTutorial()) return;
      if (state.tutorialStep === 4 && !state.scanResult) {
        els.feedback.textContent = state.language === "zh" ? "请先点击“运行真实模型扫描”，看到结果后再进入下一步。" : "Please run the real model scan before moving to the next step.";
        els.feedback.className = "feedback-box warning";
        renderTutorialGuide();
        return;
      }
      if (state.tutorialStep === tutorialSteps.length - 1) {
        submitLevel();
        return;
      }
      advanceTutorialStep();
    }

    function retryLevel() {
      resetTrialState();
      state.history = state.history.filter((view) => view !== "result" && view !== "challenge");
      showView("challenge", { replace: true });
    }
