// Japanese national holidays for 2024
const holidays = [
  '2024-01-01', // 元日
  '2024-01-08', // 成人の日
  '2024-02-11', // 建国記念の日
  '2024-02-12', // 振替休日
  '2024-02-23', // 天皇誕生日
  '2024-03-20', // 春分の日
  '2024-04-29', // 昭和の日
  '2024-05-03', // 憲法記念日
  '2024-05-04', // みどりの日
  '2024-05-05', // こどもの日
  '2024-05-06', // 振替休日
  '2024-07-15', // 海の日
  '2024-08-11', // 山の日
  '2024-08-12', // 振替休日
  '2024-09-16', // 敬老の日
  '2024-09-23', // 秋分の日
  '2024-10-14', // スポーツの日
  '2024-11-04', // 文化の日 振替休日
  '2024-11-23'  // 勤労感謝の日
];

function isHoliday(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const formatted = `${y}-${m}-${d}`;
  const day = date.getDay();
  return day === 0 || day === 6 || holidays.includes(formatted);
}

function nextBusinessDay(date) {
  let next = new Date(date.getTime());
  while (isHoliday(next)) {
    next.setDate(next.getDate() + 1);
  }
  return next;
}

function addBusinessDays(date, days) {
  let result = new Date(date.getTime());
  for (let i = 0; i < days; i++) {
    result.setDate(result.getDate() + 1);
    result = nextBusinessDay(result);
  }
  return result;
}

function format(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function drawCalendar(orderDate, shipDate, deliveryDate) {
  const year = orderDate.getFullYear();
  const month = orderDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDate = new Date(year, month + 1, 0).getDate();
  const days = ['日', '月', '火', '水', '木', '金', '土'];

  let html = '<table class="calendar"><thead><tr>';
  for (const d of days) html += `<th>${d}</th>`;
  html += '</tr></thead><tbody><tr>';

  let day = 0;
  for (let i = 0; i < firstDay.getDay(); i++) {
    html += '<td></td>';
    day++;
  }

  for (let date = 1; date <= lastDate; date++) {
    const current = new Date(year, month, date);
    const classes = [];
    if (format(current) === format(orderDate)) classes.push('order');
    if (format(current) === format(shipDate)) classes.push('ship');
    if (format(current) === format(deliveryDate)) classes.push('delivery');
    if (isHoliday(current)) classes.push('holiday');
    html += `<td class="${classes.join(' ')}">${date}</td>`;
    day++;
    if (day % 7 === 0 && date !== lastDate) html += '</tr><tr>';
  }

  while (day % 7 !== 0) {
    html += '<td></td>';
    day++;
  }

  html += '</tr></tbody></table>';
  document.getElementById('calendar').innerHTML = html;
}

const orderInput = document.getElementById('orderDate');
const shipSpan = document.getElementById('shipDate');
const deliverySpan = document.getElementById('deliveryDate');

orderInput.addEventListener('change', () => {
  const orderDate = new Date(orderInput.value);
  if (isNaN(orderDate)) {
    shipSpan.textContent = '-';
    deliverySpan.textContent = '-';
    return;
  }
  const shipDate = addBusinessDays(orderDate, 1);
  const deliveryDate = addBusinessDays(shipDate, 1);
  shipSpan.textContent = format(shipDate);
  deliverySpan.textContent = format(deliveryDate);
  drawCalendar(orderDate, shipDate, deliveryDate);
});
