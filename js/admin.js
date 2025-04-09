// Override default fetch behavior for admin (no 3-month filter)
async function fetchData() {
  document.querySelector('.loading').style.display = 'block';
  const res = await fetch('https://opensheet.elk.sh/1UMul8nt25GR8MUM-_EdwAR0q6Ne2ovPv_R-m1-CHeXw/Daily%20Sales%20record');
  data = await res.json();
  filteredData = data;
  document.querySelector('.loading').style.display = 'none';
  renderResults();
}

function renderResults() {
  const table = document.getElementById('resultsTable');
  table.innerHTML = '';
  document.getElementById('resultsCount').textContent = `📊 Showing ${filteredData.length} records`;

  paginate(filteredData, currentPage).forEach(row => {
    const tr = document.createElement('tr');
    const courierName = (row["Courier Name"] || '').trim();
    const trackingId = (row["Tracking ID"] || '').toLowerCase();

    let courierDisplay = '';
    if (courierName) {
      courierDisplay = `<a href="${couriers[courierName] || '#'}" target="_blank">${courierName}</a>`;
    } else if (trackingId.includes('cancelled')) {
      courierDisplay = `<span style="color:#e60000;font-weight:600;">❌ Cancelled</span>`;
    } else if (trackingId.includes('delivered')) {
      courierDisplay = `<span style="color:#28a745;font-weight:600;">✅ Delivered</span>`;
    } else {
      courierDisplay = `<span style="color:#888;">N/A</span>`;
    }

    tr.innerHTML = `
      <td>${formatDate(row.Date)}</td>
      <td>${row["Customer Name"]}</td>
      <td>${row["Location (Pincode)"]}</td>
      <td>${courierDisplay}</td>
      <td>${row["Tracking ID"]}</td>
      <td>${row["Category"] || ''}</td>
      <td>${row["Vendor Name"] || ''}</td>
      <td>${row["Reseller having wallet"] || row["Reseller Name"] || ''}</td>
    `;
    tr.onclick = () => renderPopup(row);
    table.appendChild(tr);
  });

  renderPaginationControls();
}

function applyAdminFilters() {
  const month = document.getElementById("adminMonth").value;
  const week = document.getElementById("adminWeek").value;
  const year = document.getElementById("adminYear").value;
  const vendor = document.getElementById("vendorFilter").value.toLowerCase();
  const reseller = document.getElementById("resellerFilter").value.toLowerCase();

  filteredData = data.filter(row => {
    const date = new Date(row.Date);
    let match = true;

    if (month) {
      const [y, m] = month.split("-");
      match = match && (date.getFullYear() == y && (date.getMonth() + 1) == parseInt(m));
    }

    if (week) {
      const [wy, wn] = week.split("-W");
      const weekDate = new Date(date.getFullYear(), 0, 1 + (wn - 1) * 7);
      match = match && (weekDate.getFullYear() == wy);
    }

    if (year) {
      match = match && (date.getFullYear() == year);
    }

    if (vendor) {
      match = match && (row["Vendor Name"]?.toLowerCase().includes(vendor));
    }

    if (reseller) {
      const val = row["Reseller having wallet"] || row["Reseller Name"] || "";
      match = match && (val.toLowerCase().includes(reseller));
    }

    return match;
  });

  currentPage = 1;
  renderResults();
}
