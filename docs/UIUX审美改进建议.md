# SaikoSubStudio 前端 UI/UX 审美改进建议

**日期**：2026-06  
**版本**：v2.0.1  
**审查范围**：Ingest → Workbench → Theater 全流程 + 全局视觉系统  
**依据**：阅片环境审美原则 + 项目历史痛点（Theater 遮罩/剧照迭代、NAS 保真、CJK 排版）+ 当前代码审查 + 真实高端设计系统参考（ElevenLabs、RunwayML、Linear、Apple、Framer）

---

## 1. 总体审美定位（必须坚守）

### 核心原则（来自 cinematic-frontend-aesthetics）
- **阅片环境真实感优先**：追求家庭观影/阅片环境下的光影、质感、景深（vignette、grain、TV bezel、放映光影），而非纯赛博或扁平 SaaS 卡片。
- **预览可信度至上（WYSIWYG）**：Theater 必须让专业字幕工作者“敢信”。预览效果 ≈ 真实 ASS 在 VLC/mpv 里的呈现。
- **CJK 优先**：中文排版权重高于英文，强调中英混排的视觉平衡与暗底可读性。
- **画幅精确模拟**：2.39:1 / 1.9:1 等宽银幕必须有正确 letterbox + TV 遮罩，不能为了“好看”牺牲真实性。
- **NAS 保真**：Toast 位置、默认场景、动画时机、扫描戏剧化等必须与原 NAS 版保持一致。
- **反 Slop 规则**：禁止彩虹渐变、emoji、专业工具里出现虚假数据、过度玻璃拟态导致的“塑料感”。

**当前状态评估**：基础阅片环境氛围已建立（glass + aurora + grain + neon），但在**深度质感、控件精致度、CJK 专业感、Theater 真实家庭观影模拟**上仍有明显提升空间。

---

## 2. 全局视觉语言与 App Shell

### 当前亮点
- 深邃背景 `#050507` + 多层 aurora glow + film grain（已调低到 0.008 避免 Windows Chrome 问题）。
- 优秀的类型尺度（`--text-*` + CJK 保护规则）。
- glass-panel-ar / glass-btn-ar 体系（blur + 细边框 + 重阴影）。

### 改进建议

**2.1 电影质感强化**
- **Film Grain**：当前太弱（0.008）。建议增加一个可开关的“胶片颗粒模式”（默认弱开启），或在 Theater 内部单独加强 grain + vignette，模拟家庭观影时的放映质感。
- **光影深度**：增加更多“光源行为”。例如 Ingest 空状态和 Theater 可加入柔和的 projector light ray（用 CSS radial-gradient + mask 实现）。
- **表面层次**：当前 glass 层级不够丰富。建议引入 4-5 级 elevation（surface-0 到 surface-4），并在文档中明确定义。

**2.2 System Tray（顶部系统栏）**
- 当前过于“技术极客”（nexus://basement + 时钟 + A± 缩放）。
- **建议**：
  - 增加“当前步骤”清晰指示（Ingest / Workbench / Theater），可用小胶片图标或步骤进度。
  - 缩放按钮（A±）视觉太弱，改成更优雅的“显示比例”下拉或滑块。
  - 版本号移到更隐蔽的位置，或做成 hover 才显示的“构建信息”。

**2.3 全局暗黑电影调色板建议**
参考 ElevenLabs / RunwayML / Apple 暗黑高端风格，当前紫色 neon（#a855f7）偏“赛博”，可考虑增加更温暖的家庭观影金（#C5A46E）或冷银作为辅助。

---

## 3. Ingest 环节审美

### 当前问题
- 空状态全息扫描（DragZone）戏剧化很强，但**技术标记（SYS_LOC.0x39F）** 与电影氛围略有冲突。
- 双层 bezel wrapper（`rounded-[28px]`）在不同内容密度下容易显得“框太多”。
- TmdbPanel 里的 poster blur + 液体漂移动画很好，但信息层级（评分、年份、类型）还可以更电影化。

### 具体改进建议

