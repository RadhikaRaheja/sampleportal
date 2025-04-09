// Format date to DD-MMM-YYYY
function formatDate(inputDate) {
  const date = new Date(inputDate);
  if (isNaN(date)) return '';
  const options = { day: '2-digit', month: 'short', year: 'numeric' };
  return date.toLocaleDateString('en-GB', options).replace(/ /g, '-');
}

// Pagination utility
function paginate(data, page, entriesPerPage = 10) {
  const start = (page - 1) * entriesPerPage;
  return data.slice(start, start + entriesPerPage);
}
