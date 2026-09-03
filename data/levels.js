const levelGroups = [
      {
        id: "tutorial",
        title: { zh: "新手训练", en: "Tutorial Mission" },
        description: { zh: "按顺序解锁，学习核心机制。", en: "Unlock in order and learn core mechanics." },
        levels: [
          {
            id: "T1",
            image: "01_street_clock.png",
            source: "clock",
            target: "taxi",
            candidates: ["clock", "watch", "tower", "taxi", "cab", "car", "street sign", "traffic light", "banana"],
            why: { zh: "为什么图片里的文字会影响 AI？", en: "Why can text inside an image influence AI?" },
            explain: {
              zh: "在多模态 AI 里，模型不只是看图像里的形状、颜色和物体，也会读取图像中出现的文字。对于模型来说，图片里的文字贴纸是一种 cross-modal cue：它来自文字模态，却会影响图像分类。比如原图是街边时钟，但你放入 TAXI 这样的词，模型可能把这个文字线索和候选标签 taxi 对齐，从而提高 target score。这一关先不追求复杂技巧，我们要观察最基础的问题：当同一张 clock 图片里出现不同文字时，AI 的判断是否会被拉向文字暗示的类别。那么我们在本关中试试使用不同文字的贴纸吧。",
              en: "A multimodal AI does not only look at shapes, colors, and objects. It can also read text that appears inside an image. For the model, a sticker is a cross-modal cue: a text signal that can change an image decision. The original picture is a street clock, but a word such as TAXI may align more strongly with the target label and raise the target score. In this training mission, do not worry about advanced strategy yet. First observe the basic effect: when different words appear on the same clock image, does the AI move toward the label suggested by the sticker?"
            },
            training: {
              zh: { title: "尝试用不同的贴纸内容来欺骗模型", body: "输入 TAXI、出租车、car 或随机词，比较哪些文字更容易把 clock 拉向 taxi。" },
              en: { title: "Try different sticker words to fool the model", body: "Enter TAXI, taxi, car, or random words and compare which words pull clock toward taxi." }
            }
          },
          {
            id: "T2",
            image: "01_street_clock.png",
            source: "clock",
            target: "taxi",
            candidates: ["clock", "watch", "tower", "taxi", "cab", "car", "street sign", "traffic light", "banana"],
            why: { zh: "贴纸越大是否一定越有效？", en: "Is a bigger sticker always more effective?" },
            explain: {
              zh: "贴纸大小会影响模型读取文字线索的机会。更大的文字通常更清晰，也更容易被 AI 当作重要信息，因此 target score 可能上升。但是，越大并不一定越好。过大的贴纸会遮挡原图，让人类玩家很容易发现伪装，也会降低 stealth score。教育目标不是教玩家简单地把文字放到最大，而是理解攻击成功和自然可读之间的张力。这一关仍然使用同一张 clock 图片，让你只改变 sticker size，观察大小从很小到很大时，AI 置信度和隐蔽性如何一起变化。那么我们在本关中试试不同大小的贴纸吧。",
              en: "Sticker size changes how easily the model can read the text cue. Larger text is usually clearer, so it may raise the target score. But bigger is not always better. A huge sticker blocks the original image, makes the disguise obvious to humans, and lowers stealth score. The goal is not simply to maximize size; it is to understand the tradeoff between attack success and human readability. This mission keeps the same clock image so you can focus on one variable: sticker size. Try moving from tiny to large and observe how AI confidence and stealth change together."
            },
            training: {
              zh: { title: "尝试改变贴纸大小，观察模型反应", body: "保持文字接近目标词，分别尝试小、中、大尺寸，比较 target score 和 stealth score。" },
              en: { title: "Change sticker size and watch the model react", body: "Keep the word target-related, then test small, medium, and large sizes. Compare target score and stealth score." }
            }
          },
          {
            id: "T3",
            image: "01_street_clock.png",
            source: "clock",
            target: "taxi",
            candidates: ["clock", "watch", "tower", "taxi", "cab", "car", "street sign", "traffic light", "banana"],
            why: { zh: "贴纸放在哪里更容易影响模型？", en: "Where should a sticker go to influence the model?" },
            explain: {
              zh: "贴纸位置会影响 AI 是否注意到文字。放在图像中心、主体附近或高对比区域，文字更容易进入模型的有效视觉区域，因此可能带来更强的 target score 增长。但位置也会影响人类观看体验：如果贴纸挡住时钟主体，人类会觉得图片被明显修改；如果放在边缘，可能更隐蔽，但模型也可能不够重视。这个关卡继续使用 clock 图片，让你只训练 placement。你可以把同一个 TAXI 贴纸拖到中心、角落、背景和主体边缘，观察模型判断是否改变。那么我们在本关中试试把贴纸放在不同位置吧。",
              en: "Sticker placement affects whether the AI attends to the text. Text near the center, near the main object, or in a high-contrast area may enter the model's useful visual region and increase target score. But placement also changes human readability. If the sticker covers the clock, the image looks obviously edited. If it sits near the edge, it may be stealthier, but the model may ignore it. This mission keeps the clock image fixed so you can train placement only. Drag the same TAXI sticker to the center, corners, background, and object edge, then compare the model response."
            },
            training: {
              zh: { title: "拖拽贴纸到不同位置，比较影响强度", body: "把同一个贴纸分别放到主体中心、背景、角落和道路边缘，观察模型更容易读取哪里。" },
              en: { title: "Drag the sticker to different positions", body: "Place the same sticker at the object center, background, corner, and road edge. Observe where the model reads it more strongly." }
            }
          },
          {
            id: "T4",
            image: "01_street_clock.png",
            source: "clock",
            target: "taxi",
            candidates: ["clock", "watch", "tower", "taxi", "cab", "car", "street sign", "traffic light", "banana"],
            why: { zh: "颜色和透明度会不会改变 AI 的注意力？", en: "Do color and opacity change AI attention?" },
            explain: {
              zh: "颜色和透明度会影响文字是否清晰可读。对 AI 来说，高对比度文字更容易成为有效 cue，例如深色字配浅色底、浅色字配深色底。透明度过低时，人类可能觉得贴纸更自然，但模型也可能读不清文字，target score 上升较少。透明度过高、颜色过突兀时，模型可能更容易被影响，但 stealth score 可能下降。这一关使用同一张 clock 图片，帮助你只观察视觉样式变量。请尝试不同文字颜色、底色和透明度，看看怎样既能让模型读到，又不会让贴纸太显眼。那么我们在本关中试试不同外观组合吧。",
              en: "Color and opacity affect whether the text is readable. For AI, high-contrast text is more likely to become an effective cue, such as dark text on a light background or light text on a dark background. If opacity is too low, the sticker may look more natural to humans, but the model may not read it clearly. If opacity is too high or the colors are too loud, the model may react more strongly, while stealth score drops. This mission uses the same clock image so you can isolate visual style. Test text color, background color, and opacity together."
            },
            training: {
              zh: { title: "调整颜色和透明度，寻找可读但不突兀的贴纸", body: "尝试不同文字颜色、底色和透明度，比较 target score 是否上升，以及 stealth 是否下降。" },
              en: { title: "Tune color and opacity for readable but subtle text", body: "Try different text colors, backgrounds, and opacity. Compare target score gains with stealth loss." }
            }
          },
          {
            id: "T5",
            image: "01_street_clock.png",
            source: "clock",
            target: "taxi",
            candidates: ["clock", "watch", "tower", "taxi", "cab", "car", "street sign", "traffic light", "banana"],
            why: { zh: "为什么攻击成功和隐蔽性需要平衡？", en: "Why balance attack success and stealth?" },
            explain: {
              zh: "在这个游戏里，真正好的伪装不是只让 AI 说出 taxi，也不是只让图片看起来自然，而是同时做到两件事。攻击成功代表模型是否被文字线索拉向目标类别；隐蔽性代表人类是否仍能自然理解原图，没有觉得贴纸过大、过亮或过突兀。如果你把 TAXI 做得巨大，可能 target score 很高，但人类会立刻发现。反过来，如果贴纸太小太淡，stealth 很高，但模型可能完全不受影响。这一关综合使用文字、大小、位置、颜色和透明度，让你练习像特工一样平衡两类目标。那么我们在本关中试试找到最高综合分策略吧。",
              en: "A strong disguise is not only making the AI say taxi, and it is not only keeping the image natural. It must do both. Attack success means the model is pulled toward the target label by the text cue. Stealth means humans can still understand the original image without noticing an obvious edit. If you make TAXI huge, target score may rise, but humans will notice immediately. If the sticker is tiny and faint, stealth may be high, but the model may ignore it. This mission combines word choice, size, placement, color, and opacity so you can practice balancing both goals."
            },
            training: {
              zh: { title: "综合使用所有工具，平衡攻击成功和隐蔽性", body: "同时调整文字、大小、位置、颜色和透明度，目标是让模型说 taxi，同时让图片仍然自然可读。" },
              en: { title: "Use all tools to balance attack success and stealth", body: "Adjust word, size, placement, color, and opacity together. Make the model say taxi while keeping the image readable." }
            }
          }
        ]
      },
      {
        id: "easy",
        title: { zh: "简单关卡", en: "Easy Missions" },
        description: { zh: "自由选择，实践新手引导中学到的策略。", en: "Choose freely and practice what you learned." },
        levels: [
          {
            id: "E1",
            image: "01_street_clock.png",
            source: "clock",
            target: "taxi",
            candidates: ["clock", "watch", "tower", "taxi", "cab", "car", "street sign", "traffic light", "banana"],
            why: { zh: "目标词是否能直接把 AI 拉向目标类别？", en: "Can a target word directly pull AI toward the target label?" },
            explain: {
              zh: "这是正式实践的第一关，目标是把新手训练中最基础的发现用到真实任务里。原图仍然是 clock，目标是 taxi。你可以使用 TAXI、taxi、出租车、cab 等目标相关词，观察 target score 是否上升。与第一次新手训练不同，这里不再只完成流程，而是要求你自己决定文字、大小、位置和透明度。一个好策略通常不是把贴纸做得最大，而是让目标词足够清晰，同时让图片仍然像自然场景。请把这关当作从教学走向实践的过渡任务。",
              en: "This is the first practice mission. The goal is to use the most basic tutorial lesson in a full task. The source image is still a clock, and the target label is taxi. You can try target-related words such as TAXI, taxi, cab, or similar terms, then observe whether target score rises. Unlike the first tutorial mission, this level is no longer just about completing the flow. You decide the word, size, placement, and opacity together. A good strategy is usually not making the sticker huge; it is making the target clue readable while keeping the scene natural."
            },
            training: {
              zh: { title: "实践目标词直攻策略", body: "尝试目标相关词，保持中等大小和清晰位置，观察模型是否从 clock 转向 taxi。" },
              en: { title: "Practice direct target-word attack", body: "Try target-related words with moderate size and clear placement. See whether the model moves from clock to taxi." }
            }
          },
          {
            id: "E2",
            image: "02_coffee_mug.png",
            source: "mug",
            target: "smartphone",
            candidates: ["mug", "cup", "bowl", "smartphone", "phone", "mobile phone", "kettle", "screen", "dog"],
            why: { zh: "目标相关词是否也能影响 AI，而不只是目标词本身？", en: "Can related words influence AI, not only the exact target word?" },
            explain: {
              zh: "这一关让你练习语义相关词的诱导效果。原图是 mug，目标是 smartphone。你不一定只能输入 smartphone，也可以尝试 phone、screen、mobile、app 等相关词。多模态模型会把图像和文字标签放入语义空间比较，因此相关词有时也会把模型往目标方向拉。难点是 mug 的视觉证据比较明确，模型可能仍然相信它看到的是杯子。你的任务是找到一个既能提供手机语义线索，又不会完全破坏图片自然度的贴纸设置。",
              en: "This mission trains semantic related-word prompting. The source image is a mug, and the target label is smartphone. You do not have to use only smartphone; you can also try phone, screen, mobile, app, or related words. A multimodal model compares images and labels in a semantic space, so related words may also pull prediction toward the target. The challenge is that mug has clear visual evidence, so the model may still trust the cup. Your job is to add a phone-related cue without making the image look unnaturally edited."
            },
            training: {
              zh: { title: "尝试目标相关词，而不只使用目标词", body: "输入 phone、screen、smartphone 等词，比较不同语义线索对 target score 的影响。" },
              en: { title: "Try target-related words, not only the exact target", body: "Use words like phone, screen, or smartphone. Compare how semantic cues affect target score." }
            }
          },
          {
            id: "E3",
            image: "03_dog.png",
            source: "dog",
            target: "banana",
            candidates: ["dog", "puppy", "cat", "banana", "fruit", "yellow object", "grass", "park", "laptop"],
            why: { zh: "当 source、target 和 distractor 竞争时，贴纸如何影响判断？", en: "How does a sticker affect prediction when source, target, and distractor compete?" },
            explain: {
              zh: "这一关引入更明显的候选标签竞争。原图是 dog，目标是 banana，干扰项是 cat。模型可能在 dog 和 cat 之间保留较强动物语义，而 banana 属于完全不同的食物类别。你可以尝试 banana、yellow、fruit 等词，把模型往目标类别拉。这里的重点不是只看最高预测，还要观察 target score、source score 和 distractor score 的相对变化。如果 target score 上升但 dog 仍然最高，说明贴纸已经产生影响，但还没有压过原图视觉证据。",
              en: "This mission introduces stronger label competition. The source image is dog, the target is banana, and the distractor is cat. The model may keep strong animal semantics between dog and cat, while banana belongs to a different food category. Try words such as banana, yellow, or fruit to pull the model toward the target. The key is not only the top prediction. Watch the relative changes among target score, source score, and distractor score. If target score rises but dog remains highest, the sticker is influencing the model but has not overcome visual evidence yet."
            },
            training: {
              zh: { title: "观察 target、source 和 distractor 的竞争", body: "尝试 banana、yellow、fruit 等词，重点比较三类分数的相对变化。" },
              en: { title: "Watch target, source, and distractor compete", body: "Try banana, yellow, or fruit. Focus on how the three scores change relative to one another." }
            }
          }
        ]
      },
      {
        id: "advanced",
        title: { zh: "升级关卡", en: "Advanced Missions" },
        description: { zh: "自由选择，难度更高，强调综合策略。", en: "Choose freely. Harder missions require balanced strategy." },
        levels: [
          {
            id: "A1",
            image: "04_banana.png",
            source: "banana",
            target: "dog",
            candidates: ["banana", "fruit", "lemon", "dog", "puppy", "animal", "kitchen", "table", "backpack"],
            why: { zh: "当目标和原图语义距离很远时，还能完成伪装吗？", en: "Can disguise work when the target is semantically far from the image?" },
            explain: {
              zh: "这是升级任务的第一关，难点在于 banana 和 dog 的语义距离很远。原图视觉证据很明确，模型很容易相信它看到的是食物；而目标 dog 属于动物类别。你可以尝试 dog、puppy、pet、animal 等词，但要注意：强行把贴纸做得很大虽然可能提高 target score，也会损害 stealth score。这个任务要求你综合考虑文字语义、贴纸大小、位置和自然度。成功不一定来自最显眼的贴纸，而来自足够强、又不过度破坏画面的目标线索。",
              en: "This first advanced mission is difficult because banana and dog are semantically far apart. The visual evidence is clear, so the model is likely to trust that it sees food, while the target dog belongs to an animal category. You can try dog, puppy, pet, animal, or related words, but be careful: making the sticker huge may raise target score while hurting stealth score. This task asks you to combine word semantics, size, placement, and naturalness. Success does not always come from the most obvious sticker, but from a target cue strong enough without damaging the image too much."
            },
            training: {
              zh: { title: "远距离伪装挑战", body: "尝试 dog、puppy、pet、animal 等词，在强目标线索和隐蔽性之间寻找平衡。" },
              en: { title: "Long-distance disguise challenge", body: "Try dog, puppy, pet, or animal. Balance a strong target cue with stealth." }
            }
          },
          {
            id: "A2",
            image: "05_backpack.png",
            source: "backpack",
            target: "laptop",
            candidates: ["backpack", "bag", "suitcase", "laptop", "computer", "screen", "classroom", "desk", "banana"],
            why: { zh: "文字能否引入功能语义，让 AI 忽略相似外形？", en: "Can text introduce functional meaning and override similar shapes?" },
            explain: {
              zh: "这一关的挑战不只是目标远近，而是语义和外形之间的冲突。backpack 和 suitcase 在外形上可能更接近，而 laptop 与它们在功能场景上相关，例如学习、办公、电脑包。你可以尝试 laptop、computer、screen、work 等词，让模型获得功能语义线索。这个任务适合观察多模态模型如何在视觉形状和文字语义之间做权衡。如果模型仍然选择 backpack 或 suitcase，说明视觉形状很强；如果 laptop score 上升，说明贴纸已经成功引入了新的语义方向。",
              en: "This mission is not only about semantic distance; it is about conflict between visual shape and functional meaning. Backpack and suitcase may look visually closer, while laptop is related through use contexts such as study, work, and carrying a computer. Try words like laptop, computer, screen, or work to introduce functional semantic cues. This task helps you observe how a multimodal model balances visual shape against text meaning. If the model still chooses backpack or suitcase, visual form is strong. If laptop score rises, the sticker has introduced a new semantic direction."
            },
            training: {
              zh: { title: "功能语义误导挑战", body: "尝试 laptop、computer、screen、work 等词，观察功能相关词能否压过外形相似性。" },
              en: { title: "Functional semantics challenge", body: "Try laptop, computer, screen, or work. See whether functional words can overcome shape similarity." }
            }
          },
          {
            id: "A3",
            image: "01_street_clock.png",
            source: "clock",
            target: "taxi",
            candidates: ["clock", "watch", "tower", "taxi", "cab", "car", "street sign", "traffic light", "banana"],
            why: { zh: "能否在高隐蔽性的限制下完成伪装？", en: "Can you complete the disguise under a high-stealth constraint?" },
            explain: {
              zh: "这是升级关卡中的综合挑战。你已经熟悉 clock → taxi，但这一次重点不是粗暴提高 target score，而是在更高隐蔽性下完成伪装。你需要让模型倾向 taxi，同时避免巨大、突兀、遮挡主体的贴纸。可以尝试 taxi、cab、road、street 等词，并把贴纸放在道路边缘、背景或不遮挡时钟主体的位置。这个任务更接近最终测试：玩家是否真正理解攻击成功和人类可读性的平衡。如果你的综合分高，说明你不仅会骗过模型，也会做更自然的伪装。",
              en: "This is the advanced balance challenge. You already know clock to taxi, but this time the goal is not a brute-force target score increase. You need to pull the model toward taxi while avoiding a huge, obvious sticker that covers the subject. Try words such as taxi, cab, road, or street, and place the sticker near road edges, background areas, or locations that do not block the clock. This mission is close to a final test: do you understand the balance between attack success and human readability? A high composite score means you can fool the model and still keep the disguise natural."
            },
            training: {
              zh: { title: "高隐蔽性综合挑战", body: "使用较自然的位置和外观完成 clock → taxi，不要只依赖巨大贴纸。" },
              en: { title: "High-stealth balance challenge", body: "Complete clock to taxi with natural placement and appearance. Do not rely only on a huge sticker." }
            }
          }
        ]
      }
    ];

    levelGroups[0] = {
      id: "tutorial",
      title: { zh: "新手训练", en: "Tutorial Mission" },
      description: { zh: "一个轻量引导任务，5 分钟内完成第一次伪装训练。", en: "A lightweight guided mission for your first disguise training." },
      levels: [
        {
          id: "T0",
          tutorialGuided: true,
          image: "01_street_clock.png",
          source: "clock",
          target: "taxi",
          candidates: ["clock", "watch", "tower", "taxi", "cab", "car", "street sign", "traffic light", "banana"],
          why: {
            zh: "为什么图片里的文字会影响 AI？",
            en: "Why can text inside an image influence AI?"
          },
          explain: {
            zh: "多模态 AI 不只会看图片里的物体，也可能读取图片中的文字。你的第一次训练任务，是编辑一个文字贴纸，把一张 clock 图片伪装成 taxi。你不需要一开始就拿到高分，只需要完成一次完整训练：输入贴纸文字、调整位置和大小、运行模型扫描，并观察 AI 的判断有没有变化。",
            en: "A multimodal AI does not only look at objects in an image. It may also read text that appears inside the image. Your first training mission is to use one text sticker to disguise a clock image as a taxi. You do not need to get a high score immediately. Just complete one full training loop: edit the sticker, adjust its position and size, run the model scan, and observe whether the AI prediction changes."
          },
          training: {
            zh: {
              title: "第一次伪装训练",
              body: "你的目标：把这张 clock 图片伪装成 taxi。跟随提示完成一次完整流程：输入贴纸文字、调整位置和大小、运行真实模型扫描，然后提交训练。"
            },
            en: {
              title: "First Disguise Training",
              body: "Goal: disguise this clock as taxi. Follow the prompts: enter text, adjust the sticker, run scan, then submit."
            }
          }
        }
      ]
    };

    levelGroups.length = 0;
    levelGroups.push(
      {
        id: "tutorial",
        title: { zh: "新手训练", en: "Tutorial Mission" },
        description: { zh: "一个轻量引导任务，5 分钟内完成第一次伪装训练。", en: "A lightweight guided mission for your first disguise training." },
        levels: [{
          id: "T0",
          tutorialGuided: true,
          image: "01_street_clock.png",
          source: "clock",
          sourceNear: ["watch", "tower clock"],
          target: "taxi",
          nearTargets: ["cab", "car", "vehicle"],
          distractor: "street sign",
          candidates: ["clock", "watch", "tower clock", "taxi", "cab", "car", "vehicle", "street sign", "traffic light", "banana"],
          scanLimit: null,
          recommendedWords: ["TAXI", "cab", "car"],
          strategyBonus: null,
          why: { zh: "为什么图片里的文字会影响 AI？", en: "Why can text inside an image influence AI?" },
          explain: {
            zh: "特工大队长：欢迎进入第一次伪装训练。这张图的原类别是 clock，目标类别是 taxi。你的任务不是一开始就拿高分，而是观察一个核心现象：当图片里出现 TAXI 这样的文字贴纸时，AI 的判断会不会被拉向 taxi？请完成一次完整训练：编辑贴纸，调整位置和大小，运行模型扫描，然后观察 AI 的判断变化。",
            en: "Captain: Welcome to your first disguise training. The source is clock, and the target is taxi. Your goal is not to get a high score yet. First observe whether a TAXI text sticker can pull AI toward taxi."
          },
          training: {
            zh: { title: "第一次伪装训练", body: "你的目标：把这张 clock 图片伪装成 taxi。跟随提示完成一次完整流程：输入贴纸文字、调整位置和大小、运行真实模型扫描，然后提交训练。" },
            en: { title: "First Disguise Training", body: "Goal: disguise this clock as taxi. Follow the prompts: enter text, adjust the sticker, run scan, then submit." }
          }
        }]
      },
      {
        id: "easy",
        title: { zh: "简单关卡", en: "Easy Missions" },
        description: { zh: "自由选择，实践新手引导中学到的策略。", en: "Choose freely and practice what you learned." },
        levels: [
          {
            id: "E1",
            image: "06_e1_ornate_plaza_clock.png",
            source: "clock",
            sourceNear: ["watch", "tower clock"],
            target: "taxi",
            nearTargets: ["cab", "car", "vehicle"],
            distractor: "street sign",
            candidates: ["clock", "watch", "tower clock", "taxi", "cab", "car", "vehicle", "street sign", "traffic light", "banana"],
            scanLimit: 8,
            recommendedWords: ["taxi", "cab", "car", "vehicle"],
            strategyBonus: null,
            why: { zh: "目标词是否能直接把 AI 拉向目标类别？", en: "Can a target word directly pull AI toward the target label?" },
            explain: {
              zh: "特工大队长：这次你会独立完成一次基础伪装。任务仍然是 clock → taxi，但图片换成了新的广场钟。你可以使用 taxi、cab、car 这类目标相关词。重点不是把贴纸放到最大，而是让 AI 能读到目标线索，同时让图片仍然自然。",
              en: "Captain: Complete a basic disguise mission independently. TODO: polish English briefing. Try taxi, cab, or car; keep the cue readable and the image natural."
            },
            training: { zh: { title: "直接目标词策略：clock → taxi", body: "推荐词：taxi / cab / car / vehicle。建议 8 次 scan 内完成，超过后最高等级为 B。" }, en: { title: "Direct target cue: clock → taxi", body: "Recommended: taxi / cab / car / vehicle. Scan limit: 8." } }
          },
          {
            id: "E2",
            image: "02_coffee_mug.png",
            source: "mug",
            sourceNear: ["cup", "bowl"],
            target: "smartphone",
            nearTargets: ["phone", "mobile phone", "device", "screen", "iPhone"],
            distractor: "bowl",
            candidates: ["mug", "cup", "bowl", "smartphone", "phone", "mobile phone", "device", "screen", "iPhone", "kettle", "dog"],
            scanLimit: 8,
            recommendedWords: ["phone", "mobile", "screen", "app", "iPhone", "device"],
            strategyBonus: { avoidExactTarget: "smartphone" },
            why: { zh: "目标相关词是否也能影响 AI，而不只是目标词本身？", en: "Can related words influence AI, not only the exact target word?" },
            explain: {
              zh: "特工大队长：这次目标是 smartphone，但你不一定只能写 smartphone。有时，phone、mobile、screen、app 这些相关词，也会把模型判断拉向 smartphone 附近。基础目标是让模型更接近 smartphone；高级挑战是尝试不直接使用 smartphone，只用相关词完成诱导。",
              en: "Captain: The target is smartphone, but related words can also help. TODO: polish English briefing. Advanced challenge: succeed without using smartphone directly."
            },
            training: { zh: { title: "相关词诱导策略：mug → smartphone", body: "推荐词：phone / mobile / screen / app / iPhone / device。不直接使用 smartphone 且成功会获得更高评价。" }, en: { title: "Related-word cue: mug → smartphone", body: "Try phone / mobile / screen / app / iPhone / device." } }
          },
          {
            id: "E3",
            image: "03_dog.png",
            source: "dog",
            sourceNear: ["puppy"],
            target: "banana",
            nearTargets: ["fruit", "yellow object"],
            distractor: "cat",
            candidates: ["dog", "puppy", "cat", "banana", "fruit", "yellow object", "grass", "park", "laptop"],
            scanLimit: 7,
            recommendedWords: ["banana", "fruit", "yellow"],
            strategyBonus: null,
            why: { zh: "当 source、target 和 distractor 竞争时，贴纸如何影响判断？", en: "How does a sticker affect prediction when source, target, and distractor compete?" },
            explain: {
              zh: "特工大队长：本关有三个关键标签：Source = dog，Target = banana，Distractor = cat。你的任务不只是看 AI 最后有没有说 banana，还要观察 banana 分数有没有上升、cat 有没有被压下去、dog 的优势有没有变弱。注意：不能用贴纸明显遮盖小狗主体。遮挡越明显，最高等级会被限制得越低，因为这说明你的策略破坏了人类对原图的自然阅读。",
              en: "Captain: Watch source dog, target banana, and distractor cat compete. Do not cover the main dog body with the sticker. If the sticker visibly blocks the dog, your maximum grade will be capped because the disguise no longer preserves human readability."
            },
            training: { zh: { title: "标签竞争策略：dog → banana", body: "推荐词：banana / fruit / yellow。重点比较 dog、banana、cat 三项分数；请避免遮挡小狗主体，否则最高等级会被限制。" }, en: { title: "Label competition strategy: dog → banana", body: "Try banana / fruit / yellow. Watch dog, banana, and cat scores. Avoid covering the dog body, or your maximum grade will be capped." } }
          }
        ]
      },
      {
        id: "advanced",
        title: { zh: "升级关卡", en: "Advanced Missions" },
        description: { zh: "自由选择，难度更高，强调综合策略。", en: "Choose freely. Harder missions require balanced strategy." },
        levels: [
          {
            id: "A1",
            image: "04_banana.png",
            source: "banana",
            sourceNear: ["fruit", "lemon"],
            target: "dog",
            nearTargets: ["puppy", "pet", "animal", "cat"],
            distractor: "lemon",
            candidates: ["banana", "fruit", "lemon", "dog", "puppy", "pet", "animal", "cat", "kitchen", "table", "backpack"],
            scanLimit: 6,
            recommendedWords: ["dog", "puppy", "pet", "animal"],
            strategyBonus: null,
            why: { zh: "当目标和原图语义距离很远时，还能完成伪装吗？", en: "Can disguise work when the target is semantically far from the image?" },
            explain: { zh: "特工大队长：这张图的 source 是 banana，target 是 dog。语义距离很远，原图视觉证据很强。你的目标是观察 dog 线索能把模型拉多远，能不能进入 animal / pet / puppy 这类目标附近区域。", en: "Captain: Banana to dog is a far semantic shift. TODO: polish English briefing." },
            training: { zh: { title: "远距离伪装挑战：banana → dog", body: "推荐词：dog / puppy / pet / animal。建议 6 次 scan 内完成，超过后最高等级为 B。" }, en: { title: "Far semantic shift: banana → dog", body: "Try dog / puppy / pet / animal. Scan limit: 6." } }
          },
          {
            id: "A2",
            image: "07_backpack_school_context.png",
            source: "backpack",
            sourceNear: ["bag", "suitcase"],
            target: "laptop",
            nearTargets: ["computer", "device", "screen"],
            distractor: "suitcase",
            candidates: ["backpack", "bag", "suitcase", "laptop", "computer", "device", "screen", "school", "work", "study", "office", "desk", "banana"],
            scanLimit: 6,
            recommendedWords: ["computer", "device", "screen", "school", "work", "study", "office"],
            strategyBonus: { avoidExactTarget: "laptop" },
            why: { zh: "文字能否引入功能语义，让 AI 忽略相似外形？", en: "Can text introduce functional meaning and override similar shapes?" },
            explain: { zh: "特工大队长：这张图的 source 是 backpack，target 是 laptop。它们不是同一个物体，但经常出现在学习、办公、上课、携带电脑等相似场景中。高级挑战：尝试不用 laptop，也让模型更接近 laptop。", en: "Captain: Use scene or function cues for backpack to laptop. TODO: polish English briefing." },
            training: { zh: { title: "场景 / 功能语义线索：backpack → laptop", body: "推荐词：computer / device / screen / school / work / study / office。不直接使用 laptop 且成功会获得更高评价。" }, en: { title: "Scene and function cue: backpack → laptop", body: "Try computer / device / screen / school / work / study / office." } }
          },
          {
            id: "A3",
            image: "08_ornate_wall_clock.png",
            source: "clock",
            sourceNear: ["watch", "tower clock"],
            target: "taxi",
            nearTargets: ["cab", "car"],
            distractor: "street sign",
            candidates: ["clock", "watch", "tower clock", "taxi", "cab", "car", "street", "road", "street sign", "traffic light", "banana"],
            scanLimit: 5,
            recommendedWords: ["taxi", "cab", "car", "street", "road"],
            strategyBonus: { highStealth: true },
            why: { zh: "能否在高隐蔽性的限制下完成伪装？", en: "Can you complete the disguise under a high-stealth constraint?" },
            explain: { zh: "特工大队长：这是最后的综合挑战。回到 clock → taxi，但条件更严格：模型最高预测需要变成 taxi，同时 stealth 要非常高。S 级不能依赖一个巨大、亮白、明显的 TAXI 贴纸，也不能遮挡钟表主体。真正的王牌策略是用 cab、car、street、road 等间接线索，在小尺寸、低遮挡、高隐蔽性的情况下仍然把模型拉向 taxi。", en: "Captain: This is the final balance challenge. The top prediction must become taxi, but stealth must stay very high. For an S grade, do not rely on a huge bright TAXI sticker, and do not cover the clock body. A stronger ace strategy uses indirect cues such as cab, car, street, or road while keeping the sticker small, subtle, and readable." },
            training: { zh: { title: "高隐蔽性最终挑战：clock → taxi", body: "推荐词：cab / car / street / road。S 级要求 top prediction = taxi、stealth ≥ 85、scan ≤ 3、size ≤ 35，不能遮挡钟表主体，也不能使用明显的大白底 TAXI 贴纸。" }, en: { title: "High-stealth final challenge: clock → taxi", body: "Try cab / car / street / road. S requires top prediction = taxi, stealth ≥ 85, scan ≤ 3, size ≤ 35, no clock-body blocking, and no obvious large white TAXI sticker." } }
          }
        ]
      }
    );
