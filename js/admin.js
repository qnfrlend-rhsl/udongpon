const GAS_URL = "https://script.google.com/macros/s/AKfycbxKs4fzt-dN_b1Y-R9Mhiccx_NWqZJE1q9vBr_xwLIUHU66okTfpBAeBVBULLxITX26Jw/exec";

let allCoupons = [];
let allStores = [];
let isAdmin = localStorage.getItem("isAdmin") === "true";

function getGeoCache() {
  return JSON.parse(localStorage.getItem("geoCache") || "{}");
}

function setGeoCache(cache) {
  localStorage.setItem("geoCache", JSON.stringify(cache));
}

async function getCoordsFromAddress(address) {

  const geoCache = getGeoCache(); 

  if (geoCache[address]) {
    return geoCache[address];
  }

  const url = `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(address)}`;

  const res = await fetch(url, {
    headers: {
      Authorization: "KakaoAK 4bc216edc0a1de5f21dd79022ce52f2b"
    }
  });

  const data = await res.json();

  if (!data.documents.length) {
    return null;
  }

  const result = {
    lat: data.documents[0].y,
    lng: data.documents[0].x
  };

  // ⭐ 캐시에 저장
  geoCache[address] = result;
  setGeoCache(geoCache);

  return result;
}


/* =========================
   ⭐ 쿠폰 로드
========================= */
function loadAdminCoupons() {
  fetch(GAS_URL + "?action=getCoupons", {
    cache: "no-store"
  })
    .then(res => res.json())
    .then(data => {
      allCoupons = Array.isArray(data) ? data : [];
      renderCoupons("all");
    })
    .catch(err => {
      console.error("쿠폰 로드 실패:", err);
    });
}

/* =========================
   ⭐ 매장 로드
========================= */
function loadStores() {
  fetch(GAS_URL + "?action=getStores")
    .then(res => res.json())
    .then(data => {

      allStores = (Array.isArray(data) ? data : [])
  .filter(store => store && typeof store === "object")
  .map(store => ({
    ...store,
    hasEvent: store.hasEvent ?? false
  }));

      renderStores();
      updateStoreFilter();
    })
    .catch(err => {
      console.error("매장 로드 실패:", err);
    });
}

/* =========================
   ⭐ 쿠폰 렌더
========================= */
function renderCoupons(filter) {
  const el = document.getElementById("adminList");

  let list = allCoupons;

  if (filter !== "all") {
    list = allCoupons.filter(c =>
      String(c.storeName || "").trim() === String(filter || "").trim()
    );
  }

  if (!list.length) {
    el.innerHTML = "쿠폰 없음";
    return;
  }

  el.innerHTML = list.map(c => {

    const isActive = c.status === "active";
    const isPaid = c.status === "paid";
    const id = String(c.couponId || "");

    return `
      <div class="card ${isActive ? "" : "expired"}">

        <div class="row flex-row">
          <b>👤 ${c.name || "-"}</b>

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

        <div class="row">📞 ${c.phone || "-"}</div>
        <div class="row">🏪 ${c.storeName || "-"}</div>
        <div class="row">🏠 ${c.address || "-"}</div>
        <div class="row">🕒 ${new Date(c.issuedAt).toLocaleString("ko-KR")}</div>

        <div class="btn-area">
          ${isActive
          ? `<button onclick="payCoupon('${id}')">결제대기</button>`
           : ""}
          <button onclick="deleteCoupon('${id}')">삭제</button>
        </div>

      </div>
    `;
  }).join("");
}

/* =========================
   ⭐ 매장 렌더
========================= */
function updateAdminButton() {
  const btn = document.getElementById("adminBtn");
  if (!btn) return;

  btn.innerText = isAdmin ? "관리자 ON 🔓" : "관리자 OFF 🔐";
}

function toggleAdmin() {
  if (!isAdmin) {
    const pw = prompt("관리자 비밀번호");

    if (pw === "132482") {
      isAdmin = true;
      localStorage.setItem("isAdmin", "true");
      alert("관리자 ON 🔓");
    } else {
      alert("비밀번호 틀림");
      return;
    }
  } else {
    isAdmin = false;
    localStorage.removeItem("isAdmin");
    alert("관리자 OFF 🔒");
  }

  loadStores();
  updateAdminButton();
}



