<p align="center">
  <img src="icons/icon128.png" alt="InstantTranslate Logo" width="96" height="96">
</p>

<h1 align="center">InstantTranslate</h1>

<p align="center">
  <b>Tiện ích dịch thuật bôi đen siêu tốc, nhẹ nhàng và thông minh chuẩn Manifest V3</b><br>
  <i>Dịch tức thì trên mọi trang web • 100% Miễn phí • Không cần API Key • Bảo vệ quyền riêng tư</i>
</p>

<p align="center">
  <a href="https://github.com/btvdev03/InstantTranslate"><img src="https://img.shields.io/badge/Version-1.1.0-blue?style=flat-square" alt="Version 1.1.0"></a>
  <a href="https://developer.chrome.com/docs/extensions/mv3/intro/"><img src="https://img.shields.io/badge/Manifest-V3-success?style=flat-square&logo=googlechrome&logoColor=white" alt="Manifest V3"></a>
  <a href="#"><img src="https://img.shields.io/badge/Platform-Chrome%20%7C%20Edge%20%7C%20Brave%20%7C%20Cốc%20Cốc-orange?style=flat-square" alt="Supported Browsers"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="MIT License"></a>
  <a href="#"><img src="https://img.shields.io/badge/Privacy-Zero%20Telemetry-purple?style=flat-square" alt="Zero Telemetry"></a>
  <a href="#"><img src="https://img.shields.io/badge/API-Free%20%2F%20No%20Key-brightgreen?style=flat-square" alt="No API Key Required"></a>
</p>

---

## 📑 Mục Lục

