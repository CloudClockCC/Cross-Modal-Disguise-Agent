function t(key) {
      return copy[state.language][key] || copy.en[key] || key;
    }

    function getAllLevels() {
      return levelGroups.flatMap((group) => group.levels.map((level, index) => ({ ...level, groupId: group.id, group, index })));
    }

    function currentLevel() {
      return getAllLevels().find((level) => level.id === state.selectedLevelId) || getAllLevels()[0];
    }

    function isGuidedTutorial(level = currentLevel()) {
      return Boolean(level.tutorialGuided);
    }

    function tutorialTargetElement(target) {
      const map = {
        text: els.stickerText,
        sticker: els.sticker,
        size: els.sizeRange,
        appearance: els.opacityRange,
        metrics: document.querySelector(".score-strip"),
        scan: document.querySelector('[data-action="run-scan"]'),
        submit: document.querySelector('[data-action="submit-level"]')
      };
      return map[target] || null;
    }

    function isLevelUnlocked(level) {
      if (level.groupId !== "tutorial") return true;
      if (level.index === 0) return true;
      const previous = level.group.levels[level.index - 1];
      return Boolean(state.completed[previous.id]);
    }

    function levelStatus(level) {
      if (!isLevelUnlocked(level)) return t("locked");
      const completed = state.completed[level.id];
      if (completed) return `${t("completed")} · ${t("best")} ${completed.grade}`;
      return t("notStarted");
    }

    function formalLevels() {
      return getAllLevels().filter((level) => !isGuidedTutorial(level));
    }

    function gradeRank(grade) {
      return gradeOrder[grade] || 0;
    }

    function betterGrade(a, b) {
      return gradeRank(a) >= gradeRank(b) ? a : b;
    }

    function calculateAgentProfile() {
      const formal = formalLevels();
      const grades = formal.map((level) => state.completed[level.id]?.grade).filter(Boolean);
      const counts = { S: 0, A: 0, B: 0, C: 0, D: 0 };
      grades.forEach((grade) => { if (counts[grade] !== undefined) counts[grade] += 1; });
      const completedCount = grades.length;
      const aOrSCount = counts.S + counts.A;
      const tutorialCompleted = Boolean(state.completed.T0);
      const a3Grade = state.completed.A3?.grade || "";
      let titleLevel = -1;
      if (counts.S >= 4 && ["S", "A"].includes(a3Grade)) titleLevel = 5;
      else if (aOrSCount >= 4 && counts.S >= 1) titleLevel = 4;
      else if (aOrSCount >= 3) titleLevel = 3;
      else if (completedCount === formal.length && counts.D === 0) titleLevel = 2;
      else if (completedCount >= 2) titleLevel = 1;
      else if (tutorialCompleted) titleLevel = 0;
      const title = agentTitles.find((item) => item.level === titleLevel) || null;
      return { formalCount: formal.length, completedCount, counts, aOrSCount, a3Grade, tutorialCompleted, titleLevel, title };
    }

    function nextTitleRequirement(profile) {
      if (profile.titleLevel < 0) return state.language === "zh" ? "完成新手训练即可成为训练生。" : "Complete tutorial to become Agent Trainee.";
      if (profile.titleLevel < 1) return state.language === "zh" ? `还需要完成 ${Math.max(0, 2 - profile.completedCount)} 个正式关卡。` : `Complete ${Math.max(0, 2 - profile.completedCount)} more formal missions.`;
      if (profile.titleLevel < 2) return state.language === "zh" ? `还需要完成全部 ${profile.formalCount} 个正式关卡，并且没有 D。` : `Complete all ${profile.formalCount} formal missions with no D.`;
      if (profile.titleLevel < 3) return state.language === "zh" ? `还需要 ${Math.max(0, 3 - profile.aOrSCount)} 个 A/S 成绩。` : `Need ${Math.max(0, 3 - profile.aOrSCount)} more A/S grades.`;
      if (profile.titleLevel < 4) return state.language === "zh" ? "还需要至少 4 个 A/S，且至少 1 个 S。" : "Need at least 4 A/S grades and at least 1 S.";
      if (profile.titleLevel < 5) return state.language === "zh" ? "还需要至少 4 个 S，并且 A3 达到 A 或 S。" : "Need at least 4 S grades and A/S on A3.";
      return state.language === "zh" ? "你已经达到最高头衔。" : "You have reached the highest title.";
    }

    function renderAgentProfile() {
      const profile = calculateAgentProfile();
      const titleName = profile.title ? `${profile.title.zh} · ${profile.title.en}` : (state.language === "zh" ? "尚未解锁" : "Not unlocked");
      const html = `
        <strong>${state.language === "zh" ? "特工档案" : "Agent Profile"}</strong>
        <div class="agent-title-badge">${titleName}</div>
        <div class="muted" style="margin-top:8px;">
          ${state.language === "zh" ? "正式关卡完成" : "Formal missions"}：${profile.completedCount}/${profile.formalCount}<br>
          S/A/B/C/D：${profile.counts.S}/${profile.counts.A}/${profile.counts.B}/${profile.counts.C}/${profile.counts.D}<br>
          ${state.language === "zh" ? "距离下一头衔" : "Next title"}：${nextTitleRequirement(profile)}
        </div>
      `;
      if (els.homeAgentProfile) els.homeAgentProfile.innerHTML = html;
      if (els.historyAgentProfile) els.historyAgentProfile.innerHTML = html;
    }

    function maybeUnlockTitle() {
      const profile = calculateAgentProfile();
      if (profile.titleLevel <= state.highestUnlockedTitleLevel || profile.titleLevel < 0) return null;
      state.highestUnlockedTitleLevel = profile.titleLevel;
      state.lastUnlockedTitle = profile.title;
      return profile.title;
    }

    function showTitleUnlockModal(title) {
      if (!title) return;
      els.titleUnlockHeading.textContent = state.language === "zh" ? "新头衔解锁" : "Title Unlocked";
      els.titleUnlockBadge.textContent = title.short;
      els.titleUnlockName.textContent = `${title.zh} · ${title.en}`;
      els.titleUnlockBody.textContent = title.captain[state.language];
      document.querySelector('[data-action="view-agent-profile"]').textContent = state.language === "zh" ? "查看我的特工档案" : "View Agent Profile";
      document.querySelector('[data-action="close-title-unlock"]').textContent = state.language === "zh" ? "继续任务" : "Continue Mission";
      els.titleUnlockModal.classList.add("open");
    }

    function showView(viewName, options = {}) {
      if (state.view !== viewName && !options.replace) state.history.push(state.view);
      state.view = viewName;
      document.body.classList.toggle("tutorial-challenge", viewName === "challenge" && isGuidedTutorial());
      $$(".view").forEach((view) => view.classList.toggle("active", view.id === `view-${viewName}`));
      els.navBack.disabled = state.history.length === 0;
      if (viewName === "home") renderAgentProfile();
      if (viewName === "intro") resetComicIntroduction();
      if (viewName === "levels") renderLevels();
      if (viewName === "briefing") renderBriefing();
      if (viewName === "challenge") renderChallenge();
      if (viewName === "result") renderResult();
      if (viewName === "ending") renderEnding();
      if (viewName === "history") renderHistoryView();
      if (viewName !== "challenge") {
        clearTutorialHighlights();
        els.tutorialOverlay.classList.remove("open");
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function goBack() {
      const previous = state.history.pop();
      if (previous) showView(previous, { replace: true });
    }

    function goHome() {
      state.history = [];
      showView("home", { replace: true });
    }

    function defaultStickerText(language = state.language) {
      return language === "zh" ? "请输入文本" : "Enter text";
    }

    function isDefaultStickerText(value) {
      return ["文字", "TEXT", "请输入贴纸文本", "Enter sticker text", "请输入文本", "Enter text"].includes(String(value || "").trim());
    }

    function currentStickerTextInput() {
      return els.stickerText ? els.stickerText.value.trim() : "";
    }

    function hasValidStickerText() {
      const text = currentStickerTextInput();
      return Boolean(text && !isDefaultStickerText(text));
    }

    function syncDefaultStickerLanguage(previousLanguage) {
      if (!isDefaultStickerText(state.sticker.text)) return;
      state.sticker.text = defaultStickerText();
      if (els.stickerText && (!els.stickerText.value.trim() || isDefaultStickerText(els.stickerText.value || defaultStickerText(previousLanguage)))) {
        els.stickerText.value = "";
      }
      renderSticker();
    }

    function renderStaticText() {
      $$("[data-i18n]").forEach((node) => { node.textContent = t(node.dataset.i18n); });
      $$("[data-lang]").forEach((button) => {
        const active = button.dataset.lang === state.language;
        button.classList.toggle("active", active);
        button.setAttribute("aria-pressed", String(active));
      });
      document.documentElement.lang = state.language === "zh" ? "zh-CN" : "en";
    }

    let introComicIndex = 0;
    const introComicSlides = $$(".intro-comic-slide");
    const introComicTrack = $("#intro-comic-track");
    const introComicProgress = $("#intro-comic-progress");
    const introComicBack = $("#intro-comic-back");
    const introComicNext = $("#intro-comic-next");
    const introComicStage = $("#intro-comic-stage");
    const introFileStage = $("#intro-file-stage");

    introComicSlides.forEach((_, index) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "intro-comic-dot";
      dot.setAttribute("aria-label", `Comic panel ${index + 1}`);
      dot.addEventListener("click", () => showIntroComicPanel(index));
      introComicProgress.appendChild(dot);
    });

    function showIntroComicPanel(index) {
      introComicIndex = Math.max(0, Math.min(introComicSlides.length - 1, index));
      introComicTrack.style.transform = `translateX(-${introComicIndex * 100}%)`;
      Array.from(introComicProgress.children).forEach((dot, i) => dot.classList.toggle("active", i === introComicIndex));
      introComicBack.disabled = introComicIndex === 0;
      introComicNext.hidden = introComicIndex === introComicSlides.length - 1;
    }

    function resetComicIntroduction() {
      introFileStage.hidden = true;
      introComicStage.hidden = false;
      showIntroComicPanel(0);
    }

    function openIntroAgentFile() {
      introComicStage.hidden = true;
      introFileStage.hidden = false;
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function backToIntroComic() {
      introFileStage.hidden = true;
      introComicStage.hidden = false;
      showIntroComicPanel(3);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
