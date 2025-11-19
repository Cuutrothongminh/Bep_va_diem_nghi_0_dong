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
// Chuẩn hóa link Google Maps
// ===============================
function normalizeGmapsLink(link) {
  if(!link) return "";
  link = link.trim();
  if(link.startsWith("http://") || link.startsWith("https://")) return link;
  // Nếu link bắt đầu bằng www hoặc maps, thêm https://
  if(link.startsWith("www.") || link.startsWith("maps.")) return "https://" + link;
  return link;
}

// ===============================
// Hiển thị bảng + tìm kiếm + nút gọi
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
          // Link Google Map
          if(keyLower.includes("gmaps") || keyLower.includes("map")) {
            const url = normalizeGmapsLink(row[h]);
            return `<td>${url ? `<a href="${url}" target="_blank" class="map-link">Xem bản đồ</a>` : ""}</td>`;
          }
          // Số điện thoại
          if(keyLower.includes("sdt") || keyLower.includes("phone")) {
            return `<td>${row[h] ? `<a href="tel:${row[h]}" class="call-btn">Gọi ngay</a>` : ""}</td>`;
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
      const url = normalizeGmapsLink(p.gmaps_link);
      const phone = p.phone || "";
      const phoneLink = phone ? `<br><a href="tel:${phone}" class="call-btn">Gọi ngay</a>` : "";
      const popupContent = `<b>${p.name}</b><br>${p.address || ""}${url ? `<br><a href="${url}" target="_blank">Xem bản đồ</a>` : ""}${phoneLink}`;
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

    // Chuẩn hóa cột gmaps_link và phone
    bepData.forEach(r => {
      r.gmaps_link = normalizeGmapsLink(r["Link Google Map"] || r["GoogleMap"] || r["gmaps_link"] || "");
      r.phone = r["SDT"] || r["Phone"] || "";
    });
    diemData.forEach(r => {
      r.gmaps_link = normalizeGmapsLink(r["Link Google Map"] || r["GoogleMap"] || r["gmaps_link"] || "");
      r.phone = r["SDT"] || r["Phone"] || "";
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
        gmaps_link: r.gmaps_link,
        phone: r.phone
      });
    });

    diemData.forEach(r => {
      if(r.Lat && r.Lng) allPoints.push({
        name: r.Ten || r.Name || "Điểm nghỉ",
        address: r.DiaChi || r.Address || "",
        lat: r.Lat,
        lng: r.Lng,
        gmaps_link: r.gmaps_link,
        phone: r.phone
      });
    });

    initMap(allPoints);

  } catch(e) {
    console.error(e);
    alert("Không tải được dữ liệu. Kiểm tra link CSV!");
  }
}

init();