- [Giới Thiệu](#-giới-thiệu)
- [Tính Năng Nổi Bật](#-tính-năng-nổi-bật)
- [Tối Ưu Hóa Đọc Bài Báo Khoa Học & Tài Liệu Dài](#-tối-ưu-hóa-đọc-bài-báo-khoa-học--tài-liệu-dài)
- [Bảng Phím Tắt](#-bảng-phím-tắt)
- [Hướng Dẫn Cài Đặt](#-hướng-dẫn-cài-đặt)
- [Kiến Trúc Kỹ Thuật](#-kiến-trúc-kỹ-thuật)
- [Chính Sách Bảo Mật](#-chính-sách-bảo-mật)
- [Đóng Góp](#-đóng-góp)
- [Giấy Phép](#-giấy-phép)

---

## 🌟 Giới Thiệu

**InstantTranslate** là tiện ích mở rộng trình duyệt (Browser Extension) hiện đại xây dựng hoàn toàn theo chuẩn **Manifest V3**. Được thiết kế hướng tới sự tinh tế, mượt mà và tối giản tài nguyên, tiện ích hỗ trợ người dùng dịch thuật song ngữ tức thì khi duyệt web, tra cứu từ điển chuyên sâu và đọc các tài liệu học thuật phức tạp.

Khác với các tiện ích cồng kềnh yêu cầu tài khoản hay API key đắt đỏ, **InstantTranslate** hoạt động **ngay sau khi cài đặt**, không yêu cầu cấu hình phức tạp và đảm bảo an toàn dữ liệu 100%.

---

## ✨ Tính Năng Nổi Bật

### ⚡ Dịch Tức Thì Bằng Thao Tác Chuột (Instant Selection Translation)
- **Tự động nhận diện ngôn ngữ**: Bôi đen một từ, câu hoặc đoạn văn bản bất kỳ, thẻ dịch sẽ xuất hiện ngay cạnh con trỏ chuột.
- **Chế độ Nhấp đúp (Double-Click)**: Kích hoạt nhanh bản dịch chỉ bằng thao tác click đúp vào bất kỳ từ vựng nào trên trang.
- **Đảo chiều ngôn ngữ 1-chạm (`⇄`)**: Hoán đổi nhanh giữa ngôn ngữ nguồn và ngôn ngữ đích chỉ với một nút bấm hoặc phím tắt.

### 🛡️ Cô Lập Tuyệt Đối Bằng Closed Shadow DOM
- Cửa sổ dịch được đóng gói hoàn toàn bên trong **Shadow Root (`mode: "closed"`)**.
- **Miễn nhiễm 100% với CSS của trang web**: Tránh triệt để tình trạng vỡ giao diện, lỗi tràn chữ hay xung đột kiểu dáng trên mọi nền tảng web (kể cả GitHub, arXiv, Notion, Medium hay Google Docs).

### 📐 Thuật Toán Định Vị Chống Tràn Thông Minh (Smart Viewport Collision)
- Tự động phát hiện vị trí con trỏ chuột và tọa độ màn hình.
- Linh hoạt tính toán không gian khả dụng để lật hướng hiển thị (Lên/Xuống) hoặc neo cách mép dưới màn hình một khoảng an toàn, đảm bảo giao diện luôn nằm trọn trong tầm nhìn của người dùng.

### 🪄 Thay Thế Văn Bản Gốc Tại Chỗ (`Ctrl + Enter`)
- Khi đang soạn thảo trên ô nhập liệu (`input`, `textarea`, trình biên tập `contenteditable` như Gmail, Google Docs, mạng xã hội):
  - Bôi đen câu tiếng nước ngoài.
  - Nhấn tổ hợp phím **`Ctrl + Enter`** (hoặc nút **"Thay thế"**).
  - Nội dung gốc trên trang sẽ ngay lập tức được thay thế bằng bản dịch tiếng Việt mượt mà.

### 🌐 Hệ Thống Cờ Vector Quốc Gia (SVG Flag System)
- Khắc phục triệt để hạn chế của font hệ thống Windows (vốn hiển thị cờ quốc gia thành chữ cái viết tắt dạng mã vùng như `US`, `VN`).
- Sử dụng các biểu tượng vector SVG sắc nét chuẩn quốc tế, mang lại giao diện trực quan và chuyên nghiệp.

### 📚 Từ Điển Ngữ Pháp Chi Tiết & Từ Đồng Nghĩa Tương Tác
- Khi tra từ đơn hoặc cụm từ:
  - Phân loại rõ ràng ngữ pháp: **Danh từ** (*Noun* - Xanh ngọc), **Động từ** (*Verb* - Tím), **Tính từ** (*Adjective* - Cam hổ phách).
  - Danh sách từ đồng nghĩa trình bày dạng thẻ tương tác: Nhấp chuột vào bất kỳ từ nào để sao chép nhanh vào khay nhớ tạm.

### 🔊 Phát Âm Bản Xứ Kèm Sóng Âm Trực Quan (Text-to-Speech)
- Đọc chuẩn giọng người bản xứ thông qua Web Speech API.
- Hiệu ứng sóng âm thanh động phát sáng khi âm thanh đang chạy.

### 📜 Lịch Sử Dịch Thuật Cục Bộ (Local Translation History)
- Tự động lưu 50 mục dịch gần nhất trên bộ nhớ trình duyệt (`chrome.storage.local`).
- Cho phép tra cứu lại, sao chép hoặc xóa lịch sử dễ dàng trong popup tiện ích.

### 🌓 Tự Động Thích Ứng Giao Diện Sáng / Tối (Dark / Light Mode)
- Tự động nhận diện thiết lập giao diện của hệ thống để đồng bộ tông màu dịu mắt, chống mỏi mắt khi đọc ban đêm.

---

## 🔬 Tối Ưu Hóa Đọc Bài Báo Khoa Học & Tài Liệu Dài

InstantTranslate được tối ưu hóa đặc biệt cho giới nghiên cứu, lập trình viên và sinh viên thường xuyên đọc tài liệu khoa học dài (như [arXiv](https://arxiv.org), ScienceDirect, Nature, IEEE Xplore...):

- **Typography chuẩn học thuật**: Cỡ chữ 15.5px, `line-height: 1.65` và độ đậm vừa vặn (`font-weight: 480`) giúp việc đọc các đoạn văn dài trở nên thư thái, không gây mỏi mắt.
- **Thu gọn văn bản gốc**: Đoạn văn gốc được xếp gọn gàng trong khối xem trước có thể đóng/mở linh hoạt, nhường trọn không gian cho bản dịch tiếng Việt.
- **Cuộn nội dung độc lập**: Thanh tiêu đề và thanh công cụ dưới đáy luôn được cố định ở vị trí dễ thao tác nhất, trong khi nội dung bản dịch có thể cuộn mượt mà mà không làm thay đổi kích thước thẻ dịch.

---

## ⌨️ Bảng Phím Tắt

| Phím tắt | Thao tác | Mô tả chi tiết |
| :--- | :--- | :--- |
| `Esc` | Đóng thẻ dịch | Ẩn ngay lập tức cửa sổ dịch đang mở trên trang |
| `Ctrl + Enter` | Thay thế văn bản | Thay thế đoạn văn bản bôi đen trong ô soạn thảo bằng bản dịch |
| `Ctrl + C` | Sao chép nhanh | Sao chép toàn bộ nội dung bản dịch vào khay nhớ tạm |
| `Giữ Ctrl + Bôi đen` | Dịch có điều kiện | Chỉ dịch khi người dùng chủ động giữ phím `Ctrl` *(Bật trong Cài đặt)* |
| `Giữ Alt + Bôi đen` | Dịch có điều kiện | Chỉ dịch khi người dùng chủ động giữ phím `Alt` *(Bật trong Cài đặt)* |

---

## 🚀 Hướng Dẫn Cài Đặt

Tiện ích tương thích với mọi trình duyệt nhân Chromium bao gồm: **Google Chrome, Microsoft Edge, Brave, Cốc Cốc, Opera...**

### Cách 1: Cài đặt từ mã nguồn (Khuyên dùng)

1. **Tải mã nguồn về máy tính:**
   ```bash
   git clone https://github.com/btvdev03/InstantTranslate.git
   ```
   *(Hoặc tải về file ZIP từ nút **Code $\rightarrow$ Download ZIP** trên GitHub và giải nén).*

2. **Mở trang quản lý Tiện ích mở rộng:**
   - Trên **Google Chrome / Brave / Cốc Cốc**: Nhập `chrome://extensions/` vào thanh địa chỉ.
   - Trên **Microsoft Edge**: Nhập `edge://extensions/` vào thanh địa chỉ.

3. **Kích hoạt chế độ nhà phát triển:**
   - Gạt bật công tắc **"Chế độ dành cho nhà phát triển" (Developer mode)** ở góc trên bên phải.

4. **Tải tiện ích:**
   - Nhấp vào nút **"Tải tiện ích đã giải nén" (Load unpacked)** ở góc trên bên trái.
   - Chọn thư mục `InstantTranslate` vừa tải về (thư mục chứa file `manifest.json`).

5. **Trải nghiệm ngay:**
   - Mở bất kỳ trang web nào (ví dụ: [arXiv](https://arxiv.org) hoặc [Wikipedia](https://wikipedia.org)), bôi đen một đoạn văn bản bất kỳ để trải nghiệm tốc độ dịch tức thì!

---

## 🏗️ Kiến Trúc Kỹ Thuật

Dự án áp dụng mô hình phân tách trách nhiệm chặt chẽ, tận dụng tối đa các công nghệ web hiện đại mà không phụ thuộc vào các thư viện bên thứ ba nặng nề (Zero External Dependencies):

```
InstantTranslate/
├── manifest.json              # Khai báo cấu hình mở rộng chuẩn Manifest V3
├── background.js              # Service Worker nền xử lý dịch thuật, mạng & bộ nhớ đệm
├── LICENSE                    # Giấy phép nguồn mở MIT
├── README.md                  # Tài liệu hướng dẫn dự án
├── content/
│   └── content.js             # Content script: Shadow DOM, Smart Positioning & Inline UI
├── popup/
│   ├── popup.html             # Giao diện cài đặt và quản lý lịch sử
│   ├── popup.css              # Phong cách Fluent UI / Modern Glassmorphism
│   └── popup.js               # Logic điều khiển cài đặt và xem trước
└── icons/
    ├── icon16.png             # Biểu tượng 16x16px
    ├── icon48.png             # Biểu tượng 48x48px
    ├── icon128.png            # Biểu tượng 128x128px
    └── icon.svg               # Vector icon gốc
```

### Điểm nhấn công nghệ:
- **Service Worker (`background.js`)**: Thực thi bất đồng bộ các yêu cầu dịch thuật thông qua cơ chế fallback đa tầng, tự động phục hồi kết nối và giảm thiểu độ trễ mạng.
- **Closed Shadow Root (`content/content.js`)**: Ngăn chặn rò rỉ CSS hai chiều, đảm bảo tính thẩm mỹ nhất quán trên hàng triệu trang web khác nhau.
- **Pure Vanilla JavaScript (ES6+)**: Mã nguồn tinh gọn, kích thước siêu nhẹ (< 100KB), khởi động trong vài mili-giây mà không tiêu tốn RAM trình duyệt.

---

## 🔒 Chính Sách Bảo Mật

Chúng tôi tôn trọng tối đa sự riêng tư và bảo mật thông tin của người dùng:

- 🛡️ **Zero Telemetry**: Tiện ích hoàn toàn **không thu thập, không theo dõi và không lưu trữ** lịch sử duyệt web hay danh tính của bạn.
- 💾 **Lưu trữ hoàn toàn cục bộ**: Lịch sử dịch thuật và các tùy chỉnh cấu hình được lưu trực tiếp trên trình duyệt của bạn (`chrome.storage.local`) và không bao giờ gửi về máy chủ bên ngoài.
- 🔍 **Mã nguồn mở minh bạch**: Toàn bộ mã nguồn được công khai để cộng đồng có thể tự kiểm tra và kiểm thử bảo mật độc lập.

---

## 🤝 Đóng Góp

Mọi đóng góp nhằm cải thiện tiện ích đều được chào đón! Bạn có thể tham gia phát triển dự án theo các bước sau:

1. **Fork** repository này về tài khoản GitHub của bạn.
2. Tạo nhánh tính năng mới (`git checkout -b feature/AmazingFeature`).
3. Cam kết thay đổi (`git commit -m "feat: Add some amazing feature"`).
4. Đẩy mã nguồn lên nhánh (`git push origin feature/AmazingFeature`).
5. Tạo một **Pull Request** mô tả chi tiết các thay đổi của bạn.

Nếu bạn phát hiện lỗi hoặc có đề xuất tính năng mới, vui lòng mở một [Issue mới](https://github.com/btvdev03/InstantTranslate/issues).

---

## 📄 Giấy Phép

Dự án được phân phối dưới giấy phép mã nguồn mở **MIT License**. Xem chi tiết tại tệp [LICENSE](LICENSE).

---

<p align="center">
  Phát triển với ❤️ vì một trải nghiệm duyệt web không rào cản ngôn ngữ.
</p>
