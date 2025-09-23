const STORAGE_KEY = 'truckReceptionAppointments';
const DOCKS = [
  { id: 'A1', label: 'A1 (冷蔵)' },
  { id: 'A2', label: 'A2 (冷蔵)' },
  { id: 'B1', label: 'B1 (常温)' },
  { id: 'B2', label: 'B2 (常温)' },
  { id: 'C1', label: 'C1 (積み込み)' }
];
const START_HOUR = 6;
const END_HOUR = 22;
const STATUS = {
  waiting: '待機中',
  arrived: '到着済み',
  completed: '完了'
};

let appointments = loadAppointments();
let selectedAppointmentId = null;

const form = document.getElementById('reservationForm');
const dockSelect = document.getElementById('dock');
const selectedDateInput = document.getElementById('selectedDate');
const todayBtn = document.getElementById('todayBtn');
const exportCsvBtn = document.getElementById('exportCsvBtn');
const scheduleGrid = document.getElementById('scheduleGrid');
const detailContainer = document.getElementById('details');
const detailTemplate = document.getElementById('detailTemplate');
const slotTemplate = document.getElementById('slotTemplate');
const dockStatsList = document.getElementById('dockStats');
const dockStatTemplate = document.getElementById('dockStatTemplate');
const snackbar = document.getElementById('snackbar');

init();

function init() {
  populateDockSelect();
  selectedDateInput.value = formatDate(new Date());
  syncFormDate();
  render();
  form.addEventListener('submit', handleSubmit);
  selectedDateInput.addEventListener('change', () => {
    selectedAppointmentId = null;
    syncFormDate();
    render();
  });
  todayBtn.addEventListener('click', () => {
    selectedDateInput.value = formatDate(new Date());
    selectedAppointmentId = null;
    syncFormDate();
    render();
  });
  if (exportCsvBtn) {
    exportCsvBtn.addEventListener('click', handleExportCsv);
  }
}

function populateDockSelect() {
  dockSelect.innerHTML = '';
  for (const dock of DOCKS) {
    const option = document.createElement('option');
    option.value = dock.id;
    option.textContent = dock.label;
    dockSelect.append(option);
  }
}

function loadAppointments() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return seedAppointments();
  }
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : seedAppointments();
  } catch (error) {
    console.warn('予約データの読み込みに失敗したため初期データを使用します。', error);
    return seedAppointments();
  }
}

function seedAppointments() {
  const today = formatDate(new Date());
  const tomorrow = formatDate(addDays(new Date(), 1));
  return [
    {
      id: generateId(),
      company: '北海フーズ',
      truckId: '札幌 400 あ 1234',
      driver: '佐藤',
      cargo: '食品',
      dock: 'A1',
      date: today,
      startTime: '09:00',
      endTime: '10:00',
      duration: 60,
      status: 'waiting',
      note: '冷凍食品の搬入'
    },
    {
      id: generateId(),
      company: '京浜ロジ',
      truckId: '川崎 88 か 9876',
      driver: '鈴木',
      cargo: '日用品',
      dock: 'B1',
      date: today,
      startTime: '13:30',
      endTime: '14:30',
      duration: 60,
      status: 'arrived',
      note: '紙製品を引き取り'
    },
    {
      id: generateId(),
      company: 'サンシャイン電機',
      truckId: '品川 300 い 5555',
      driver: '田中',
      cargo: '家電',
      dock: 'C1',
      date: tomorrow,
      startTime: '10:30',
      endTime: '12:00',
      duration: 90,
      status: 'waiting',
      note: '大型テレビ搬出'
    }
  ];
}

function saveAppointments() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appointments));
}

function handleSubmit(event) {
  event.preventDefault();
  const formData = new FormData(form);
  const date = formData.get('date');
  const time = formData.get('time');
  const duration = Number(formData.get('duration')) || 60;
  const start = parseDateTime(date, time);
  if (!date || !time || Number.isNaN(start.getTime())) {
    showSnackbar('受付日と開始時刻を正しく入力してください。');
    return;
  }
  if (!isWithinOperatingHours(start, duration)) {
    showSnackbar(`稼働時間は${String(START_HOUR).padStart(2, '0')}:00〜${String(END_HOUR).padStart(2, '0')}:00です。`);
    return;
  }
  const end = new Date(start.getTime() + duration * 60 * 1000);
  const dock = formData.get('dock');
  if (hasConflict(dock, start, end)) {
    showSnackbar('同じバースの同時間帯には既に予約があります。');
    return;
  }
  const appointment = {
    id: generateId(),
    company: formData.get('company')?.trim() || '未設定',
    truckId: formData.get('truckId')?.trim() || '不明',
    driver: formData.get('driver')?.trim() || '',
    cargo: formData.get('cargo') || 'その他',
    dock,
    date,
    startTime: formatTime(start),
    endTime: formatTime(end),
    duration,
    status: 'waiting',
    note: formData.get('note')?.trim() || ''
  };
  appointments.push(appointment);
  saveAppointments();
  showSnackbar('予約を登録しました。');
  selectedDateInput.value = date;
  form.reset();
  syncFormDate();
  selectedAppointmentId = appointment.id;
  render();
}

