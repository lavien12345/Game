# Empower Beauty (妝識你的美) — 後端與資料庫系統

Empower Beauty（妝識你的美）是一個專為現代美妝愛好者設計的**虛擬試妝與個人化美妝產品推薦平台**之核心後端與資料庫系統。本專案基於 **Flask** 框架、**PostgreSQL** 關聯式資料庫與 **Redis** 高速快取建構，整合了多維色彩向量運算（CIELAB Delta E）、語意风格分析與高安全性爬蟲技術，提供快速、精準、安全的智慧美妝體驗。

---

## 🌟 核心功能亮點

### 1. 雙軌制安全身分驗證 (JWT & Session)
* **雙軌認證**：同時支援適用於 Web 前端的跨網域安全 Cookie Session (PostgreSQL-backed `MemberSession`) 以及適用於行動端或 API 介接的 **JWT Bearer Token** 驗證。
* **安全防護**：全站實施嚴格的密碼雜湊加密（Bcrypt），支援帳號停權保護，並在 API 層面實施基於角色的存取控制 (RBAC) 與管理員稽核日誌。

### 2. 多維度 AI 智慧美妝推薦引擎
* **色彩精準匹配**：基於 CIELAB Delta E 2000 色彩幾何計算與 12 維色彩向量，精準分析用戶膚色（`skinTone`）與唇色（`lipLab`），提供「以色找色」與「試妝色推薦」功能。
* **語意風格分析**：導入 **Jaccard 相似度演算法**，比對商品標籤、個人喜好色系與避開地雷色，有效防止標籤塞選作弊。
* **特徵矩陣與動態權重**：利用 $O(1)$ 的特徵評分矩陣（Face/Eye/Lip Shape Matrix）與風格動態權重（Dynamic Weights）機制，自動根據日常、港風、病嬌等不同妝容調整權重，並輔以 **Jittering (隨機微擾)** 演算法提升推薦多樣性。

### 3. 安全穩健之商品網頁爬蟲 (Crawler Preview)
* **防禦性安全爬網**：自主開發具備 DNS 解析驗證的爬蟲，嚴格禁止爬取內部網路、保留或私有 IP (防禦 SSRF 漏洞)。
* **多層次速率限制 (Rate Limiting)**：配備 `PreviewRateLimiter`，支援管理員、目標網域及全域的滑動視窗 (Sliding Window) 頻率限制，防止目標網站阻擋與 API 濫用。
* **結構化資料提取**：支援 LD+JSON、OpenGraph 及 Meta 標籤提取，提取商品品牌、名稱、描述、價格、圖片及規格。

### 4. 遊戲化點數與忠誠度系統
* **每日簽到與連續簽到獎勵**：具備連續簽到倍增機制（累積簽到 3/7/14/30 天獲得額外加成點數）。
* **任務領取系統**：使用者完成「首次分析」、「首次收藏」、「好友推薦」等任務後可手動領取點數獎勵。
* **主題商城兌換**：用戶可憑點數解鎖專屬個性化主題（玫瑰粉、翡翠綠、闇黑風）。

### 5. 健全的資料庫約束與稽核日誌 (Audit Trail)
* **自動觸發器 (Database Triggers)**：資料庫層級配備 `enforce_product_contract()` 觸發器，自動執行商品規格驗證、HEX 轉 Lab 計算（使用內建 `product_hex_to_lab` 函數）、資料品質評分以及推薦就緒狀態（`recommendation_ready`）判定。
* **雙層稽核日誌**：提供 `audit_logs`（應用程式層級操作日誌）與 `admin_audit_logs`（高風險刪除操作之管理員稽核），全面符合企業級稽核規範。

---

## 📂 專案模組架構

