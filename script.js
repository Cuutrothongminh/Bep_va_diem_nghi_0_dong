// ====== CONFIG ======
const CSV_URL_BEP =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRGXNCIucm8_hAKXVIAWXxGkUDeY865wFUIrTwxTXEgA7USKi1ZJ7RAF4Mm0vT8ds2tc9mbFvtI64Uh/pub?output=csv&gid=0";

const CSV_URL_DIEMNGHI =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRGXNCIucm8_hAKXVIAWXxGkUDeY865wFUIrTwxTXEgA7USKi1ZJ7RAF4Mm0vT8ds2tc9mbFvtI64Uh/pub?output=csv&gid=332850820";


// ====== HÀM ĐỌC CSV ======
async function loadCSV(url) {
  const res = await fetch(url);
  const text = await res.text();

  const rows = text.trim().split("\n").map(r => r.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/));

  const header = rows[0].map(h => h.replace(/(^"|"$)/g, '').trim());

  return rows.slice(1).map(row => {
    let obj = {};
    row.forEach((val, i) => {
      obj[header[i]] = val ? val.replace(/(^"|"$)/g, '').trim() : "";
    });
    return obj;
  });
}


// ====== CHUẨN HÓA LINK GOOGLE MAPS ======
function normalizeGmapsLink(link) {
  if (!link) return "";
  link = link.trim();
  if (!/^https?:\/\//i.test(link)) link = "https://" + link;
  return link;
}


// ====== TÁCH SỐ ĐIỆN THOẠI ======
function createPhoneButtons(phoneString) {
  if (!phoneString) return "";

  const numbers = phoneString.split(";").map(s => s.trim()).filter(s => s.length > 0);

  return numbers
    .map(num => `<a href="tel:${num}" class="call-btn">${num}</a>`)
    .join(" ");
}


// ====== RENDER BẢNG ======
function renderTable(data, elementId) {
  if (!data || !data.length) {
    document.getElementById(elementId).innerHTML = "<p>Không có dữ liệu.</p>";
    return;
  }

  // Loại bỏ cột "type"
  const headers = Object.keys(data[0]).filter(h => h.toLowerCase() !== "type");

  const container = document.getElementById(elementId);

  container.innerHTML = `
    <input type="text" class="form-control mb-2" placeholder="Tìm kiếm..." id="${elementId}-search">

    <table class="table table-bordered table-striped" id="${elementId}-table">
      <thead>
        <tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr>
      </thead>
      <tbody>
        ${data
          .map(row => {
            return `
              <tr>
                ${headers
                  .map(h => {
                    const key = h.toLowerCase();

                    // Google Maps
                    if (key.includes("map") || key.includes("gmaps")) {
                      const url = normalizeGmapsLink(row[h]);
                      return `<td>${url ? `<a href="${url}" target="_blank" class="map-link">Xem bản đồ</a>` : ""}</td>`;
                    }

                    // Nhiều số điện thoại
                    if (key.includes("sdt") || key.includes("phone")) {
                      return `<td>${createPhoneButtons(row[h])}</td>`;
                    }

                    return `<td>${row[h] || ""}</td>`;
                  })
                  .join("")}
              </tr>
            `;
          })
          .join("")}
      </tbody>
    </table>
  `;

  // Tìm kiếm nhanh
  const input = document.getElementById(`${elementId}-search`);
  input.addEventListener("input", () => {
    const filter = input.value.toLowerCase();
    container.querySelectorAll("tbody tr").forEach(tr => {
      tr.style.display = tr.innerText.toLowerCase().includes(filter) ? "" : "none";
    });
  });
}



// ====== MAP + MARKER CLUSTER ======
function initMap(allPoints) {
  const map = L.map("map").setView([16.047, 108.206], 6);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18,
  }).addTo(map);

  const markers = L.markerClusterGroup();

  allPoints.forEach(p => {
    const lat = parseFloat(p.Lat);
    const lng = parseFloat(p.Lng);
    if (isNaN(lat) || isNaN(lng)) return;

    const url = normalizeGmapsLink(p.gmaps_link);

    const popupPhones = createPhoneButtons(p.phone);

    const popupContent = `
      <b>${p.Ten || p.Name || ""}</b><br>
      ${p.DiaChi || p.Address || ""}<br>
      ${url ? `<a href="${url}" target="_blank">Xem bản đồ</a>` : ""}
      <br>${popupPhones}
    `;

    const iconUrl =
      p.type === "bep"
        ? "https://maps.google.com/mapfiles/ms/icons/red-dot.png"
        : "https://maps.google.com/mapfiles/ms/icons/green-dot.png";

    const icon = L.icon({
      iconUrl,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
    });

    markers.addLayer(L.marker([lat, lng], { icon }).bindPopup(popupContent));
  });

  map.addLayer(markers);
}



// ====== KHỞI ĐỘNG ======
async function init() {
  try {
    const bepData = await loadCSV(CSV_URL_BEP);
    const diemData = await loadCSV(CSV_URL_DIEMNGHI);

    bepData.forEach(r => {
      r.gmaps_link = normalizeGmapsLink(r["Link Google Map"] || r["gmaps_link"] || "");
      r.phone = r["SDT"] || r["Phone"] || "";
      r.type = "bep";
    });

    diemData.forEach(r => {
      r.gmaps_link = normalizeGmapsLink(r["Link Google Map"] || r["gmaps_link"] || "");
      r.phone = r["SDT"] || r["Phone"] || "";
      r.type = "diemnghi";
    });

    renderTable(bepData, "table-bep");
    renderTable(diemData, "table-diemnghi");

    const allPoints = [...bepData, ...diemData].filter(p => p.Lat && p.Lng);

    initMap(allPoints);
  } catch (e) {
    console.error(e);
    alert("Không tải được dữ liệu!");
  }
}

init();
