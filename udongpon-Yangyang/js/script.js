const GAS_URL = "https://script.google.com/macros/s/AKfycbzB6eG0cWsGrh9lBlhrSjcRWbhZmoYJs4D0-UVva1CUgRm4aKq_JFJd14oqLDH1jJSpxw/exec";

// 지도 초기화
let map;

window.addEventListener("DOMContentLoaded", () => {


///////////////////////////////////////////////////////////////////////// 지역 바꿀 때 사용 시작

  map = L.map('map', {
    minZoom: 6,
    maxZoom: 19
   }).setView([38.073495, 128.619594], 16);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19
  }).addTo(map);

});

///////////////////////////////////////////////////////////////////////// 지역 바꿀 때 사용 여기까지

// 마커 저장
let markers = [];
let allStores = [];
let allCoupons = [];
let cityList = [];
let currentCity = "양양군";    /////////////////////////////////////////// 지역 바꿀 때 사용 
let currentDong = "";
let currentCategory = "전체";
let isInitialLoad = true;

// 🔥 배지 크기 (여기서 조절)
let badgeSize = 20;
let badgeOffsetX = 2;
let badgeOffsetY = -8;

// 📍 지역 좌표
/*
const dongCoords = {
  "교동": [37.8813, 127.7278],
  "조운동": [37.8785, 127.7242],
  "약사동": [37.8789, 127.7196],
  "근화동": [37.8842, 127.7103],
  "소양동": [37.8856, 127.7199],
  "후평동": [37.882824, 127.748288],
  "효자동": [37.8690, 127.7350],
  "석사동": [37.8602, 127.7475],
  "퇴계동": [37.864283, 127.726027],
  "강남동": [37.8730, 127.7050],
  "신사우동": [37.9000, 127.7500],
  "신동": [37.932957, 127.727934],
  "사농동": [37.915510, 127.722807],
  "중앙로": [37.879609, 127.723018],
  "조양동": [37.880163, 127.730161],
  "요선동": [37.883273, 127.727638],
  "운교동": [37.877447, 127.732393],
  "낙원동": [37.879454, 127.724090],
  "칠전동": [37.843812, 127.711238],
  


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
*/

function isEventActive(store) {
  if (!store.eventStart || !store.eventEnd) return false;

  const now = Date.now();
  const start = new Date(store.eventStart).getTime();
  const end = new Date(store.eventEnd).getTime();

  return now >= start && now <= end;
}

function updateStats() {

  // 현재 선택된 시·군의 매장만 통계에 사용
  const cityStores = currentCity
    ? allStores.filter(store =>
        (store.address || "").includes(currentCity)
      )
    : allStores;

  const eventCount = cityStores.filter(store =>
    store.status === "active" &&
    isEventActive(store)
  ).length;

  const activeCount = cityStores.filter(store =>
    store.status === "active"
  ).length;

  const pendingCount = cityStores.filter(store =>
    store.status === "pending"
  ).length;

  document.getElementById("eventCount").textContent =
    eventCount + "";

  document.getElementById("storeCount").textContent =
    activeCount + "";

  document.getElementById("pendingCount").textContent =
    pendingCount + "";

  // =====================
  // 이벤트 뉴스바 화면 하단 줄광고를 말하는 것임.
  // =====================
/*
  const eventStores = allStores.filter(store =>
    store.status === "active" &&
    isEventActive(store)
  );

  let newsText =
`<span style="color:#ffd700;font-weight:bold; font-size:13px; display:inline-flex; align-items:center; gap:5px;">
  <span style="font-size:12px;">📢</span>
  현재 이벤트매장 ${eventStores.length}곳 운영중 [ 문의전화 : 010-8429-5368 ]
</span>
<span style="margin-left:8px; font-size:10px; color:#ff0000; opacity:0.8;">▶</span> `;

  eventStores.forEach(store => {
  newsText += `
  <span style="color:#ffffff;">
    ${store.dong} ${store.storeName}
  </span>
  <span style="display:inline-block; margin-left:25px; font-size:10px; color:#ff0000;">▶</span> `;
  });

  document.getElementById("newsTrack").innerHTML =
  newsText;
  */
  }


