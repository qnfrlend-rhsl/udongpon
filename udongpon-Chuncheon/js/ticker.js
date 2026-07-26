document.addEventListener("DOMContentLoaded", () => {

  fetch("ticker.html")
    .then(response => {
      if (!response.ok) {
        throw new Error("ticker.html 불러오기 실패");
      }

      return response.text();
    })
    .then(html => {

      const newsTicker = document.getElementById("newsTicker");

      if (!newsTicker) {
        console.error("newsTicker 요소를 찾을 수 없습니다.");
        return;
      }

      newsTicker.innerHTML = html;

    })
    .catch(error => {
      console.error("자막 로딩 실패:", error);
    });

});