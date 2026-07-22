# HANDOFF — 雙狼北漂 2026 PWA

最後更新：2026-07-14（第四輪＋v68-v71 補丁）｜正式站：https://japan-trip-2026-nwtb.vercel.app｜repo 內部版本：**v71**（commit `45e32ed`）

> **v71（2026-07-14）**：修「導航起點顯示成 WiFiBOX」——舊 `api=1` 純座標 URL 會被 Google 吸附到最近 POI。改為名稱＋FTID＋座標的 data 區塊深度連結：`maps/dir/{encName1}/{encName2}/data=!4m14!4m13!1m5!1m1!1s{FTID1}!2m2!1d{lng}!2d{lat}!1m5!1m1!1s{FTID2}!2m2!1d{lng}!2d{lat}!3e3`（**!1d=lng、!2d=lat 順序反直覺**；!3e3=transit）。FTID 從 places.json 的 googleMapsUrl 抽（覆蓋 248/249，唯一缺的是無名座標釘選點→fallback 舊格式）；HOTEL/HOTEL_0808 常數加硬編 ftid。新函式 extractFtid/getPlaceNavInfo（app.js:488-518）。**實測依據**：純名稱格式會誤配（「Pokémon Center」被解析到台北）、`origin_place_id` 塞 FTID 無效被忽略、data 區塊格式 FTID 蓋過模糊名稱釘死正確分店——三者皆真實瀏覽器驗證。verifier 19/19 模擬過＋實產 URL 端到端開圖驗證通過。**地雷**：此 data 格式為非官方文件格式，Google 若改版需重驗。
>
> **v70（2026-07-14）**：使用者提供 Plus Code `FQMW+5M` 驗證 HOTEL FUJiTORiiGATE 真實位置＝35.482937,138.796687（富士吉田市上吉田2-6-18）。places.json 該條目原座標偏 4.48 km 已修正；app.js `HOTEL_0808.address` 原寫河口湖町船津3557 已改〒403-0005 富士吉田市上吉田2-6-18。**待使用者確認**：`HOTEL_0808.station`「富士急行『河口湖駅』搭接駁車 5 分鐘」疑錯（上吉田較近富士山駅），等訂房確認信核對，不編造。

> **v69（2026-07-13）**：當天第一站點 🧭 不再 alert，改以前一晚住宿為起點（`date==='2026-08-09' ? HOTEL_0808 : HOTEL`，app.js:1040-1054）；前一卡存在但缺座標（航班卡）維持 alert。模擬 4/4、verifier 通過。**遺留 nit（既有非 v69 引入）**：`HOTEL_0808` 常數座標 (35.4828938,138.7967342) 與 places.json 同飯店條目 (35.4425725,138.7951951) 相差約 4.5 km，名稱字串也不同（const 無日文後綴）——哪個是真座標待查證，影響地圖飯店標記位置。

> **v68（2026-07-12）**：使用者實測 v67 導航發現三 bug——拖曳後按鈕殘留相連、URL 渲染時綁死致起訖點錯誤、Sortable 無 delay 致手機無法捲動。修法：廢除卡片間按鈕列，🧭 併入卡片 .iplace-actions（📍 旁），點擊當下依 DOM 順序即時算 URL（app.js:996-1074 附近）；天數欄 Sortable 加 `delay:300, delayOnTouchOnly:true, touchStartThreshold:5, draggable:'.itinerary-place'`，onEnd 補重渲染（跨天 from/to 兩欄）；三件套 bump v68。node 模擬 8/8 過、verifier 二審通過無阻擋級、正式站 curl 已命中。**待使用者實機驗收**（重新整理×2 → 卡片右上 🧭 → 拖曳後起訖點跟新順序、長列表可捲動）。

---

# 第四輪交接｜2026-07-11｜v65 → v67.1

## 四-1. 任務目標（使用者原話）
1. 「記帳（v59 機制）改軟刪除墓碑：比照 v63 的 mergeTombstoned 模式…修『A 刪帳後，離線的 B 補記帳會讓被刪的帳復活並重寫進 Google 試算表』的 bug…推送試算表的清單必須排除 deleted:true 項目…完成後派 verifier 二審」
2. 「交通方案 A：行程每段移動加『導航』按鈕，深度連結開 Google Maps 帶入起訖點（座標用 places.json 的權威座標）。URL 格式驗證即可，實機開 App 由我驗收」
3. （追加）「我好像沒有看到導航按鈕」→ 追出 SW 快取根因並修復

