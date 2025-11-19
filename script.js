const SHEET_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRGXNCIucm8_hAKXVIAWXxGkUDeY865wFUIrTwxTXEgA7USKi1ZJ7RAF4Mm0vT8ds2tc9mbFvtI64Uh/pub?gid=0&single=true&output=csv";

const listContainer = document.getElementById("list");
const loading = document.getElementById("loading");
const errorBox = document.getElementById("error");

async function loadData() {
  try {
    const response = await fetch(SHEET_URL);
    if (!response.ok) throw new Error("Không tải được dữ liệu");

    const csv = await response.text();
    const rows = csv.split("\n").map(r => r.split(","));

    if (rows.length < 2) {
      loading.style.display = "none";
      errorBox.innerHTML = "❗ Google Sheets chưa có dữ liệu.";
      return;
    }

    const headers = rows[0].map(h => h.trim());
    const items = rows.slice(1).map(row =>
      Object.fromEntries(row.map((v, i) => [headers[i], v.trim()]))
    );

    renderList(items);
  } catch (err) {
    loading.style.display = "none";
    errorBox.innerHTML = "❗ Lỗi khi tải dữ liệu!";
  }
}

function renderList(items) {
  loading.style.display = "none";

  listContainer.innerHTML = "";

  items.forEach(item => {
    if (!item.name) return;

    let phoneHTML = "";
    if (item.phone) {
      const phones = item.phone.split("|").map(p => p.trim());
      phoneHTML = phones
        .map(p => `<a class="call-btn" href="tel:${p}">📞 ${p}</a>`)
        .join(" ");
    }

    let mapHTML = item.gmaps_link
      ? `<a class="map-btn" href="${item.gmaps_link}" target="_blank">🗺️ Mở bản đồ</a>`
      : "";

    const card = document.createElement("div");
    card.className = "card-item";

    card.innerHTML = `
      <h3>${item.name}</h3>
      <div class="type-tag">${item.type || "Không xác định"}</div>

      <p><strong>Địa chỉ:</strong> ${item.address || "—"}</p>

      ${phoneHTML ? `<p><strong>Điện thoại:</strong> ${phoneHTML}</p>` : ""}

      ${item.capacity ? `<p><strong>Sức chứa:</strong> ${item.capacity}</p>` : ""}

      ${item.note ? `<p><strong>Ghi chú:</strong> ${item.note}</p>` : ""}

      ${mapHTML}
    `;

    listContainer.appendChild(card);
  });
}

loadData();
