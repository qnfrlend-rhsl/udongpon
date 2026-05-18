const GAS_URL = "https://script.google.com/macros/s/AKfycbyPE3waJLoFri5DBAdpabY7i3swjA6HwAg8qYPHlVNvUVQGbAp9KvldiMMkUI5mcETcNw/exec";

// 지도 초기화
const map = L.map('map').setView([37.880368, 127.738029], 15);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// 마커 저장
let markers = [];
let allStores = [];
let allCoupons = [];
let currentDong = "후평3동";
let currentCategory = "전체";

// 🔥 배지 크기 (여기서 조절)
let badgeSize = 20;
let badgeOffsetX = 2;
let badgeOffsetY = -8;

// 📍 지역 좌표
const dongCoords = {
  "교동": [37.8813, 127.7278],
  "조운동": [37.8785, 127.7242],
  "약사동": [37.8789, 127.7196],
  "근화동": [37.8842, 127.7103],
  "소양동": [37.8856, 127.7199],
  "후평동": [37.882824, 127.748288],
  "효자동": [37.8690, 127.7350],
  "석사동": [37.8602, 127.7475],
  "퇴계동": [37.8510, 127.7580],
  "강남동": [37.8730, 127.7050],
  "신사우동": [37.9000, 127.7500],
  "신동": [37.932957, 127.727934],
  "사농동": [37.915510, 127.722807],
  "중앙로": [37.879609, 127.723018],
  "조양동": [37.880163, 127.730161],
  "요선동": [37.883273, 127.727638],
  "운교동": [37.877447, 127.732393],
  "낙원동": [37.879454, 127.724090],


  "동면": [37.881964, 127.764511],
  "서면": [37.8800, 127.6300],
  "남면": [37.7900, 127.6500],
  "남산면": [37.7500, 127.7300],
  "북산면": [37.9700, 127.8600],
  "신동면": [37.8200, 127.7800],
  "동내면": [37.8550, 127.7650],
  "신북읍": [37.9400, 127.7700],
  "만천리": [37.877434, 127.771491]
};

// 데이터 로드
fetch(GAS_URL + "?action=getStores")
  .then(res => res.json())
  .then(stores => {
    allStores = stores || [];
    renderMarkers(allStores);
  })
  .catch(err => console.error("STORE ERROR:", err));

// 상세 이동
function goToStore(storeName) {
  window.location.href = `store.html?name=${encodeURIComponent(storeName)}`;
}

// 지역 검색
function searchDong() {
  const dong = document.getElementById("dongInput").value.trim();

  if (!dong) return;

  currentDong = dong;

  if (dongCoords[dong]) {
    map.setView(dongCoords[dong], 15, { animate: true });
  } else {
    alert("해당 지역 좌표가 없습니다.");
    return;
  }

  applyFilter();
}

// 🔥 마커 렌더 (배지 추가 버전)
function renderMarkers(storesData) {

  markers.forEach(m => map.removeLayer(m));
  markers = [];

  (storesData || []).forEach(store => {

    const lat = Number(store.lat);
    const lng = Number(store.lng);
    if (!lat || !lng) return;

    const status = store.status || "pending";
    const emoji = status === "active" ? "💖" : "💛";

    // 🔥 배지 조건
    const showBadge =
      status === "active" &&
      store.discount &&
      store.discount.trim() !== "";

    const icon = L.divIcon({
      className: "custom-pin",
      html: `
        <div style="position:relative;display:inline-block;">

          <!-- 💖💛 하트 -->
          <span style="
            font-size:17px;
            text-shadow:0 1px 3px rgba(0,0,0,0.4);
          ">
            ${emoji}
          </span>

          <!-- 🔥 배지 -->
          ${showBadge ? `
  <div class="badge-wrap"
       style="
         position:absolute;
         top:${badgeOffsetY - badgeSize * 0.4}px;
         left:${badgeOffsetX}px;
       ">

    <div class="badge-icon"
      style="
        width:${badgeSize}px;
        height:${badgeSize}px;
        background: none;
        color:white;
        font-size:${badgeSize * 0.85}px;
        border: none;
        display:flex;
        align-items:center;
        justify-content:center;
        box-shadow:none;
      ">
      🎁
    </div>

    <div class="badge-tooltip">
      ${store.discount || ""}
    </div>

  </div>
` : ""}

        </div>
      `,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
      popupAnchor: [5, -3]
    });

    const marker = L.marker([lat, lng], { icon }).addTo(map);

    marker.bindTooltip(store.storeName, {
    direction: "bottom",
    offset: [0, 23],
    permanent: false,
    sticky: true
    });

    let popupContent = `<b>${store.storeName}</b><br>🎁 ${store.discount || "-" }<br><br>`;
    popupContent += `<button onclick="openWebsite('${store.websiteUrl || ""}')">홈페이지 보기</button>`;

    if (status === "active") {
      popupContent += `<br><br><button onclick="goToStore('${store.storeName}')">쿠폰받기</button>`;
    } else {
      popupContent += `<br><br><span style="font-size:16px;font-weight:bold;color:red;">등록대기중</span>`;
    }

    marker.bindPopup(popupContent);
    markers.push(marker);
  });
}