## 四-2. 現況（已完成，含驗證證據）

| 版本/commit | 完成項目 | 檔案:行號 | 驗證證據 |
|---|---|---|---|
| v66 `120fbf0` | 記帳刪除改軟刪除墓碑（`deleted:true`＋`updatedAt`），合併重用 v63 `mergeTombstoned`；移除舊 per-device deletedIds 機制；pushToSheet 過濾墓碑（不送＝Apps Script 依來源ID刪列，預期行為）；render/拆帳/匯出/圖表/AI context/輪詢共 11 處讀取點全過濾 | app.js:1617、1764-1770、1785-1801、1825-1868、1871-1879、1910、1944-1958、2387-2396、2452、2492、2540；api/expenses.js:11-24 | node 模擬 7/7 過；**verifier 二審通過無阻擋級**（4 情境含核心「A刪＋B離線補記帳」）；正式站 curl 命中 `mergeTombstoned(cloud, local, 'id')` |
| v67 `ed4c26a` | 行程天數列表視圖，相鄰兩地點間插「🧭 導航」按鈕：`getPlaceCoords`（allPlaces 權威、行程內嵌 fallback、皆無則不出按鈕）＋`transitDirectionsUrl`（`maps/dir/?api=1&origin=lat,lng&destination=lat,lng&travelmode=transit`） | app.js:478-495（座標/URL）、984-991（插入）、996-1005（makeNavButton）；style.css:539-547 | node 模擬 5/5 過（含 places.json 優先於行程舊座標、缺任一端座標→null）；正式站 curl 命中 `transitDirectionsUrl` |
| v67.1 `d8a7e5f` | **修使用者看不到新版的根因**：sw.js JS/CSS 走 cache-first，而 CACHE 名與 `?v=` 自 v60 起從未 bump → sw.js 位元組沒變 → SW 不更新 → 已安裝裝置永遠吃 v60 快取（v61-v67 前端更新在已安裝 PWA 上可能都沒生效過）。bump 至 v67 並在 sw.js 加註解 | sw.js:1、5；index.html:21、673 | 正式站 curl 命中 `tokyo-trip-2026-v67`、首頁引用 `app.js?v=67`、`makeNavButton` ×2；全 repo grep `v=60` 零殘留；node --check 過 |

## 四-3. 關鍵決策

| 決策 | 理由 | 捨棄方案 |
|---|---|---|
| 記帳墓碑直接重用共用 `mergeTombstoned`，不另寫合併 | v63 已驗證過的邏輯，行為一致、少一套維護 | 記帳專用合併函式 |
| 試算表刪列靠「墓碑不進推送清單」由 Apps Script 來源ID比對自動刪 | 沿用既有單向推送架構，前端零額外協定 | 另傳刪除指令給 Apps Script（多一套機制） |
| 導航 URL 用官方 `maps/dir/?api=1` 深度連結、座標值（非地名）、travelmode=transit | 座標不受同名地點干擾；官方格式 iOS/Android 皆會喚起 App | 地名字串（易誤配）、爬乘換案內（無 API 違 ToS，第三輪已否決） |
| 導航按鈕只做天數列表視圖，時間軸視圖不做 | 時間軸是絕對定位事件塊，無「段落」可插；需求主場景在列表 | 時間軸另設計浮動導航（等使用者有需求再說） |
| SW 修法＝bump 版本字串，不改 cache-first 策略 | 離線可用性（旅途中地鐵無訊號）是既有設計目標 | JS 改 network-first（離線退化） |

## 四-4. 未完成事項

