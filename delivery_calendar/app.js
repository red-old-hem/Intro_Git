// Japanese national holidays for 2024 and 2025
const holidays = [
  // 2024
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
  '2024-11-23', // 勤労感謝の日
  // 2025
  '2025-01-01', // 元日
  '2025-01-13', // 成人の日
  '2025-02-11', // 建国記念の日
  '2025-02-23', // 天皇誕生日
  '2025-02-24', // 振替休日
  '2025-03-20', // 春分の日
  '2025-04-29', // 昭和の日
  '2025-05-03', // 憲法記念日
  '2025-05-04', // みどりの日
  '2025-05-05', // こどもの日
  '2025-05-06', // 振替休日
  '2025-07-21', // 海の日
  '2025-08-11', // 山の日
  '2025-09-15', // 敬老の日
  '2025-09-23', // 秋分の日
  '2025-10-13', // スポーツの日
  '2025-11-03', // 文化の日
  '2025-11-23', // 勤労感謝の日
  '2025-11-24'  // 振替休日
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

const orderInput = document.getElementById('orderDate');
const shipSpan = document.getElementById('shipDate');
const deliverySpan = document.getElementById('deliveryDate');
const calendar = document.getElementById('calendar');

function generateCalendar(year, month, shipDate, deliveryDate) {
  const days = ['日','月','火','水','木','金','土'];
  const first = new Date(year, month - 1, 1);
  let html = `<table><caption>${year}年${month}月</caption><thead><tr>`;
  for (const d of days) html += `<th>${d}</th>`;
  html += '</tr></thead><tbody>';

  let current = new Date(first);
  current.setDate(1 - first.getDay());
  for (let week = 0; week < 6; week++) {
    html += '<tr>';
    for (let i = 0; i < 7; i++) {
      const inMonth = current.getMonth() === first.getMonth();
      let cell = '';
      if (inMonth) {
        const classes = [];
        if (isHoliday(current)) classes.push('holiday');
        if (shipDate && format(current) === format(shipDate)) classes.push('ship');
        if (deliveryDate && format(current) === format(deliveryDate)) classes.push('delivery');
        cell = `<td class="${classes.join(' ')}">${current.getDate()}</td>`;
      } else {
        cell = '<td></td>';
      }
      html += cell;
      current.setDate(current.getDate() + 1);
    }
    html += '</tr>';
    if (current.getMonth() !== first.getMonth() && current.getDate() >= 7) break;
  }
  html += '</tbody></table>';
  calendar.innerHTML = html;
}

function initCalendar() {
  const today = new Date();
  generateCalendar(today.getFullYear(), today.getMonth() + 1);
}

orderInput.addEventListener('change', () => {
  const orderDate = new Date(orderInput.value);
  if (isNaN(orderDate)) {
    shipSpan.textContent = '-';
    deliverySpan.textContent = '-';
    generateCalendar(new Date().getFullYear(), new Date().getMonth() + 1);
    return;
  }
  const shipDate = addBusinessDays(orderDate, 1);
  const deliveryDate = addBusinessDays(shipDate, 1);
  shipSpan.textContent = format(shipDate);
  deliverySpan.textContent = format(deliveryDate);
  generateCalendar(orderDate.getFullYear(), orderDate.getMonth() + 1, shipDate, deliveryDate);
});

initCalendar();
