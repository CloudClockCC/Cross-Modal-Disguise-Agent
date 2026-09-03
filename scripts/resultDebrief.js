function stickerStrategy(level) {
      const text = state.sticker.text.toLowerCase();
      return {
        targetText: text.includes(level.target.toLowerCase()) || (text.length > 2 && level.target.toLowerCase().includes(text)),
        sourceText: text.includes(level.source.toLowerCase()),
        large: state.sticker.size >= 58,
        tiny: state.sticker.size <= 12,
        centered: Math.hypot(state.sticker.x - 50, state.sticker.y - 50) <= 22,
        edge: state.sticker.x <= 18 || state.sticker.x >= 82 || state.sticker.y <= 18 || state.sticker.y >= 82,
        lowOpacity: state.sticker.opacity <= 45,
        highOpacity: state.sticker.opacity >= 88
      };
    }

    function targetNearLabels(level) {
      return level.nearTargets || [];
    }

    function stealthBand(score) {
      const value = Number(score) || 0;
      if (value >= 85) return { key: "high", zh: "很隐蔽", en: "Highly stealthy" };
      if (value >= 65) return { key: "ok", zh: "基本自然", en: "Acceptable" };
      if (value >= 40) return { key: "obvious", zh: "比较明显", en: "Obvious" };
      return { key: "low", zh: "太明显", en: "Too obvious" };
    }

    function buildScanDiagnostic(result) {
      const level = currentLevel();
      const band = stealthBand(result.stealth);
      const nearTargets = targetNearLabels(level);
      const nearTargetHit = !result.attack && nearTargets.some((label) => labelsMatch(result.top, label));
      if (state.language === "zh") {
        const predictionNote = result.attack
          ? `AI 已经把最高预测转向 ${level.target}。`
          : nearTargetHit
            ? `AI 还没有精准变成 ${level.target}，但已经转向 ${result.top}，说明贴纸把模型拉向了目标附近的语义。`
            : `AI 现在仍然更偏向 ${result.top}。`;
        const scoreNote = result.influence > 10
          ? `Target score 上升了 ${signedPercent(result.influence)}，方向是有效的。`
          : `Target score 变化还不强，可以尝试更清晰的目标相关词、稍大尺寸或更靠近主体的位置。`;
        const stealthNote = `Stealth 是 ${result.stealth}%（${band.zh}）。贴纸越大、越亮或越遮挡主体，通常越容易降低隐蔽性。`;
        return `特工大队长提示：${predictionNote}${scoreNote}${stealthNote}`;
      }
      const predictionNote = result.attack
        ? `The AI top prediction has moved to ${level.target}. `
        : nearTargetHit
          ? `The AI has not precisely reached ${level.target}, but it moved to ${result.top}, a near-target label. `
          : `The AI still leans toward ${result.top}. `;
      const scoreNote = result.influence > 10
        ? `Target score rose by ${signedPercent(result.influence)}, so the direction is working. `
        : `Target score has not moved much; try a clearer target-related word, a slightly larger sticker, or a position closer to the subject. `;
      const stealthNote = `Stealth is ${result.stealth}% (${band.en}). Larger, brighter, or more obstructive stickers usually reduce stealth.`;
      return `Agent Captain note: ${predictionNote}${scoreNote}${stealthNote}`;
    }

    function escapeHtml(value) {
      return String(value ?? "").replace(/[&<>"']/g, (char) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      }[char]));
    }

    function debriefHtml(parts) {
      const analysis = parts.analysis.map((item) => `<li>${item}</li>`).join("");
      return `
        <section class="debrief-section">
          <h4>${parts.verdictTitle}</h4>
          <p>${parts.verdict}</p>
        </section>
        <section class="debrief-section">
          <h4>${parts.analysisTitle}</h4>
          <ul>${analysis}</ul>
        </section>
        <section class="debrief-section">
          <h4>${parts.nextTitle}</h4>
          <p>${parts.next}</p>
        </section>
        <section class="debrief-section">
          <h4>${parts.conceptTitle}</h4>
          <p>${parts.concept}</p>
        </section>
      `;
    }

    const learningDebriefs = {
      tutorial: {
        zh: {
          verdict: "<strong>训练完成，特工。</strong>你已经完成了一次完整伪装流程：编辑贴纸、调整位置与大小、运行真实模型扫描，并提交训练结果。",
          analysis: [
            "这次训练的重点不是追求最高等级，而是观察 <strong>图片里的文字贴纸</strong> 是否会影响 AI 判断。",
            "无论 AI 是否完全转向 <strong>taxi</strong>，只要 <strong>target score</strong> 或预测结果发生变化，就说明文字线索已经开始产生作用。"
          ],
          next: "进入正式任务后，你需要更有策略地选择文字、大小、位置和透明度，既要影响 AI，也要保持图片对人类自然可读。",
          concept: "<strong>multimodal AI</strong> 不只看图像，也会读取图像中的文字。贴纸文字是一种 <strong>cross-modal cue</strong>，会改变模型对图像和候选标签之间的 <strong>image-text alignment</strong>。"
        },
        en: {
          verdict: "<strong>Training complete, agent.</strong> You have finished one full disguise loop: editing the sticker, adjusting its position and size, running a real model scan, and submitting the result.",
          analysis: [
            "The goal here is not to chase the highest grade yet. It is to observe whether <strong>text inside an image</strong> can affect the AI decision.",
            "Even if the AI does not fully switch to <strong>taxi</strong>, a change in <strong>target score</strong> or prediction means the text cue has started to matter."
          ],
          next: "In formal missions, choose text, size, position, and opacity more strategically. You need to influence the AI while keeping the image readable for humans.",
          concept: "<strong>Multimodal AI</strong> does not only see images; it can also read text inside images. A sticker becomes a <strong>cross-modal cue</strong> and changes the <strong>image-text alignment</strong> between the image and candidate labels."
        }
      },
      E1: {
        S: {
          zh: ["<strong>任务完成，特工。</strong>AI 已经从 <strong>clock</strong> 转向 <strong>taxi</strong>，并且你的 <strong>stealth</strong> 仍然不错。本关等级为 <strong>S</strong>。", ["<strong>目标词有效</strong>：你的文字和 taxi 高度相关，模型很容易把图像与目标标签对齐。", "<strong>伪装质量较高</strong>：贴纸没有过度破坏画面，人类仍然能自然看懂原图。"], "下一次可以尝试 <strong>cab / car / vehicle</strong> 这类间接词，看看不用直接写 taxi 是否也能影响模型。", "这说明直接目标词是一种很强的 <strong>cross-modal cue</strong>，可以改变模型的 <strong>image-text alignment</strong>。"],
          en: ["<strong>Mission complete, agent.</strong> The AI moved from <strong>clock</strong> to <strong>taxi</strong>, and your <strong>stealth</strong> is still strong. Grade: <strong>S</strong>.", ["<strong>The target word worked</strong>: your sticker was strongly related to taxi, so the model aligned the image with the target label.", "<strong>The disguise quality is high</strong>: the sticker did not destroy the image, so humans can still understand the original scene."], "Next time, try indirect words such as <strong>cab / car / vehicle</strong> and see whether you can influence the model without writing taxi directly.", "A direct target word is a strong <strong>cross-modal cue</strong>. It can change the model's <strong>image-text alignment</strong>."]
        },
        A: {
          zh: ["<strong>任务完成。</strong>AI 已经预测为 <strong>taxi</strong>，说明你的文字贴纸成功压过了 clock 的视觉证据。本关等级为 <strong>A</strong>。", ["<strong>攻击成功</strong>：最高预测已经到达目标类别。", "但 scan 次数、贴纸自然度或 <strong>stealth score</strong> 仍有优化空间。"], "尝试 <strong>缩小贴纸</strong>，或把贴纸移动到更自然的位置，让伪装更像真实场景的一部分。", "成功预测为 taxi 说明文字线索已经强到足以影响 <strong>multimodal AI</strong> 的最终分类。"],
          en: ["<strong>Mission complete.</strong> The AI predicted <strong>taxi</strong>, which means your sticker overpowered the visual evidence for clock. Grade: <strong>A</strong>.", ["<strong>Attack success</strong>: the top prediction reached the target category.", "However, scan count, naturalness, or <strong>stealth score</strong> could still be improved."], "Try to <strong>make the sticker smaller</strong> or move it to a more natural position.", "Predicting taxi shows that the text cue became strong enough to influence the final decision of a <strong>multimodal AI</strong>."]
        },
        B: {
          zh: ["<strong>接近成功。</strong>AI 还没有完全预测为 taxi，但已经转向 <strong>cab / car</strong> 等交通语义区域。本关等级为 <strong>B</strong>。", ["<strong>方向正确</strong>：模型已经被拉向目标附近。", "但目标线索还不够精准，或强度还不足以让 <strong>taxi</strong> 成为最高预测。"], "让文字更接近目标，或提高贴纸可读性。可以尝试 <strong>taxi / cab / car</strong> 并比较结果。", "这展示了 <strong>semantic neighborhood</strong>：模型可能先被拉向目标附近，而不一定立刻到达精确目标。"],
          en: ["<strong>Close to success.</strong> The AI did not fully predict taxi, but it moved toward transport-related labels such as <strong>cab / car</strong>. Grade: <strong>B</strong>.", ["<strong>The direction is right</strong>: the model is moving near the target category.", "The cue is not precise or strong enough yet to make <strong>taxi</strong> the top prediction."], "Use a word closer to the target, or make the sticker easier to read. Try <strong>taxi / cab / car</strong> and compare the results.", "This shows a <strong>semantic neighborhood</strong>: the model may move near the target before reaching the exact label."]
        },
        C: {
          zh: ["<strong>轻微影响。</strong>taxi score 有变化，但 AI 仍然更相信原图是 <strong>clock</strong>。本关等级为 <strong>C</strong>。", ["文字线索可能被模型读到了一点，但影响强度较弱。", "<strong>clock</strong> 的视觉证据仍然占主导。"], "可以 <strong>增大一点贴纸</strong>、移动到更靠近主体的位置，或使用更直接的目标词。", "当 <strong>target score</strong> 上升但 top prediction 没变时，说明文字影响存在，但还没有压过视觉证据。"],
          en: ["<strong>Slight influence.</strong> The taxi score changed, but the AI still trusts the image as <strong>clock</strong>. Grade: <strong>C</strong>.", ["The model may have read part of the text cue, but the influence is weak.", "The visual evidence for <strong>clock</strong> is still dominant."], "Try to <strong>increase sticker size</strong>, move it closer to the main object, or use a more direct target word.", "When <strong>target score</strong> increases but the top prediction does not change, the text has influence, but not enough to beat the visual evidence."]
        },
        D: {
          zh: ["<strong>伪装未生效。</strong>AI 仍然主要相信图片是 <strong>clock</strong>。本关等级为 <strong>D</strong>。", ["文字可能太小、太边缘，或与 <strong>taxi</strong> 的关系不够强。", "模型没有获得足够清晰的目标线索。"], "先用更明确的 <strong>taxi / cab</strong> 词语重新尝试，再逐步优化 stealth。", "<strong>cross-modal cue</strong> 必须足够清晰，才可能影响模型分类。"],
          en: ["<strong>The disguise did not work.</strong> The AI still mainly sees the image as <strong>clock</strong>. Grade: <strong>D</strong>.", ["The text may be too small, too far from attention, or not related enough to <strong>taxi</strong>.", "The model did not receive a clear target cue."], "Start with clearer words like <strong>taxi / cab</strong>, then improve stealth after the model reacts.", "A <strong>cross-modal cue</strong> must be readable enough before it can affect classification."]
        }
      },
      E2: {
        S: {
          zh: ["<strong>高级伪装成功，特工。</strong>你没有直接依赖 smartphone，但 AI 已经进入 <strong>phone / device / screen</strong> 等相关语义区域。本关等级为 <strong>S</strong>。", ["<strong>相关词诱导有效</strong>：模型从 mug 被拉向 smartphone 附近。", "<strong>stealth 达标</strong>：你的伪装仍然保持了较好的自然度。"], "继续测试不同相关词，例如 <strong>phone / screen / app / device</strong>，观察哪个词最容易触发目标语义。", "这体现了 <strong>semantic neighborhood</strong>：模型不只理解精确目标词，也会被目标附近的相关词影响。"],
          en: ["<strong>Advanced disguise success, agent.</strong> You did not rely directly on smartphone, but the AI moved into related labels such as <strong>phone / device / screen</strong>. Grade: <strong>S</strong>.", ["<strong>Related-word cue worked</strong>: the model moved from mug toward the smartphone area.", "<strong>Stealth passed</strong>: the disguise still looks reasonably natural."], "Test related words such as <strong>phone / screen / app / device</strong> and compare which one triggers the target meaning best.", "This shows a <strong>semantic neighborhood</strong>: the model can be influenced by words near the target, not only the exact target word."]
        },
        A: {
          zh: ["<strong>任务完成。</strong>AI 已经明显转向 <strong>smartphone</strong>，说明贴纸线索足够强。本关等级为 <strong>A</strong>。", ["<strong>目标明确</strong>：如果你直接使用 smartphone，这是有效但比较直接的策略。", "本关更高阶的挑战，是不用直接答案也能诱导模型。"], "尝试用 <strong>phone / screen / app / device</strong> 代替 smartphone，挑战更高级的语义诱导。", "直接目标词能提高 <strong>target score</strong>，但相关词可以帮助玩家理解模型的语义空间。"],
          en: ["<strong>Mission complete.</strong> The AI clearly moved toward <strong>smartphone</strong>, so your sticker cue was strong. Grade: <strong>A</strong>.", ["<strong>The target was clear</strong>: if you used smartphone directly, it is effective but straightforward.", "The higher-level challenge is to guide the model without giving the exact answer."], "Try <strong>phone / screen / app / device</strong> instead of smartphone to test a more advanced semantic strategy.", "A direct target word can raise <strong>target score</strong>, while related words help reveal the model's semantic space."]
        },
        B: {
          zh: ["<strong>语义诱导有效。</strong>AI 还没有完全变成 smartphone，但已经靠近 <strong>phone / screen / device</strong> 区域。本关等级为 <strong>B</strong>。", ["模型已经离开单纯的 <strong>mug</strong> 视觉判断。", "你的贴纸正在把模型拉向目标附近的 <strong>semantic neighborhood</strong>。"], "提高文字清晰度，或换一个更接近 smartphone 的相关词，例如 <strong>iPhone / phone / screen</strong>。", "near-target 结果不是完全失败，它说明模型已经被推向目标附近。"],
          en: ["<strong>The semantic cue worked.</strong> The AI did not fully become smartphone, but it moved near <strong>phone / screen / device</strong>. Grade: <strong>B</strong>.", ["The model is no longer only following the visual evidence for <strong>mug</strong>.", "Your sticker is pulling it into the target <strong>semantic neighborhood</strong>."], "Make the word clearer, or try a closer related word such as <strong>iPhone / phone / screen</strong>.", "A near-target result is not a total failure. It shows that the model has moved toward the target area."]
        },
        C: {
          zh: ["<strong>只有轻微影响。</strong>相关词可能被模型读到了，但还不足以改变主要判断。本关等级为 <strong>C</strong>。", ["<strong>mug</strong> 的视觉证据仍然很强。", "你的词可能和 smartphone 有关系，但语义强度或可读性还不够。"], "尝试 <strong>phone / iPhone / screen</strong> 这类更具体的词，或把贴纸移动到模型更容易读取的位置。", "相关词需要足够接近目标，才会明显影响 <strong>target score</strong>。"],
          en: ["<strong>Only slight influence.</strong> The model may have read the related word, but it was not enough to change the main prediction. Grade: <strong>C</strong>.", ["The visual evidence for <strong>mug</strong> is still strong.", "Your word may be related to smartphone, but it is not strong or readable enough yet."], "Try more specific words such as <strong>phone / iPhone / screen</strong>, or move the sticker to a more readable position.", "A related word must be close enough to the target before it strongly changes the <strong>target score</strong>."]
        },
        D: {
          zh: ["<strong>诱导失败。</strong>AI 仍然主要把图片看作 <strong>mug</strong>。本关等级为 <strong>D</strong>。", ["贴纸没有形成足够强的 smartphone 方向线索。", "词语可能太远、太弱，或贴纸不够清晰。"], "先使用更接近目标的词，例如 <strong>phone / iPhone / screen</strong>，再慢慢尝试更隐蔽的策略。", "<strong>semantic neighborhood</strong> 有范围限制，太远的词不会稳定拉动模型。"],
          en: ["<strong>The cue failed.</strong> The AI still mainly sees the image as <strong>mug</strong>. Grade: <strong>D</strong>.", ["The sticker did not create a strong enough smartphone-direction cue.", "The word may be too distant, too weak, or not readable enough."], "Start with a closer target-related word such as <strong>phone / iPhone / screen</strong>, then try more subtle strategies.", "A <strong>semantic neighborhood</strong> has limits. Words that are too far away will not reliably move the model."]
        }
      },
      E3: {
        S: {
          zh: ["<strong>任务完成，特工。</strong><strong>banana</strong> 已经成为最高预测，说明目标线索成功压过了 <strong>dog</strong> 和 <strong>cat</strong>。本关等级为 <strong>S</strong>。", ["<strong>target 获胜</strong>：banana 在标签竞争中成为最强候选。", "<strong>distractor 被压制</strong>：cat 没有把模型留在动物语义附近。"], "继续观察 source、target 和 distractor 三项分数，而不只是看 top prediction。", "模型分类不是单一判断，而是在多个候选标签之间进行 <strong>score competition</strong>。"],
          en: ["<strong>Mission complete, agent.</strong> <strong>Banana</strong> became the top prediction, so the target cue beat both <strong>dog</strong> and <strong>cat</strong>. Grade: <strong>S</strong>.", ["<strong>The target won</strong>: banana became the strongest candidate in the label competition.", "<strong>The distractor was controlled</strong>: cat did not keep the model in the animal area."], "Keep watching source, target, and distractor scores, not only the top prediction.", "Classification is not a single yes-or-no decision. It is a <strong>score competition</strong> between candidate labels."]
        },
        A: {
          zh: ["<strong>表现很好。</strong><strong>banana score</strong> 已经超过 dog，说明目标线索基本压过了原图视觉证据。本关等级为 <strong>A</strong>。", ["banana 已经比 source 更有竞争力。", "如果 top prediction 还没有稳定，可能是 distractor 或视觉证据仍在干扰。"], "提高 <strong>stealth</strong>，并避免遮挡小狗主体，让伪装更自然。", "当 target score 超过 source score 时，说明文字线索已经显著改变模型的判断排序。"],
          en: ["<strong>Strong performance.</strong> The <strong>banana score</strong> is higher than dog, so the target cue has mostly beaten the visual source. Grade: <strong>A</strong>.", ["Banana is now more competitive than the source label.", "If the top prediction is not stable, the distractor or visual evidence may still be interfering."], "Improve <strong>stealth</strong> and avoid covering the dog too much.", "When target score passes source score, the text cue has changed the model's ranking of labels."]
        },
        B: {
          zh: ["<strong>有明显进展。</strong><strong>banana</strong> 已经超过 cat，或 banana score 明显上升。本关等级为 <strong>B</strong>。", ["模型不再只停留在 dog / cat 的动物语义区域。", "但 banana 还没有完全压过 <strong>dog</strong> 的视觉证据。"], "增强 banana 线索，同时 <strong>避免遮挡主体</strong>，否则等级可能被限制。", "distractor score 可以帮助玩家判断模型是否仍停留在 source 附近。"],
          en: ["<strong>Clear progress.</strong> <strong>Banana</strong> beat cat, or the banana score increased strongly. Grade: <strong>B</strong>.", ["The model is no longer only staying in the dog / cat animal area.", "But banana has not fully beaten the visual evidence for <strong>dog</strong>."], "Strengthen the banana cue while <strong>avoiding object obstruction</strong>, or the grade may be capped.", "Distractor score helps players see whether the model is still close to the source category."]
        },
        C: {
          zh: ["<strong>轻微影响。</strong>banana score 有上升，但 <strong>dog</strong> 或 <strong>cat</strong> 仍然占主导。本关等级为 <strong>C</strong>。", ["贴纸有效，但还没有压过原图和干扰类别。", "模型仍然更相信动物相关视觉证据。"], "让文字更清晰，或选择更靠近模型注意区域的位置，同时不要遮挡小狗主体。", "target 上升但未超过 source/distractor 时，说明影响存在但竞争力不足。"],
          en: ["<strong>Slight influence.</strong> Banana score increased, but <strong>dog</strong> or <strong>cat</strong> still dominates. Grade: <strong>C</strong>.", ["The sticker has some effect, but it has not beaten the source and distractor labels.", "The model still trusts animal-related visual evidence more."], "Make the text clearer or move it to a more readable area, while avoiding covering the dog.", "If target rises but does not beat source or distractor, the cue exists but is not competitive enough."]
        },
        D: {
          zh: ["<strong>标签竞争失败。</strong>dog 或 cat 仍然明显主导，banana 没有形成有效竞争。本关等级为 <strong>D</strong>。", ["模型仍然停留在原图的动物语义区域。", "banana 线索可能太弱、太小或位置不理想。"], "先使用更明确的 <strong>banana / fruit / yellow</strong> 线索，并让文字更容易被读取。", "在多标签竞争中，弱线索很难改变模型的最高预测。"],
          en: ["<strong>Label competition failed.</strong> Dog or cat still dominates, and banana did not become competitive. Grade: <strong>D</strong>.", ["The model is still in the animal semantic area of the original image.", "The banana cue may be too weak, too small, or poorly placed."], "Use clearer cues such as <strong>banana / fruit / yellow</strong>, and make the text easier to read.", "In multi-label competition, weak cues are unlikely to change the top prediction."]
        }
      },
      A1: {
        S: {
          zh: ["<strong>高级任务完成，特工。</strong>AI 已经从 <strong>banana</strong> 转向 <strong>dog</strong>，并且伪装仍保持自然。本关等级为 <strong>S</strong>。", ["<strong>远距离语义迁移成功</strong>：文字线索压过了强水果视觉证据。", "<strong>stealth 可接受</strong>：你没有只靠巨大贴纸粗暴通关。"], "尝试更小或更隐蔽的贴纸，看看能否继续保持 dog prediction。", "语义距离越远，模型越难被拉动；成功说明你的 <strong>cross-modal cue</strong> 足够强。"],
          en: ["<strong>Advanced mission complete, agent.</strong> The AI moved from <strong>banana</strong> to <strong>dog</strong>, and the disguise still looks natural. Grade: <strong>S</strong>.", ["<strong>Far semantic shift succeeded</strong>: the text cue beat strong fruit visual evidence.", "<strong>Stealth is acceptable</strong>: you did not rely only on a huge obvious sticker."], "Try a smaller or more hidden sticker and see whether the model still predicts dog.", "The larger the semantic distance, the harder the shift. Success means your <strong>cross-modal cue</strong> was strong enough."]
        },
        A: {
          zh: ["<strong>任务完成。</strong>AI 已经预测为 <strong>dog</strong>，说明目标文字线索足够强。本关等级为 <strong>A</strong>。", ["你成功让模型离开 banana / fruit 判断。", "但远距离伪装通常需要更明显的贴纸，因此 <strong>stealth</strong> 可能还有提升空间。"], "减少贴纸面积或降低对比度，同时保持文字可读。", "当文字目标和原图视觉差距很大时，模型需要更强的文字证据才会转向。"],
          en: ["<strong>Mission complete.</strong> The AI predicted <strong>dog</strong>, so the target text cue was strong enough. Grade: <strong>A</strong>.", ["You moved the model away from banana / fruit.", "But far semantic shifts often need more visible stickers, so <strong>stealth</strong> can still improve."], "Reduce sticker size or contrast while keeping the text readable.", "When the target is far from the original image, the model needs stronger text evidence to move."]
        },
        B: {
          zh: ["<strong>接近目标。</strong>AI 已经进入 <strong>puppy / animal / pet</strong> 等动物相关区域。本关等级为 <strong>B</strong>。", ["虽然还没有精确变成 dog，但模型已经从 banana/fruit 被拉向目标附近。", "这是远距离任务中的重要进展。"], "使用更明确的 <strong>dog</strong> 线索，或把贴纸移到更容易被模型读取的位置。", "near-target 结果说明模型已经跨过了一部分语义距离。"],
          en: ["<strong>Near the target.</strong> The AI moved into animal-related labels such as <strong>puppy / animal / pet</strong>. Grade: <strong>B</strong>.", ["It is not exactly dog yet, but the model has moved away from banana / fruit.", "This is important progress in a far-shift mission."], "Use a clearer <strong>dog</strong> cue, or move the sticker to a more readable area.", "A near-target result means the model has crossed part of the semantic distance."]
        },
        C: {
          zh: ["<strong>轻微影响。</strong>dog score 有上升，但 <strong>banana</strong> 的视觉证据仍然很强。本关等级为 <strong>C</strong>。", ["banana 和 dog 在视觉与语义上距离很远。", "当前贴纸还不足以完成完整迁移。"], "提高文字清晰度，或尝试 <strong>puppy / animal</strong> 这类辅助词。", "文字贴纸不是万能按钮，原图的强视觉证据仍然会影响模型。"],
          en: ["<strong>Slight influence.</strong> Dog score increased, but the visual evidence for <strong>banana</strong> is still strong. Grade: <strong>C</strong>.", ["Banana and dog are visually and semantically far apart.", "The current sticker is not strong enough for a full shift."], "Make the word clearer, or try helper cues such as <strong>puppy / animal</strong>.", "A text sticker is not a magic button. Strong visual evidence still matters to the model."]
        },
        D: {
          zh: ["<strong>伪装失败。</strong>AI 仍然主要相信图片是 <strong>banana / fruit</strong>。本关等级为 <strong>D</strong>。", ["贴纸线索还不足以对抗强视觉证据。", "语义距离太远时，弱文字很难改变判断。"], "先提高 <strong>dog</strong> 线索强度，再考虑缩小贴纸或提高 stealth。", "远距离伪装需要更强的 <strong>image-text alignment</strong> 改变。"],
          en: ["<strong>Disguise failed.</strong> The AI still mainly sees the image as <strong>banana / fruit</strong>. Grade: <strong>D</strong>.", ["The sticker cue is not strong enough to fight the visual evidence.", "When semantic distance is large, weak text rarely changes the prediction."], "First strengthen the <strong>dog</strong> cue, then improve sticker stealth.", "Far disguise requires a stronger change in <strong>image-text alignment</strong>."]
        }
      },
      A2: {
        S: {
          zh: ["<strong>高级语义伪装成功，特工。</strong>你没有直接依赖 laptop，但 AI 已经进入 <strong>computer / screen / device</strong> 等功能语义区域。本关等级为 <strong>S</strong>。", ["<strong>场景/功能线索有效</strong>：你的文字没有直接说目标，却把模型推向目标附近。", "<strong>策略质量高</strong>：这比直接写 laptop 更像高级特工的语义伪装。"], "继续探索 <strong>school / work / study / office</strong> 等更间接的场景词。", "模型会利用物体的功能和场景关系。这样的词可以形成 <strong>functional semantic cue</strong>。"],
          en: ["<strong>Advanced semantic disguise success, agent.</strong> You did not directly rely on laptop, but the AI moved into functional labels such as <strong>computer / screen / device</strong>. Grade: <strong>S</strong>.", ["<strong>Scene/function cue worked</strong>: your word did not name the target directly, but moved the model near it.", "<strong>High strategy quality</strong>: this is more advanced than simply writing laptop."], "Explore more indirect scene words such as <strong>school / work / study / office</strong>.", "The model can use functional and scene relations. These words become <strong>functional semantic cues</strong>."]
        },
        A: {
          zh: ["<strong>任务完成。</strong>AI 已经明显转向 <strong>laptop</strong>，说明贴纸成功影响了模型。本关等级为 <strong>A</strong>。", ["如果你直接使用 laptop，这是有效但比较直接的策略。", "本关更高阶的目标，是使用功能或场景词完成诱导。"], "尝试 <strong>computer / screen / device / school</strong>，看看不用 laptop 是否也能成功。", "直接目标词能提高 target score，但场景词能帮助你理解模型如何连接物体和环境。"],
          en: ["<strong>Mission complete.</strong> The AI clearly moved toward <strong>laptop</strong>, so the sticker influenced the model. Grade: <strong>A</strong>.", ["If you used laptop directly, it is effective but straightforward.", "The higher-level goal is to guide the model with function or scene words."], "Try <strong>computer / screen / device / school</strong> and see whether you can succeed without writing laptop.", "A direct target word can raise target score, but scene words show how the model connects objects and contexts."]
        },
        B: {
          zh: ["<strong>语义方向正确。</strong>AI 已经靠近 <strong>computer / device / screen</strong> 等 laptop 相关区域。本关等级为 <strong>B</strong>。", ["模型已经从 backpack 被拉向功能语义。", "但目标线索还没有强到让 laptop 成为稳定最高预测。"], "让词语更接近 laptop，或把贴纸放在更像学习/办公语境的位置。", "功能相关词可以改变模型判断方向，即使没有直接命中目标标签。"],
          en: ["<strong>The semantic direction is right.</strong> The AI moved near laptop-related labels such as <strong>computer / device / screen</strong>. Grade: <strong>B</strong>.", ["The model moved from backpack toward functional meaning.", "But the cue is not strong enough to make laptop a stable top prediction."], "Use a word closer to laptop, or place the sticker in a more school/work-like context.", "Function-related words can move the model's direction, even without directly hitting the target label."]
        },
        C: {
          zh: ["<strong>轻微影响。</strong>模型可能看到了一些功能线索，但 <strong>backpack</strong> 的视觉证据仍然占主导。本关等级为 <strong>C</strong>。", ["你的词可能和 laptop 有关系，但语义强度不够。", "贴纸位置、大小或可读性可能限制了影响效果。"], "尝试 <strong>computer / screen / work / study</strong> 等更强的相关词，同时不要让贴纸过大破坏 stealth。", "场景线索需要被模型清楚读取，才会改变目标附近的分数。"],
          en: ["<strong>Slight influence.</strong> The model may have seen some functional cue, but the visual evidence for <strong>backpack</strong> still dominates. Grade: <strong>C</strong>.", ["Your word may be related to laptop, but the semantic strength is not enough.", "Sticker position, size, or readability may be limiting the effect."], "Try stronger related words such as <strong>computer / screen / work / study</strong>, while keeping the sticker from becoming too obvious.", "Scene cues must be readable to the model before they can change target-near scores."]
        },
        D: {
          zh: ["<strong>语义线索未生效。</strong>AI 仍然主要把图片看作 <strong>backpack / bag</strong>。本关等级为 <strong>D</strong>。", ["功能或场景线索没有被模型有效读取。", "当前词语可能离 laptop 太远，或贴纸不够清楚。"], "先使用更直接的功能相关词，例如 <strong>computer / screen / device</strong>，再尝试更隐蔽的场景词。", "不是所有场景词都会产生效果，模型更容易响应与目标功能直接相关的线索。"],
          en: ["<strong>The semantic cue did not work.</strong> The AI still mainly sees the image as <strong>backpack / bag</strong>. Grade: <strong>D</strong>.", ["The model did not effectively read the function or scene cue.", "The word may be too far from laptop, or the sticker may not be clear enough."], "Start with more direct functional words such as <strong>computer / screen / device</strong>, then try more subtle scene words.", "Not every scene word works. The model responds more easily to cues directly related to the target function."]
        }
      },
      A3: {
        S: {
          zh: ["<strong>王牌级伪装完成，特工。</strong>AI 已经预测为 <strong>taxi</strong>，同时 <strong>stealth score</strong> 很高。本关等级为 <strong>S</strong>。", ["<strong>影响强度达标</strong>：模型已经被成功带向目标类别。", "<strong>隐蔽性优秀</strong>：你没有依赖巨大、显眼的大白底贴纸。", "<strong>策略成熟</strong>：间接交通词比直接写 TAXI 更符合最终关目标。"], "保留这套策略，尝试在更小尺寸或更低对比度下继续维持 taxi prediction。", "最终关的核心是 <strong>influence vs stealth tradeoff</strong>：骗过 AI 的同时，也要让人类不容易发现破绽。"],
          en: ["<strong>Ace-level disguise complete, agent.</strong> The AI predicted <strong>taxi</strong>, and the <strong>stealth score</strong> stayed high. Grade: <strong>S</strong>.", ["<strong>Influence passed</strong>: the model moved to the target category.", "<strong>Stealth is excellent</strong>: you did not rely on a huge obvious white sticker.", "<strong>The strategy is mature</strong>: indirect traffic words fit the final mission better than simply writing TAXI."], "Keep this strategy and test whether a smaller or lower-contrast sticker can still maintain taxi prediction.", "The final mission is about the <strong>influence vs stealth tradeoff</strong>: fool the AI while keeping the edit hard for humans to notice."]
        },
        A: {
          zh: ["<strong>任务完成。</strong>AI 已经转向 <strong>taxi</strong>，说明你的文字线索足够强。本关等级为 <strong>A</strong>。", ["攻击目标已经达成。", "但可能直接使用了 taxi，或贴纸仍然略明显，所以没有达到最高隐蔽标准。"], "尝试 <strong>cab / car / street / road</strong> 这类间接词，并缩小贴纸或降低对比度。", "最终关不只奖励成功，还奖励高质量、低暴露风险的 <strong>stealth strategy</strong>。"],
          en: ["<strong>Mission complete.</strong> The AI moved to <strong>taxi</strong>, so your text cue was strong enough. Grade: <strong>A</strong>.", ["The attack goal was reached.", "But you may have used taxi directly, or the sticker may still be too visible for the highest stealth standard."], "Try indirect words such as <strong>cab / car / street / road</strong>, and make the sticker smaller or lower contrast.", "The final mission rewards not only success, but high-quality low-risk <strong>stealth strategy</strong>."]
        },
        B: {
          zh: ["<strong>接近成功。</strong>AI 可能已经进入 <strong>cab / car</strong> 等交通语义区域，或 taxi score 明显上升。本关等级为 <strong>B</strong>。", ["你的方向是对的，模型已经被拉向目标附近。", "但最终关要求更严格：不仅要影响 AI，还要保持高 stealth。"], "减少贴纸显眼程度，同时保留足够可读性。可以优先调整 <strong>大小、透明度和位置</strong>。", "near-target 在最终关中是有效进展，但还不等于最高质量伪装。"],
          en: ["<strong>Close to success.</strong> The AI may have moved into traffic-related labels such as <strong>cab / car</strong>, or taxi score increased strongly. Grade: <strong>B</strong>.", ["Your direction is right, and the model moved near the target.", "But the final mission is stricter: you need both AI influence and high stealth."], "Make the sticker less obvious while keeping it readable. Focus on <strong>size, opacity, and position</strong>.", "Near-target movement is useful progress, but it is not the same as a high-quality final disguise."]
        },
        C: {
          zh: ["<strong>平衡还不够。</strong>可能是 target score 上升了但 stealth 太低，也可能是 stealth 很高但模型没有被明显影响。本关等级为 <strong>C</strong>。", ["如果影响弱，说明文字线索不够清晰。", "如果隐蔽低，说明贴纸太大、太亮或遮挡主体。"], "根据短板调整：影响弱就增强文字；隐蔽低就 <strong>缩小贴纸</strong>、降低对比或移动到更自然的位置。", "<strong>tradeoff</strong> 的意思是两个目标会互相拉扯：越明显越容易影响 AI，但也越容易被人类发现。"],
          en: ["<strong>The balance is not enough.</strong> Target score may have increased while stealth dropped, or stealth may be high while the model barely moved. Grade: <strong>C</strong>.", ["If influence is weak, the text cue is not clear enough.", "If stealth is low, the sticker may be too large, too bright, or covering the main object."], "Adjust the weak side: strengthen the text if influence is low; <strong>make the sticker smaller</strong>, lower contrast, or move it if stealth is low.", "A <strong>tradeoff</strong> means two goals pull against each other: a visible sticker may influence AI, but it is easier for humans to notice."]
        },
        D: {
          zh: ["<strong>最终伪装失败。</strong>AI 没有明显转向 <strong>taxi</strong>，或者贴纸明显破坏了原图自然度。本关等级为 <strong>D</strong>。", ["当前策略没有同时满足 <strong>influence</strong> 和 <strong>stealth</strong>。", "可能文字太弱，也可能贴纸太显眼。"], "先选择 <strong>cab / car / road</strong> 等交通相关词，再调整大小、位置和透明度。", "最终挑战要求综合控制文字语义、视觉显眼度和主体遮挡，而不是只追求单一分数。"],
          en: ["<strong>Final disguise failed.</strong> The AI did not clearly move toward <strong>taxi</strong>, or the sticker damaged the natural look of the image. Grade: <strong>D</strong>.", ["The current strategy did not satisfy both <strong>influence</strong> and <strong>stealth</strong>.", "The text may be too weak, or the sticker may be too obvious."], "Start with traffic-related words such as <strong>cab / car / road</strong>, then adjust size, position, and opacity.", "The final challenge requires control of text meaning, visual obviousness, and object obstruction, not only one score."]
        }
      }
    };

    function buildDebrief(level, result) {
      const labels = {
        zh: ["特工大队长结论", "情报分析", "下一步行动", "AI 概念解锁"],
        en: ["Agent Captain Verdict", "Intel Analysis", "Next Move", "AI Concept Unlocked"]
      }[state.language];
      const selected = isGuidedTutorial(level)
        ? learningDebriefs.tutorial[state.language]
        : learningDebriefs[level.id]?.[result.grade]?.[state.language] || learningDebriefs[level.id]?.D?.[state.language];
      const data = Array.isArray(selected)
        ? { verdict: selected[0], analysis: selected[1], next: selected[2], concept: selected[3] }
        : selected;
      if (!data) {
        return debriefHtml({
          verdictTitle: labels[0],
          analysisTitle: labels[1],
          nextTitle: labels[2],
          conceptTitle: labels[3],
          verdict: state.language === "zh" ? "<strong>扫描完成。</strong>请根据结果指标继续调整策略。" : "<strong>Scan complete.</strong> Use the result metrics to adjust your strategy.",
          analysis: [state.language === "zh" ? "本关结果已经记录到研究数据中。" : "This attempt has been recorded in the research data."],
          next: state.language === "zh" ? "继续比较文字、大小、位置和隐蔽性的影响。" : "Keep comparing text, size, position, and stealth.",
          concept: "<strong>multimodal AI</strong> compares image evidence and text cues together."
        });
      }
      const dynamic = state.language === "zh"
        ? `本次 <strong>AI 最高预测</strong>：<strong>${escapeHtml(result.top)}</strong>；<strong>target score</strong>：<strong>${escapeHtml(result.target)}%</strong>；<strong>stealth score</strong>：<strong>${escapeHtml(result.stealth)}%</strong>。`
        : `<strong>AI top prediction</strong>: <strong>${escapeHtml(result.top)}</strong>; <strong>target score</strong>: <strong>${escapeHtml(result.target)}%</strong>; <strong>stealth score</strong>: <strong>${escapeHtml(result.stealth)}%</strong>.`;
      return debriefHtml({
        verdictTitle: labels[0],
        analysisTitle: labels[1],
        nextTitle: labels[2],
        conceptTitle: labels[3],
        verdict: data.verdict,
        analysis: [dynamic, ...data.analysis],
        next: data.next,
        concept: data.concept
      });
    }