// 최근 검색 저장
function saveRecentSearch(keyword) {

  let recent = JSON.parse(
    localStorage.getItem("recentSearches") || "[]"
  );

  // 중복 제거
  recent = recent.filter(v => v !== keyword);

  // 앞에 추가
  recent.unshift(keyword);

  // 최대 5개
  recent = recent.slice(0, 5);

  localStorage.setItem(
    "recentSearches",
    JSON.stringify(recent)
  );
}

// 최근 검색 가져오기
function getRecentSearches() {
  return JSON.parse(
    localStorage.getItem("recentSearches") || "[]"
  );
}

// 데이터 로드
// 데이터 로드 시간 측정
const storeLoadStart = performance.now();

fetch(GAS_URL + "?action=getStoreMapData")
  .then(res => res.json())
  .then(stores => {

  const storeLoadEnd = performance.now();

  console.log(
    "📡 매장 데이터 로딩 시간:",
    ((storeLoadEnd - storeLoadStart) / 1000).toFixed(2),
    "초"
  );

  console.log("📦 getStoreMapData 응답:", stores);
  console.log("📦 응답 배열 여부:", Array.isArray(stores));

  allStores = stores || [];

  cityList = ["양양군"];   ////////////////////////////////////////////////////////////  지역 바꿀 때 사용

  console.log("📍 시·군 목록:", cityList);

  updateStats();

  applyFilter();

})
  .catch(err => console.error("STORE ERROR:", err));

// 상세 이동
function goToStore(storeName) {
  window.location.href = `store.html?name=${encodeURIComponent(storeName)}`;
}

const cityInput = document.getElementById("cityInput");
const dongInput = document.getElementById("dongInput");
const autocompleteList = document.getElementById("autocompleteList");

// 시·군 검색
function searchCity() {

  const input = cityInput.value.trim();

  if (!input) return;

  // 입력한 시·군이 등록된 매장 주소에 있는지 확인
  const cityStores = allStores.filter(store =>
    (store.address || "").includes(input)
  );

console.log("🔎 검색한 시·군:", input);
console.log("📍 첫 번째 주소:", allStores[0]?.address);
console.log("🏪 검색된 매장:", cityStores);

  // 해당 시·군 매장이 없으면 종료
  if (!cityStores.length) {
    alert("등록된 매장이 없는 지역입니다.");
    return;
  }

  // 현재 선택된 시·군 저장
  currentCity = input;

  // 동 검색 초기화
  currentDong = "";

  // 카테고리 초기화
  currentCategory = "전체";

  // 해당 시·군의 첫 번째 매장 위치로 지도 이동
  const firstStore = cityStores[0];

  map.setView(
    [
      Number(firstStore.lat),
      Number(firstStore.lng)
    ],
    17,
    { animate: true }
  );

  // 해당 시·군 전체 매장 표시
  applyFilter();

  updateStats();

  console.log(
    "현재 선택된 시·군:",
    currentCity,
    "| 매장 수:",
    cityStores.length
  );

}

