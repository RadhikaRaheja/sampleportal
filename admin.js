const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyxN6fXtkLd5o6LpInKf5DH5GqguhmnFoC8GvzISglwVZ7_m4rggYeXXjFCK9Wh8uQtTg/exec";
let dataSales = [], dataWallet = [], vendorsList = [];

document.addEventListener("DOMContentLoaded", async () => {
  setupTabs();
  await loadVendors();
  await loadSalesData();
  await loadWalletData();
});

function setupTabs() {
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".tab-content").forEach(tab => tab.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById(`${btn.dataset.tab}-tab`).classList.add("active");
    });
  });
}

async function loadVendors() {
  const res = await fetch(`${GOOGLE_SCRIPT_URL}?sheet=List of Vendors`);
  const list = await res.json();
  vendorsList = list.map(x => x["Name"] || x["Vendor Name"] || x["Name of Vendor/Reseller"]);
}

async function loadSalesData() {
  const res = await fetch(`${GOOGLE_SCRIPT_URL}?sheet=Daily Sales record`);
  const raw = await res.json();
  const limitDate = new Date(); limitDate.setDate(limitDate.getDate() - 30);
  dataSales = raw.filter(row => new Date(row.Date) >= limitDate);
  renderSalesTable(dataSales);
}

async function loadWalletData() {
  const res = await fetch(`${GOOGLE_SCRIPT_URL}?sheet=Vendor Wallet Record`);
  const raw = await res.json();
  const limitDate = new Date(); limitDate.setDate(limitDate.getDate() - 30);
  dataWallet = raw.filter(row => new Date(row["Date"]) >= limitDate);
  renderWalletTable(dataWallet);
}

function renderSalesTable(data) {
  const tbody = document.querySelector("#sales-table tbody");
  tbody.innerHTML = "";
  document.getElementById("resultsCount").textContent = `📦 Showing ${data.length} orders`;

  function formatDate(input) {
  const date = new Date(input);
  if (isNaN(date.getTime())) return ''; // Fallback for invalid/missing
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).replace(/ /g, '-');
}

  data.forEach((row, index) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      ${cell(row.Date, index, 'Date', 'date')}
      ${cell(row["Customer Name"], index, 'Customer Name')}
      ${cell(row["Location (Pincode)"], index, 'Location (Pincode)')}
      ${dropdown(row["Vendor Name"], index, 'Vendor Name')}
      ${cell(row["Amount Received from Customer"], index, 'Amount Received from Customer', 'number')}
      ${cell(row["Amount Paid to Vendor"], index, 'Amount Paid to Vendor', 'number')}
      ${dropdown(row["Reseller Name"], index, 'Reseller Name')}
      ${cell(row["Courier Name"], index, 'Courier Name')}
      ${cell(row["Tracking ID"], index, 'Tracking ID')}
    `;
    tbody.appendChild(tr);
  });
}

function renderWalletTable(data) {
  const tbody = document.querySelector("#wallet-table tbody");
  tbody.innerHTML = "";
  document.getElementById("resultsCount").textContent = `💰 Showing ${data.length} wallet records`;

  data.forEach((row, index) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      ${cell(row["Date"], index, 'Date', 'date')}
      ${dropdown(row["Name of Vendor/Reseller"], index, 'Name of Vendor/Reseller')}
      ${cell(row["Amount"], index, 'Amount', 'number')}
    `;
    tbody.appendChild(tr);
  });
}

// Editable input cell
function cell(value, row, col, type = "text") {
  return `<td><input type="${type}" value="${value || ''}" data-row="${row}" data-col="${col}" onblur="saveEdit(this)" /></td>`;
}

// Vendor dropdown cell
function dropdown(value, row, col) {
  const options = vendorsList.map(v => `<option ${v === value ? "selected" : ""}>${v}</option>`).join("");
  return `<td><select data-row="${row}" data-col="${col}" onchange="saveEdit(this)">${options}</select></td>`;
}

// Save to Google Sheet via Apps Script
async function saveEdit(el) {
  const row = parseInt(el.dataset.row) + 2;
  const col = el.dataset.col;
  const val = el.value;
  const sheet = el.closest("table").id.includes("wallet") ? "Vendor Wallet Record" : "Daily Sales record";

  const res = await fetch(GOOGLE_SCRIPT_URL, {
    method: "POST",
    body: JSON.stringify({ sheet, row, col, value: val }),
    headers: { "Content-Type": "application/json" }
  });

  const json = await res.json();
  if (json.success) showToast("✅ Saved");
  else showToast("❌ Error");
}

function showToast(msg) {
  const el = document.getElementById("toast");
  el.innerText = msg;
  el.style.display = "block";
  setTimeout(() => (el.style.display = "none"), 2000);
}

// Filters
function applyFilters() {
  const from = new Date(document.getElementById("fromDate").value);
  const to = new Date(document.getElementById("toDate").value);
  const vendor = document.getElementById("filterVendor").value.toLowerCase();
  const reseller = document.getElementById("filterReseller").value.toLowerCase();
  const blanks = document.getElementById("filterBlanks").checked;

  let filtered = dataSales.filter(row => {
    const d = new Date(row.Date);
    let match = true;
    if (!isNaN(from)) match = match && d >= from;
    if (!isNaN(to)) match = match && d <= to;
    if (vendor) match = match && (row["Vendor Name"] || '').toLowerCase().includes(vendor);
    if (reseller) match = match && (row["Reseller Name"] || '').toLowerCase().includes(reseller);
    if (blanks) {
      match = match &&
        (!row["Tracking ID"] || !row["Courier Name"] || !row["Reseller Name"]);
    }
    return match;
  });

  renderSalesTable(filtered);
}

function updateCell(sheet, rowIndex, columnName, newValue) {
  fetch('https://script.google.com/macros/s/AKfycbyxN6fXtkLd5o6LpInKf5DH5GqguhmnFoC8GvzISglwVZ7_m4rggYeXXjFCK9Wh8uQtTg/exec', {
    method: 'POST',
    body: JSON.stringify({
      sheetName: sheet,
      row: rowIndex + 2, // +2 because 0-based + header
      column: columnName,
      value: newValue
    }),
    headers: {
      'Content-Type': 'application/json'
    }
  })
  .then(res => res.json())
  .then(res => {
    if (res.success) showToast("✅ Updated");
    else showToast("⚠️ Update failed");
  })
  .catch(() => showToast("❌ Error updating"));
}

function clearFilters() {
  document.getElementById("fromDate").value = "";
  document.getElementById("toDate").value = "";
  document.getElementById("filterVendor").value = "";
  document.getElementById("filterReseller").value = "";
  document.getElementById("filterBlanks").checked = false;
  renderSalesTable(dataSales);
}