function renderStores() {
  const el = document.getElementById("storeList");

  if (!allStores.length) {
    el.innerHTML = "등록된 매장 없음";
    return;
  }


  el.innerHTML = allStores.map(s => {
    return `
      <div class="card">
        <b>🏪 ${s.storeName}</b><br>
        📍 ${s.address || "-"}<br>
        📞 ${s.phone || "-"}<br>
        🎁 ${s.discount || "-"}<br>
        <div class="status ${s.status === "active" ? "active" : "expired"}">
          ${s.status === "active" ? "운영중" : "등록대기"}
        </div><br>

        <button onclick="editStore('${s.storeId}')">수정</button>
        <button onclick="deleteStore('${s.storeId}')">삭제</button>
        <button onclick="setStoreStatus('${s.storeId}','active')">매장등록</button>
        <button onclick="setStoreStatus('${s.storeId}','pending')">등록대기</button>
      </div>
    `;
  }).join("");
}

function requireAdmin() {
  if (!isAdmin) {
    alert("관리자 권한 필요 🔒");
    return false;
  }
  return true;
}

// =========================
// 매장 상태 변경
// 위치: js/admin.js
// =========================
function setStoreStatus(storeId, mode) {

  if (!requireAdmin()) return;

  const statusValue = mode === "active" ? "active" : "pending";

  fetch(GAS_URL + "?action=updateStoreStatus&storeId=" + encodeURIComponent(storeId) +
        "&status=" + encodeURIComponent(statusValue))
    .then(res => res.json())
    .then(data => {
      if(data.success) {
        alert("등록되었습니다");
        loadStores(); // 리스트 갱신
      } else {
        alert("상태 변경 실패");
      }
    })
    .catch(err => {
      console.error(err);
      alert("상태 변경 중 오류 발생");
    });
}

/* =========================
   ⭐ 매장 등록
========================= */
async function addStore(status = 'active') {

  if (!requireAdmin()) return;

  const storeName = document.getElementById("storeName")?.value || "";
  const category = document.getElementById("storeCategory")?.value || "";
  const dong = document.getElementById("storeDong")?.value || "";
  const address = document.getElementById("storeAddress")?.value || "";
  const phone = document.getElementById("storePhone")?.value || "";
  const discount = document.getElementById("storeDiscount")?.value || "";
  const websiteUrl = document.getElementById("storeWebsite")?.value || "";

  // ⭐ 여기 핵심 추가
  const coords = await getCoordsFromAddress(address);

  if (!coords) {
    alert("주소 좌표 변환 실패");
    return;
  }

  fetch(
    GAS_URL +
    "?action=addStore" +
    "&storeName=" + encodeURIComponent(storeName) +
    "&category=" + encodeURIComponent(category) +
    "&dong=" + encodeURIComponent(dong) +
    "&address=" + encodeURIComponent(address) +
    "&phone=" + encodeURIComponent(phone) +
    "&discount=" + encodeURIComponent(discount) +
    "&websiteUrl=" + encodeURIComponent(websiteUrl) +
    "&lat=" + encodeURIComponent(coords.lat) +
    "&lng=" + encodeURIComponent(coords.lng) +
    "&status=" + encodeURIComponent(status)
  )
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      showMsg("등록 완료 ❤️");
      loadStores();
    } else {
      alert("등록 실패");
    }
  })
  .catch(err => {
    console.error(err);
    alert("등록 중 오류 발생");
  });
}
/* =========================
   ⭐ 매장 삭제
========================= */
function deleteStore(id) {

  if (!requireAdmin()) return;

  if (!confirm("정말 삭제할까?")) return;

  fetch(GAS_URL + "?action=deleteStore&storeId=" + encodeURIComponent(id))
    .then(res => res.json())
    .then(data => {
      if (data.success) loadStores();
      else alert("삭제 실패");
    })
    .catch(err => {
      console.error(err);
      alert("삭제 중 오류 발생");
    });
}

