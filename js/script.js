const GAS_URL = "https://script.google.com/macros/s/AKfycbxKs4fzt-dN_b1Y-R9Mhiccx_NWqZJE1q9vBr_xwLIUHU66okTfpBAeBVBULLxITX26Jw/exec";

// 지도 초기화
const map = L.map('map', {
  minZoom: 6,
  maxZoom: 19
}).setView([37.885192, 127.745077], 17);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors',
  maxZoom: 19
}).addTo(map);

// 마커 저장
let markers = [];
let allStores = [];
let allCoupons = [];
let currentDong = "";
let currentCategory = "전체";
let isInitialLoad = true;

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

function isEventActive(store) {
  if (!store.eventStart || !store.eventEnd) return false;

  const now = Date.now();
  const start = new Date(store.eventStart).getTime();
  const end = new Date(store.eventEnd).getTime();

  return now >= start && now <= end;
}

function updateStats() {

  const eventCount = allStores.filter(store =>
    store.status === "active" &&
    isEventActive(store)
  ).length;

  const activeCount = allStores.filter(store =>
    store.status === "active"
  ).length;

  const pendingCount = allStores.filter(store =>
    store.status === "pending"
  ).length;

  document.getElementById("eventCount").textContent =
    eventCount + "개";

  document.getElementById("storeCount").textContent =
    activeCount + "개";

  document.getElementById("pendingCount").textContent =
    pendingCount + "개";

  // =====================
  // 이벤트 뉴스바
  // =====================

  const eventStores = allStores.filter(store =>
    store.status === "active" &&
    isEventActive(store)
  );

  let newsText =
`<span style="color:#ffd700;font-weight:bold; font-size:13px; display:inline-flex; align-items:center; gap:5px;">
  <span style="font-size:12px;">📢</span>
  현재 이벤트매장 ${eventStores.length}곳 운영중
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
fetch(GAS_URL + "?action=getStores")
  .then(res => res.json())
  .then(stores => {
  allStores = stores || [];

  updateStats();

  setTimeout(() => {
    applyFilter();
  }, 0);
})
  .catch(err => console.error("STORE ERROR:", err));

// 상세 이동
function goToStore(storeName) {
  window.location.href = `store.html?name=${encodeURIComponent(storeName)}`;
}

// 지역 검색
function searchDong() {

  const input = document.getElementById("dongInput")
    .value
    .trim()
    .toLowerCase();

  if (!input) return;

  // =====================
  // 1. 동 검색
  // =====================

  const dongList = Object.keys(dongCoords);

  const matchedDong = dongList.find(dong =>
    input.includes(dong.toLowerCase()) ||
    dong.toLowerCase().includes(input)
  );

  if (matchedDong) {

    currentDong = matchedDong;

    map.setView(
      dongCoords[matchedDong],
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

  const matchedStore = allStores.find(store =>
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

    let popupContent = `<b>${store.storeName}</b><br>🎁 ${store.discount || "-" }<br><br>`;
    popupContent += `<button onclick="openWebsite('${store.websiteUrl || ""}')">상세 / 홈페이지 보기</button>`;

    if (status === "active") {
      //popupContent += `<br><br><button onclick="goToStore('${store.storeName}')">쿠폰받기</button>`;
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

  if (currentDong && currentDong !== "전체") {
  filtered = filtered.filter(store =>
    (store.dong || "").includes(currentDong)
  );
}

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

const dongInput = document.getElementById("dongInput");
const autocompleteList = document.getElementById("autocompleteList");

// 입력 시 자동완성
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

  // 동 목록
  const dongList = Object.keys(dongCoords);

  const storeList = allStores.map(
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

  if (
    !e.target.classList.contains("autocomplete-item") ||
    e.target.classList.contains("recent-label")
  ) return;

  const text = e.target.innerText;

  dongInput.value = text;

  autocompleteList.style.display = "none";

  searchDong();
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