- 当前粒子 + holographic 扫描效果优秀（适合“阅片准备”仪式感）。
- **改进**：
  - 增加“胶片装载”声音暗示（可选，无障碍友好）。
  - 扫描过程中的中文提示要更克制、专业（避免过多“正在云端检索”）。
  - 建议增加一个极简的“支持格式”提示条（ASS / SRT / ZIP），用极细的 monospace 呈现。

**3.2 TmdbPanel + TaskList 布局**
- 双 bezel 包裹视觉上“太重”。
- **建议**：
  - 改成单层精致边框 + 内部柔和分割（类似 Linear 的卡片层次）。
  - TmdbPanel 成功绑定后，poster 区域可以做更强的“电影海报灯箱”效果（轻微 vignette + 边框光）。
  - 任务列表里每条 Task 的视觉权重要明显高于当前（当前信息密度不够）。

**3.3 Library Modal（历史存档）**
- 当前玻璃态 + 背景模糊图很好。
- **改进**：
  - 增加缩略图预览（取第一帧字幕 + 小剧照）。
  - 卡片 hover 时增加更强的“电影光影”反馈。

---

## 4. Workbench 环节审美

### 当前问题
- 顶部导航栏信息量大但层次不够清晰（文件名 + 行数 + 各种按钮挤在一起）。
- 浮动 StyleSidebar 出现时，SequenceList 区域压缩感明显。
- SequenceList 和 TimelineControls 的视觉语言与 Theater 差异较大（需要统一电影感）。

### 具体改进建议

**4.1 顶部导航栏**
- 把“workspace // workbench”这种极客标签改得更优雅（或做成可折叠的 metadata 区）。
- TimelineControls 应该有更强的“时间轴电影感”（参考专业剪辑软件的磁带/胶片时间码风格）。
- “放映厅预览”按钮可以做成更有“进入影院”仪式感的样式（加轻微金色光晕）。

**4.2 浮动样式抽屉**
- 当前 spring 动画和 glass 效果不错。
- **改进**：
  - 抽屉打开时，SequenceList 区域可以轻微 darken + blur，强化“焦点在样式上”。
  - 抽屉标题可以更电影化（“字幕调光台”而非单纯 “styles // 样式模板”）。

---

**5. Theater 环节（当前最大审美战场）**

这是历史迭代最多的模块（多次遮罩、剧照修复），也是最需要**真实家庭观影 / 阅片环境模拟**的地方。

### 当前亮点
- ControlDeck 的画幅卡片 + 预设 pill 已经很精致。
- ScreenSimulator 对不同 ratio 的处理在最近 commit 已有明显进步。

### 核心改进建议

**5.1 ControlDeck 审美提升**
- 当前三个区块（画幅 / 模拟场景 / 字幕预设）视觉权重相等，但**画幅比例**应该是最核心的。
- **建议**：
  - 画幅按钮改成更“物理”的小电视/银幕 icon（用 SVG 更好）。
  - “换张剧照”按钮可以做成更优雅的 film-strip 切换动画。
  - 增加一个“胶片模式”总开关（同时影响 grain + vignette + 字幕描边强度）。

**5.2 ScreenSimulator（最关键）**
- **遮罩与边框**：必须保证 2.39:1 在 TV bezel 内部有正确的 letterbox。当前已修复，但可以再加强“物理电视玻璃”的高光与反射（subtle specular highlight）。
- **剧照渲染**：
  - 增加家庭观影质感：边缘 vignette + 极轻 film grain + 轻微放映光晕（可用 CSS filter）。
  - 当使用 preset 场景（cinema/nature/night）时，可以叠加轻微的“家庭电视放映颗粒 + 环境光”。
- **字幕渲染**：
  - 当前 8 层 shadow 已经不错，但建议增加 `WebkitTextStroke` 作为现代补充（更锐利）。
  - 强烈建议暴露并默认使用**字体家族选择**（苹方 / 思源黑体 / Inter 等），当前硬编码系统字体在不同设备差异大。
  - 歌词模式要更突出（更大斜体 + 特殊描边）。