| 事項 | 下一步第一個指令 |
|---|---|
| 使用者實機驗收 **v71** 導航（起點顯示飯店/店家本名非 WiFiBOX、首站從住宿出發、拖曳後起訖點正確、長列表可捲動） | 問使用者驗收結果；異常先看 DevTools→Application→Service Workers 是否已是 v71 |
| `HOTEL_0808.station` 接駁資訊疑錯（河口湖駅 vs 富士山駅），等使用者對照訂房確認信 | 使用者提供正確資訊後改 app.js:21 附近 |
| 時間軸視圖無導航按鈕（設計取捨） | 使用者要再另行設計 |
| 交通方案 B（預焙路線卡離線可看）仍未拍板 | 使用者點頭→先派 researcher 查每段路線 |
| 墓碑不清理（記帳/購物清單同）、`exp-deleted` 舊 localStorage 殘留無害未清 | 量大再說；要清則 schema migration 加 `localStorage.removeItem('exp-deleted')` |
| 第二、三輪遺留未動：8 筆離群地點、3COINS 西銀座、apple-touch-icon PNG、server.py 殘留路由 | 見第二、三輪交接 |

## 四-5. 地雷（新增，前幾輪的仍有效）

| 地雷 | 說明 |
|---|---|
| **改 app.js/style.css 必須同步 bump sw.js 的 CACHE 名＋STATIC 清單＋index.html 的 `?v=`（三處一起）** | sw.js JS/CSS cache-first，URL 不變＋sw.js 位元組不變＝已安裝客戶端永遠拿舊版。v61-v67 全踩此坑，curl 驗正式站只能證明伺服器端，證不了客戶端。sw.js 第 4 行已加註解 |
| git repo 根目錄是 `japan-trip/public/`，不是 `japan-trip/` | 在 japan-trip/ 跑 git 會 `fatal: not a git repository`；verifier 曾因此無法 `git show` |
| 權威座標檔是 `public/places.json`（fetch `/places.json` 進 allPlaces） | `japan-trip/data/maps/` 下的是產生工具中間檔，不要拿來當資料源 |

---

# 第三輪交接｜2026-07-10~11｜v61 → v63

## 三-1. 任務目標（使用者原話）
「我想知道我的購物清單跟行前事項這兩個部分他們會自動儲存嗎？如果我跟另一個人同時新增項目會同時儲存上去還是會被覆蓋呢」→「好 一起修 並且檢查其他地方是否有壞掉的地方 或是可以優化我的程式碼的地方」

## 三-2. 現況（已完成，含驗證證據）

| 版本/commit | 完成項目 | 檔案:行號 | 驗證證據 |
|---|---|---|---|
| v61 `2f25f52` | 購物清單納入雲端同步（原 SYNC_KEYS 寫 `shopping_list` 但實際鍵是 `shopItems`，從未同步）；GET→按 id 合併→POST＋互斥鎖 | app.js saveShopItems/mergeShopItems/syncShopItemsToCloud | node 模擬 8 過；正式站 curl 命中新函式 |
| v62 `7ea6045` | 行前準備同步改 `prep_` 前綴比對（原 SYNC_KEYS 四個字面鍵 `prep_vjw` 等全不存在，24 項從未同步）；自訂項目名稱落地 `prep_custom_items`（舊版只存 DOM，換裝置消失） | app.js shouldSyncKey、loadPrepCustomItems 等 | node 模擬 15 過；正式站 curl 命中 |
| v63 `7bc9ef6` | 修二審 2 個阻擋級：`prep_custom_items` 整包覆蓋互蓋→專用墓碑合併；購物清單刪除復活→軟刪除墓碑（`deleted:true`＋updatedAt，共用 `mergeTombstoned`），render/預算/AI context 均過濾墓碑 | app.js:2086-2100（mergeTombstoned）、1958-1993、2277-2286 | node 模擬全過；verifier 複審**通過**；正式站 curl 命中 mergeTombstoned |
| v64 `c328e56` | 三項優化＋一功能：①天氣/匯率/sheet-meta 10 分鐘 TTL 快取（`fetchWithCache`，stale-while-error）②輪詢改 visibilitychange＋in-flight 旗標＋startPolling 防計時器洩漏 ③刪孤兒端點 api/transit.js＋vercel.json 路由 ④prep 自訂項目刪除鈕（走 v63 墓碑＋confirm） | app.js:238-268、2035-2055、2298-2405 | node 模擬 10 過；verifier 二審無阻擋級；正式站 /api/transit 回 404 |
| v65 `ff3a8ad` | 修二審建議級：切記帳頁/記帳存後 `fetchSheetMeta(true)` 繞過快取（force 參數）；prep checkbox 與 btn-add-prep 加 dataset.bound 防重複綁定 | app.js:257-268、161、1815、2072-2088 | node 模擬過（force 強制重打、綁 3 次只觸發 1 次）；正式站 curl 命中 fetchSheetMeta(true) ×2 |

