/**
 * ============================================================
 * GOOGLE APPS SCRIPT — NHẬN ĐƠN HÀNG LANDING PAGE TUMILL (tumill.html / index.html)
 * ------------------------------------------------------------
 * Ghi đơn vào Google Sheet:
 *   https://docs.google.com/spreadsheets/d/1oHV5gJu_C-33zDb1JwhQDS1VyQATCahXN7zqlJH5OkM/edit
 *   → tự tạo / dùng tab tên "DonHang_TUMILL"
 * Đây là 1 deployment RIÊNG, không đụng tới script/tab của SEOHAL hay landing khác
 * đang dùng chung bảng này (mỗi sản phẩm 1 tab, không ảnh hưởng lẫn nhau).
 *
 * CÁCH TRIỂN KHAI (c Thúy / Bao làm 1 lần):
 *   1. Mở Google Sheet trên → menu Tiện ích mở rộng (Extensions) → Apps Script.
 *      (Nếu Sheet đã có sẵn 1 project Apps Script cho SEOHAL, bấm dấu "+" để
 *       tạo thêm 1 FILE MỚI trong project đó, hoặc tạo project mới đều được —
 *       miễn không xoá code cũ của SEOHAL.)
 *   2. Dán TOÀN BỘ file này vào (file mới, không ghi đè lên code SEOHAL).
 *   3. Bấm Deploy (Triển khai) → New deployment → chọn loại "Web app".
 *        - Description: TUMILL orders
 *        - Execute as:  Me (chính chủ sheet)
 *        - Who has access: Anyone   ← QUAN TRỌNG để landing page gửi được
 *        - LƯU Ý: phải chọn deploy MỘT web app RIÊNG cho file này (Apps Script
 *          cho phép nhiều entry point doPost khác nhau qua các deployment khác nhau
 *          nếu để trong file riêng gọi qua hàm riêng — xem ghi chú cuối file nếu
 *          Sheet đã có sẵn doPost() của SEOHAL).
 *   4. Authorize / cấp quyền khi được hỏi.
 *   5. Copy URL dạng .../exec → dán vào biến `webhookUrl:` trong tumill.html
 *      (tìm dòng "webhookUrl:" bằng Ctrl+F, gần cuối file, trong hàm
 *      TikTokShopBuyPopup.config({...})). Nhớ sửa ở CẢ 2 nơi:
 *        - "Main (c Thúy)/tumill.html"
 *        - "tumill-landing-page/index.html" (repo riêng đang deploy Vercel)
 *   6. (Tuỳ chọn) Chạy hàm `setupHeaders` 1 lần để tạo sẵn dòng tiêu đề.
 *
 *   ⚠️ NẾU Sheet này ĐÃ CÓ SẴN 1 file .gs với hàm doPost() (từ SEOHAL) và bạn
 *   dán file này vào CÙNG project đó, Apps Script sẽ báo lỗi "trùng tên hàm
 *   doPost". Cách xử lý — chọn 1 trong 2:
 *     (a) Đơn giản nhất: tạo 1 Google Apps Script project MỚI, đứng RIÊNG
 *         (không cần nằm trong Sheet), rồi trong code dùng
 *         SpreadsheetApp.openById(SPREADSHEET_ID) như bên dưới — vẫn ghi đúng
 *         vào Sheet này, không cần đụng tới project cũ của SEOHAL.
 *     (b) Đổi tên hàm doPost() bên dưới thành doPost_TUMILL(), rồi viết 1 hàm
 *         doPost(e) dùng chung ở đầu project để tự route theo product_sku
 *         trong payload — cách này gọn nhưng cần sửa code SEOHAL cũ, KHÔNG
 *         khuyến khích nếu không chắc chắn.
 *   → Khuyến nghị dùng cách (a): tạo project Apps Script mới, độc lập.
 * ============================================================
 */

var SPREADSHEET_ID = '1oHV5gJu_C-33zDb1JwhQDS1VyQATCahXN7zqlJH5OkM';
var SHEET_NAME     = 'DonHang_TUMILL';

/* Thứ tự cột — KHỚP với payload gửi từ tumill.html */
var HEADERS = [
  'received_at', 'order_code', 'timestamp', 'fullname', 'phone', 'address', 'note',
  'product_name', 'product_sku', 'unit_price', 'quantity', 'total_value', 'currency',
  'option_labels', 'meta_pixel_id',
  'utm_source', 'utm_campaign', 'utm_medium', 'utm_term', 'utm_content',
  'page_url', 'referrer', 'session_duration',
  'client_ip_address', 'client_user_agent', 'fbc', 'fbp'
];

function getSheet_() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/* Chạy tay 1 lần (tuỳ chọn) để tạo sẵn tab + dòng tiêu đề */
function setupHeaders() {
  getSheet_();
}

function doPost(e) {
  try {
    var data = {};
    if (e && e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    }
    var sheet = getSheet_();
    var row = [ new Date() ]; // received_at (giờ server)
    for (var i = 1; i < HEADERS.length; i++) {
      var key = HEADERS[i];
      var v = data[key];
      if (v === undefined || v === null) v = '';
      if (typeof v === 'object') v = JSON.stringify(v);
      row.push(v);
    }
    sheet.appendRow(row);
    return jsonOut_({ ok: true, order_code: data.order_code || '' });
  } catch (err) {
    return jsonOut_({ ok: false, error: String(err) });
  }
}

/* Mở URL /exec bằng trình duyệt để kiểm tra script còn sống */
function doGet() {
  return jsonOut_({ ok: true, service: 'TUMILL orders webhook', sheet: SHEET_NAME });
}

function jsonOut_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
