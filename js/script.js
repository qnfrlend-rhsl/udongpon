const GAS_URL = "https://script.google.com/macros/s/AKfycbw5vXb9Yue650Fj_vXt6jskm5mTXde7hJePp6QJqSUl0-U3i_zPCNtMJNOvS4x6VSn8GQ/exec";

// 지도 초기화
const map = L.map('map').setView([37.8935, 127.7395], 15);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// 마커 저장
let markers = [];
let allStores = [];
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
fetch(GAS_URL + "?action=getStores")
  .then(res => res.json())
  .then(stores => {
    allStores = stores;
    renderMarkers(stores);
  })
  .catch(err => {
    console.error(err);
  });

// 상세 이동
function goToStore(storeName) {
  window.location.href = `store.html?name=${encodeURIComponent(storeName)}`;
}

// 동 검색 (여기 그대로 OK)
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

// 마커 렌더
function renderMarkers(storesData) {
  // 기존 마커 제거
  markers.forEach(m => map.removeLayer(m));
  markers = [];

  storesData.forEach(store => {
    const lat = Number(store.lat);
    const lng = Number(store.lng);
    if (!lat || !lng) return;

    const status = store.status || "pending";

    // 상태별 이모지
    const emoji = status === "active" ? "💖" : "💛";

    const icon = L.divIcon({
      className: "custom-pin",
      html: `<span style="
              font-size: 13px; 
              text-shadow: 0 1px 3px rgba(0,0,0,0.4);
            ">${emoji}</span>`,
      iconSize: [11, 11],
      iconAnchor: [3, 7],  // 핀 밑부분 기준
      popupAnchor: [0, -28]
    });

    const marker = L.marker([lat, lng], { icon }).addTo(map);

    let popupContent = `<b>${store.storeName}</b><br>🎁 ${store.discount || "-" }<br><br>`;
    popupContent += `<button onclick="openWebsite('${store.websiteUrl}')">홈페이지 보기</button>`;
    popupContent += `<br><br><button onclick="goToStore('${store.storeName}')">쿠폰받기</button>`;
    if(status !== "active") {
    popupContent += `<br><span style="font-size:16px; font-weight:bold; color:red;">등록대기중</span>`;
    }

    marker.bindPopup(popupContent);
    markers.push(marker);
  });
}

// 카테고리
function filterCategory(category) {
  currentCategory = category;

  // ⭐ 전체 클릭하면 동도 초기화 (핵심)
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

// ⭐⭐⭐ 핵심 수정 (여기만 바뀜)
function applyFilter() {

  let filtered = allStores;

  // 🔥 동 필터 (빈 값이면 무시)
  if (currentDong && currentDong !== "") {
    filtered = filtered.filter(store =>
      (store.dong || "").includes(currentDong)
    );
  }

  // 🔥 카테고리 필터
  if (currentCategory && currentCategory !== "전체") {
    filtered = filtered.filter(store =>
      store.category === currentCategory
    );
  }

  renderMarkers(filtered);
}

document.getElementById("dongInput").addEventListener("keypress", function(e) {
  if (e.key === "Enter") {
    searchDong();
  }
});