## 三-3. 關鍵決策

| 決策 | 理由 | 捨棄方案 |
|---|---|---|
| 刪除採軟刪除墓碑（deleted:true＋updatedAt），不清理墓碑 | per-device deletedIds push 後清空會讓刪除無法傳播到第三方裝置（復活 bug）；清單量小不需清理 | 雲端持久化 deletedIds 鍵（多一套機制） |
| prep 勾選鍵用前綴比對 `prep_`，`prep_custom_items` 明確排除走專用合併 | 前綴一次涵蓋固定＋動態鍵；陣列鍵不能走整值覆蓋 | 逐鍵列舉（就是這次壞掉的原因） |

## 三-4. 未完成事項

| 事項 | 下一步第一個指令 |
|---|---|
| 記帳（v59）刪除無跨裝置墓碑會復活（離線後補記帳情境會觸發），機制已向使用者說明並建議做，**等使用者拍板** | 使用者點頭→派 implementer 比照 v63 改軟刪除，注意 Google 試算表下游刪除邏輯不受影響 |
| 交通功能：已建議 A（行程每段移動深度連結開 Google Maps/Yahoo乘換案內帶起訖點）＋B（預焙路線卡離線可看），**等使用者拍板**；不做爬乘換案內（無 API、違 ToS） | 使用者點頭→A 派 implementer（半天）、B 先派 researcher 查每段路線 |
| server.py（本機開發工具，不在 git repo）殘留 /api/transit 路由 | 使用者要清再清，不影響正式站 |
| 已知限制：跨裝置同毫秒級真併發仍是 last-write-wins（互斥鎖只防同分頁）；initPrepChecklists 的歷史重複綁定已在 v65 修 | 設計取捨，暫不處理 |

## 三-5. 地雷（新增）

| 地雷 | 說明 |
|---|---|
| 主 shell 沒有 node，在 PATH | 用 `/opt/homebrew/bin/node` 全路徑 |
| SYNC_KEYS 鍵名與實際 localStorage 鍵不符是本輪兩個 bug 的共同根因 | 之後新增同步鍵一律先 grep 實際 setItem 的鍵名核對，不要抄宣告 |

---

# 第二輪交接｜2026-07-10｜v58 → v60

## 二-1. 任務目標（使用者原話）

| 順序 | 原話 |
|---|---|
| 1 | 「我現在在google試算表有建立一個2026東京的帳務清單…你覺得要怎麼把google試算表的帳務清單跟我現在網頁當中的記帳功能整合在一起，我最後的計算都想要用試算表進行以及呈現」 |
| 2 | 「我從我的網頁記帳，他會根據我的試算表格式填寫上去，然後進一步更新我在試算表上面的結果」 |
| 3 | 「我想要你在記帳的頁面幫我設計同步的狀態，讓我確保有同步上去，我在把網頁關掉。還有什麼功能是我沒有想到的嗎？」 |
| 4 | 「先做裝置互蓋以及1,2,3,5,6這幾個問題，匯率的部分我想請你使用跟google試算表一樣的數值」 |
| 5 | 「日記的部分我想要把現在的文字輸入框拆成野狼跟美珊各自的區塊…同時撰寫的時候才不會互相覆蓋…不管誰先誰後儲存都要同步上去」 |
| 6 | 「如果我們現有的行程使用jr pass會比較便宜嗎？請詳細比較讓我檢查每一項是否都符合實際情形」 |

## 二-2. 現況（已完成，含驗證證據）