function hasConflict(dock, start, end, ignoreId = null) {
  return appointments.some((appt) => {
    if (appt.dock !== dock || appt.id === ignoreId) return false;
    const apptStart = parseDateTime(appt.date, appt.startTime);
    const apptEnd = parseDateTime(appt.date, appt.endTime);
    return rangesOverlap(start, end, apptStart, apptEnd);
  });
}

function rangesOverlap(startA, endA, startB, endB) {
  return startA < endB && startB < endA;
}

function parseDateTime(date, time) {
  return new Date(`${date}T${time}`);
}

function isWithinOperatingHours(start, duration) {
  const startMinutes = start.getHours() * 60 + start.getMinutes();
  const endMinutes = startMinutes + duration;
  return startMinutes >= START_HOUR * 60 && endMinutes <= END_HOUR * 60;
}

function render() {
  renderSchedule();
  renderDockStats();
  renderDetails(selectedAppointmentId ? findAppointment(selectedAppointmentId) : null);
}

function renderSchedule() {
  const date = selectedDateInput.value;
  const appointmentsForDay = appointments
    .filter((appt) => appt.date === date)
    .sort((a, b) => `${a.startTime}`.localeCompare(`${b.startTime}`));

  scheduleGrid.innerHTML = '';
  for (const dock of DOCKS) {
    const column = document.createElement('div');
    column.className = 'dock-column';

    const header = document.createElement('div');
    header.className = 'dock-header';
    header.textContent = `${dock.label}`;
    column.append(header);

    const body = document.createElement('div');
    body.className = 'dock-body';

    const items = appointmentsForDay.filter((appt) => appt.dock === dock.id);
    if (items.length === 0) {
      const placeholder = document.createElement('p');
      placeholder.className = 'empty-slot';
      placeholder.textContent = '予約なし';
      placeholder.style.margin = 'auto';
      placeholder.style.color = '#9ca3af';
      body.append(placeholder);
    } else {
      for (const appt of items) {
        const slotNode = slotTemplate.content.firstElementChild.cloneNode(true);
        slotNode.dataset.id = appt.id;
        slotNode.querySelector('.slot-time').textContent = `${appt.startTime} – ${appt.endTime}`;
        slotNode.querySelector('.slot-company').textContent = `${appt.company}`;
        slotNode.querySelector('.slot-status').textContent = STATUS[appt.status] || appt.status;
        slotNode.classList.add(mapStatusToClass(appt.status));
        if (appt.id === selectedAppointmentId) {
          slotNode.classList.add('active');
          slotNode.style.outline = '3px solid rgba(29, 111, 163, 0.35)';
        }
        slotNode.addEventListener('click', () => {
          selectedAppointmentId = appt.id;
          renderDetails(appt);
          highlightSelected(appt.id);
        });
        slotNode.addEventListener('keydown', (event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            slotNode.click();
          }
        });
        const wrapper = document.createElement('div');
        wrapper.className = 'time-slot';
        const label = document.createElement('div');
        label.className = 'time-label';
        label.textContent = `${appt.startTime} 開始 (${appt.duration}分)`;
        wrapper.append(label, slotNode);
        body.append(wrapper);
      }
    }

    column.append(body);
    scheduleGrid.append(column);
  }
}

function highlightSelected(id) {
  for (const slot of scheduleGrid.querySelectorAll('.slot')) {
    if (slot.dataset.id === id) {
      slot.style.outline = '3px solid rgba(29, 111, 163, 0.35)';
    } else {
      slot.style.outline = '';
    }
  }
}

function renderDetails(appointment) {
  detailContainer.innerHTML = '';
  if (!appointment) {
    detailContainer.classList.add('empty');
    detailContainer.textContent = 'スケジュール表の予約をクリックすると詳細が表示されます。';
    return;
  }
  detailContainer.classList.remove('empty');
  const node = detailTemplate.content.cloneNode(true);
  node.querySelector('[data-field="company"]').textContent = appointment.company;
  node.querySelector('[data-field="truckId"]').textContent = appointment.truckId;
  node.querySelector('[data-field="driver"]').textContent = appointment.driver || '-';
  node.querySelector('[data-field="cargo"]').textContent = appointment.cargo;
  node.querySelector('[data-field="dock"]').textContent = getDockLabel(appointment.dock);
  node.querySelector('[data-field="timeRange"]').textContent = `${appointment.date} ${appointment.startTime}〜${appointment.endTime}`;
  node.querySelector('[data-field="status"]').textContent = STATUS[appointment.status] || appointment.status;
  node.querySelector('[data-field="note"]').textContent = appointment.note || '-';
  const toggleBtn = node.querySelector('[data-action="toggle"]');
  const deleteBtn = node.querySelector('[data-action="delete"]');
  toggleBtn.addEventListener('click', () => {
    cycleStatus(appointment.id);
  });
  deleteBtn.addEventListener('click', () => {
    deleteAppointment(appointment.id);
  });
  detailContainer.append(node);
}

