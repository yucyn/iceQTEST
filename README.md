# CourtIQ Ice — 跑位學習室

獨立的基礎學習原型，保留原影片整理專案不動。

## 現有範圍

- 一個完整的 10 秒中區爭球回傳、重組與接應示範。
- C / LW / RW / LD / RD 五個位置的任務、觀察重點、理由與替代情境。
- 播放、暫停、時間軸、階段切換、速度與中區放大。
- 在 3 秒停住預判下一步，與 5.4 秒的示範區域比較。
- 學習標記、分位置筆記及 JSON 匯出；紀錄僅存目前瀏覽器。

本課是人工設計的受控情境，不是對真實比賽的自動分析或唯一戰術答案。
對手移動也是設計資料，守門員及裁判省略；沒有影片追蹤、API 金鑰、AI 服務或戰術評分。

`content/courses/*.json` 是唯一課程內容來源，`content/catalog.json` 管理排序。`scripts/build-content.mjs` 檢查並產生網站使用的資料；`dist/lesson.js`／`dist/course-adapter.js` 保持現有畫面介面，`dist/engine.js` 處理插值與紀錄驗證，`dist/app.js` 處理互動。完整欄位及匯入／匯出方式見 [課程資料契約](docs/CONTENT_MODEL.md)。

## 驗證

執行 `node test.mjs` 檢查五個位置、路徑界限、球權交接、階段及紀錄驗證。
已透過瀏覽器驗證播放、位置切換、預判、示範解釋、學習標記保存／取消，與 390px iframe 中的手機版操作及寬度。

## 參考

使用者提供的分位置教學影片作為介面與學習流程方向，未複製影片素材或原站內容。
爭球分工背景：https://www.nhl.com/news/former-nhl-coach-don-nachbaur-talks-faceoff-strategy-304811858

## Lesson 02 · Post-Up regroup
Two authored scenarios compare an open boards lane with an opponent stepping toward the receiving winger. All five roles support playback, stage stepping, prediction at 4.8 s and explanation at 7.2 s. Teaching principle reference: https://weisstechhockey.com/post-up-regroup-in-action/ . Coordinates, timing and opponents are illustrative, not tracked footage. Each scenario has its own local notes, viewed roles and predictions; the first lesson retains its original storage key. Export includes all three scenario records. No API or AI service is used.

## Exercise library · 0.3
Six topics / eleven distinct scenarios. The original faceoff and Post-Up records retain their exact keys. New modules cover defensive-zone exits (same-side outlet / behind-net reverse), pass-and-move (return lane opens / cutter remains covered), a local 2-on-1 rush (defender protects middle / challenges puck carrier), and defensive-side positioning (opponent passes and cuts / carries along boards). All five roles have authored movement, moment-specific work, visual reads, reasons and common mistakes. These are teaching situations, not tracked footage, certified systems, or AI assessments. Sources link from each lesson; additional branches, times and coordinates are original illustrative designs.

Navigation supports topic filters, sequential scenario cycling, and a shuffled practice queue that begins at the decision checkpoint. Scenario attempts count only after a selected prediction is revealed, and a scenario is counted once even when several roles are attempted. JSON exports include every known scenario. Goalies are fixed schematic markers and have no reaction logic. Defensive lessons show the opponent attacking left toward the own goal; the opponent may possess the puck without being treated as a selectable own-team role. Local progress remains browser-specific and does not sync between devices.

Validation: `node test.mjs` checks all eleven scenarios, five role paths, stage boundaries, puck continuity and handoffs, independent storage keys, reverse behind the own goal line, attacking entry timing and defensive-side relationships. Browser QA covers eight new scenario prediction/reveal flows, filters, next scenario and random practice; mobile layout checked in a 390 px frame. No network model calls or keys.

## Compact catalog · 0.4
The course directory starts collapsed, retaining the current course summary and random / next-scenario actions. Expand to search course title, topic, focus or scenario names and combine the query with category filters. Results page at six courses per page inside a bounded scrolling panel; selecting a course collapses the directory and restores focus to its summary. Tests include a 47-course fixture, last-page bounds, combined filters and no results. The rink, five roles, spatial prediction, reveal and local progress schema remain unchanged. Source-review status is now explicit: lessons are pre-authored teaching examples and have not received individual coach review. Spatial proximity is not tactical correctness.

## Forecheck content · 0.5.1
Lesson 07 adds three forecheck decision situations using the same renderer, role tokens, case selector, prediction comparison, explanation and progress schema as every other lesson. C/LW/RW/LD/RD remain the labels; changing cases preserves the selected position. Conditions are prose inside the ordinary role explanation and risks remain in the ordinary common-mistake explanation. There are no source-specific rectangles, classifier, result panel, lesson badge or forced role changes. The original 14 scenario keys remain stable.

