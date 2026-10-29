# ⚡ InstantTranslate - Tiện Ích Dịch Chuột Siêu Tốc (Manifest V3)

> **Dịch văn bản bôi đen tức thì trên mọi trang web • 100% Miễn Phí • Không cần API Key • Giao diện Shadow DOM cô lập hoàn toàn.**

---

## 🌟 Giới Thiệu

**InstantTranslate** là Browser Extension hiện đại chuẩn **Manifest V3** dành cho Google Chrome, Microsoft Edge, Brave, Cốc Cốc và các trình duyệt Chromium. 

Tiện ích cho phép người dùng bôi đen bất kỳ đoạn văn bản nào trên trang web, ngay lập tức hiển thị một cửa sổ dịch (tooltip/popover) sang Tiếng Việt (hoặc ngôn ngữ tùy ý) với tốc độ tức thì, giao diện mượt mà và **hoàn toàn miễn phí** mà không phải đăng ký bất kỳ dịch vụ trả phí hay API Key nào!

---

## ✨ Tính Năng Nổi Bật

- **🆓 100% Miễn Phí & Zero Config:** Sử dụng trực tiếp hạ tầng dịch thuật công khai với cơ chế đa tầng fallback (Google GTX, Chrome Dict, MyMemory). Không cần tài khoản, không cần API Key, cài là dùng ngay!
- **🛡️ Công Nghệ Shadow DOM (`closed` mode):** Cửa sổ dịch được nhúng độc lập hoàn toàn vào trang web. **100% miễn nhiễm** với CSS của trang web đang mở, không bao giờ lo vỡ bố cục hay lỗi font chữ.
- **🎯 Định Vị Thông Minh (Collision Detection):** Luôn bám sát vị trí con trỏ chuột và vùng văn bản được bôi đen. Tự động lật hướng (lên/xuống/trái/phải) khi gần mép màn hình, đảm bảo không bị tràn hay khuất nội dung.
- **🔊 Phát Âm Bản Xứ (Text-to-Speech):** Tích hợp nút loa phát âm cho cả văn bản gốc và bản dịch với giọng đọc chuẩn tự nhiên thông qua Web Speech API.
- **📋 Sao Chép 1-Chạm:** Nút copy bản dịch nhanh kèm hiệu ứng đổi icon tích xanh xác nhận trực quan.
- **📌 Ghim Cửa Sổ (Pin Mode):** Giữ cửa sổ dịch cố định trên màn hình ngay cả khi bạn click chuột sang vùng khác để tham khảo tài liệu.
- **📖 Tra Từ Điển Chi Tiết:** Khi bôi đen từ đơn, tiện ích hiển thị đầy đủ phiên âm quốc tế (IPA) và phân loại từ (danh từ, động từ, tính từ...) kèm các nghĩa mở rộng.
- **⚡ 4 Chế Độ Kích Hoạt Linh Hoạt:**
  1. *Tự động tức thì (Auto):* Bôi đen đến đâu, dịch ngay đến đó (có bộ đệm debounce chống spam).
  2. *Nút kích hoạt (Icon):* Hiện một icon dịch nhỏ cạnh chuột, click vào mới mở dịch (tránh làm phiền khi đọc lướt).
  3. *Giữ phím `Ctrl`:* Chỉ kích hoạt dịch khi bạn vừa giữ phím `Ctrl` (hoặc `Cmd` trên Mac) vừa bôi đen.
  4. *Giữ phím `Alt`:* Chỉ kích hoạt khi vừa giữ phím `Alt` vừa bôi đen.
- **🧪 Khung Dịch Thử Trực Tiếp Trong Popup:** Cho phép gõ hoặc dán văn bản để dịch nhanh ngay trên thanh công cụ mà không cần mở trang web khác.

---

## 📂 Cấu Trúc Dự Án