// 지역 검색
function searchDong() {

  const input = document.getElementById("dongInput")
    .value
    .trim()
    .toLowerCase();

  if (!input) return;

  // =====================
  // 1. 등록된 매장 주소로 지역 검색
  // =====================

  const matchedRegionStores = allStores.filter(store =>
    (store.address || "")
    .toLowerCase()
    .includes(input)
  );

  if (matchedRegionStores.length) {

  currentDong = input;

  // 검색된 지역의 첫 번째 매장 위치로 이동
  const firstStore = matchedRegionStores[0];

  map.setView(
    [
      Number(firstStore.lat),
      Number(firstStore.lng)
    ],
    15,
    { animate: true }
  );

  applyFilter();
  saveRecentSearch(input);
  return;
  }

// =====================
// 2. 상호명 검색
// =====================

const searchStores = currentCity
  ? allStores.filter(store =>
      (store.address || "").includes(currentCity)
    )
  : allStores;

const matchedStore = searchStores.find(store =>
  (store.storeName || "")
    .toLowerCase()
    .includes(input)
);

  if (matchedStore) {

    currentDong = "";

    map.setView(
      [
        Number(matchedStore.lat),
        Number(matchedStore.lng)
      ],
      18,
      { animate: true }
    );

    renderMarkers([matchedStore]);

    saveRecentSearch(input);
    return;
  }

  alert("검색 결과가 없습니다.");
}

// 🔥 마커 렌더 (배지 추가 버전)
function renderMarkers(storesData) {

  const markerStart = performance.now();

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
  store.status === "active" &&
  isEventActive(store);

    const icon = L.divIcon({
  className: "custom-pin",
  html: `
    <div style="position:relative;display:inline-block;text-align:center;">

      <!-- 💖💛 하트 -->
      <span style="
  font-size:${status === "active" ? 18 : 12}px;
  text-shadow:0 1px 3px rgba(0,0,0,0.4);
  display:block;
">
  ${emoji}
</span>

      <!-- 🏪 매장 이름 (🔥 이것만 추가) -->
      <div style="
        font-size:${status === "active" ? 11 : 8}px;
        color:${status === "active" ? "#a11000" : "#000000"};
        white-space:nowrap;
        margin-top:-3px;
      ">
        ${store.storeName}
      </div>

      <!-- 🔥 배지 (기존 그대로 유지) -->
      ${showBadge ? `
        <div class="badge-wrap"
             style="
               position:absolute;
               top:${badgeOffsetY - badgeSize * 0.4}px;
               left:${badgeOffsetX + 11}px;
             ">

          <div class="badge-icon gift-glow"
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
  iconSize: [28, 40],
  iconAnchor: [14, 20],
  popupAnchor: [5, -3]
});

    const marker = L.marker([lat, lng], { icon }).addTo(map);

    marker.bindTooltip(store.storeName, {
    direction: "bottom",
    offset: [0, 23],
    permanent: false,
    sticky: true
    });

    let popupContent = `
  <b>${store.storeName}</b><br>
  📞 ${store.phone || "번호 없음"}<br>
  🎁 ${store.discount || "-"}<br><br>
`;

popupContent += `
  <button onclick="openWebsite('${store.websiteUrl || ""}', '${store.status}')">
    상세 / 홈페이지 보기
  </button>
`;

if (status === "active") {
  // popupContent += `<br><br><button onclick="goToStore('${store.storeName}')">쿠폰받기</button>`;
} else {
  popupContent += `
    <br><br>
    <span style="font-size:16px;font-weight:bold;color:red;">
      등록대기중
    </span>
  `;
}

    marker.bindPopup(popupContent);
    markers.push(marker);
  });

  const markerEnd = performance.now();

  console.log(
    "📍 마커 생성 시간:",
    ((markerEnd - markerStart) / 1000).toFixed(2),
    "초",
    "| 마커 수:",
    markers.length
  );
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
function openWebsite(url, status) {

  if (status === "pending") {
    alert("정식등록이 필요합니다.");
    return;
  }

  if (!url) {
    alert("등록된 홈페이지가 없습니다.");
    return;
  }

  window.open(url, "_blank");
}