| 版本/commit | 完成項目 | 檔案:行號 | 驗證證據 |
|---|---|---|---|
| `b2f0737` | 記帳→Google 試算表單向推送：POST 存 Gist 後轉發 Apps Script，回應附 `sheet:{status,added,removed}` | api/expenses.js:11-28、gsheet-apps-script.gs（repo 外，`japan-trip/gsheet-apps-script.gs`） | curl 實測 added/removed 正確；重送 added:0（去重生效）；試算表計算區自動更新 |
| v58 `8e2eca8` | 記帳同步狀態列（同步中/已同步/失敗點擊重試）＋關頁警告 | index.html #exp-sync-status、app.js setExpSyncStatus | playwright 實測顯示「✅ 已同步雲端＋試算表」 |
| v59 `ea2cec3` | 合併儲存防兩裝置互蓋（GET→按 id 合併→POST＋互斥鎖＋localStorage 刪除追蹤）、離線暫存自動重送、`/api/sheet-meta` 試算表回流（匯率→#twd2jpy readonly、已結清 ids→拆帳排除）、APP_TOKEN 通行碼（401→prompt） | app.js:1729-1790（merge/save）、api/sheet-meta.js（新檔）、api/expenses.js:70-72 | node 模擬合併/競態全過；playwright 實測新增→✅、刪除→追蹤→清空；curl 錯誤 token 回 401；匯率欄 3-6 秒後變 5.03(唯讀) |
| v60 `7f06d61` | 日記拆野狼/美珊雙人區塊＋雲端同步（Gist `diary.json`，逐日期逐欄位按 updatedAt 合併）；輸入即存草稿；舊資料遷移 updatedAt=0；照片維持本機 | app.js:2343-2565、api/diary.js（新檔）、vercel.json | node 模擬 8 組邊界全過；playwright 實測雙區塊渲染、草稿即存、401 prompt、取消路徑；curl GET `{}` / 錯誤 token 401 |
| 環境 | Apps Script 已重新部署（含 doGet）；Vercel 已設 `APP_TOKEN`、`GSHEET_URL`、`GSHEET_TOKEN`（既有 `GIST_ID`、`GH_TOKEN`） | — | curl sheet-meta 回 `rate:0.1987987`；錯誤 token 401 |
| 研究 | JR Pass 比價：全國版/廣域券都不划算，最省是巴士組合；修正認知——記帳 8400/6600 是**兩人單程**非一人來回；最後一天路線是**河口湖→成田** | 無檔案（結論在對話） | 河口湖→成田直達巴士存在但每日僅 1 班（13:10→16:27，¥6,000）；四方案比較表已交付使用者 |
| 附帶 | 修好 `~/.claude/hooks/post-edit-check.sh` 的 node PATH（前一輪地雷「本機沒有 node」實為 hook PATH 缺 homebrew） | hooks 檔第 4 行 export PATH | 修後 node --check 正常執行 |

## 二-3. 關鍵決策（已同步 memory/decisions.md）

| 決策 | 理由 | 捨棄方案 |
|---|---|---|
| 試算表整合採「網頁→試算表單向推送」，Gist 仍為 source of truth；Apps Script 用隱藏「來源ID」欄（表頭欄+9）去重與同步刪除，手動列永不動 | 使用者要「計算與呈現都在試算表」；單向流無衝突 | 試算表定時拉取（不夠即時）、試算表當資料庫（大改） |
| 欄位對應：a=野狼、b=美珊；personal→已結清=TRUE＋備註「個人」；日期寫備註（8/3 格式）；分類轉中文 7 類 | 使用者 AskUserQuestion 逐項拍板 | 新增日期欄/分帳欄（動版面） |
| 匯率以試算表為權威回流網頁（1/rate 填入，readonly）；已結清狀態也回流排除拆帳 | 使用者明示「最後結算以試算表為準」 | 網頁手動輸入匯率（兩邊數字不一致） |
| 日記照片不上雲，只同步文字 | base64 照片 1-2MB 會撞 Gist 限制 | 接圖床（Vercel Blob，另計工程） |
| 舊日記遷移 updatedAt=0 | 遷移的舊資料合併時必須輸給雲端任何既有內容，否則資料倒退（verifier 抓到的阻擋級 bug） | 用 Date.now()（會反蓋雲端新資料） |

## 二-4. 未完成事項

| 事項 | 下一步第一個指令 |
|---|---|
| 使用者自驗：兩裝置日記雙區塊同步（一人寫野狼、一人寫美珊，先後儲存都保留）＋通行碼首問流程 | 問使用者驗收結果；若異常，先 curl `/api/diary` 看雲端實際內容 |
| 功能點子待挑（researcher 15 點：常用品項一鍵記帳、Suica 預付、行程×花費對照、免稅退稅、甜蜜互欠等） | 問使用者挑哪幾個；完整表在 2026-07-10 對話「功能靈感調查完成」訊息 |
| 河口湖→成田最終交通決策 | 問使用者班機時間：19:30 後→直達巴士 ¥6,000（電洽富士急 0570-022956 確認 8 月班表）；17:00-19:30→維持富士回遊+N'EX 搭上午班 |
| 日記照片跨裝置同步（需圖床） | 若使用者要做：先派 researcher 比較 Vercel Blob / Cloudinary 免費額度 |
| 前一輪遺留 3 項未動：8 筆離群地點確認、3COINS 西銀座、apple-touch-icon PNG | 見下方第一輪交接第 4 節 |

