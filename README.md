# ⚡ InstantTranslate (v1.1.0) - Tiện Ích Dịch Chuột Siêu Tốc (Manifest V3)

> **Dịch văn bản bôi đen tức thì trên mọi trang web • 100% Miễn Phí • Không cần API Key • Giao diện Glassmorphism Shadow DOM cô lập hoàn toàn.**

---

## 🌟 Giới Thiệu

**InstantTranslate** là Browser Extension hiện đại chuẩn **Manifest V3** dành cho Google Chrome, Microsoft Edge, Brave, Cốc Cốc và các trình duyệt Chromium. 

Tiện ích cho phép người dùng bôi đen bất kỳ đoạn văn bản nào trên trang web, ngay lập tức hiển thị một cửa sổ dịch (Hero Card) sang Tiếng Việt (hoặc ngôn ngữ tùy ý) với tốc độ tức thì, giao diện mượt mà và **hoàn toàn miễn phí** mà không phải đăng ký bất kỳ dịch vụ trả phí hay API Key nào!

---

## ✨ Điểm Nâng Cấp Nổi Bật (Version 1.1.0)

- **🎨 Thẻ Bản Dịch Hero Card Đẳng Cấp**:
  - Giao diện **Glassmorphism mờ 20px** với hiệu ứng đổ bóng sang trọng, bo góc 16px.
  - Phân tách rõ ràng giữa *Văn bản gốc* và *Thẻ bản dịch trung tâm* với độ tương phản cao, cỡ chữ lớn 15.5px, line-height 1.6 dễ đọc.
  - Tự động nhận diện Dark Mode / Light Mode theo hệ thống.
- **🪄 Tính Năng "Thay Thế Chữ Gốc" (`Ctrl + Enter`)**:
  - Khi đang gõ email, bình luận Facebook, bài viết trên Word Online hay các ô nhập liệu: Bạn chỉ cần bôi đen câu tiếng Anh $\rightarrow$ bấm nút **"Thay thế"** (hoặc `Ctrl+Enter`) $\rightarrow$ Đoạn chữ gốc trên web sẽ lập tức biến thành bản dịch tiếng Việt!
- **🔄 Đảo Chiều Ngôn Ngữ 1-Chạm (`⇄`)**:
  - Bấm nút đảo chiều trên thanh ngôn ngữ để đổi nhanh giữa `EN ⇄ VI` hoặc ngôn ngữ nguồn và đích.
- **🖱️ Chế Độ Nhấp Đúp Chuột (Double-Click)**:
  - Tùy chọn tra nhanh: Nhấp đúp vào bất kỳ từ đơn nào trên trang web là popover dịch hiện ra ngay, không cần kéo chuột bôi đen.
- **📜 Tab Lịch Sử Dịch Thuật (History)**:
  - Tự động lưu 50 mục dịch gần nhất kèm thời gian.
  - Có thể mở popup xem lại, tra cứu, sao chép hoặc xóa lịch sử bất cứ lúc nào.
- **🔊 Phát Âm Bản Xứ Kèm Hiệu Ứng Sóng Âm (Wave Sound)**:
  - Nút loa phát âm có hiệu ứng sóng âm thanh động khi đang đọc (Web Speech API).
- **📖 Từ Điển Phân Màu Sắc Nét**:
  - Danh từ (*Noun* - xanh ngọc), Động từ (*Verb* - tím violet), Tính từ (*Adj* - cam hổ phách).
  - Các từ đồng nghĩa hiển thị dưới dạng thẻ pill bo tròn, click vào là copy ngay.
- **🛡️ Công Nghệ Shadow DOM (`closed` mode)**:
  - Cửa sổ dịch được nhúng độc lập hoàn toàn vào trang web. **100% miễn nhiễm** với CSS của trang web đang mở, không bao giờ lo vỡ bố cục hay lỗi font chữ.
- **🎯 Định Vị Thông Minh (Collision Detection)**:
  - Luôn bám sát con trỏ chuột, tự động lật hướng (lên/xuống/trái/phải) khi sát mép màn hình.

---

## ⌨️ Phím Tắt Tiện Lợi

| Phím tắt | Chức năng |
| :--- | :--- |
| `Esc` | Đóng ngay cửa sổ dịch |
| `Ctrl + Enter` | Thay thế đoạn văn bản bôi đen trên web bằng bản dịch |
| `Ctrl + C` | Sao chép nhanh kết quả dịch |
| `Giữ Ctrl + Bôi đen` | Chế độ kích hoạt chọn lọc (nếu bật trong Cài đặt) |
| `Giữ Alt + Bôi đen` | Chế độ kích hoạt bằng phím Alt |

---

## 📂 Cấu Trúc Dự Án

```
InstantTranslate/
├── manifest.json              # Khai báo cấu hình Extension (Manifest V3)
├── background.js              # Service Worker nền xử lý dịch thuật, fallback & history
├── .gitignore                 # Cấu hình bỏ qua file thừa khi commit git
├── README.md                  # Hướng dẫn chi tiết & tài liệu dự án
├── content/
│   └── content.js             # Content script Shadow DOM, hero card & replace text
├── popup/
│   ├── popup.html             # Giao diện cài đặt, quick test & history
│   ├── popup.css              # Phong cách Fluent/Glassmorphism hiện đại (hỗ trợ Dark Mode)
│   └── popup.js               # Quản lý cài đặt chrome.storage, history & dịch thử
└── icons/
    ├── icon16.png             # Icon 16x16px
    ├── icon48.png             # Icon 48x48px
    ├── icon128.png            # Icon 128x128px
    └── icon.svg               # Vector icon gốc
```

---

## 🚀 Hướng Dẫn Cài Đặt (Developer Mode)

Bạn có thể cài đặt **InstantTranslate** vào mọi trình duyệt Chromium (Google Chrome, Microsoft Edge, Brave, Cốc Cốc, Opera...) chỉ trong 30 giây:

1. Mở trình duyệt Chrome hoặc Edge:
   - Chrome: nhập `chrome://extensions/` vào thanh địa chỉ.
   - Edge: nhập `edge://extensions/` vào thanh địa chỉ.
2. Bật công tắc **"Chế độ dành cho nhà phát triển" (Developer mode)** ở góc trên bên phải.
3. Nhấp vào nút **"Tải tiện ích đã giải nén" (Load unpacked)** ở góc trên bên trái.
4. Điều hướng và chọn thư mục:
   ```
   C:\Dev\tools\InstantTranslate
   ```
5. Bật một tab web bất kỳ (ví dụ: [github.com](https://github.com)), bôi đen một đoạn chữ bất kỳ $\rightarrow$ Cửa sổ dịch đẹp mắt sẽ xuất hiện tức thì!

---

## 📤 Hướng Dẫn Push Lên GitHub Cá Nhân (`btvdev03`)

Git đã được khởi tạo và commit sẵn. Khi bạn muốn đưa lên GitHub:
1. Tạo một repo mới trên [github.com/new](https://github.com/new) tên là `InstantTranslate`.
2. Mở Terminal / PowerShell và chạy:
```powershell
cd C:\Dev\tools\InstantTranslate
git remote add origin https://github.com/btvdev03/InstantTranslate.git
git branch -M main
git push -u origin main
```
