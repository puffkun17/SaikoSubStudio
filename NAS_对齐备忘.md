# NAS 版本字幕核心对齐备忘

**开始时间**：2026-06-11
**目标**：尽可能一模一样地移植 NAS 成熟版本的字幕处理核心到 Git 版本
**原则**：只保留独立字幕处理逻辑，严禁带入门户、体育赛程等模块代码

## 已完成

- [x] 定位 NAS 与 Git 核心文件
- [x] 对比 `subtitleCore.ts`
  - 结论：基本一致，仅 Git 版本新增 `zhFontFamily` / `enFontFamily` 字段（已确认属于合理扩展）
- [x] 对比 `IngestStep.tsx`
  - 发现较多视觉和文案差异（环境光、网格、版本号、术语）
  - NAS 版本使用“工作区 // 片源与字幕对齐绑定”，Git 版本已改为“阅片环境初始化”（符合用户偏好）
  - 版本号：NAS 为 v1.0 pro，Git 为 v2.0.1

## 待对比文件（优先级排序）

1. `src/utils/subtitleCore.ts`（已完成）
2. `src/components/IngestStep.tsx`（已完成初步对比）
3. `src/components/Ingest/DragZone.tsx`
4. `src/store/useStudioStore.ts`
5. `src/components/Theater/ScreenSimulator.tsx`（**已完成对齐**）
   3. `src/components/Ingest/DragZone.tsx`（**已完成对齐**）
      - Git 版本在全息扫描界面、实时日志、TMDB 集成、胶片齿孔视觉上更有亮点，已保留这些改进
      - 核心文件处理逻辑与 NAS 版本保持一致
   4. `src/store/useStudioStore.ts`
   5. `src/components/Theater/ScreenSimulator.tsx`（已完成对齐）
   6. 类型定义与工具函数

   ## 发现的问题 / Bug

   （待记录）

   ## 备注

   - 严格控制范围，只做字幕处理相关
   - 发现重大逻辑差异会记录并修复
   - 当前进度：已完成 4/6 个核心文件对比（`DragZone.tsx` 已对齐）