## 二-5. 地雷（新增，前一輪的仍然有效）

| 地雷 | 說明 |
|---|---|
| **HANDOFF.md 在 public/ 內，不可 commit** | public/ 是部署根目錄，commit 會被 Vercel 部署成公開網頁。維持 untracked |
| Apps Script 改碼必須「部署→管理部署→編輯→**新版本**」 | 只貼程式碼不重新部署＝沒生效；使用者已踩過一次 |
| Vercel 環境變數改動必須 Redeploy 才生效 | 使用者設了 APP_TOKEN 但沒 redeploy，401 不生效；已教學 |
| Apps Script doGet 冷啟動 3-6 秒 | 記帳頁匯率欄開頁頭幾秒顯示預設 4.55 再變 5.03，是 Google 延遲不是 bug |
| implementer agent 曾誤回報「已在背景執行」實際沒改任何檔 | 收到 agent 完成回報後先 `git status` 核實，別直接採信 |
| 兩裝置併發已有防護但輪詢 30 秒內仍可能看到舊畫面 | 資料不會丟（合併保證），只是顯示延遲，切分頁會刷新 |
| hook 的 node PATH 已修（export PATH 加 homebrew） | 前一輪地雷「本機沒有 node」已失效，不要再用括號計數替代，直接 node --check |

---

# 第一輪交接｜2026-07-10（稍早）｜v51 → v57

## 1. 任務目標（使用者原話）

| 順序 | 原話 |
|---|---|
| 1 | 「請確認目前的版本、功能及網頁設計，並告訴我還能夠優化的地方讓使用起來更順暢沒有學習成本，以及我所不知道但你知道可以修改的地方以及我不知道你也不知道的知識盲區」 |
| 2 | 「1. 由圖片當中可以發現在時間軸的檢視模式當中，最後一天也就是8/9仍然有寫我們住在apa...2. 去趣的功能當中請實作多人共編，離線地圖以及分賬功能補強...3. 在主頁面新增一個區塊是注意事項...4. 搜尋網站上第一次去到日本需要注意的事情」 |
| 3 | 「要，我不確定你的v51功能也是否有成功推播請一起確認之前版本你預計要做的功能是否都有成功再網頁上面」 |
| 4 | 「我剛剛更新了我的google map清單，請讀取並推播上去」 |
| 5 | 「1. 請確認hatoya asakusa在地圖上的位置...2. 同樣確認無印良品旗艦店的位置...3. 確認3 coins銀座旗艦店的位置 4. 在地圖上標記apa我們的住宿位置成一個小房子...5. 再次確認每個地點與其地圖上的位置是否正確」 |
| 6 | 「你再看一次，我點擊hatoya asakusa他的位置不在淺草寺那曲，同時我點擊無印良品銀座旗艦店他的位置也不在銀座」 |
| 7 | 「幫我把浮動的那三個功能按鈕移動到最上面，因為他會擋道我最後一天的形成備忘錄」 |
| 8 | 「你幫我移到25天後出發的旁邊，做成三個按鈕」 |

## 2. 現況（已完成，含驗證證據）

