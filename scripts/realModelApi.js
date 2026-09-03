async function scoreRealModel() {
      const level = currentLevel();
      const response = await fetch(REAL_MODEL_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: level.image,
          stickerText: state.sticker.text,
          sizePercent: state.sticker.size,
          xPercent: state.sticker.x,
          yPercent: state.sticker.y,
          textColor: state.sticker.textColor,
          backgroundColor: state.sticker.bgColor,
          opacityPercent: state.sticker.opacity,
          stealthScore: stealthScore(),
          participantId: "",
          sessionId: state.sessionId,
          trialId: level.id,
          experimentMode: level.groupId,
          scanIndex: state.scansThisTrial,
          rotationDegrees: state.sticker.rotation,
          fontWeight: state.sticker.weight,
          sourceLabel: level.source,
          targetLabel: level.target,
          distractorLabel: level.distractor,
          candidateLabels: level.candidates
        })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || response.statusText);
      }
      return mapRealModelResult(data, level);
    }

    function mapRealModelResult(data, level) {
      const baseline = data.baseline || {};
      const variant = data.variant || {};
      const probabilities = variant.probabilities || {};
      const baselineProbabilities = baseline.probabilities || {};
      const logits = variant.logits || {};
      const baselineLogits = baseline.logits || {};
      const distractorLabel = level.distractor || data.distractor_label || level.candidates.find((label) => label !== level.source && label !== level.target) || level.candidates[2];
      const source = scoreForProbabilities(probabilities, level.source);
      const target = scoreForProbabilities(probabilities, level.target);
      const distractor = scoreForProbabilities(probabilities, distractorLabel);
      const baselineTarget = scoreForProbabilities(baselineProbabilities, level.target);
      const influence = Math.round(Number(data.target_probability_delta ?? ((probabilities[level.target] || 0) - (baselineProbabilities[level.target] || 0))) * 100);
      const stealth = stealthScore();
      const top = data.variant_top_prediction || variant.top_prediction || level.source;
      const beforeTop = data.baseline_top_prediction || baseline.top_prediction || level.source;
      const attack = labelsMatch(top, level.target) || data.target_became_top === true;
      const composite = compositeScore(attack, influence, stealth);
      const nearTargetScore = maxScoreForLabels(probabilities, level.nearTargets || []);
      const baselineNearTargetScore = maxScoreForLabels(baselineProbabilities, level.nearTargets || []);
      const result = {
        top,
        beforeTop,
        source,
        target,
        distractor,
        distractorLabel,
        nearTargetScore,
        nearTargetDelta: nearTargetScore - baselineNearTargetScore,
        influence,
        stealth,
        attack,
        composite,
        baselineTarget,
        targetProbabilityDelta: influence,
        baselineTargetLogit: Number(data.baseline_target_logit ?? baselineLogits[level.target] ?? 0),
        variantTargetLogit: Number(data.variant_target_logit ?? logits[level.target] ?? 0),
        targetLogitDelta: Number(data.target_logit_delta ?? ((logits[level.target] || 0) - (baselineLogits[level.target] || 0))),
        generatedImage: data.generated_image || "",
        probabilities,
        baselineProbabilities,
        realModel: true,
        raw: data
      };
      const gradeInfo = evaluateLevelGrade(level, result);
      return { ...result, ...gradeInfo, grade: gradeInfo.grade };
    }