```text
Backend database/
├── app.py                # 應用程式主入口（包含所有路由、Session 與 JWT 控制、API Gateway）
├── models.py             # SQLAlchemy ORM 資料庫模型定義（20+ 張實體關係表與視圖）
├── extensions.py         # Flask 擴充套件初始化（SQLAlchemy, Bcrypt, LoginManager）
├── config.py             # 資料庫連線字串格式化與系統參數配置（支援環境變數載入）
├── forms.py              # Flask-WTF 前端表單驗證與規則定義
├── recommendation.py     # AI 彩妝推薦算法核心（Delta E, Jaccard, Dynamic Weights）
├── crawler_preview.py    # 安全網頁商品爬蟲（SSRF 防禦、流式下載、結構化解析）
├── otp_utils.py          # SMTP 郵件發送、預防 Gmail 亂碼封裝、品牌風格 HTML 驗證碼範本
├── OTP.py                # OTP 驗證碼專屬微服務/端點控制
├── wait_for_services.py  # 容器啟動預檢腳本（預先等待 PostgreSQL 與 Redis 就緒）
├── seed_data.py          # 批次測試數據種子導入工具
├── sql.py                # 提供獨立於主應用的資料庫批次 CSV 匯入機制
├── doc.py                # 自動生成畢業專題「後端與資料庫系統規格書」（DOCX 格式）
├── postgre.sql           # PostgreSQL 完整的資料庫結構、預存程序、視圖、觸發器備份檔
├── requirements.txt      # 專案 Python 相依套件清單
├── Dockerfile            # 輕量級 Python 3.11 容器建置清單
├── docker-compose.yml    # 多容器服務配置（App + PostgreSQL 16 + Redis 7）
├── DOCKER.md             # Docker 啟動與維護手冊
└── templates/            # 前端基礎模板與管理員後台介面 (Bootstrap 5)
```

---

## ⚙️ 快速開始 (環境部署)

### 方法 A：Docker Compose 容器化部署 (推薦)

本專案已完全容器化，如果本機 `5000` (Flask), `5432` (PostgreSQL), `6379` (Redis) 沒有被佔用，可快速一鍵啟動：

1. **配置環境變數**：
   將 `.env.docker.example` 複製並命名為 `.env`：
   ```bash
   cp .env.docker.example .env
   ```
   *請務必更換 `SECRET_KEY`、`DB_PASSWORD`，以及配置發送驗證碼的 `SMTP_USER` 與 `SMTP_PASS`。*

2. **一鍵啟動服務**：
   ```bash
   docker compose up -d --build
   ```