**5.3 整体 Theater 氛围**
- 建议在 TheaterStep 增加“进入阅片环境”过渡动画（屏幕渐暗 + 环境光晕汇聚）。
- 增加一个“专业模式”切换（隐藏部分 UI，只剩纯净银幕 + 字幕 + 最小控制）。

---

## 6. 样式系统（StyleSidebar）审美

### 当前问题（与之前字体字号文档高度重合）
- 标签仍大量使用 “px”，误导用户。
- globalScale 仍然不够突出。
- 颜色选择器视觉不错，但缺少“电影常用配色”快速推荐。
- 滑块样式可以更精致（参考专业 DAW 或调色软件）。

### 具体改进建议
1. **立即执行**（高优先）：
   - 所有字号标签统一改为“中文字号（参考单位 / ASS）”。
   - 暴露并美化 globalScale 滑块（0.6~1.8），放在最顶部。
   - 增加字体家族选择器（中/英分开），并实时应用到 ScreenSimulator。
   - 描边渲染升级为 `text-shadow` + `WebkitTextStroke` 组合。

2. **中优先**：
   - 增加更多专业预设（“IMAX 沉浸”“胶片经典 35mm”“Netflix 202x 极简”）。
   - 滑块旁边增加精确数字输入（已部分实现，需统一）。
   - 颜色选择增加“电影胶片常用”色板（暖白 + 冷银 + 橙金 + 深红）。

---

## 7. 动效、反馈与交互审美

### 当前优点
- 大量使用 spring + framer-motion，过渡自然。
- Toast 系统已对齐 NAS 中上位置。

### 改进建议
- **扫描过程（Ingest）**：动画要“戏剧化但不阻碍感知真实工作”。当前已通过 await 修复，但视觉反馈可以再克制一些。
- **全局**：所有 hover/active 要有一致的“胶片按压”反馈（当前 button:active scale 已存在，可统一到更多元素）。
- **空状态与加载**：增加更多“光影呼吸”而非纯粒子。
- **无障碍**：电影感不能牺牲可读性，glass 上的文字对比度要严格检查。

---

## 8. 优先级与实施路线图

### 高优先（建议本周内处理）
- Theater 遮罩/剧照/字幕渲染最终打磨（尤其是 2.39:1 + 真实 projector feel）
- 字体家族选择 + globalScale 暴露 + 标签体系清理
- StyleSidebar 整体精致度提升
- ScreenSimulator 描边 + 光影强化

### 中优先
- Ingest 空状态与 Library Modal 电影感强化
- ControlDeck 物理化改进
- 全局 film grain / light ray 统一策略

### 低优先 / 长期
- 专业模式（极简影院视图）
- 更多真实设计系统参考实现（可从 popular-web-designs 里提取 ElevenLabs / RunwayML 令牌）
- 正式 DESIGN.md 产出（使用 design-md skill）

---

## 9. 验证 checklist（每次改动后必查）

- [ ] 所有画幅（尤其是 2.39:1）在 Theater 内字幕位置与真实播放一致
- [ ] 中英混排在 TMDB 剧照 + preset 场景下可读性优秀
- [ ] 样式修改实时反映在预览，且导出 ASS 接近预览
- [ ] CJK 小字号在暗背景 + 玻璃上仍清晰
- [ ] Windows Chrome + macOS Safari 视觉一致性（grain、blur、字体）
- [ ] 无“空黑”状态（Theater 必须有默认场景或剧照）
- [ ] NAS 关键元素（Toast 位置、默认场景、扫描戏剧化）未退化

---

**结语**：

SaikoSubStudio 的审美基础已经非常扎实（远超普通 Next.js 项目），核心竞争力在于“真实阅片环境下的字幕预览可信度”。接下来的改进方向不是“加更多效果”，而是**减法 + 质感打磨 + CJK 专业度**，让它真正成为字幕工作者“所见即所得”的家庭观影 / 专业阅片工作台。

需要我立刻针对某个具体环节（例如 Theater 或 StyleSidebar）产出可直接应用的代码改动，或生成视觉变体（使用 sketch skill），请随时指示。