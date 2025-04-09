let data = [], filteredData = [], couriers = {}, currentPage = 1, entriesPerPage = 10;

// Fetch Google Sheet Data
async function fetchData() {
  document.querySelector('.loading').style.display = 'block';
  const res = await fetch('https://opensheet.elk.sh/1UMul8nt25GR8MUM-_EdwAR0q6Ne2ovPv_R-m1-CHeXw/Daily%20Sales%20record');
  const result = await res.json();

  // For user mode, only last 3 months
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  data = result.filter(row => new Date(row.Date) >= threeMonthsAgo);

  filteredData = data;
  document.querySelector('.loading').style.display = 'none';
  renderResults();
}

async function loadCouriers() {
  const res = await fetch('https://opensheet.elk.sh/1UMul8nt25GR8MUM-_EdwAR0q6Ne2ovPv_R-m1-CHeXw/CourierMapping');
  const map = await res.json();
  const dropdown = document.getElementById('courierDropdown');
  map.forEach(entry => {
    couriers[entry['Courier Name']] = entry['Courier Website Link'];
    const option = document.createElement('option');
    option.value = entry['Courier Name'];
    option.textContent = entry['Courier Name'];
    dropdown.appendChild(option);
  });
}

function filterResults() {
  let field = document.getElementById('searchField').value;
  let query = '';
  if (field === 'Date') query = formatDate(document.getElementById('dateInput').value);
  else if (field === 'Courier Name') query = document.getElementById('courierDropdown').value;
  else query = document.getElementById('searchInput').value.toLowerCase();

  filteredData = data.filter(row => {
    if (!row[field]) return false;
    let value = field === 'Date' ? formatDate(row[field]) : row[field].toLowerCase();
    return value.includes(query);
  });

  currentPage = 1;
  renderResults();
}

function renderResults() {
  const table = document.getElementById('resultsTable');
  table.innerHTML = '';
  document.getElementById('resultsCount').textContent = `🔍 Showing ${filteredData.length} results`;

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
    `;
    tr.onclick = () => renderPopup(row);
    table.appendChild(tr);
  });

  renderPaginationControls();
}

// Init
fetchData();
loadCouriers();