/* =========================
   ⭐ 매장 수정 (간단 prompt 방식)
========================= */
function editStore(id) {

  if (!requireAdmin()) return;
  
  const store = allStores.find(s => String(s.storeId) === String(id));
  if (!store) return;

  const newName = prompt("매장명", store.storeName);
  const newAddress = prompt("주소", store.address);
  const newPhone = prompt("전화번호", store.phone);
  const newCategory = prompt("카테고리", store.category);
  const newDiscount = prompt("할인", store.discount);
  const newUrl = prompt("웹사이트", store.websiteUrl);

  fetch(
    GAS_URL +
    "?action=updateStore" +
    "&storeId=" + encodeURIComponent(id) +
    "&storeName=" + encodeURIComponent(newName) +
    "&address=" + encodeURIComponent(newAddress) +
    "&phone=" + encodeURIComponent(newPhone) +
    "&category=" + encodeURIComponent(newCategory) +
    "&discount=" + encodeURIComponent(newDiscount) +
    "&websiteUrl=" + encodeURIComponent(newUrl)
  )
  .then(() => loadStores());
}
/* =========================
   ⭐ 쿠폰 상태 변경
========================= */
function payCoupon(id) {
  updateStatus(id, "paid");
}

function updateStatus(id, status) {
  fetch(
    GAS_URL +
      "?action=updateStatus&couponId=" +
      encodeURIComponent(id) +
      "&status=" +
      encodeURIComponent(status)
  )
    .then(() => loadAdminCoupons())
    .catch(err => console.error(err));
}

/* =========================
   ⭐ 쿠폰 삭제
========================= */
function deleteCoupon(id) {

  if (!requireAdmin()) return;

  if (!confirm("정말 삭제할까?")) return;

  fetch(
    GAS_URL +
    "?action=deleteCoupon&couponId=" +
    encodeURIComponent(id)
  )
  .then(res => res.json())
  .then(data => {
    if (data.success) loadAdminCoupons();
    else alert("삭제 실패");
  })
  .catch(err => {
    console.error(err);
    alert("삭제 중 오류 발생");
  });
}
/* =========================
   ⭐ 매장 필터 (쿠폰용 드롭다운 자동 생성)
========================= */
function updateStoreFilter() {
  const select = document.getElementById("storeFilter");
  if (!select) return;

  const current = select.value;

  select.innerHTML = `<option value="all">전체</option>` +
    allStores.map(s =>
      `<option value="${s.storeName}">${s.storeName}</option>`
    ).join("");

  select.value = current;
}

/* =========================
   ⭐ 필터 이벤트
========================= */
document.getElementById("storeFilter").addEventListener("change", (e) => {
  renderCoupons(e.target.value);
});

/* =========================
   ⭐ 초기 실행
========================= */
window.addEventListener("load", () => {
  updateAdminButton();
  loadStores();          // 1회
  loadAdminCoupons();    // 1회 즉시 실행

  setInterval(() => {
    loadAdminCoupons();  // 60초마다 갱신
  }, 60000);
});

function searchStore() {
  const keyword = document.getElementById("storeSearch").value.trim();

  if (!keyword) {
    renderStores();
    return;
  }

  const filtered = allStores.filter(store =>
    (store.storeName || "").includes(keyword)
  );

  const el = document.getElementById("storeList");

  if (!filtered.length) {
    el.innerHTML = "검색 결과 없음";
    return;
  }

  el.innerHTML = filtered.map(s => {
    return `
      <div class="card">
        <b>🏪 ${s.storeName}</b><br>
        📍 ${s.address || "-"}<br>
        📞 ${s.phone || "-"}<br>
        🎁 ${s.discount || "-"}<br>

        <div class="status ${s.status === "active" ? "active" : "expired"}">
          ${s.status === "active" ? "운영중" : "등록대기"}
        </div><br>

        <button onclick="editStore('${s.storeId}')">수정</button>
        <button onclick="setStoreStatus('${s.storeId}','active')">등록</button>
        <button onclick="setStoreStatus('${s.storeId}','pending')">등록대기</button>
      </div>
    `;
  }).join("");
}

function showMsg(text) {
  const msg = document.createElement("div");
  msg.innerText = text;

  msg.style.position = "fixed";
  msg.style.bottom = "20px";
  msg.style.left = "50%";
  msg.style.transform = "translateX(-50%)";
  msg.style.background = "#333";
  msg.style.color = "#fff";
  msg.style.padding = "10px 20px";
  msg.style.borderRadius = "8px";
  msg.style.zIndex = "9999";

  document.body.appendChild(msg);

  setTimeout(() => {
    msg.remove();
  }, 500);
}
