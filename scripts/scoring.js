function evaluateLevelGrade(level, result) {
      if (isGuidedTutorial(level)) return { grade: "Done", uncappedGrade: "Done", reasonKey: "training", scanLimitExceeded: false, directTargetUsed: false };
      const targetDelta = Number(result.targetProbabilityDelta ?? result.influence ?? 0);
      const nearTop = topMatches(result, level.nearTargets || []);
      const relatedTop = topMatches(result, [level.target, ...(level.nearTargets || [])]);
      const topTarget = labelsMatch(result.top, level.target);
      const directTargetUsed = stickerUsesExactTarget(level);
      const obstruction = subjectObstruction(level);
      const obviousWhiteSticker = usesObviousWhiteSticker();
      let grade = "D";
      let reasonKey = "no_effect";
      if (level.id === "E1") {
        if (topTarget && result.stealth >= 60 && state.scansThisTrial <= 3) [grade, reasonKey] = ["S", "direct_clean"];
        else if (topTarget) [grade, reasonKey] = ["A", "target_top"];
        else if (nearTop || targetDelta >= 15) [grade, reasonKey] = ["B", "near_target"];
        else if (targetDelta >= 5) [grade, reasonKey] = ["C", "small_delta"];
      } else if (level.id === "E2") {
        const smartphoneSemanticTop = topTarget || nearTop;
        if (!directTargetUsed && smartphoneSemanticTop && result.stealth >= 55 && state.scansThisTrial <= 4) [grade, reasonKey] = ["S", "semantic_bonus"];
        else if (topTarget || result.target >= Math.max(result.source, result.distractor, result.nearTargetScore || 0)) [grade, reasonKey] = ["A", "target_dominant"];
        else if (nearTop) [grade, reasonKey] = ["B", "related_top"];
        else if (targetDelta >= 5 || (result.nearTargetDelta || 0) >= 5) [grade, reasonKey] = ["C", "related_delta"];
      } else if (level.id === "E3") {
        if (topTarget && result.stealth >= 50 && state.scansThisTrial <= 4) [grade, reasonKey] = ["S", "target_wins"];
        else if (result.target > result.source) [grade, reasonKey] = ["A", "target_over_source"];
        else if (result.target > result.distractor || targetDelta >= 15) [grade, reasonKey] = ["B", "target_over_distractor"];
        else if (targetDelta >= 5) [grade, reasonKey] = ["C", "small_delta"];
        const capped = capGrade(grade, obstruction.cap);
        if (capped !== grade) [grade, reasonKey] = [capped, `subject_block_${obstruction.key}`];
      } else if (level.id === "A1") {
        if (topTarget && result.stealth >= 55 && state.scansThisTrial <= 4) [grade, reasonKey] = ["S", "far_shift_clean"];
        else if (topTarget) [grade, reasonKey] = ["A", "target_top"];
        else if (nearTop || targetDelta >= 20) [grade, reasonKey] = ["B", "animal_region"];
        else if (targetDelta >= 5) [grade, reasonKey] = ["C", "small_delta"];
      } else if (level.id === "A2") {
        if (!directTargetUsed && relatedTop && result.stealth >= 60 && state.scansThisTrial <= 4) [grade, reasonKey] = ["S", "scene_bonus"];
        else if (topTarget || result.target >= Math.max(result.source, result.distractor, result.nearTargetScore || 0)) [grade, reasonKey] = ["A", "target_dominant"];
        else if (nearTop) [grade, reasonKey] = ["B", "functional_top"];
        else if (targetDelta >= 5 || (result.nearTargetDelta || 0) >= 5) [grade, reasonKey] = ["C", "functional_delta"];
      } else if (level.id === "A3") {
        const usesIndirectCue = stickerUsesAnyWord(["cab", "car", "street", "road"]) && !directTargetUsed;
        const sReady = topTarget
          && result.stealth >= 85
          && state.scansThisTrial <= 3
          && state.sticker.size <= 35
          && obstruction.key === "none"
          && !obviousWhiteSticker
          && usesIndirectCue;
        if (sReady) [grade, reasonKey] = ["S", "ace_indirect_stealth"];
        else if (topTarget && result.stealth >= 70) [grade, reasonKey] = ["A", "stealth_success"];
        else if ((topTarget && result.stealth >= 50) || (result.target >= 50 && result.stealth >= 60) || topMatches(result, ["cab", "car"])) [grade, reasonKey] = ["B", "balanced_partial"];
        else if (targetDelta >= 5) [grade, reasonKey] = ["C", result.stealth < 50 ? "stealth_break" : "small_delta"];
        const capped = capGrade(grade, obstruction.cap);
        if (capped !== grade) [grade, reasonKey] = [capped, `subject_block_${obstruction.key}`];
      }
      const uncappedGrade = grade;
      grade = capGradeForScanLimit(level, grade);
      const scanLimitExceeded = Boolean(level.scanLimit && state.scansThisTrial > level.scanLimit);
      if (scanLimitExceeded && grade !== uncappedGrade) reasonKey = "scan_cap";
      return { grade, uncappedGrade, reasonKey, scanLimitExceeded, directTargetUsed, obstruction, obviousWhiteSticker };
    }

    function missionPassed(result, level = currentLevel()) {
      if (!result) return false;
      if (isGuidedTutorial(level)) return true;
      return gradeRank(result.grade) >= gradeRank("C");
    }

    function compositeScore(attack, influence, stealth) {
      const attackPoints = attack ? 60 : 0;
      const influencePoints = Math.min(25, Math.max(0, influence) * .625);
      const stealthPoints = Math.max(0, Math.min(100, stealth)) * .15;
      return Math.round(attackPoints + influencePoints + stealthPoints);
    }

    function gradeFromComposite(composite) {
      return composite >= 85 ? "S" : composite >= 70 ? "A" : composite >= 50 ? "B" : "C";
    }

    function simulatedScan() {
      const level = currentLevel();
      const text = state.sticker.text.toLowerCase();
      const targetHit = text.includes(level.target.toLowerCase()) || text.length > 2 && level.target.toLowerCase().includes(text);
      const sourceHit = text.includes(level.source.toLowerCase());
      const sizePower = state.sticker.size / 35;
      const centerPower = Math.max(0, 42 - Math.hypot(state.sticker.x - 50, state.sticker.y - 50)) / 42;
      const opacityPower = state.sticker.opacity / 100;
      let target = 8 + (targetHit ? 48 : 10) * sizePower * opacityPower + centerPower * 18;
      let source = 78 - (targetHit ? 28 : 8) * sizePower - centerPower * 10;
      let distractor = 100 - target - source;
      if (sourceHit) {
        source += 20;
        target -= 16;
      }
      target = Math.max(1, target);
      source = Math.max(1, source);
      distractor = Math.max(1, distractor);
      const total = target + source + distractor;
      target = Math.round(target / total * 100);
      source = Math.round(source / total * 100);
      distractor = Math.max(1, 100 - target - source);
      const top = target > source && target > distractor ? level.target : source >= distractor ? level.source : level.candidates[2];
      const influence = Math.max(0, target - 8);
      const stealth = stealthScore();
      const attack = top === level.target;
      const composite = compositeScore(attack, influence, stealth);
      const result = {
        top,
        beforeTop: level.source,
        source,
        target,
        distractor,
        distractorLabel: level.distractor || level.candidates[2],
        nearTargetScore: 0,
        nearTargetDelta: 0,
        influence,
        stealth,
        attack,
        composite,
        baselineTarget: 8,
        targetProbabilityDelta: influence,
        targetLogitDelta: 0,
        generatedImage: "",
        realModel: false
      };
      const gradeInfo = evaluateLevelGrade(level, result);
      return { ...result, ...gradeInfo, grade: gradeInfo.grade };
    }

    function signedPercent(value) {
      const numeric = Math.round(Number(value) || 0);
      return `${numeric > 0 ? "+" : ""}${numeric}%`;
    }

    function percentScore(value) {
      return Math.round((Number(value) || 0) * 100);
    }
