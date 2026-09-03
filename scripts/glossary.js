function renderGlossary() {
      els.glossaryList.innerHTML = "";
      const glossaryTerms = {
        zh: [
          ["multimodal AI", "通俗解释：会同时看图片、读文字的 AI。在本游戏中，它会一起参考原图内容和贴纸文字。"],
          ["OpenCLIP", "通俗解释：本地运行的真实图文模型。在本游戏中，它负责比较图片和候选标签哪个更接近。"],
          ["image-text alignment", "通俗解释：图片和文字在模型眼里是不是“意思接近”。在本游戏中，它决定图片更像 clock、taxi 还是其他标签。"],
          ["confidence", "通俗解释：模型对某个判断有多强的倾向。在本游戏中，分数越高，表示模型越偏向那个标签。"],
          ["cross-modal cue", "通俗解释：来自一种信息形式的线索，影响了另一种判断。在本游戏中，贴纸文字影响了 AI 对图片类别的判断。"],
          ["stealth score", "通俗解释：图片对人类看起来是否仍然自然。在本游戏中，贴纸越大、越突兀或越遮挡主体，stealth 通常越低。"]
        ],
        en: [
          ["multimodal AI", "Plain meaning: an AI that can use images and text together. In this game, it reads both the original image and the sticker text."],
          ["OpenCLIP", "Plain meaning: the real local image-text model used here. In this game, it compares the image against candidate labels."],
          ["image-text alignment", "Plain meaning: whether an image and a text label feel close in meaning to the model. In this game, it affects whether the image looks more like clock, taxi, or another label."],
          ["confidence", "Plain meaning: how strongly the model leans toward a prediction. In this game, a higher score means a stronger model preference."],
          ["cross-modal cue", "Plain meaning: a clue from one information type that changes another judgment. In this game, sticker text changes the AI image classification."],
          ["stealth score", "Plain meaning: whether the edited image still looks natural to humans. In this game, bigger, louder, or more obstructive stickers usually lower stealth."]
        ]
      };
      glossaryTerms[state.language].forEach(([term, body]) => {
        const item = document.createElement("div");
        item.className = "history-item";
        item.innerHTML = `<strong>${term}</strong>${body}`;
        els.glossaryList.appendChild(item);
      });
    }
