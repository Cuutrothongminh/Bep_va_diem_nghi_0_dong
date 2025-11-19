// CSV từng sheet
const SHEET_BEP = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRGXNCIucm8_hAKXVIAWXxGkUDeY865wFUIrTwxTXEgA7USKi1ZJ7RAF4Mm0vT8ds2tc9mbFvtI64Uh/pub?gid=0&single=true&output=csv";
const SHEET_DIEMNGHI = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRGXNCIucm8_hAKXVIAWXxGkUDeY865wFUIrTwxTXEgA7USKi1ZJ7RAF4Mm0vT8ds2tc9mbFvtI64Uh/pub?gid=373689948&single=true&output=csv";

const loading = document.getElementById("loading");
const errorBox = document.getElementById("error");
const bepList = document.getElementById("bep-list");
const diemnghiList = document.getElementById("diemnghi-list");

async function loadCSV(url) {
  const response = await fetch(url);
  const csv = await response.text();
  const lines = csv.trim().split("\n").map(r => r.split(","));

  const headers = lines[0].map(h => h.trim());
  return lines.slice(1)
    .filter(row => row.some(v => v.trim() !== ""))
    .map(row =>
      Object.fromEntries(row.map((v, i) => [headers[i], v.trim()]))
    );
}

function renderList(container, items) {
  container.innerHTML = "";

  items.forEach(item => {
    const phoneButtons = item.Phone
      ? item.Phone.split(/;|\||,/).map(p =>
          `<a class="call-btn" href="tel:${p.trim()}">📞 ${p.trim()}</a>`
        ).join(" ")
      : "";

    const mapButton = item.gmaps_link
      ? `<a class="map-btn" href="${item.gmaps_link}" target="_blank">🗺️ Mở bản đồ</a>`
      : "";

    const card = document.createElement("div");
    card.className = "card-item";
    card.innerHTML = `
      <h3>${item["Tên bếp"] || item["Tên"]}</h3>
      <p><strong>Địa chỉ:</strong> ${item["Địa chỉ"] || "—"}</p>
      ${phoneButtons ? `<p><strong>Điện thoại:</strong> ${phoneButtons}</p>` : ""}
      ${item["Suất/ngày"] ? `<p><strong>Suất/ngày:</strong> ${item["Suất/ngày"]}</p>` : ""}
      ${item["Số phòng"] ? `<p><strong>Số phòng:</strong> ${item["Số phòng"]}</p>` : ""}
      ${item["Số người"] ? `<p><strong>Số người:</strong> ${item["Số người"]}</p>` : ""}
      ${item["Ghi chú"] ? `<p><strong>Ghi chú:</strong> ${item["Ghi chú"]}</p>` : ""}
      ${mapButton}
    `;
    container.appendChild(card);
  });
}

async function loadData() {
  try {
    const [bepData, diemnghiData] = await Promise.all([
      loadCSV(SHEET_BEP),
      loadCSV(SHEET_DIEMNGHI)
    ]);

    loading.style.display = "none";

    renderList(bepList, bepData);
    renderList(diemnghiList, diemnghiData);
  } catch (err) {
    loading.style.display = "none";
    errorBox.textContent = "❗ Không thể tải dữ liệu từ Google Sheets";
  }
}

loadData();
