# 課程來源與防重複紀錄

每次備課先更新 course-source-register.json，再執行 `node scripts/check-course-sources.mjs`。比對新影片：`node scripts/check-course-sources.mjs /absolute/path/video.mp4`。相同位元檔案會阻擋；不同錄影或剪輯需人工核對來源帳號、標題、動作與情境。缺指紋不等於確認未重複。

| 課次 | 主題 | 來源 | 留檔狀態 |
|---|---|---|---|
| 01 | 中區爭球後的五人分工 | 爭球分工背景：NHL Coaches Room | 舊課已補登，原檔指紋待補 |
| 02 | Post-Up 中區重新組織 | Weiss Tech Hockey：Post-Up Regroup in Action | 舊課已補登，原檔指紋待補 |
| 03 | 自區出球與低位支援 | IHS：Strong Side Breakout Drill（低位支援原則） | 舊課已補登，原檔指紋待補 |
| 04 | 傳後移動與回傳判斷 | IHS：Give & Go（Pass & Move） | 舊課已補登，原檔指紋待補 |
| 05 | 局部二打一的攻擊選擇 | IHS：2 on 1 Corner Traffic（讀防守與傳球線） | 舊課已補登，原檔指紋待補 |
| 06 | 防守側位置與補位 | IHS：D-Zone 1 on 1 Give and Go | 舊課已補登，原檔指紋待補 |
| 07 | 前壓圍堵與三人分工 | 來源：你提供的 Honest Hockey 前壓動畫；跑位與條件為依片整理 | 舊課已補登，原檔指紋待補 |
| 08 | 進攻區低位循環與門後反向 | BENCHIQ / benchiq.hockey：Net Reverse & Attack（使用者提供 IG 螢幕錄影） | 舊課已補登，原檔指紋待補 |
| 09 | 暖身射門：轉向、輪轉與高位接應 | BENCHIQ / maple dranik：Warm Up Shots（使用者提供 IG 螢幕錄影） | 舊課已補登，原檔指紋待補 |
| 10 | 自區門後防守：中鋒守門前與後衛交接 | getbenchwise：Center · D-zone（使用者提供 IG 錄影） | 舊課已補登，原檔指紋待補 |
| 11 | 自區邊鋒：守住高位與封鎖傳球線 | projecthockey／danny_hype：IQ Check #1 · Wingers（使用者提供錄影） | 新課備課，已記錄指紋 |

第11課：與現有10課標題、情境及來源比對，未見同來源記錄。與第10課同屬自區防守，但主角為邊鋒高位封線，而非中鋒門前與後衛交接。

每課紀錄保留固定ID、題名、來源標示及檔名、情境清單、影片指紋與審查備註。來源查核與課程資料分開保存，不改學生端既有格式。


## 找回原始影片

以固定 courseId 查詢 course-source-register.json，再用 sources[].fileName 找原片；檔案改名時用 SHA-256 確認。新版 sourceAssetId 是完整影片指紋，sourceSegments 記錄各情境使用的原片時間範圍。原片時間與10秒課程時間分開記錄。

第11課：winger-hold-high → ScreenRecording_11-03-2026 18-47-58_1.mp4。hold-high 約19–26秒；deny-wall 約9–18秒；point-and-outlet 約26–30秒。原片保留於使用者的原始檔案存放處，GitHub保留教材與對照紀錄；本流程不會自動備份原始影片。

修訂課程保持 courseId，遞增情境 revision；同來源新增教學用途時記錄差異。重新錄製或剪輯的影片指紋不同，仍須人工比對。舊課缺少指紋者需補齊，不代表已確認未重複。