The user's supplied Honest Hockey recording informs the content. Source filenames, direct observations and visual interpretations are recorded only in the normal reference notes, with further evidence boundaries in SOURCE_REVIEW.md. The original recording is not deployed. The same select position → predict on rink → reveal sequence applies to future material regardless of whether it originated in a video, diagram, article or practice plan. Spatial comparison remains a comparison to the demonstration, not a verdict on complete tactical correctness.

Validation covers all 14 cases, shared comparison behavior, forecheck possession / high positions, preserved keys, desktop and mobile prediction / reveal, ordinary C/LW/RW/LD/RD labels and case switching without role replacement.

## Scenario switching · 0.5.2
The forecheck case selector previously changed the checkpoint metadata but reused role-level copy and retained the old playback time. Each of its three cases now provides distinct job, visual read, rationale, risk, prediction prompt and practice introduction for all five roles. Selecting a case previews its own decision timestamp immediately (1.4 / 3.8 / 6.2 s), clears stale prediction UI and preserves the selected position. The ordinary case help shows what to observe now; no new practice component or source-specific renderer is introduced. Other lessons without an explicit previewTime retain their existing playback comparison behavior. Tests check every role's case-specific copy and distinct preview phase; browser checks cover C, RW and mobile LW switching plus revealed explanation.

## Optional interactive trial and 3D preview · 0.6
The original lesson / prediction workflow, role labels, case switching and learning-progress keys remain unchanged. A collapsed extension section below the original workspace exposes two modes shared by every lesson.

### Interactive trial
A private in-memory board can be captured from the current lesson frame or its decision checkpoint. The learner controls one own-team role, proposes a bounded rink move, commits the move, or passes from the current own-team holder to the selected teammate. A turn represents approximately two illustrative seconds, up to thirty turns. Other own-team roles hold their current positions. The user chooses between an opponent holding policy and a limited pressure policy; one nearby opponent may approach the carrier / support lane, and an opponent carrier may advance toward the own goal. Straight-line pass interception uses a declared geometric proximity rule. It is not a skating, collision, possession-contest, shooting, offside-officiating or multi-agent strategy model, and it produces no outcome probabilities.

The board supports undo, reset, an editable initial possession assumption, the original demonstration position for comparison, move / response traces and qualitative consequences (spacing, pressure on a passing line, long support distance, entry timing, defensive depth). A point beyond the original clip's duration compares against the original clip's end and is labeled accordingly. Comments describe possible issues under the selected assumptions, not certified tactical grades. Current lesson job / visual-read guidance stays available for comparison. Trial state is not written to original progress or lesson data and is discarded on lesson/case changes or page reload.

### 3D preview
All lessons and current trial positions can be rendered in a lightweight procedural arena with volumetric skaters, sticks, goals, boards and rink markings. Cameras support orbit, follow and eye-height views, drag / keyboard look, zoom, role selection and reset. The lesson animation has a separate playback clock; the main lesson time is not mutated. Committed trial steps have a separate 3D replay timeline with play, pause and scrubbing; replay interpolates existing snapshots and does not generate additional moves. Player proportions, facing direction, the rink and fixed goalies are illustrative. No original-video 3D reconstruction or VR headset support is implied.

The renderer uses self-contained WebGL geometry and shaders when available. A perspective-correct camera / depth-sorted Canvas geometry renderer supplies the same three camera modes when WebGL is unavailable. No external 3D libraries, CDN assets, API keys or network model calls are required. Camera assets are constructed locally; 3D initialization is deferred until the 3D tab is opened. The canvas-compatible renderer was visually tested in the managed browser (which did not expose WebGL). The hardware WebGL path is syntax-reviewed but was not GPU-validated in that environment.

### Validation
`node test.mjs` additionally covers snapshot immutability across all 14 cases, possession inference / override / reset, carrying, clear and intercepted passes, distinct response policies, rejected invalid / overlong moves, rounded rink bounds, interpolation, projection math and the absence of trial writes to learning storage. Browser checks cover move / reply / undo / reset / pass, changing source possession through lesson selection, trial-to-3D source switching, all camera modes, camera controls, independent 3D playback, old prediction flow regression, and a 390 px responsive frame without horizontal overflow. Both optional modes are rule-based teaching aids, not validated match predictions.