| 版本/commit | 完成項目 | 檔案:行號 | 驗證證據 |
|---|---|---|---|
| v51（未單獨 commit，併入 v52）| theme_color 同步、日記照片 quota 錯誤處理、syncPull 背景暫停、aria-label | app.js:2244 `saveDiaryData()`、app.js:2065 | 隨 v52 一併部署驗證 |
| v52 `7f75313` | 修復 `/api/expenses` 缺失（記帳從未真正持久化）| `api/expenses.js`（新檔）、`vercel.json` 新增路由 | `curl -X POST .../api/expenses` 寫入→GET 讀回一致 |
| v52 | 分帳「個人/平分」類型 | index.html:467 `#exp-split`、app.js:1784 | 手動檢查 renderSettle() 排除 personal |
| v52 | 記帳共編（30秒輪詢+比對）| app.js:2052 `refreshExpensesIfChanged()` | curl 確認 app.js 內容含此函式 |
| v52 | 離線地圖預先快取按鈕 | app.js:347 `cacheOfflineMap()` | curl 確認函式存在 |
| v52 | 注意事項頁面（首次赴日提醒）| index.html:517 `#section-notices` | curl 確認 HTML 含此區塊 |
| v52 | 修復時間軸 8/9 住宿殘留 bug | app.js `renderTimelineView()` 內 tl-hotel | 使用者截圖比對確認邏輯正確 |
| CSV `4c6c750` | 讀取雙狼北漂.csv 更新 places.json | `data/maps/update_places.sh` | curl 正式站 places.json 筆數 = 249 |
| v53 `f81619d` | 地圖新增 APA/富士山飯店小房子標記 | app.js:318 `makeHotelIcon()` | curl 確認 app.js 含 makeHotelIcon |
| v53 | 修正 Hatoya Asakusa、無印良品銀座旗艦店座標（第一輪，僅 places.json）| `places.json` | curl 讀回座標值正確（但後來發現 itinerary 端未同步，見 v55）|
| v54 `7ca8c38` | 每日路線 checkbox 篩選（可單獨勾選日期）| app.js:1221 `visibleDays`、app.js:1272 `renderRouteLegend()` | curl 確認 legend-checkbox 存在於 app.js |
| v54 | SW 主動檢查更新 + controllerchange 自動 reload | app.js:209 | curl 確認 controllerchange 存在 |
| v55 `b3128d3` | **根因修復**：itinerary 座標與 places.json 脫鉤（Gist 快照污染）| app.js:769 `reconcileItineraryCoords()` | curl 確認函式存在；另直接 POST 修正 Gist 內殘留舊座標，GET 讀回確認一致 |
| v56 `b2fbe6e` | 浮動按鈕移到頂部（fixed top）| style.css | curl 確認 CSS 含 `calc(var(--header-h) + 0.8rem)` |
| v57 `496a2c0` | 浮動按鈕移入 header，緊鄰倒數天數，改成 inline 按鈕 | index.html:187 `.header-icon-actions`、style.css:1150 | curl 確認 HTML/CSS 含 header-icon-actions |

**部署流程確認**：本 session 才發現「本地改完不等於上線」——git push 才會觸發 Vercel 自動部署，之後一律在改完程式碼後立刻 `git add && commit && push`，並用輪詢 curl 驗證正式站，不能只憑本地檔案內容回報完成。

## 3. 關鍵決策

| 決策 | 理由 | 捨棄的替代方案 |
|---|---|---|
| places.json 作為地點座標唯一權威來源，itinerary 載入後強制 `reconcileItineraryCoords()` 覆蓋內嵌座標 | Gist 同步快照保存的是拖曳當下的座標快照，會跟 places.json 的後續修正脫鉤，導致「明明修了但地圖還是錯」反覆發生 | 只手動一次性修正 Gist 資料（治標不治本，下次修 places.json 或新增地點又會重現同樣問題）|
| SW 加入 `controllerchange` 監聽 + 自動 reload | 使用者多次反映「部署了新版但畫面沒變」，靠提醒使用者手動刷新不可靠 | 僅在回覆中提醒「請強制重新整理」（已證實使用者仍然看到舊資料，不夠）|
| 記帳分帳只做「個人/平分」二選一，不做比例拆帳 | 符合目前實際需求，避免過度設計 | 支援任意比例（如 70/30）分帳 |
| `api/expenses.js` 沿用 `sync.js` 同一個 GitHub Gist，不開新資料庫 | 與現有架構一致，`GIST_ID`/`GH_TOKEN` 環境變數已經配置好 | 另建 Vercel KV 或其他資料庫 |
| 浮動按鈕最終定案為 header 內 inline 按鈕（非 fixed）| 使用者兩輪回饋（先要求移到頂部 fixed，再要求移到倒數天數旁邊），最終方案需同時滿足「不擋內容」與「靠近倒數文字」|「移到頂部」的 fixed 版本（v56，使用者後續要求再移動，未達最終需求）|
| header-icon-actions 內按鈕加 `onclick="event.stopPropagation()"` | header-title 本身有「點擊返回首頁」的事件監聽，按鈕若巢狀其中會被事件冒泡誤觸發 | 把按鈕放在 header-title 外面但視覺上貼齊（會失去「緊鄰倒數天數」的視覺效果，使用者原話明確要求並排）|

