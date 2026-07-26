const provinceSelect = document.getElementById("provinceSelect");
const regionList = document.querySelector(".region-list");

provinceSelect.addEventListener("change", function () {

    // 기존 지역 버튼 모두 삭제
    regionList.innerHTML = "";

    // 선택한 지역 데이터 가져오기
    const selectedRegions = regions[this.value];

    // 선택한 지역이 없으면 종료
    if (!selectedRegions) {
        regionList.classList.remove("show");
        return;
    }
    // 지역 버튼 만들기
    selectedRegions.forEach(region => {
    const link = document.createElement("a");
    link.className = "region-box";

    // 동 목록이 있는 경우
    if (region.districts) {
        link.href = "#";
        link.addEventListener("click", function (event) {
            event.preventDefault();

            // 기존 목록 삭제
            regionList.innerHTML = "";

            // 동 목록 생성
            region.districts.forEach(district => {
                const districtLink = document.createElement("a");
                districtLink.className = "region-box";
                districtLink.href = district.url;
                districtLink.target = "_blank";
                districtLink.rel = "noopener";
                districtLink.innerHTML = `
                    <div class="region-info">
                        <div class="region-icon">
                            📍
                        </div>
                        <div>
                            <div class="region-name">
                                ${district.name}
                            </div>
                            <div class="region-sub">
                                ${district.sub}
                            </div>
                        </div>
                    </div>
                    <div class="arrow">
                        →
                    </div>
                `;
                regionList.appendChild(districtLink);
            });
        });
    } else {
        // 동 목록이 없는 일반 지역
        link.href = region.url;
        link.target = "_blank";
        link.rel = "noopener";

    }
    link.innerHTML = `
        <div class="region-info">
            <div class="region-icon">
                📍
            </div>
            <div>
                <div class="region-name">
                    ${region.name}
                </div>
                <div class="region-sub">
                    ${region.sub}
                </div>
            </div>
        </div>
        <div class="arrow">
            →
        </div>
    `;
    regionList.appendChild(link);
});
    // 지역 목록 표시
    regionList.classList.add("show");

});