3. **預檢與瀏覽**：
   系統將自動執行 `wait_for_services.py` 預檢，待 PostgreSQL 和 Redis 運作正常後啟動 App：
   * 健康檢查：[http://127.0.0.1:5000/health](http://127.0.0.1:5000/health)
   * 前台首頁：[http://127.0.0.1:5000/](http://127.0.0.1:5000/)
   * 試妝推薦介面：[http://127.0.0.1:5000/tryon-recommendations](http://127.0.0.1:5000/tryon-recommendations)

---

### 方法 B：本機開發手動部署

1. **安裝 Python 相依套件**：
   ```bash
   pip install -r requirements.txt
   ```

2. **啟動本機快取與資料庫**：
   確保本機的 **PostgreSQL** 與 **Redis** 服務已正常運行。

3. **設定本機環境變數**：
   參考 `.env.example` 建立 `.env` 檔案並填寫適當的資料庫連線參數與金鑰。

4. **初始化與匯入測試數據 (Seed Data)**：
   ```bash
   python seed_data.py
   ```

5. **執行應用程式**：
   ```bash
   python run_local_5000.py
   ```

---

## 📊 資料庫視圖與觸發器說明

本系統之資料安全與一致性不僅實施於應用程式層，在資料庫（PostgreSQL）底層亦設有堅實的機制（詳見 `postgre.sql`）：

* **預存預期函數** `product_hex_to_lab(h text)`:
  使用純數學與幾何演算法，在資料庫寫入 HEX 色碼時自動轉換為 L、a、b 三維色彩坐標。
* **資料合約觸發器** `enforce_product_contract()`:
  每當各分類產品（唇彩、底妝等）新增或更新時，資料庫會自動規範 `category` 對應名稱、產生 `sku`、檢測 `recommendation_ready` 是否就緒，並評估 `data_quality_score` 資料品質評分。
* **分析視圖** `view_member_dashboard` & `view_product_popularity`:
  為管理員後台提供高效率的統計資訊，免除在程式端進行複雜的資料聚合查詢。

---

## 🛣️ 核心 API 端點概覽

| 端點 (Endpoint) | 方法 (Method) | 說明 | 身分限制 |
| :--- | :---: | :--- | :--- |
| `/api/register` | `POST` | 新會員註冊（支援 OTP 自動檢測） | 公開 |
| `/api/login` | `POST` | 會員登入（發行 Cookie Session 與 JWT Access Token） | 公開 |
| `/api/logout` | `POST` | 註銷當前會話與 Cookie | 會員 |
| `/api/send-otp` | `POST` | 發送註冊/驗證專用電子郵件驗證碼 | 公開 |
| `/api/verify-otp` | `POST` | 驗證收到的驗證碼（驗證成功後直接開通帳號） | 公開 |
| `/api/members/<email>` | `GET` | 讀取當前登入會員之 Profile | 帳號本人 |
| `/api/members/<email>` | `PATCH` | 編輯會員等級、角色權限或允許存取之頁面 | 管理員 |
| `/api/members/<email>` | `DELETE` | 永久硬刪除會員（連帶清除最愛、簽到、分析、購物車） | 管理員 |
| `/api/favorites/toggle` | `POST` | 切換特定美妝商品之收藏狀態（加入/取消收藏） | 會員 |
| `/api/checkins` | `POST` | 用戶今日報到簽到（發放點數獎勵） | 會員 |
| `/api/members/<email>/tasks` | `GET` | 取得任務進度與點數領取狀況 | 帳號本人 |
| `/api/tryon/save` | `POST` | 儲存一筆虛擬試妝紀錄（含妝前、妝後圖片網址與 AI 建議） | 會員 |
| `/api/crawler/product-preview`| `POST` | 爬取指定電商網址，產生高精確度的美妝商品預覽數據 | 管理員 |
| `/api/recommend/tryon` | `POST` | 依據試妝色彩的 Hex/HSV/Lab/12D 向量計算相近色推薦 | 會員 |
| `/api/recommend/personal` | `GET` | 個人化 AI 推薦（根據喜好、風格與收藏紀錄） | 會員 |

---

## 🛠️ 開發階段診斷與測試工具

本專案提供了多功能測試腳本以確保各系統模組穩定性：

* `quick_test.py`: 快速檢測資料庫連線與測試帳號 Session 建立。
* `test_login.py`: 比對資料庫中儲存的 Bcrypt 雜湊，診斷密碼驗證邏輯。
* `test_cookie.py`: 模擬完整的 HTTP Session 連續請求流程，測試跨網域跨站 Cookie 傳遞。
* `full_diagnostic.py`: 產生 `diagnostic_result.txt`，對註冊、登入、Session 撤銷等功能進行一體化系統診斷。
* `test_final.py`: 在主機不啟動前端的情況下模擬 API 連線，檢驗 JWT 與後台管理的運作情況。

---

## 📜 專案技術棧

* **Backend Framework**: Python 11 + Flask 3.1.3
* **Database & Cache**: PostgreSQL 16 (Alpine-based) + Redis 7 (Alpine-based)
* **Auth & Security**: Flask-Login + Flask-Bcrypt + PyJWT (HMAC SHA-256)
* **Web Scraper & Parsing**: Requests + Beautiful Soup 4 + Urllib3 + LXML + IPAddress / Socket
* **Algorithmic Math**: NumPy 2.4 + Custom Delta E Formula + Jaccard Index Formulation
* **Email Server**: SMTP (TLS 587) + MIMEMultipart Custom Renderer
* **Deployment**: Docker Compose v2 + Gunicorn (production WSGI server)
