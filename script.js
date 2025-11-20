// ================== CONFIG CSV ================== //
const CSV_URL_BEP =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRGXNCIucm8_hAKXVIAWXxGkUDeY865wFUIrTwxTXEgA7USKi1ZJ7RAF4Mm0vT8ds2tc9mbFvtI64Uh/pub?output=csv&gid=0";

const CSV_URL_DIEMNGHI =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRGXNCIucm8_hAKXVIAWXxGkUDeY865wFUIrTwxTXEgA7USKi1ZJ7RAF4Mm0vT8ds2tc9mbFvtI64Uh/pub?output=csv&gid=332850820";


// ================== LOAD CSV ================== //
async function loadCSV(url) {
  const res = await fetch(url);
  const text = await res.text();

  // Tách CSV an toàn với dấu phẩy trong dấu ngoặc kép
  const rows = text.trim().split("\n").map(r =>
    r.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/)
  );

  const header = rows[0].map(h => h.replace(/(^"|"$)/g, "").trim());

  return rows.slice(1).map(row => {
    let obj = {};
    row.forEach((val, i) => {
      obj[header[i]] = val.replace(/(^"|"$)/g, "").trim();
    });
    return obj;
  });
}


// ================== GOOGLE MAPS LINK ================== //
function normalizeGmapsLink(link) {
  if (!link) return "";
  link = link.trim();
  if (!/^https?:\/\//i.test(link)) link = "https://" + link;
  return link;
}


// ================== TÁCH NHIỀU SỐ ĐIỆN THOẠI ================== //
function createPhoneButtons(str) {
  if (!str) return "";

  const nums = str.split(";")
    .map(t => t.trim())
    .filter(t => t.length > 0);

  return nums
    .map(n => `<a class="call-btn" href="tel:${n}">${n}</a>`)
    .join("");
}


// ================== RENDER BẢNG ================== //
function renderTable(data, elementId) {
  if (!data.length) {
    document.getElementById(elementId).innerHTML = "Không có dữ liệu.";
    return;
  }

  const headers = Object.keys(data[0]);

  document.getElementById(elementId).innerHTML = `
    <input type="text" class="form-control" placeholder="Tìm kiếm..." id="${elementId}-search">

    <table class="table table-bordered table-striped mt-2">
      <thead>
        <tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr>
      </thead>
      <tbody>
        ${data.map(r => `
          <tr>
            ${headers.map(h => {

              const key = h.toLowerCase();

              // số điện thoại
              if (key.includes("sdt") || key.includes("phone"))
                return `<td>${createPhoneButtons(r[h])}</td>`;

              // Google Maps
              if (key.includes("map"))
                return `<td>${r[h] ? `<a target="_blank" class="map-link" href="${normalizeGmapsLink(r[h])}">Xem</a>` : ""}</td>`;

              return `<td>${r[h]}</td>`;
            }).join("")}
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;

  // Search live
  const searchInput = document.getElementById(`${elementId}-search`);
  searchInput.addEventListener("input", () => {
    const filter = searchInput.value.toLowerCase();
    document.querySelectorAll(`#${elementId} tbody tr`).forEach(tr => {
      tr.style.display = tr.innerText.toLowerCase().includes(filter) ? "" : "none";
    });
  });
}


// ================== MAP ================== //
function initMap(points) {
  const map = L.map("map").setView([16.047, 108.206], 6);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 18 }).addTo(map);

  const markerCluster = L.markerClusterGroup();

  points.forEach(p => {
    const lat = parseFloat(p.Lat);
    const lng = parseFloat(p.Lng);

    if (!lat || !lng) return;

    const phoneHTML = createPhoneButtons(p.SDT);
    const mapURL = normalizeGmapsLink(p["Link Map"]);

    const icon = L.icon({
      iconUrl: p.type === "bep"
        ? "https://maps.google.com/mapfiles/ms/icons/red-dot.png"
        : "https://maps.google.com/mapfiles/ms/icons/green-dot.png",
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    });

    markerCluster.addLayer(
      L.marker([lat, lng], { icon }).bindPopup(`
        <b>${p["Tên"]}</b><br>
        ${p["Địa chỉ"]}<br>
        ${mapURL ? `<a href="${mapURL}" target="_blank">Mở bản đồ</a>` : ""}
        <br><br>
        ${phoneHTML}
      `)
    );
  });

  map.addLayer(markerCluster);
}


// ================== MAIN ================== //
async function init() {
  const bepDataRaw = await loadCSV(CSV_URL_BEP);
  const diemRaw = await loadCSV(CSV_URL_DIEMNGHI);

  bepDataRaw.forEach(r => r.type = "bep");
  diemRaw.forEach(r => r.type = "diemnghi");

  renderTable(bepDataRaw, "table-bep");
  renderTable(diemRaw, "table-diemnghi");

  const allPoints = [...bepDataRaw, ...diemRaw];
  initMap(allPoints);
}

init();
