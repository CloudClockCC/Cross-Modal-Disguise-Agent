async function postLocalDatabase(path, payload) {
      if (!LOCAL_API_BASE) return;
      try {
        await fetch(`${LOCAL_API_BASE}${path}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      } catch (error) {
        console.warn("Local database logging failed:", error);
      }
    }

    function startDatabaseSession() {
      postLocalDatabase("/api/session/start", {
        session_id: state.sessionId,
        participant_id: "",
        app_version: "V4.6 Local Database Logging",
        language: state.language,
        started_at: new Date(state.trialStart).toISOString()
      });
    }

    function persistAttempt(record) {
      postLocalDatabase("/api/log-attempt", {
        ...record,
        participant_id: record.participant_id || "",
        app_version: "V4.6 Local Database Logging",
        language: state.language
      });
    }

    function logScan(type) {
      const level = currentLevel();
      const record = {
        type,
        timestamp: new Date().toISOString(),
        session_id: state.sessionId,
        trial_id: level.id,
        image_id: level.image,
        sticker_text: state.sticker.text,
        sticker_size: state.sticker.size,
        sticker_position: `${Math.round(state.sticker.x)},${Math.round(state.sticker.y)}`,
        sticker_color: `${state.sticker.textColor}/${state.sticker.bgColor}`,
        sticker_opacity: state.sticker.opacity,
        sticker_rotation: state.sticker.rotation,
        sticker_weight: state.sticker.weight,
        model_score_before: state.scanResult ? state.scanResult.beforeTop || level.source : level.source,
        model_score_after: state.scanResult ? state.scanResult.top : "",
        source_score_after: state.scanResult ? state.scanResult.source : "",
        target_score_before: state.scanResult ? state.scanResult.baselineTarget : "",
        target_score_after: state.scanResult ? state.scanResult.target : "",
        distractor_score_after: state.scanResult ? state.scanResult.distractor : "",
        near_target_score_after: state.scanResult ? state.scanResult.nearTargetScore ?? "" : "",
        target_probability_delta: state.scanResult ? state.scanResult.targetProbabilityDelta : "",
        near_target_delta: state.scanResult ? state.scanResult.nearTargetDelta ?? "" : "",
        target_logit_delta: state.scanResult ? state.scanResult.targetLogitDelta : "",
        generated_image: state.scanResult ? state.scanResult.generatedImage : "",
        scoring_mode: state.scanResult && state.scanResult.realModel ? "openclip" : "",
        scan_limit: level.scanLimit || "",
        scan_limit_exceeded: state.scanResult && state.scanResult.scanLimitExceeded ? "true" : "false",
        direct_target_used: state.scanResult && state.scanResult.directTargetUsed ? "true" : "false",
        subject_obstruction: state.scanResult && state.scanResult.obstruction ? state.scanResult.obstruction.key : "",
        subject_obstruction_ratio: state.scanResult && state.scanResult.obstruction ? state.scanResult.obstruction.ratio.toFixed(3) : "",
        obvious_white_sticker: state.scanResult && state.scanResult.obviousWhiteSticker ? "true" : "false",
        tutorial_completed: isGuidedTutorial(level) && state.scanResult ? "scan_done" : "",
        tutorial_step_count: isGuidedTutorial(level) ? state.tutorialStep + 1 : "",
        tutorial_skipped: isGuidedTutorial(level) ? String(state.tutorialSkipped) : "",
        tutorial_optional_controls_used: isGuidedTutorial(level) ? String(state.tutorialOptionalUsed) : "",
        time_spent: Math.round((Date.now() - state.trialStart) / 1000),
        number_of_scans: state.scansThisTrial,
        submitted_result: "",
        grade: state.scanResult ? state.scanResult.grade : "",
        uncapped_grade: state.scanResult ? state.scanResult.uncappedGrade || state.scanResult.grade : "",
        composite: state.scanResult ? state.scanResult.composite : ""
      };
      state.attempts.push(record);
      persistAttempt(record);
    }

    function renderResult() {
      const level = currentLevel();
      const result = state.scanResult || simulatedScan();
      const guidedTutorial = isGuidedTutorial(level);
      const resultTitle = document.querySelector('[data-i18n="resultTitle"]');
      if (resultTitle) resultTitle.textContent = guidedTutorial ? t("tutorialResultTitle") : t("resultTitle");
      const resultMetricsTitle = document.querySelector('[data-i18n="resultMetrics"]');
      if (resultMetricsTitle) resultMetricsTitle.textContent = guidedTutorial ? (state.language === "zh" ? "训练观察" : "Training Observations") : t("resultMetrics");
      const learningTitle = document.querySelector('[data-i18n="learningDebrief"]');
      if (learningTitle) learningTitle.textContent = guidedTutorial ? (state.language === "zh" ? "训练解释" : "Training Explanation") : t("learningDebrief");
      els.resultGrid.innerHTML = "";
      const displayGrade = guidedTutorial ? "Training Complete" : result.grade;
      const gradeClass = guidedTutorial ? "outcome-pass" : `grade-${String(result.grade).toLowerCase()}`;
      const passed = guidedTutorial || gradeRank(result.grade) >= gradeRank("C");
      const outcomeClass = passed ? "outcome-pass" : "outcome-fail";
      const band = stealthBand(result.stealth);
      const metrics = guidedTutorial ? [
        [state.language === "zh" ? "AI 原本 → 贴纸后" : "Before → After", `${result.beforeTop || level.source} → ${result.top}`],
        [state.language === "zh" ? "AI 最高预测" : "Top prediction", result.top],
        [state.language === "zh" ? "目标分数" : "Target score", `${result.target}%`],
        [state.language === "zh" ? "目标变化" : "Target delta", signedPercent(result.targetProbabilityDelta ?? result.influence)],
        [state.language === "zh" ? "隐蔽性" : "Stealth", `${result.stealth}% · ${state.language === "zh" ? band.zh : band.en}`]
      ] : [
        [state.language === "zh" ? "Before → After" : "Before → After", `${result.beforeTop || level.source} → ${result.top}`],
        [state.language === "zh" ? "AI 最高预测" : "Top prediction", result.top],
        [state.language === "zh" ? "Target score" : "Target score", `${result.target}%`],
        [state.language === "zh" ? "Target delta" : "Target delta", signedPercent(result.targetProbabilityDelta ?? result.influence)],
        [state.language === "zh" ? "Source score" : "Source score", `${result.source}%`],
        [level.id === "E3" ? "Source / Target / Cat" : state.language === "zh" ? "Distractor / Near-target" : "Distractor / Near-target", level.id === "E3" ? `${result.source}% / ${result.target}% / ${result.distractor}%` : `${result.distractor}% / ${result.nearTargetScore ?? 0}%`],
        [state.language === "zh" ? "Stealth score" : "Stealth score", `${result.stealth}% · ${state.language === "zh" ? band.zh : band.en}`],
        [state.language === "zh" ? "Scan count" : "Scan count", `${state.scansThisTrial}${level.scanLimit ? ` / ${level.scanLimit}` : ""}`]
      ];
      metrics.forEach(([label, value]) => {
        const metric = document.createElement("div");
        metric.className = "result-metric";
        metric.innerHTML = `<strong>${label}</strong><span>${value}</span>`;
        els.resultGrid.appendChild(metric);
      });
      const finalRow = document.createElement("div");
      finalRow.className = "result-final-row";
      finalRow.innerHTML = guidedTutorial ? `
        <div class="result-metric"><strong>${state.language === "zh" ? "训练记录" : "Training record"}</strong><span class="result-value ${gradeClass}">${state.language === "zh" ? "观察完成" : "Observation complete"}</span></div>
        <div class="result-metric"><strong>${state.language === "zh" ? "训练状态" : "Training status"}</strong><span class="result-value ${outcomeClass}">${state.language === "zh" ? "训练完成" : "Training Complete"}</span></div>
      ` : `
        <div class="result-metric"><strong>${state.language === "zh" ? "本关等级" : "Mission grade"}</strong><span class="result-value ${gradeClass}">${displayGrade}</span></div>
        <div class="result-metric"><strong>${state.language === "zh" ? "通关结果" : "Outcome"}</strong><span class="result-value ${outcomeClass}">${passed ? t("pass") : t("fail")}</span></div>
      `;
      els.resultGrid.appendChild(finalRow);
      els.resultExplanation.innerHTML = buildDebrief(level, result);
      els.resultKeywords.innerHTML = "";
      ["cross-modal cue", "multimodal AI", "image-text alignment", "confidence", "stealth score"].forEach((term) => {
        const chip = document.createElement("button");
        chip.type = "button";
        chip.className = "keyword-chip";
        chip.textContent = term;
        chip.addEventListener("click", () => els.glossaryModal.classList.add("open"));
        els.resultKeywords.appendChild(chip);
      });
      els.resultRecord.innerHTML = "";
    }

    function nextLevel() {
      const levels = getAllLevels().filter(isLevelUnlocked);
      const index = levels.findIndex((level) => level.id === state.selectedLevelId);
      const next = levels[index + 1];
      if (!next) {
        showView("levels");
        return;
      }
      state.selectedLevelId = next.id;
      resetTrialState();
      showView("briefing");
    }

    function allPlayableComplete() {
      return getAllLevels().every((level) => Boolean(state.completed[level.id]));
    }

    function renderEnding() {
      const completed = Object.values(state.completed);
      const best = completed.slice().sort((a, b) => b.score - a.score)[0];
      els.endingStats.innerHTML = "";
      [
        ["Total score", completed.reduce((sum, item) => sum + item.score, 0)],
        ["Completed levels", `${completed.length}/${getAllLevels().length}`],
        ["Best disguise", best ? `${best.grade} · ${best.score}` : "-"],
        ["Most used strategy", state.attempts.length ? "target-related sticker" : "-"]
      ].forEach(([label, value]) => {
        const item = document.createElement("div");
        item.className = "result-card";
        item.innerHTML = `<strong>${label}</strong>${value}`;
        els.endingStats.appendChild(item);
      });
    }

    function renderHistoryView() {
      renderAgentProfile();
      const completed = Object.keys(state.completed).length;
      els.historyStats.innerHTML = "";
      [
        ["Completed", `${completed}/${getAllLevels().length}`],
        ["Attempts", state.attempts.length],
        ["Session", state.sessionId],
        ["Best", Object.values(state.completed).sort((a, b) => b.score - a.score)[0]?.score || "-"]
      ].forEach(([label, value]) => {
        const item = document.createElement("div");
        item.className = "result-card";
        item.innerHTML = `<strong>${label}</strong>${value}`;
        els.historyStats.appendChild(item);
      });
      els.historyList.innerHTML = "";
      state.attempts.slice().reverse().forEach((attempt) => {
        const item = document.createElement("div");
        item.className = "history-item";
        item.innerHTML = `<strong>${attempt.type} · ${attempt.trial_id}</strong>${attempt.model_score_before} → ${attempt.model_score_after} · ${attempt.timestamp}`;
        els.historyList.appendChild(item);
      });
    }

    function exportCsv() {
      const headers = [
        "type", "timestamp", "session_id", "trial_id", "image_id",
        "sticker_text", "sticker_size", "sticker_position", "sticker_color", "sticker_opacity", "sticker_rotation", "sticker_weight",
        "model_score_before", "model_score_after", "source_score_after", "target_score_before", "target_score_after", "distractor_score_after", "near_target_score_after",
        "target_probability_delta", "near_target_delta", "target_logit_delta", "generated_image", "scoring_mode",
        "scan_limit", "scan_limit_exceeded", "direct_target_used", "subject_obstruction", "subject_obstruction_ratio", "obvious_white_sticker",
        "tutorial_completed", "tutorial_step_count", "tutorial_skipped", "tutorial_optional_controls_used",
        "time_spent", "number_of_scans", "submitted_result", "grade", "uncapped_grade", "composite", "title_after_submit", "highest_title_level_after_submit"
      ];
      const escapeCsv = (value) => `"${String(value ?? "").replaceAll("\"", "\"\"")}"`;
      const rows = state.attempts.map((row) => headers.map((key) => escapeCsv(row[key])).join(","));
      const blob = new Blob([[headers.join(","), ...rows].join("\r\n")], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `A2_CMDA_Game_V4_6_${new Date().toISOString().replace(/[:.]/g, "-")}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    }
