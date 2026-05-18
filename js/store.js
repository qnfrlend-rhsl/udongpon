const GAS_URL = "https://script.google.com/macros/s/AKfycbwzFCQqPEHQMLGtE-ANYxzY-VIREg3Sm75i_97OsA0bFK0P0Qqz-ej3UySMtsv2RDld/exec";

const params = new URLSearchParams(window.location.search);
const storeName = params.get("name");
let store = null;

/* =========================
   매장 정보 로드
========================= */
fetch(GAS_URL + "?action=getStores")
  .then(res => res.json())
  .then(data => {
    store = data.find(
      s => String(s.storeName).trim() === String(storeName).trim()
    );

    if (!store) {
      alert("매장 정보를 찾을 수 없습니다.");
      throw new Error("store not found");
    }

    document.getElementById("storeName").textContent = storeName;
    document.getElementById("discount").textContent = `${store.discount || "-"}`;

    loadCoupons();
  })
  .catch(err => console.error(err));

let selectedType = "store";

/* =========================
   홈페이지 열기
========================= */
function openHomepage() {
  if (store?.websiteUrl) {
    window.open(store.websiteUrl, "_blank");
  } else {
    alert("등록된 홈페이지가 없습니다.");
  }
}

/* =========================
   타입 선택
========================= */
function selectType(type) {
  selectedType = type;

  const addressInput = document.getElementById("address");

  if (type === "delivery") {
    addressInput.classList.remove("hidden");
    addressInput.required = true;
  } else {
    addressInput.classList.add("hidden");
    addressInput.required = false;
  }
}

/* =========================
   쿠폰 발급
========================= */
document.getElementById("couponForm").addEventListener("submit", function (e) {
  e.preventDefault();

  if (!store) {
    alert("매장 정보를 불러오는 중입니다.");
    return;
  }

  const name = document.getElementById("name").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const address = document.getElementById("address").value.trim();
  const now = Date.now();

  // 기존 쿠폰 조회 후 active 체크
  fetch(GAS_URL + "?action=getCoupons")
    .then(res => res.json())
    .then(data => {
      const list = Array.isArray(data)
        ? data
        : data.data || data.result || [];

        console.log("쿠폰목록 확인", list);

      const hasActiveCoupon = list.some(c => {
        const issuedTime = new Date(c.issuedAt).getTime();
        const isExpired = now - issuedTime > 2 * 60 * 60 * 1000;

        return (
        String(c.storeName).trim() === String(storeName).trim() &&
        normalizePhone(c.phone) === normalizePhone(phone) &&
        c.status === "active" &&
        !isExpired
      );
      });

      if (hasActiveCoupon) {
        alert("이미 사용 가능한 쿠폰이 있습니다.");
        return;
      }

      issueCoupon(name, phone, address);
    })
    .catch(err => {
      console.error(err);
      alert("쿠폰 확인 실패");
    });
});

/* =========================
   실제 쿠폰 발급
========================= */
function issueCoupon(name, phone, address) {
  fetch(
    GAS_URL +
      "?action=issueCoupon" +
      "&storeName=" + encodeURIComponent(storeName) +
      "&storeId=" + encodeURIComponent(store.storeId || "") +
      "&name=" + encodeURIComponent(name) +
      "&phone=" + encodeURIComponent(phone) +
      "&address=" + encodeURIComponent(address) +
      "&type=" + encodeURIComponent(selectedType)
  )
    .then(async res => {
      const text = await res.text();
      console.log("RAW RESPONSE:", text);
      return JSON.parse(text);
    })
    .then(data => {
      console.log("쿠폰 발급 완료:", data);
      alert("쿠폰이 발급되었습니다!");
      loadCoupons();
    })
    .catch(err => {
      console.error(err);
      alert("쿠폰 발급 실패");
    });
}

/* =========================
   쿠폰 불러오기
========================= */
function loadCoupons() {
  fetch(GAS_URL + "?action=getCoupons")
    .then(res => res.json())
    .then(data => {
      const list = Array.isArray(data)
        ? data
        : data.data || data.result || [];

      const myCoupons = list.filter(coupon =>
        String(coupon.storeName).trim() === String(storeName).trim()
      );

      renderCoupons(myCoupons);
    })
    .catch(err => {
      console.error("쿠폰 불러오기 실패:", err);
    });
}

/* =========================
   쿠폰 렌더
========================= */
function renderCoupons(coupons) {
  const listElement = document.getElementById("couponList");

  if (!coupons || coupons.length === 0) {
    listElement.innerHTML = "발급된 쿠폰이 없습니다.";
    return;
  }

  let html = "";
  const now = Date.now();

  coupons.forEach(c => {
    const issuedTime = new Date(c.issuedAt).getTime();
    const isExpiredByTime = now - issuedTime > 2 * 60 * 60 * 1000;

    const isActive = c.status === "active" && !isExpiredByTime;

    html += `
      <div class="coupon-card">
        <div class="coupon-top">
          <span class="coupon-name">${c.name || "이름 없음"}</span>

          <span class="coupon-status ${
            isActive ? "status-active" : "status-expired"
          }">
            ${isActive ? "🟢 사용가능" : "⚪ 만료"}
          </span>
        </div>

        <div class="coupon-info">
          🏪 ${c.storeName || "-"}<br>
          🕒 ${new Date(c.issuedAt).toLocaleString("ko-KR")}
        </div>
      </div>
    `;
  });

  listElement.innerHTML = html;
}

function normalizePhone(value) {
  return String(value)
    .replace(/[^0-9]/g, "")
    .replace(/^0/, "");
}