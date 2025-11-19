// ===============================
// 1. LINK CSV (THAY LẠI TẠI ĐÂY)
// ===============================
const CSV_URL_BEP =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRGXNCIucm8_hAKXVIAWXxGkUDeY865wFUIrTwxTXEgA7USKi1ZJ7RAF4Mm0vT8ds2tc9mbFvtI64Uh/pubhtml?gid=0&single=true";

const CSV_URL_DIEMNGHI =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRGXNCIucm8_hAKXVIAWXxGkUDeY865wFUIrTwxTXEgA7USKi1ZJ7RAF4Mm0vT8ds2tc9mbFvtI64Uh/pubhtml?gid=332850820&single=true";


// ===============================
// 2. HÀM ĐỌC CSV
// ===============================
async function loadCSV(url) {
  const res = await fetch(url);
  const text = await res.text();

  const rows = text.trim().split("\n").map(r => r.split(","));

  const header = rows[0];
  const data = rows.slice(1).map(row => {
    let obj = {};
    row.forEach((val, i) => obj[header[i]] = val);
    return obj;
  });

  return data;
}

// ===============================
// 3. HIỂN THỊ BẢNG HTML
// ===============================
function renderTable(data, elementId) {
  if (!data || data.length === 0) {
    document.getElementById(elementId).innerHTML = "<p>Không có dữ liệu.</p>";
    return;
  }

  const header = Object.keys(data[0]);
  let html = `<table class="table table-bordered table-striped"><thead><tr>`;

  header.forEach(h => html += `<th>${h}</th>`);
  html += `</tr></thead><tbody>`;

  data.forEach(row => {
    html += "<tr>";
    header.forEach(h => html += `<td>${row[h] || ""}</td>`);
    html += "</tr>";
  });

  html += "</tbody></table>";

  document.getElementById(elementId).innerHTML = html;
}

// ===============================
// 4. HIỂN THỊ MAP
// ===============================
function initMap(allPoints) {
  const map = L.map("map").setView([16.047, 108.206], 6); // Trung VN

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18,
  }).addTo(map);

  allPoints.forEach(p => {
    if (!p.lat || !p.lng) return;

    L.marker([p.lat, p.lng]).addTo(map)
      .bindPopup(`<b>${p.name}</b><br>${p.address}`);
  });
}

// ===============================
// 5. LOAD DỮ LIỆU & KHỞI CHẠY
// ===============================
async function init() {
  try {
    const bepData = await loadCSV(CSV_URL_BEP);
    const diemData = await loadCSV(CSV_URL_DIEMNGHI);

    renderTable(bepData, "table-bep");
    renderTable(diemData, "table-diemnghi");

    // Gộp danh sách điểm để hiển thị map
    const allPoints = [];

    bepData.forEach(r => {
      if (r.Lat && r.Lng) allPoints.push({
        name: r.Ten || r.Name || "Bếp",
        address: r.DiaChi || r.Address || "",
        lat: parseFloat(r.Lat),
        lng: parseFloat(r.Lng)
      });
    });

    diemData.forEach(r => {
      if (r.Lat && r.Lng) allPoints.push({
        name: r.Ten || r.Name || "Điểm nghỉ",
        address: r.DiaChi || r.Address || "",
        lat: parseFloat(r.Lat),
        lng: parseFloat(r.Lng)
      });
    });

    initMap(allPoints);

  } catch (e) {
    console.error(e);
    alert("Không tải được dữ liệu! Kiểm tra lại link CSV Publish.");
  }
}

init();
