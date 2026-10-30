# 課程資料契約 v1

第一階段只拆資料與播放邏輯。無 CMS、管理帳號、AI 呼叫、自動發布或內容版本回復介面。原有練習、互動試走、3D 都透過相同的 lesson adapter 取得資料。

## 唯一編輯來源

- `content/catalog.json`：schemaVersion 及排序後的課程檔案清單。
- `content/courses/<course-id>.json`：每堂課一檔；新增課程只需新增 JSON 並登記清單。
- `scripts/content-contract.mjs`：匯入與發布共用驗證入口，錯誤包含完整欄位路徑。
- `scripts/build-content.mjs`：驗證後生成 `dist/content/published.js`。禁止直接修改生成檔。
- `dist/course-adapter.js`：轉成現有網站讀取的格式；目前畫面不需要了解後台的資料布局。

## 欄位與關係

課程包含 schemaVersion、id、number、title、category、focus、scenarios。

每個情境包含 id、label、revision、content。課程 id 與情境 id 為永久識別碼，不因改名、排序、修改內容或發布日期改變。情境 revision 對應目前匯出學習紀錄的 lessonVersion；不是已實作的歷史版本系統。

content 包含：

| 區塊 | 欄位 |
|---|---|
| 說明 | title、eyebrow、context、practiceIntro；可選 subtitle、question、setting、learningFocus |
| 時間 | duration、checkpoint、predictionTime；可選 previewTime |
| 五個位置 | roles 的 C／LW／RW／LD／RD，每個有 name、job、watch、risk、prediction、why、tasks、points，可選 practiceIntro |
| 對手 | opponents 的 OC／OL／OR／ODL／ODR 位置路線 |
| 階段 | phases 的 start、end、title、cue，可選 body；tasks 須與階段數一致 |
| 球權路線 | puckSegments，hold 使用 point、follow 使用 role、pass 使用 toRole 與 fromRole／fromPoint 擇一 |
| 參考／重點 | source 的 label、可選 url／kind／fileName；takeaways 三個 title／body |
| 顯示設定 | 可選 direction、defaultRole、supportRoles（三個）、ticks（四個） |

points 統一為 `[秒, x, y]`；使用影片以外的教學示意座標，x 40–960、y 50–550。路線與階段須涵蓋整段時間。五個位置和對手 ID 是角色識別，不是真實背號。

目前練習是與示範位置比較，55 單位容許範圍；並非戰術正確性評分。規則、動畫、試走與 3D 皆未因此增加 AI 或事件機率推估。

## 本機檢查與資料包

```sh
npm test
node scripts/content-package.mjs export /absolute/path/new-course-package.json
node scripts/content-package.mjs check /absolute/path/new-course-package.json
node scripts/content-package.mjs import /absolute/path/new-course-package.json /absolute/path/new-import-folder
```

export 不覆寫既有檔案；import 只接受全新資料夾，不碰正式內容。資料包不含媒體檔案、帳號與學員紀錄。匯入後先比較、檢查，再把確認的課程資料放入 content；執行 build:content 或 npm test 生成網站資料。發布流程也必須先執行資料檢查與測試。

## 保留舊學習紀錄

第一課保持 `courtiq-ice-learning:neutral-faceoff:v1`；其他課保持 `courtiq-ice-learning:<courseId>:<caseId>:v1`。此次沒有清空、遷移或改寫 localStorage。未來重大題目修訂對舊作答的處理仍需另定遷移政策，不可把 schemaVersion、內容 revision 和儲存格式版本混為一談。

## 接後台時的界線

後台輸出相同資料契約；可先跑通一堂多情境課。一般內容編輯權限不得任意修改 schema 或執行程式。AI 只能產生草稿資料；觀察證據、解釋、假設分支的審核欄位須在下階段定義後升級契約。

createdAt／updatedAt／publishedAt／actor／changeSummary／releaseId 及不可變發布快照由未來後台與發布層管理，不在此次搬移中捏造歷史時間。現階段可透過 Git／Sites 回退整站，尚不具備單課回復。要做到單課一致回復，必須快照整個課程及關聯情境，不能只回復一個資料表欄位。媒體備份及學員進度需各自管理。

## 驗收

全部 14 個情境與搬移前以每秒 20 個時間點比對球員、冰球、階段，並比對所有角色說明及儲存鍵。測試會拒絕遺漏回饋、重複 ID、時間重疊、越界座標、未知角色、未知欄位與不安全來源網址。這是結構與行為檢查，不是教練審核。
