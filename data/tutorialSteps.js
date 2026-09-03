const tutorialSteps = [
      {
        target: "text",
        title: { zh: "Step 1 / 输入贴纸文字", en: "Step 1 / Sticker Text" },
        body: { zh: "先输入一个你想让 AI 注意到的词。目标是 taxi，你可以试试 TAXI、cab、car，也可以输入自己的想法。", en: "Enter a word for the AI to notice. Target: taxi. Try TAXI, cab, car, or your own idea." }
      },
      {
        target: "sticker",
        title: { zh: "Step 2 / 拖拽位置", en: "Step 2 / Position" },
        body: { zh: "把贴纸拖到图片中合适的位置。靠近主体通常更容易被 AI 读到，但也更容易被人发现。", en: "Drag the sticker to a suitable position. A sticker near the main object is often easier for AI to read, but also easier for humans to notice." }
      },
      {
        target: "size",
        title: { zh: "Step 3 / 调整大小", en: "Step 3 / Size" },
        body: { zh: "试着调整贴纸大小。贴纸越大，AI 越容易读到；但它也会变得更明显。", en: "Try changing the sticker size. A larger sticker is easier for AI to read, but it also becomes more obvious." }
      },
      {
        target: "appearance",
        title: { zh: "Step 4 / 贴纸模式探索", en: "Step 4 / Style" },
        body: { zh: "如果你愿意，也可以试试颜色、透明度或旋转角度。", en: "Try color, opacity, or rotation if you want." }
      },
      {
        target: "scan",
        title: { zh: "Step 5 / 运行真实模型扫描", en: "Step 5 / Run Scan" },
        body: { zh: "现在运行真实模型扫描。Run Scan 是试探，你可以多次扫描，观察 top prediction、target score 和 stealth 怎样变化。", en: "Run Scan is a test. You can scan many times and watch top prediction, target score, and stealth." }
      },
      {
        target: "metrics",
        title: { zh: "Step 6 / 查看扫描结果", en: "Step 6 / Scan Result" },
        body: { zh: "特工，扫描结果已经回传。先检查顶部三项情报：“AI 最高预测”告诉你模型现在把图片看成什么；“影响强度”告诉你贴纸有没有把模型往目标类别拉；“隐蔽性”告诉你这次伪装是否自然，隐蔽程度如何。根据它们决定下一步：加强贴纸，或把贴纸藏得更聪明。", en: "Agent, the scan report is back. Check the three top signals first: AI top prediction shows what the model thinks the image is; influence shows whether your sticker pulled the model toward the target; stealth shows how natural and hidden the disguise still looks. Use them to decide your next move: strengthen the sticker, or hide it more cleverly." }
      },
      {
        target: "metrics",
        title: { zh: "Step 7 / 根据指标调整", en: "Step 7 / Tune Strategy" },
        body: { zh: "如果 AI 最高预测还不是目标，说明伪装还不够强；如果影响强度很低，可以让文字更贴近目标、变清晰或调整位置；如果隐蔽性下降太多，就把贴纸变小、变淡，或放到更自然的位置。", en: "If AI top prediction is not the target yet, the disguise is not strong enough. If influence is low, use a clearer target-related word or adjust position. If stealth drops too much, make the sticker smaller, softer, or place it more naturally." }
      },
      {
        target: "submit",
        title: { zh: "Step 8 / 提交训练", en: "Step 8 / Submit" },
        body: { zh: "Submit 是提交本次训练结果。这里不要求高分，重点是完成一次完整流程并理解模型为什么变化。", en: "Submit records this training. No high score is required; just finish the full loop." }
      }
    ];
