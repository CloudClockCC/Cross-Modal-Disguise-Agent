    function renderScores() {
      const result = state.scanResult;
      const guidedTutorial = isGuidedTutorial();
      const passed = missionPassed(result);
      const scoreAttackLabel = els.scoreAttack ? els.scoreAttack.previousElementSibling : null;
      if (scoreAttackLabel) scoreAttackLabel.textContent = guidedTutorial ? t("trainingProgress") : t("attackSuccess");
      els.scoreTop.textContent = result ? result.top : "-";
      els.scoreAttack.textContent = result ? (guidedTutorial ? t("scanCompleted") : passed ? t("pass") : t("fail")) : "-";
      els.scoreInfluence.textContent = result ? signedPercent(result.influence) : "-";
      els.scoreStealth.textContent = `${stealthScore()}%`;
      els.scoreAttack.className = `score-value ${result && passed ? "success" : result ? "warning" : ""}`;
      els.scoreInfluence.className = `score-value ${result && result.influence > 0 ? "success" : result ? "fail" : ""}`;
      els.scoreStealth.className = `score-value ${stealthScore() >= 62 ? "success" : "warning"}`;
    }

    function setCallout(text) {
      els.scanCallout.innerHTML = `<strong>${text}</strong>`;
    }

    async function runScan() {
      if (!hasValidStickerText()) {
        state.scanResult = null;
        renderScores();
        setCallout(t("invalidStickerText"));
        els.feedback.textContent = t("invalidStickerText");
        els.feedback.className = "feedback-box warning";
        els.feedback.style.display = "block";
        return;
      }
      if (!state.stickerAdded) addSticker();
      state.scansThisTrial += 1;
      els.imageCard.classList.remove("scanning");
      void els.imageCard.offsetWidth;
      els.imageCard.classList.add("scanning");
      setCallout(`${t("modelWaiting")} ${t("modelReading")}`);
      const button = $("#run-scan");
      button.disabled = true;
      try {
        state.scanResult = await scoreRealModel();
        renderScores();
        setCallout(t("scanDone"));
        els.feedback.textContent = isGuidedTutorial() ? buildScanDiagnostic(state.scanResult) : t("scanDone");
        els.feedback.className = "feedback-box success";
        els.feedback.style.display = "block";
        logScan("scan");
      } catch (error) {
        state.scanResult = null;
        renderScores();
        setCallout(t("scanFailed"));
        els.feedback.textContent = `${t("scanFailed")} ${error.message || ""}`;
        els.feedback.className = "feedback-box fail";
        els.feedback.style.display = "block";
      } finally {
        button.disabled = false;
      }
    }

    function addSticker() {
      state.stickerAdded = true;
      state.sticker.text = currentStickerTextInput();
      renderSticker();
    }

    function resetSticker() {
      state.scanResult = null;
      resetTrialState();
      renderChallenge();
    }

    function submitLevel() {
      if (!hasValidStickerText()) {
        els.feedback.textContent = t("invalidStickerText");
        els.feedback.className = "feedback-box warning";
        els.feedback.style.display = "block";
        return;
      }
      if (!state.scanResult) {
        els.feedback.textContent = t("submitFirst");
        els.feedback.className = "feedback-box warning";
        els.feedback.style.display = "block";
        return;
      }
      const level = currentLevel();
      const result = state.scanResult;
      const guidedTutorial = isGuidedTutorial(level);
      const record = {
        type: "submit",
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
        model_score_before: result.beforeTop || level.source,
        model_score_after: result.top,
        source_score_after: result.source,
        target_score_before: result.baselineTarget,
        target_score_after: result.target,
        distractor_score_after: result.distractor,
        near_target_score_after: result.nearTargetScore ?? "",
        target_probability_delta: result.targetProbabilityDelta,
        near_target_delta: result.nearTargetDelta ?? "",
        target_logit_delta: result.targetLogitDelta,
        generated_image: result.generatedImage,
        scoring_mode: result.realModel ? "openclip" : "simulated",
        scan_limit: level.scanLimit || "",
        scan_limit_exceeded: result.scanLimitExceeded ? "true" : "false",
        direct_target_used: result.directTargetUsed ? "true" : "false",
        subject_obstruction: result.obstruction ? result.obstruction.key : "",
        subject_obstruction_ratio: result.obstruction ? result.obstruction.ratio.toFixed(3) : "",
        obvious_white_sticker: result.obviousWhiteSticker ? "true" : "false",
        tutorial_completed: guidedTutorial ? "true" : "",
        tutorial_step_count: guidedTutorial ? state.tutorialStep + 1 : "",
        tutorial_skipped: guidedTutorial ? String(state.tutorialSkipped) : "",
        tutorial_optional_controls_used: guidedTutorial ? String(state.tutorialOptionalUsed) : "",
        time_spent: Math.round((Date.now() - state.trialStart) / 1000),
        number_of_scans: state.scansThisTrial,
        submitted_result: guidedTutorial ? "training_complete" : gradeRank(result.grade) >= gradeRank("C") ? "pass" : "fail",
        grade: result.grade,
        uncapped_grade: result.uncappedGrade || result.grade,
        composite: result.composite,
        title_after_submit: "",
        highest_title_level_after_submit: ""
      };
      state.attempts.push(record);
      const previous = state.completed[level.id];
      const nextGrade = guidedTutorial ? "Done" : betterGrade(result.grade, previous?.grade);
      const nextScore = Math.max(Number(previous?.score || 0), Number(result.composite || 0));
      state.completed[level.id] = {
        grade: nextGrade,
        latestGrade: guidedTutorial ? "Done" : result.grade,
        score: nextScore,
        latestScore: result.composite,
        timestamp: record.timestamp,
        scans: state.scansThisTrial
      };
      const unlockedTitle = maybeUnlockTitle();
      const profile = calculateAgentProfile();
      record.title_after_submit = profile.title ? profile.title.en : "";
      record.highest_title_level_after_submit = profile.titleLevel;
      renderAgentProfile();
      showView(allPlayableComplete() ? "ending" : "result");
      if (unlockedTitle) showTitleUnlockModal(unlockedTitle);
    }