Principle references: IHS [Puck Support](https://www.icehockeysystems.com/individual-skills/puck-support) and [Adding Decisions & Cues To Practice](https://icehockeysystems.com/education/practice/adding-decisions-cues-practice). Thresholds, opponent policies and feedback rules in this implementation are authored simplifications, not rules reproduced from those sources.


### 0.6.1 — 聚焦冰場
- 移除 WebGL 與 Canvas 3D 場景的燈具及看台裝飾，保留冰場、球門、球員與冰球。
- 在互動試走上方直接說明：依所選規則展示可能分支，未使用 AI 或計算發生機率。


### 課程資料結構拆分（第一階段）
- 7 堂／14 情境改為獨立 JSON；不再由 JavaScript 課程產生器組合內容。第一課的特殊冰球路線也改成資料。
- `npm run build:content` 檢查及產出課程；`npm test` 執行全部檢查。新增課程只新增 JSON 並加入 catalog，不修改播放、練習、3D 程式。
- 本機資料包可 export／check／import；匯入先寫到新資料夾，不覆寫正式內容。這還不是網頁後台。
- 搬移前後每秒 20 個時間點、所有角色文字與舊進度儲存鍵比對通過。既有試走、3D、題目測試通過；CUA 驗證預判揭曉、前壓多情境回饋與 3D 繪製。
- 尚未建立 CMS、日期／單課發布快照與回復介面；沒有串接 AI 或更改觀眾權限。


### 3D 手勢與試走回放
- WebGL 與 Canvas 的左右拖曳方向一致反轉；上下沿用原本方向。
- 互動試走新增「在 3D 播放試走」，回放已提交的步驟（每步 2 秒示意）；支援暫停、時間軸、撤銷／重設後更新。沒有步驟時顯示提示。
- 課程與試走各自保留播放時間，不改寫原練習或學習紀錄。
- 新增移動／傳球中間畫面、回放邊界、撤銷／重設與相機拖曳測試。


### 3D 雙指縮放
- 三種相機與 WebGL／Canvas 共用雙指手勢：張開放大、靠攏縮小，單指保留原本視角方向。
- 雙指時不觸發旋轉，放開一指後重新以剩餘手指位置拖曳，支援取消及捕捉中斷。
- 自動測試覆蓋各相機縮放界限、雙指與單指切換、第三指、取消及監聽清理。瀏覽器操作工具無原生雙指注入，未宣稱已用實體 iPad 驗證。


### 雙方試走與本機演練庫
- 可點選兩隊十名滑行球員，操作移動／帶球／同隊傳球；另一隊依所選假設回應。對手沒有套用己方的課程標準答案。3D 可跟隨對手或使用對手視角。
- 單步距離 160 → 320 示意座標，每份最多 30 步（仍是教學示意，非真實速度）。
- IndexedDB 分離 metadata 與完整 snapshots；清單與完整紀錄按需讀取。10 份／30 步／每份 100 KB／合計 1 MB，單一交易檢查容量。
- 可命名、儲存、跨重整載入回放、匯出／匯入 JSON、刪除；不含影片，不同步到帳號，清除網站資料會移除本機紀錄。
- 詳見 [演練儲存與未來帳號額度](docs/REPLAY_STORAGE.md)。後台與免費方案伺服器管控尚未實作。

- 本次實測：對手移動、同隊傳球、IndexedDB 儲存、重整後紀錄仍在、載入對手視角回放；390px 手機演練庫無橫向溢出。


### 自由編排兩隊
- 預設為自由編排，可連續選擇兩隊多人並保留每人的落點，再按「演示本步」同時播放；不追加另一隊自動回應。
- 兩排球員快速選擇與冰場點選共用狀態。切換球員不清除其他人的安排，可清除本步、撤銷與重設。
- 本步持球者可選兩隊；第 0 步調整起始球權，後續變更會作為一步情境設定保存。傳球須選同隊接球者並按安排，再演示。
- 保留原有單人跟進施壓／原位假設模式。未演示的安排不會誤存入回放；完成後可沿用演練儲存及 3D。
- CUA 驗證己方 C 與對手 OC 同一步移動、指定對手控球傳給 OL、切回己方傳給 LW，三步可進入 3D 回放。


### 情境歸檔、空白戰術板與全場移動
- 演練庫預設只顯示目前情境，支援全部依來源分組與名稱／課程／情境搜尋。舊紀錄以既有 courseId／caseId 歸類，不重寫資料。
- 新增獨立空白戰術板頁籤，球員席逐一點選放入。初始擺人不占步數；之後新增球員會隨下一步加入。未放入的球員不參與傳球攔截／位置判讀或 3D 顯示。
- 課程與戰術板保留各自當次操作，空白板記錄以 tactics-board／blank 分開儲存與搜尋，不依附課程。
- 取消單步距離上限，全場皆可移動，仍限制落點在冰場內；動畫時間仍為教學示意。
- 空白板保存 activePlayers 名單，舊格式紀錄與進度仍相容；額度仍為合計 10 份／每份 30 步／100 KB／總 1 MB，本機儲存。
- 模型與瀏覽器驗證包含空場、兩隊放人、跨場移動、情境隔離與搜尋、保存／載入、3D 僅渲染已入場球員。
