# CourtIQ 備課與發布

正式分支：main。備課分支：prep/<主題>。

1. 將有權使用的影片交給 ChatGPT 分析；畫面不清楚處標示待確認。
2. 我們把課程或教材草稿整理到備課分支，建立 PR。課程來源使用 content/courses/*.json；教材室匯入格式為 courtiq-material-draft，與正式課程格式不同，不可直接混用。
3. 本機執行 npm test。課程與學生端仍維持既有格式。
4. 若 Vercel 已連接此儲存庫，查看該 PR 的 Preview 部署；尚未連接時請在 Vercel 原專案連接儲存庫，Root Directory 為根目錄，Output Directory 為 dist。
5. 教練在聊天室提出修改或明確確認可發布。確認前不合併 main。
6. 合併確認版本後，已連接的 Vercel 正式分支 main 自動觸發部署。應檢查部署結果，不以 Git 提交成功代替部署成功。

目前教材室草稿仍存於本機瀏覽器；按鈕不會寫入 GitHub。此工作流程由 ChatGPT 在對話中執行，沒有常駐 AI、GitHub 寫入金鑰或自動發布後端。

此儲存庫為公開儲存庫，備課分支也公開；不放原始影片、個人資料或機密內容。原始影片不包含於 Git 中。

初始來源：CourtIQ Sites commit 4d9852f2e374d7259d8b92c3c6052d5999080bce（fix14）。此副本不包含 Sites hosting identity。