// 카테고리 필터
function filterCategory(category) {
  currentCategory = category;

  if (category === "전체") {
    currentDong = "";
  }

  applyFilter();
}

// 외부 링크
function openWebsite(url) {
  if (!url) {
    alert("등록된 홈페이지가 없습니다.");
    return;
  }

  window.open(url, "_blank");
}

// 필터
function applyFilter() {

  let filtered = allStores || [];

  if (currentDong) {
    filtered = filtered.filter(store =>
      (store.dong || "").includes(currentDong)
    );
  }

  if (currentCategory && currentCategory !== "전체") {
    filtered = filtered.filter(store =>
      store.category === currentCategory
    );
  }

  renderMarkers(filtered);
}

// 엔터 검색
document.getElementById("dongInput").addEventListener("keypress", function(e) {
  if (e.key === "Enter") {
    searchDong();
  }
});



function openCouponModal() {
  document.getElementById("couponModal").style.display = "flex";
}

function closeCouponModal() {
  document.getElementById("couponModal").style.display = "none";

  document.getElementById("couponPhone").value = "";
  document.getElementById("couponResult").innerHTML = "";
}

async function searchCoupons() {
  const phone = document.getElementById("couponPhone").value.trim();

  document.getElementById("couponResult").innerHTML = "";

  if (!phone) {
    alert("전화번호를 입력하세요.");
    return;
  }

  try {
    const res = await fetch(
        `${GAS_URL}?action=getCoupons&phone=${encodeURIComponent(phone)}&t=${Date.now()}`,
        {
          cache: "no-store"
        }
      );

    const coupons = await res.json();

    let html = "";

    if (!coupons.length) {
      html = "<p>발급된 쿠폰이 없습니다.</p>";
    } else {
      coupons.forEach(coupon => {
        const isActive = coupon.status === "active";
        const isPaid = coupon.status === "paid";

        html += `
          <div class="my-coupon-card ${isActive ? "" : "expired"}">

            <div class="row flex-row">
              <b>🏪 ${coupon.storeName || "-"}</b>

              <div class="status ${
                isActive ? "active" : isPaid ? "paid" : "expired"
              }">
                ${
                  isActive
                    ? "🟢 사용가능"
                    : isPaid
                    ? "💳 결제완료"
                    : "⚪ 만료"
                }
              </div>
            </div>

            <div class="row">📞 ${coupon.phone || "-"}</div>
            <div class="row">
            🕒 ${coupon.issuedAt ? new Date(coupon.issuedAt).toLocaleString("ko-KR") : "-"}
            </div>

            <div class="row">
            ⌛ ${coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleString("ko-KR") : "-"}
            </div>

          </div>
        `;
      });
    }

    document.getElementById("couponResult").innerHTML = html;

  } catch (err) {
    console.error(err);
    alert("쿠폰 조회 실패");
  }
}

document.getElementById("couponPhone").addEventListener("keypress", function(e) {
  if (e.key === "Enter") {
    searchCoupons();
  }
});