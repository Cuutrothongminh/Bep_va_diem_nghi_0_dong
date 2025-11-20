// ================= CONFIG =================
const CSV_URL_BEP =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRGXNCIucm8_hAKXVIAWXxGkUDeY865wFUIrTwxTXEgA7USKi1ZJ7RAF4Mm0vT8ds2tc9mbFvtI64Uh/pub?output=csv&gid=0";

const CSV_URL_DIEMNGHI =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRGXNCIucm8_hAKXVIAWXxGkUDeY865wFUIrTwxTXEgA7USKi1ZJ7RAF4Mm0vT8ds2tc9mbFvtI64Uh/pub?output=csv&gid=332850820";


// ================= LOAD CSV =================
async function loadCSV(url) {
  const res = await fetch(url);
  const text = await res.text();

  const rows = text.trim().split("\n").map(
    r => r.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/)
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


// ================= FIX GOOGLE MAP LINKS =================
function normalizeGmapsLink(link) {
  if (!link) return "";
  link = link.trim();

  // Nếu user copy từ GSheets đôi khi url bị encode → ta giữ nguyên
  if (link.startsWith("http://") || link.startsWith("https://")) return link;

  return "https://" + link;
}


// ================= TÁCH SỐ ĐIỆN THOẠI =================
function createPhoneButtons(phoneString) {
  if (!phoneString) return "";

  return phoneString
    .split(";")
    .map(p => p.trim())
    .filter(p => p.length > 0)
    .map(num => `<a href="tel:${num}" class="call-btn">${num}</a>`)
    .join(" ");
}


// ================= RENDER TABLE =================
function renderTable(data, elementId) {

  const headers = Object.keys(data[0]).filter(h =>
    !["type"].includes(h.toLowerCase())
  );

  const container = document.getElementById(elementId);

  container.innerHTML = `
    <input type="text" class="form-control" placeholder="Tìm kiếm..." id="${elementId}-search">

    <table class="table table-bordered table-striped" id="${elementId}-table">
      <thead>
        <tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr>
      </thead>
      <tbody>
        ${data.map(row => `
          <tr>
            ${headers.map(h => {
              const key = h.toLowerCase();

              // Google Map
              if (key.includes("map")) {
                const url = normalizeGmapsLink(row[h]);
                return `<td>${url ? `<a href="${url}" target="_blank" class="map-link">Xem bản đồ</a>` : ""}</td>`;
              }

              // SDT
              if (key.includes("sdt") || key.includes("phone")) {
                return `<td>${createPhoneButtons(row[h])}</td>`;
              }

              return `<td>${row[h] || ""}</td>`;
            }).join("")}
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;

  // Live search
  const input = document.getElementById(`${elementId}-search`);
  input.addEventListener("input", () => {
    const filter = input.value.toLowerCase();
    container.querySelectorAll("tbody tr").forEach(tr => {
      tr.style.display = tr.innerText.toLowerCase().includes(filter) ? "" : "none";
    });
  });
}


// ================= MAP =================
function initMap(allPoints) {
  const map = L.map("map").setView([16.05, 108.2], 6);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18
  }).addTo(map);

  const markers = L.markerClusterGroup();

  allPoints.forEach(p => {
    if (!p.Lat || !p.Lng) return;

    const lat = parseFloat(p.Lat);
    const lng = parseFloat(p.Lng);
    if (isNaN(lat) || isNaN(lng)) return;

    const popup = `
      <b>${p.Ten || p.Name || ""}</b><br>
      ${p.DiaChi || p.Address || ""}<br>
      <a href="${normalizeGmapsLink(p.gmaps_link)}" target="_blank">Xem bản đồ</a><br>
      ${createPhoneButtons(p.phone)}
    `;

    markers.addLayer(
      L.marker([lat, lng]).bindPopup(popup)
    );
  });

  map.addLayer(markers);
}


// ================= MAIN =================
async function init() {
  try {
    const bep = await loadCSV(CSV_URL_BEP);
    const nghi = await loadCSV(CSV_URL_DIEMNGHI);

    bep.forEach(r => {
      r.gmaps_link = normalizeGmapsLink(r["Link Google Map"] || r["gmaps_link"]);
      r.phone = r["SDT"] || r["Phone"];
      r.type = "bep";
    });

    nghi.forEach(r => {
      r.gmaps_link = normalizeGmapsLink(r["Link Google Map"] || r["gmaps_link"]);
      r.phone = r["SDT"] || r["Phone"];
      r.type = "diemnghi";
    });

    renderTable(bep, "table-bep");
    renderTable(nghi, "table-diemnghi");

    const allPoints = [...bep, ...nghi];
    initMap(allPoints);

  } catch (err) {
    alert("Không tải được dữ liệu CSV!");
    console.error(err);
  }
}

init();