function renderDockStats() {
  const date = selectedDateInput.value;
  dockStatsList.innerHTML = '';
  for (const dock of DOCKS) {
    const appointmentsForDock = appointments.filter((appt) => appt.date === date && appt.dock === dock.id);
    const total = appointmentsForDock.length;
    const waiting = appointmentsForDock.filter((appt) => appt.status === 'waiting').length;
    const arrived = appointmentsForDock.filter((appt) => appt.status === 'arrived').length;
    const completed = appointmentsForDock.filter((appt) => appt.status === 'completed').length;
    const node = dockStatTemplate.content.firstElementChild.cloneNode(true);
    node.querySelector('.dock-label').textContent = dock.label;
    node.querySelector('.dock-count').textContent = `${total}件 (待機${waiting} / 到着${arrived} / 完了${completed})`;
    dockStatsList.append(node);
  }
}

function handleExportCsv() {
  const date = selectedDateInput.value;
  const appointmentsForDay = appointments
    .filter((appt) => appt.date === date)
    .sort((a, b) => `${a.startTime}`.localeCompare(`${b.startTime}`));

  if (appointmentsForDay.length === 0) {
    showSnackbar('出力対象の予約がありません。');
    return;
  }

  const header = [
    '受付日',
    '開始時刻',
    '終了時刻',
    '作業時間(分)',
    'バースID',
    'バース名称',
    '会社名',
    '車番',
    'ドライバー',
    '荷物種別',
    'ステータス',
    '備考'
  ];

  const rows = appointmentsForDay.map((appt) => [
    appt.date,
    appt.startTime,
    appt.endTime,
    appt.duration,
    appt.dock,
    getDockLabel(appt.dock),
    appt.company,
    appt.truckId,
    appt.driver || '',
    appt.cargo,
    STATUS[appt.status] || appt.status,
    appt.note || ''
  ]);

  const csvLines = [header, ...rows].map((row) => row.map(formatCsvValue).join(','));
  const csvContent = `\ufeff${csvLines.join('\r\n')}`;
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const fileDate = date.replace(/-/g, '');
  link.href = url;
  link.download = `truck_appointments_${fileDate}.csv`;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
  showSnackbar(`${date}の予約をCSVに出力しました。`);
}

function cycleStatus(id) {
  const appointment = findAppointment(id);
  if (!appointment) return;
  appointment.status = nextStatus(appointment.status);
  saveAppointments();
  showSnackbar(`ステータスを「${STATUS[appointment.status]}」に更新しました。`);
  render();
}

function deleteAppointment(id) {
  const appointment = findAppointment(id);
  if (!appointment) return;
  const ok = window.confirm(`「${appointment.company}」の予約を削除しますか？`);
  if (!ok) return;
  appointments = appointments.filter((appt) => appt.id !== id);
  saveAppointments();
  showSnackbar('予約を削除しました。');
  selectedAppointmentId = null;
  render();
}

function nextStatus(status) {
  switch (status) {
    case 'waiting':
      return 'arrived';
    case 'arrived':
      return 'completed';
    default:
      return 'waiting';
  }
}

function findAppointment(id) {
  return appointments.find((appt) => appt.id === id) || null;
}

function showSnackbar(message) {
  snackbar.textContent = message;
  snackbar.classList.add('show');
  setTimeout(() => snackbar.classList.remove('show'), 2800);
}

function mapStatusToClass(status) {
  switch (status) {
    case 'arrived':
      return 'arrived';
    case 'completed':
      return 'completed';
    default:
      return 'waiting';
  }
}

function formatCsvValue(value) {
  const stringValue = value ?? '';
  const normalized = String(stringValue).replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  if (/[",\n]/.test(normalized)) {
    return `"${normalized.replace(/"/g, '""')}"`;
  }
  return normalized;
}

function getDockLabel(dockId) {
  return DOCKS.find((dock) => dock.id === dockId)?.label || dockId;
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatTime(date) {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

function generateId() {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }
  return `appt-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function addDays(date, days) {
  const cloned = new Date(date.getTime());
  cloned.setDate(cloned.getDate() + days);
  return cloned;
}

function syncFormDate() {
  const dateField = document.getElementById('date');
  if (dateField) {
    dateField.value = selectedDateInput.value;
  }
}

window.addEventListener('storage', (event) => {
  if (event.key === STORAGE_KEY && event.newValue) {
    try {
      const updated = JSON.parse(event.newValue);
      if (Array.isArray(updated)) {
        appointments = updated;
        render();
      }
    } catch (error) {
      console.warn('他タブからの更新内容を読み込めませんでした', error);
    }
  }
});
