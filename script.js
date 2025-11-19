// ===============================
// Link CSV (output=csv)
// ===============================
const CSV_URL_BEP = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRGXNCIucm8_hAKXVIAWXxGkUDeY865wFUIrTwxTXEgA7USKi1ZJ7RAF4Mm0vT8ds2tc9mbFvtI64Uh/pub?output=csv&gid=0";
const CSV_URL_DIEMNGHI = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRGXNCIucm8_hAKXVIAWXxGkUDeY865wFUIrTwxTXEgA7USKi1ZJ7RAF4Mm0vT8ds2tc9mbFvtI64Uh/pub?output=csv&gid=332850820";

// ===============================
// Hàm đọc CSV
// ===============================
async function loadCSV(url) {
  const res = await fetch(url);
  const text = await res.text();
  const rows = text.trim().split("\n").map(r => r.split(","));
  const header = rows[0].map(h => h.trim());
  const data = rows.slice(1).map(row => {
    let obj = {};
    row.forEach((val, i) => {
      obj[header[i]] = val ? val.trim() : "";
    });
    return obj;
  });
  return data;
}

// ===============================
// Hiển thị bảng + tìm kiếm nhanh
// ===============================
function renderTable(data, elementId) {
  if (!data || data.length === 0) {
    document.getElementById(elementId).innerHTML = "<p>Không có dữ liệu.</p>";
    return;
  }

  const container = document.getElementById(elementId);

  container.innerHTML = `
    <input type="text" class="form-control mb-2" placeholder="Tìm kiếm..." id="${elementId}-search">
    <table class="table table-bordered table-striped" id="${elementId}-table">
      <thead>
        <tr>${Object.keys(data[0]).map(h => `<th>${h}</th>`).join("")}</tr>
      </thead>
      <tbody>
        ${data.map(row => `<tr>${Object.keys(row).map(h => {
          const keyLower = h.toLowerCase();
          // Nếu cột là link Google Map
          if(keyLower.includes("gmaps") || keyLower.includes("map")) {
            return `<td>${row[h] ? `<a href="${row[h]}" target="_blank" class="map-link">Xem bản đồ</a>` : ""}</td>`;
          }
          return `<td>${row[h] || ""}</td>`;
        }).join("")}</tr>`).join("")}
      </tbody>
    </table>
  `;

  const input = document.getElementById(`${elementId}-search`);
  input.addEventListener("input", function() {
    const filter = input.value.toLowerCase();
    const trs = container.querySelectorAll("tbody tr");
    trs.forEach(tr => {
      const text = tr.innerText.toLowerCase();
      tr.style.display = text.includes(filter) ? "" : "none";
    });
  });
}

// ===============================
// Map
// ===============================
function initMap(allPoints) {
  const map = L.map("map").setView([16.047, 108.206], 6);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 18 }).addTo(map);

  allPoints.forEach(p => {
    const lat = parseFloat(p.lat);
    const lng = parseFloat(p.lng);
    if(!isNaN(lat) && !isNaN(lng)) {
      const popupContent = `<b>${p.name}</b><br>${p.address || ""}${p.gmaps_link ? `<br><a href="${p.gmaps_link}" target="_blank">Xem bản đồ</a>` : ""}`;
      L.marker([lat,lng]).addTo(map).bindPopup(popupContent);
    }
  });
}

// ===============================
// Load dữ liệu & khởi chạy
// ===============================
async function init() {
  try {
    const bepData = await loadCSV(CSV_URL_BEP);
    const diemData = await loadCSV(CSV_URL_DIEMNGHI);

    // Chuẩn hóa cột gmaps_link
    bepData.forEach(r => {
      r.gmaps_link = r["Link Google Map"] || r["GoogleMap"] || r["gmaps_link"] || "";
    });
    diemData.forEach(r => {
      r.gmaps_link = r["Link Google Map"] || r["GoogleMap"] || r["gmaps_link"] || "";
    });

    renderTable(bepData, "table-bep");
    renderTable(diemData, "table-diemnghi");

    const allPoints = [];

    bepData.forEach(r => {
      if(r.Lat && r.Lng) allPoints.push({
        name: r.Ten || r.Name || "Bếp",
        address: r.DiaChi || r.Address || "",
        lat: r.Lat,
        lng: r.Lng,
        gmaps_link: r.gmaps_link
      });
    });

    diemData.forEach(r => {
      if(r.Lat && r.Lng) allPoints.push({
        name: r.Ten || r.Name || "Điểm nghỉ",
        address: r.DiaChi || r.Address || "",
        lat: r.Lat,
        lng: r.Lng,
        gmaps_link: r.gmaps_link
      });
    });

    initMap(allPoints);

  } catch(e) {
    console.error(e);
    alert("Không tải được dữ liệu. Kiểm tra link CSV!");
  }
}

init();
