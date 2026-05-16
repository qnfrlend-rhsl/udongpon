const GAS_URL = "https://script.google.com/macros/s/AKfycbw5vXb9Yue650Fj_vXt6jskm5mTXde7hJePp6QJqSUl0-U3i_zPCNtMJNOvS4x6VSn8GQ/exec";

// 지도 초기화
const map = L.map('map').setView([37.8935, 127.7395], 15);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// 마커 저장
let markers = [];
let allStores = [];
let allCoupons = [];
let currentDong = "후평3동";
let currentCategory = "전체";

// 동 좌표 (이건 유지)
const dongCoords = {
  "교동": [37.8813, 127.7278],
  "조운동": [37.8785, 127.7242],
  "약사명동": [37.8789, 127.7196],
  "근화동": [37.8842, 127.7103],
  "소양동": [37.8856, 127.7199],
  "후평동": [37.882824, 127.748288],
  "효자동": [37.8690, 127.7350],
  "석사동": [37.8602, 127.7475],
  "퇴계동": [37.8510, 127.7580],
  "강남동": [37.8730, 127.7050],
  "신사우동": [37.9000, 127.7500]
};

// 데이터 로드
Promise.all([
  fetch(GAS_URL + "?action=getStores").then(res => res.json()),
  fetch(GAS_URL + "?action=getCoupons").then(res => res.json())
])
.then(([stores, coupons]) => {

  allStores = stores;
  allCoupons = coupons;

  applyFilter(); // ⭐ 여기서 지도 한 번만 그림

})
.catch(err => console.error(err));

// 상세 이동
function goToStore(storeName) {
  window.location.href = `store.html?name=${encodeURIComponent(storeName)}`;
}

// 동 검색
function searchDong() {
  const dong = document.getElementById("dongInput").value.trim();

  if (!dong) return;

  currentDong = dong;

  if (dongCoords[dong]) {
    map.setView(dongCoords[dong], 15, { animate: true });
  } else {
    alert("해당 동 좌표가 없습니다.");
    return;
  }

  applyFilter();
}

// 🔥 마커 렌더 (쿠폰 오버레이 추가 버전)
function renderMarkers(storesData) {

  // 기존 마커 제거
  markers.forEach(m => map.removeLayer(m));
  markers = [];

  storesData.forEach(store => {
    const lat = Number(store.lat);
    const lng = Number(store.lng);
    if (!lat || !lng) return;

    const status = store.status || "pending";

    // 💖 / 💛 상태 아이콘
    const emoji = status === "active" ? "💖" : "💛";

    // 🔥 쿠폰 여부 (핵심 추가)
    const hasCoupon = allCoupons.some(c =>
      c.storeId === store.storeId
    );

    const icon = L.divIcon({
      className: "custom-pin",
      html: `
        <div style="position: relative; display: inline-block;">

          <!-- 메인 아이콘 -->
          <span style="
            font-size: 17px;
            text-shadow: 0 1px 3px rgba(0,0,0,0.4);
          ">
            ${emoji}
          </span>

          <!-- 🔥 쿠폰 표시 -->
          ${hasCoupon ? `
            <div style="
              position: absolute;
              top: -10px;
              right: -10px;
              font-size: 12px;
              line-height: 1;
            ">
              🔥
            </div>
          ` : ""}

        </div>
      `,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
      popupAnchor: [5, -3]
    });

    const marker = L.marker([lat, lng], { icon }).addTo(map);

    let popupContent = `<b>${store.storeName}</b><br>🎁 ${store.discount || "-" }<br><br>`;
    popupContent += `<button onclick="openWebsite('${store.websiteUrl}')">홈페이지 보기</button>`;

    if (status === "active") {
      popupContent += `<br><br><button onclick="goToStore('${store.storeName}')">쿠폰받기</button>`;
    } else {
      popupContent += `<br><br><span style="font-size:16px; font-weight:bold; color:red;">등록대기중</span>`;
    }

    marker.bindPopup(popupContent);
    markers.push(marker);
  });
}

// 카테고리
function filterCategory(category) {
  currentCategory = category;

  if (category === "전체") {
    currentDong = "";
  }

  applyFilter();
}

function openWebsite(url) {
  if (!url) {
    alert("등록된 홈페이지가 없습니다.");
    return;
  }

  window.open(url, "_blank");
}

// 필터
function applyFilter() {

  let filtered = allStores;

  if (currentDong && currentDong !== "") {
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