## 4. 未完成事項

| 事項 | 下一步第一個指令 |
|---|---|
| 8 筆超出核心行程區域的地點待使用者確認去留（清水港/あさぎり/文具の蔵Rihei/Beans Farm/Grandberry Park/Hakuba Mountain Harbor/Enoura Observatory）| 先問使用者：「這 8 筆要保留在清單裡還是刪除？」，確認後用 `python3` 過濾 `places.json` 對應 name 後 commit + push |
| 3COINS 銀座「西銀座デパート店」尚未收錄（使用者原問的「銀座旗艦店」實際不存在，只有一般分店）| 問使用者是否要新增，若要則派 researcher agent 查證西銀座デパート店精確座標後寫入 places.json |
| apple-touch-icon 仍是 SVG（iOS Safari 不支援，主畫面圖示可能顯示空白）| 本機沒有 rsvg-convert/imagemagick 等轉檔工具，需先問使用者是否要安裝工具，或請使用者提供現成 PNG（180×180），再改 `index.html:13` |
| 「再次確認每個地點與其地圖上的位置是否正確」僅做了程式化區域範圍掃描（8 筆離群值），未逐一驗證全部 249 筆真實性 | 若要更嚴謹，下一步可寫抽樣腳本（例如每次隨機抽 20 筆用 Nominatim reverse geocoding 比對地址關鍵字）分批驗證，而非一次全查 |

## 5. 地雷（踩過的坑，不要重踩）

| 地雷 | 說明 |
|---|---|
| 本機沒有 `node` | PostToolUse hook（`~/.claude/hooks/post-edit-check.sh`）每次 Edit `.js` 檔都會噴「語法檢查失敗：node: command not found」，**這不是真的語法錯誤**，是環境缺工具。用括號配對計數（`{}`/`()`/`[]` 數量比對）加目視覆核代替，但仍要每次都做，不能因為看習慣了就跳過檢查。 |
| Gist 同步快照會覆蓋 places.json 修正 | itinerary 一旦被拖曳/編輯過並存到 Gist，每個地點的 lat/lng 是「複製快照」不是即時查詢；已用 `reconcileItineraryCoords()`（app.js:769）修復，但**未來若又做出類似「複製一份資料」的功能，要留意同樣的資料脫鉤陷阱**。 |
| 不要用猜的 Vercel 網址 | 曾猜測 `japan-trip-2026.vercel.app`，結果連到完全不相關的別人專案（Vite my-trip-app）。正確網址是使用者提供的 `japan-trip-2026-nwtb.vercel.app`，之後不要再嘗試其他變體網址。 |
| Vercel CDN 邊緣快取有短暫延遲 | 部署後立刻 `curl` 可能還讀到舊版（`x-vercel-cache: HIT` 但內容其實是舊的）。改用輪詢：`until curl ... | grep -q "新內容關鍵字"; do sleep 5; done`，不要只查一次就下結論。 |
| `/api/expenses` 曾完全不存在但失敗是靜默的 | `app.js` 呼叫的端點在 `vercel.json` 沒路由、`api/` 目錄也沒對應檔案，`fetch` 失敗被 `catch` 吞掉直接回傳空陣列，不會報錯也不會被使用者發現。**之後新增任何 API 呼叫都要同時檢查 `vercel.json` 路由是否對應存在**，不能只看 `app.js` 裡有呼叫就假設可用。 |
| Leaflet tile 沒設 `crossOrigin: true` 會讓 SW 快取靜默失效 | 瀏覽器預設 `<img>` 跨網域請求是 no-cors，回傳 opaque response（`status 0`, `ok: false`），`sw.js` 用 `if (res.ok)` 判斷是否快取，opaque response 恆為 false，導致「看起來有實作但從未真正存進快取」。已修（app.js:301 附近 tileLayer 加 `crossOrigin: true`），但這類「跨網域資源 + SW 快取」的組合日後遇到都要記得檢查 CORS 模式。 |