```
InstantTranslate/
├── manifest.json              # Khai báo cấu hình Extension (Manifest V3)
├── background.js              # Service Worker nền xử lý dịch thuật & fallback
├── .gitignore                 # Cấu hình bỏ qua file thừa khi commit git
├── README.md                  # Hướng dẫn chi tiết & tài liệu dự án
├── content/
│   └── content.js             # Content script tạo Shadow DOM, tooltip & xử lý bôi đen
├── popup/
│   ├── popup.html             # Giao diện cài đặt & khung test dịch nhanh
│   ├── popup.css              # Phong cách Fluent/Glassmorphism hiện đại (hỗ trợ Dark Mode)
│   └── popup.js               # Quản lý cài đặt chrome.storage và dịch thử
└── icons/
    ├── icon16.png             # Icon 16x16px
    ├── icon48.png             # Icon 48x48px
    ├── icon128.png            # Icon 128x128px
    ├── icon.svg               # Vector icon gốc
    └── generate_icons.ps1     # Script PowerShell tạo icon tự động
```

---

## 🚀 Hướng Dẫn Cài Đặt (Developer Mode)

Bạn có thể cài đặt **InstantTranslate** vào mọi trình duyệt Chromium (Google Chrome, Microsoft Edge, Brave, Cốc Cốc, Opera...) chỉ trong 30 giây:

### 1. Trên Google Chrome / Brave / Cốc Cốc
1. Mở trình duyệt và truy cập vào đường dẫn:
   ```
   chrome://extensions/
   ```
2. Gạt công tắc **"Chế độ dành cho nhà phát triển" (Developer mode)** ở góc trên bên phải sang **BẬT**.
3. Nhấp vào nút **"Tải tiện ích đã giải nén" (Load unpacked)** ở góc trên bên trái.
4. Điều hướng và chọn thư mục:
   ```
   C:\Dev\tools\InstantTranslate
   ```
5. Tiện ích `InstantTranslate - Dịch Chuột Nhanh & Miễn Phí` sẽ xuất hiện ngay lập tức trên thanh công cụ trình duyệt! Hãy ghim icon tiện ích lên thanh tiện ích để tiện sử dụng.

### 2. Trên Microsoft Edge
1. Mở trình duyệt Edge và truy cập:
   ```
   edge://extensions/
   ```
2. Bật công tắc **"Chế độ dành cho nhà phát triển" (Developer mode)** ở menu bên trái.
3. Chọn nút **"Tải gói chưa giải nén" (Load unpacked)**.
4. Chọn thư mục `C:\Dev\tools\InstantTranslate`.

---

## 💡 Hướng Dẫn Sử Dụng & Mẹo Hay

| Thao tác | Mô tả |
| :--- | :--- |
| **Bôi đen chữ bất kỳ** | Cửa sổ dịch tự động bật lên cạnh vị trí bôi đen và dịch sang Tiếng Việt. |
| **Phím tắt `Esc`** | Đóng nhanh cửa sổ dịch bất kỳ lúc nào. |
| **Nút Ghim 📌** | Nhấn ghim để cửa sổ không bị tắt khi bạn click chuột ra ngoài trang web. |
| **Nút Loa 🔊** | Nghe phát âm văn bản gốc và bản dịch với giọng đọc tự nhiên. |
| **Nút Sao chép 📋** | Copy kết quả dịch vào Clipboard chỉ với 1 click chuột. |
| **Đổi ngôn ngữ nhanh** | Đổi trực tiếp ngôn ngữ đích ngay trong cửa sổ dịch mà không cần mở cài đặt. |
| **Chuột phải (Context Menu)** | Bôi đen bất kỳ đoạn văn nào và click chuột phải chọn *"Dịch nhanh bằng InstantTranslate"*. |

---

## 🛠️ Đẩy Dự Án Lên GitHub (`btvdev03`)

Để đồng bộ mã nguồn lên tài khoản GitHub của bạn (`btvdev03`), hãy tạo một repository mới trên GitHub với tên `InstantTranslate` và chạy các lệnh sau:

```bash
cd C:\Dev\tools\InstantTranslate

# Thêm remote GitHub
git remote add origin https://github.com/btvdev03/InstantTranslate.git

# Đặt nhánh chính là main
git branch -M main

# Đẩy code lên GitHub
git push -u origin main
```

---

## 📜 Giấy Phép & Đóng Góp

Dự án được phân phối dưới giấy phép **MIT License**. Mọi đóng góp (Pull Request, Issue báo lỗi, ý tưởng tính năng mới) đều rất được hoan nghênh!

*Tác giả:* **btvdev03**
