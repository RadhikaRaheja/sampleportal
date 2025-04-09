const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyxN6fXtkLd5o6LpInKf5DH5GqguhmnFoC8GvzISglwVZ7_m4rggYeXXjFCK9Wh8uQtTg/exec";
let vendorsList = [];

document.addEventListener("DOMContentLoaded", async () => {
  setupTabs();
  await loadVendors();
  await loadSalesData();
  await loadWalletData();
});

// Tab switch logic
function setupTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));

      btn.classList.add('active');
      document.getElementById(`${btn.dataset.tab}-tab`).classList.add('active');
    });
  });
}

// Load vendor dropdown list
async function loadVendors() {
  const res = await fetch(`${GOOGLE_SCRIPT_URL}?sheet=List of Vendors`);
  const data = await res.json();
  vendorsList = data.map(row => row["Vendor Name"] || row["Name"] || row["Name of Vendor/Reseller"] || row[""]);
}

// Load Daily Sales Records
async function loadSalesData() {
  const res = await fetch(`${GOOGLE_SCRIPT_URL}?sheet=Daily Sales record`);
  const data = await res.json();
  const tbody = document.querySelector("#sales-table tbody");
  tbody.innerHTML = "";

  data.forEach((row, index) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      ${makeCell(row.Date, index, 'Date', 'date')}
      ${makeCell(row["Customer Name"], index, 'Customer Name')}
      ${makeCell(row["Location (Pincode)"], index, 'Location (Pincode)')}
      ${makeDropdownCell(row["Vendor Name"], index, 'Vendor Name')}
      ${makeCell(row["Amount Received from Customer"], index, 'Amount Received from Customer', 'number')}
      ${makeCell(row["Amount Paid to Vendor"], index, 'Amount Paid to Vendor', 'number')}
      ${makeDropdownCell(row["Reseller having wallet"], index, 'Reseller having wallet')}
      ${makeCell(row["Courier Name"], index, 'Courier Name')}
      ${makeCell(row["Tracking ID"], index, 'Tracking ID')}
    `;

    tbody.appendChild(tr);
  });
}

// Load Vendor Wallet Record
async function loadWalletData() {
  const res = await fetch(`${GOOGLE_SCRIPT_URL}?sheet=Vendor Wallet Record`);
  const data = await res.json();
  const tbody = document.querySelector("#wallet-table tbody");
  tbody.innerHTML = "";

  data.forEach((row, index) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      ${makeCell(row["Date"], index, 'Date', 'date')}
      ${makeDropdownCell(row["Name of Vendor/Reseller"], index, 'Name of Vendor/Reseller')}
      ${makeCell(row["Amount"], index, 'Amount', 'number')}
    `;

    tbody.appendChild(tr);
  });
}

// Utilities: editable input fields with auto-save
function makeCell(value, row, colName, type = "text") {
  return `<td><input type="${type}" value="${value || ''}" data-row="${row}" data-col="${colName}" onblur="saveEdit(this)" /></td>`;
}

function makeDropdownCell(value, row, colName) {
  const options = vendorsList.map(v => `<option value="${v}" ${v === value ? "selected" : ""}>${v}</option>`).join("");
  return `<td><select data-row="${row}" data-col="${colName}" onchange="saveEdit(this)">${options}</select></td>`;
}

// Auto-save on blur or dropdown change
async function saveEdit(input) {
  const row = parseInt(input.dataset.row) + 2; // +2 to account for header + 0-index
  const col = input.dataset.col;
  const value = input.value;

  const payload = {
    sheet: input.closest("table").id.includes("wallet") ? "Vendor Wallet Record" : "Daily Sales record",
    row,
    col,
    value
  };

  try {
    const res = await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" }
    });

    const result = await res.json();
    if (result.success) showToast("✅ Saved");
    else throw new Error();
  } catch (err) {
    showToast("❌ Failed to save");
  }
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.innerText = message;
  toast.style.display = "block";
  setTimeout(() => (toast.style.display = "none"), 2000);
}
