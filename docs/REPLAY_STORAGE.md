# 演練儲存與額度

## 目前實作

儲存在瀏覽器 IndexedDB，獨立於原本學習紀錄的 localStorage。沒有會員方案、跨裝置同步、後台紀錄或雲端儲存費。頁面明確顯示本機儲存範圍；清除網站資料、裝置遺失或瀏覽器回收空間可能失去紀錄，可匯出 JSON 備份再匯入。

`dist/replay-store.js` 的 `REPLAY_LIMITS` 為單一額度來源：10 份、每份最多 30 步、每份最多 100×1024 bytes、合計最多 1024×1024 bytes。UI 的 KB／MB 依 1024 計算。大小按清理後 JSON 的 UTF-8 bytes 計算，是應用資料額度，不包含 IndexedDB 自身索引／儲存開銷，也不保證瀏覽器總可用空間。

儲存內容是全部局面快照、球權、回應文字、來源課程／情境 ID、觀察球員、名稱與儲存時間；不包含影片、音訊、截圖或 3D 模型。保留快照可避免推演規則升級後重新計算而改變舊路線。回放只讀取保存的路線，不會呼叫 AI。

兩個 object stores：

- `meta`：id、名稱、來源、日期、步數、byteLength，清單只讀這些小資料。
- `records`：完整單份演練；只在載入／匯出時讀取。播放使用已載入的記憶體資料。

只在開啟延伸體驗時讀清單；按儲存時才寫入。份數及總大小在同一個 readwrite transaction 中檢查並與 records 一起寫入，避免多分頁同時存檔繞過數量限制。失敗不覆寫已有紀錄。每次儲存／匯入都是新副本；修改後不自動覆寫原檔。刪除前會提示，可先匯出備份。

載入會重新檢查版本、角色、時間、步數及座標。匯入只接受演練 JSON，檔案先限制 512 KB（容納縮排），清理後仍受相同 100 KB／30 步／10 份／1 MB 限制。來源課程已不存在時不自動載入錯課；顯示錯誤，仍可匯出原演練。

## 未來免費帳號方案（尚未實作）

可以先沿用以上數值作為試行額度，再根據真實紀錄大小與使用情形調整。它不是已成立的付費方案。

後台應將 plan、maxReplays、maxSteps、maxReplayBytes、maxTotalBytes 存為可管理政策；實際儲存服務依登入者驗證權限及額度，不接受瀏覽器傳來的 userId、方案或 byteLength 作為可信值。伺服器驗證 JSON 並自行計算 UTF-8 大小，在交易中更新使用量和紀錄；前端只顯示伺服器回傳的額度。

清單須分頁，完整路線按需讀取；索引以 ownerId、createdAt 及狀態為主。後台可查帳號用量、調整方案、查儲存失敗紀錄。課程發布版本與個人演練各自保存，不要把學員演練加入課程發布包。媒體上傳若日後開放，必須另訂媒體額度，不與小型演練 JSON 混算。

目前未做雲端流量與多人負載測試；本次驗證涵蓋所有課程的快照格式與容量、對手操作、跨重整本機保存及回放。


## 情境歸檔與獨立戰術板

清單預設依 courseId + caseId 篩選，支援全部演練分組與名稱／來源搜尋；原有紀錄已有這兩個欄位，不需改寫。空白板使用 tactics-board / blank，不隨當前課程變更歸屬。activePlayers 為此來源的可選擴充欄位，記錄哪些預備球員已在場；讀取時嚴格檢查名單、重複與球權。舊課程紀錄仍維持全部球員可見。資料庫版本與 stores 不變。

課程與空白板共用全場移動、回放及容量限制；初始放人不記步，實際走位每次演示記一步。空白板仍屬本機資料，未加入雲端帳號。

Blank-board puck and ink: new boards start with `puckOnIce:false`; assigning an active player or placing a loose puck makes it visible. Legacy board records lacking the flag retain a visible puck. Optional snapshot `annotations` are validated red/blue carry/pass/shot strokes (60 per snapshot, 2–100 bounded points each); shared SVG/3D geometry draws waves, dashed arrows and double shot arrows. Legacy strokes remain visual annotations. New blank-board solid/wavy/dashed strokes bind to the selected player as a pending motion path; shot arrows remain visual annotations. Each snapshot retains the current lines; later edits do not rewrite earlier steps. Boards with ink may save a static zero-step record. Existing byte/count/step quotas apply to ink too. 2D playback uses the same committed snapshots as 3D; pending plans must be committed or cleared first.

Each new board transition stores validated `motionPaths` per moving player (2–100 points, bounded coordinates, stable role IDs, anchored start/end) and `puckFollows` for curved carrying without a pass. The original annotation geometry is retained for display; both 2D and 3D sample the motion polyline by cumulative distance. Ordinary endpoint moves generate solid routes. Uncommitted route drafts are excluded from saving; clearing a plan discards them. Earlier saves without motion paths keep their original straight interpolation.

The blank-board canvas now exposes a 450 ms player long-press menu and compact in-canvas controls; a focus view keeps controls and the rink in one viewport. Mouse right-click and Shift+F10 also open the player tools. Solid and wavy paths move the selected skater along the drawn curve. The current dashed tool authors a targeted pass rather than moving that skater; legacy dashed motionPaths retain their original behavior. New `puckPass` transition records contain the sender, recipient, bounded dashed polyline and optional 0.55 movement/pass stage boundary. In blank-board authored passes only the puck travels, with no interception prediction; course rule-based passing is unchanged. Saved pass routes are validated on import/load and shared by 2D/3D playback.

Free drill editing: new blank boards use independent `pucks` (up to 20, IDs P1–P20) and per-puck transition data. Each may carry, remain loose/reserve, or pass independently in the same authored turn; one skater holds at most one puck. The selected puck is mirrored into legacy `puck`/`owner` fields to keep course and camera contracts compatible. Old single-puck records remain readable. Initial setup allows direct drag placement, adding/removing pucks, and returning skaters to the bench; no turn is charged. After the first turn, dragging authors a path instead of changing past setup. Pucks and paths persist through save/export/import and 2D/3D replay. Storage quotas stay unchanged.

Examples are optional, isolated entry points, not a fixed drill workflow. The first authored example uses 5+5 skaters, 8 pucks and 8 steps (~22 KB). It demonstrates editable queue movement and return passes, not a frame-accurate reconstruction or coaching judgment of the supplied video. Step inspection is read-only until returning to the last step; loop playback repeats committed snapshots without generating actions.