// 필터
function applyFilter() {

  let filtered = allStores || [];

  // 시·군 필터
  if (currentCity) {
    filtered = filtered.filter(store =>
      (store.address || "").includes(currentCity)
    );
  }

  if (currentDong && currentDong !== "전체") {
    filtered = filtered.filter(store =>
      (store.address || "")
        .toLowerCase()
        .includes(currentDong.toLowerCase())
    );
  }

  // 카테고리 필터
  if (currentCategory && currentCategory !== "전체") {
    filtered = filtered.filter(store =>
      store.category === currentCategory
    );
  }
/*
  // 🔥 핵심 수정
  const bounds = map.getBounds();

// 🔥 bounds가 아직 초기 상태면 필터 건너뛰기
if (!bounds || bounds._southWest === undefined) {
  renderMarkers(filtered);
  return;
}

filtered = filtered.filter(store => {
  const lat = Number(store.lat);
  const lng = Number(store.lng);

  if (!lat || !lng) return false;

  return bounds.contains([lat, lng]);
});
*/
  renderMarkers(filtered);
}

// 엔터 검색
document.getElementById("cityInput").addEventListener("keypress", function(e) {
  if (e.key === "Enter") {
    searchCity();
  }
});

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

// =====================
// 시·군 자동완성
// =====================
cityInput.addEventListener("input", function() {

  const input = this.value.trim().toLowerCase();

  autocompleteList.innerHTML = "";

  if (!input) {
    autocompleteList.style.display = "none";
    return;
  }

  const matchedCities = cityList.filter(city =>
    city.toLowerCase().includes(input) ||
    input.includes(city.toLowerCase())
  );

  if (!matchedCities.length) {
    autocompleteList.style.display = "none";
    return;
  }

  matchedCities.slice(0, 8).forEach(city => {

    autocompleteList.innerHTML += `
      <div class="city-autocomplete-item">
        ${city}
      </div>
    `;

  });

  autocompleteList.style.display = "block";
});

// =====================
// 입력 시 자동완성
// =====================
dongInput.addEventListener("input", function() {

  const input = this.value.trim().toLowerCase();

  autocompleteList.innerHTML = "";

  // 입력 없으면 최근 검색 표시
  if (!input) {

    const recent = getRecentSearches();

    if (!recent.length) {
      autocompleteList.style.display = "none";
      return;
    }

    autocompleteList.innerHTML += `
      <div class="recent-label">
        최근 검색
      </div>
    `;

    recent.forEach(item => {

      autocompleteList.innerHTML += `
        <div class="autocomplete-item">
          ${item}
        </div>
      `;
    });

    autocompleteList.style.display = "block";

    return;
  }

// =====================
// 1. 동 검색
// =====================
  const dongList = Object.keys(dongCoords);

// 현재 선택된 시·군의 매장만 자동완성에 사용
  const searchStores = currentCity
  ? allStores.filter(store =>
      (store.address || "").includes(currentCity)
    )
  : allStores;

  const storeList = searchStores.map(
  store => store.storeName
  );

  const searchList = [
  ...dongList,
  ...storeList
  ];

  const matched = searchList.filter(item =>
  item.toLowerCase().includes(input) ||
  input.includes(item.toLowerCase())
  );

  if (!matched.length) {
    autocompleteList.style.display = "none";
    return;
  }

  matched.slice(0, 8).forEach(dong => {

    autocompleteList.innerHTML += `
      <div class="autocomplete-item">
        ${dong}
      </div>
    `;
  });

  autocompleteList.style.display = "block";
});

// 클릭 선택
autocompleteList.addEventListener("click", function(e) {

  // 시·군 자동완성 클릭
  if (e.target.classList.contains("city-autocomplete-item")) {

    const city = e.target.innerText.trim();

    cityInput.value = city;

    autocompleteList.style.display = "none";

    searchCity();

    return;
  }

  // 동·상호명 자동완성 클릭
  if (e.target.classList.contains("autocomplete-item")) {

    const value = e.target.innerText.trim();

    dongInput.value = value;

    autocompleteList.style.display = "none";

    searchDong();

  }

});

// 바깥 클릭 시 닫기
document.addEventListener("click", function(e) {

  if (!e.target.closest(".search-wrap")) {
    autocompleteList.style.display = "none";
  }
});

map.on("moveend", () => {
  setTimeout(applyFilter, 50);
});
