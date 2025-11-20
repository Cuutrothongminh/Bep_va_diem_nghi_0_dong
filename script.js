// ====== CONFIG ======
const CSV_URL_BEP =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRGXNCIucm8_hAKXVIAWXxGkUDeY865wFUIrTwxTXEgA7USKi1ZJ7RAF4Mm0vT8ds2tc9mbFvtI64Uh/pub?gid=0&single=true&output=csv";

const CSV_URL_DIEMNGHI =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRGXNCIucm8_hAKXVIAWXxGkUDeY865wFUIrTwxTXEgA7USKi1ZJ7RAF4Mm0vT8ds2tc9mbFvtI64Uh/pub?gid=332850820&single=true&output=csv";


// ====== HÀM ĐỌC CSV ======
async function loadCSV(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("CSV load error: " + url);

  const text = await res.text();

  const rows = text.trim().split("\n").map(r =>
    r.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/)
  );

  const header = rows[0].map(h => h.replace(/(^"|"$)/g, '').trim());

  return rows.slice(1).map(row => {
    let obj = {};
    row.forEach((val, i) => {
      obj[header[i]] = val.replace(/(^"|"$)/g, '').trim();
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

  const numbers = phoneString.split(";")
    .map(s => s.trim())
    .filter(s => s.length > 0);

  return numbers
    .map(num => `<a href="tel:${num}" class="call-btn">${num}</a>`)
    .join("");
}


// ====== RENDER BẢNG ======
function renderTable(data, elementId) {
  const container = document.getElementById(elementId);
  if (!data.length) {
    container.innerHTML = "<p>Không có dữ liệu.</p>";
    return;
  }

  // Loại bỏ trường type để tránh lặp
  const headers = Object.keys(data[0]).filter(h => h.toLowerCase() !== "type");

  container.innerHTML = `
    <input type="text" class="form-control mb-2" placeholder="Tìm kiếm..." id="${elementId}-search">

    <table class="table table-bordered table-striped">
      <thead><tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr></thead>
      <tbody>
        ${data.map(row => `
          <tr>
            ${headers.map(h => {
              const key = h.toLowerCase();

              // Hiển thị link Google Maps
              if (key.includes("map")) {
                const url = normalizeGmapsLink(row[h]);
                return `<td>${url ? `<a class="map-link" target="_blank" href="${url}">Xem bản đồ</a>` : ""}</td>`;
              }

              // Hiển thị nhiều số điện thoại
              if (key.includes("sdt") || key.includes("phone")) {
                return `<td>${createPhoneButtons(row[h])}</td>`;
              }

              return `<td>${row[h]}</td>`;
            }).join("")}
          </tr>
        `).join("")}
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



// ====== MAP ======
function initMap(points) {
  const map = L.map("map").setView([16.047, 108.206], 6);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);

  const cluster = L.markerClusterGroup();

  points.forEach(p => {
    const lat = parseFloat(p.Lat);
    const lng = parseFloat(p.Lng);
    if (isNaN(lat) || isNaN(lng)) return;

    const popup = `
      <b>${p.Ten || p.Name}</b><br>
      ${p.DiaChi || p.Address}<br>
      <a target="_blank" href="${p.gmaps_link}">Xem bản đồ</a><br>
      ${createPhoneButtons(p.phone)}
    `;

    const icon = L.icon({
      iconUrl: p.type === "bep"
        ? "https://maps.google.com/mapfiles/ms/icons/red-dot.png"
        : "https://maps.google.com/mapfiles/ms/icons/green-dot.png",
      iconSize: [32, 32],
      iconAnchor: [16, 32]
    });

    cluster.addLayer(
      L.marker([lat, lng], { icon }).bindPopup(popup)
    );
  });

  map.addLayer(cluster);
}



// ====== MAIN ======
async function init() {
  try {
    const bep = await loadCSV(CSV_URL_BEP);
    const diem = await loadCSV(CSV_URL_DIEMNGHI);

    bep.forEach(r => {
      r.gmaps_link = normalizeGmapsLink(r["Link Google Map"] || "");
      r.phone = r["SDT"] || "";
      r.type = "bep";
    });

    diem.forEach(r => {
      r.gmaps_link = normalizeGmapsLink(r["Link Google Map"] || "");
      r.phone = r["SDT"] || "";
      r.type = "diemnghi";
    });

    renderTable(bep, "table-bep");
    renderTable(diem, "table-diemnghi");

    initMap([...bep, ...diem]);

  } catch (err) {
    console.error(err);
    alert("Không tải được dữ liệu!");
  }
}

init();
