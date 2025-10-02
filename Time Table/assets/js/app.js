// ===== Animated Galaxy + Fireflies + Interactions =====

// Utilities
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

// Galaxy
(function galaxy(){
  const c = document.getElementById('galaxy');
  const ctx = c.getContext('2d');
  let w, h, cx, cy, t = 0, req;
  const DPR = Math.min(window.devicePixelRatio || 1, 2);

  function resize(){
    w = c.width = innerWidth * DPR;
    h = c.height = innerHeight * DPR;
    c.style.width = innerWidth + 'px';
    c.style.height = innerHeight + 'px';
    cx = w/2; cy = h/2;
  }
  resize(); addEventListener('resize', resize);

  function draw(){
    t += 0.0025;
    ctx.clearRect(0,0,w,h);

    // Nebula gradient
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w,h)*0.7);
    g.addColorStop(0, 'rgba(0,255,238,0.08)');
    g.addColorStop(0.5,'rgba(138,43,226,0.08)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(0,0,w,h);

    // Rotating stars
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(t);
    for(let i=0;i<240;i++){
      const r = Math.sqrt(i) * 22.0;
      const a = i * 0.21 + t*2;
      const x = Math.cos(a)*r;
      const y = Math.sin(a)*r;
      const s = (i%12===0)? 2.2 : 1.1;
      ctx.fillStyle = (i%7===0)? 'rgba(255,255,255,0.9)' : 'rgba(180,255,255,0.55)';
      ctx.beginPath(); ctx.arc(x,y,s,0,Math.PI*2); ctx.fill();
    }
    ctx.restore();

    req = requestAnimationFrame(draw);
  }
  draw();
})();

// Fireflies
(function fireflies(){
  const c = document.getElementById('fireflies');
  const ctx = c.getContext('2d');
  let w, h, DPR = Math.min(devicePixelRatio||1, 2);
  let bugs = [];
  const COUNT = 40;

  function resize(){
    w = c.width = innerWidth * DPR;
    h = c.height = innerHeight * DPR;
    c.style.width = innerWidth + 'px';
    c.style.height = innerHeight + 'px';
  }
  resize(); addEventListener('resize', resize);

  function resetBug(b){
    b.x = Math.random()*w;
    b.y = Math.random()*h;
    b.vx = (Math.random()-.5)*0.6;
    b.vy = (Math.random()-.5)*0.6;
    b.a = Math.random()*Math.PI*2;
    b.size = 1 + Math.random()*2.2;
    b.alpha = .2 + Math.random()*.8;
  }

  for(let i=0;i<COUNT;i++){ bugs[i] = {}; resetBug(bugs[i]); }

  function draw(){
    ctx.clearRect(0,0,w,h);
    for(const b of bugs){
      b.x += b.vx + Math.cos(b.a)*0.2;
      b.y += b.vy + Math.sin(b.a)*0.2;
      b.a += (Math.random()-.5)*0.2;

      if(b.x<0||b.x>w||b.y<0||b.y>h) resetBug(b);

      const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, 18);
      g.addColorStop(0,'rgba(255,255,200,'+b.alpha+')');
      g.addColorStop(0.5,'rgba(0,255,238,'+ (b.alpha*0.6) +')');
      g.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(b.x, b.y, b.size*18, 0, Math.PI*2); ctx.fill();
    }
    requestAnimationFrame(draw);
  }
  draw();
})();

// Ripple effect on cell click
document.addEventListener('click', (e)=>{
  const cell = e.target.closest('td');
  if(!cell) return;
  const r = document.createElement('span');
  r.className = 'ripple';
  const rect = cell.getBoundingClientRect();
  r.style.left = (e.clientX - rect.left) + 'px';
  r.style.top  = (e.clientY - rect.top)  + 'px';
  cell.appendChild(r);
  setTimeout(()=> r.remove(), 800);
});

// Toggles
const fantasyToggle  = document.getElementById('fantasyToggle');
const particlesToggle = document.getElementById('particlesToggle');
const reduceMotion = document.getElementById('reduceMotion');
const backgroundToggle = document.getElementById('backgroundToggle');
const calendarToggle = document.getElementById('calendarToggle');

fantasyToggle.addEventListener('click', ()=>{
  document.body.classList.toggle('fantasy');
});

particlesToggle.addEventListener('click', ()=>{
  const ff = document.getElementById('fireflies');
  ff.style.display = (ff.style.display==='none') ? 'block' : 'none';
});

backgroundToggle.addEventListener('click', ()=>{
  document.body.classList.toggle('new-bg');
});

reduceMotion.addEventListener('change', (e)=>{
  const on = e.target.checked;
  document.documentElement.style.setProperty('scroll-behavior', on ? 'auto' : 'smooth');
  document.querySelectorAll('.frame-glow').forEach(el=> el.style.animationDuration = on ? '0s' : '');
  document.querySelectorAll('tbody tr').forEach(el=>{
    el.style.animation = on ? 'none' : '';
    el.style.opacity = on ? 1 : '';
    el.style.transform = on ? 'none' : '';
  });
});

// ===== Popup Logic =====
const modal = document.getElementById('dayPopup');
const popupTitle = document.getElementById('popupTitle');
const popupTable = document.getElementById('popupTable');
const closeBtn = modal?.querySelector('.close');

// Attach click handlers to day headers
document.querySelectorAll('#mainTable thead th[data-day]').forEach((th)=>{
  th.style.cursor = 'pointer';
  th.addEventListener('click', ()=>{
    const day = th.getAttribute('data-day') || th.textContent.trim();
    popupTitle.textContent = day + ' – Timetable';

    // Find the exact column index of the clicked header (including Period col at 0)
    const headerCells = Array.from(th.parentElement.children);
    const colIndex = headerCells.indexOf(th); // e.g., Period=0, Monday=1, ...

        // Build popup rows (merge consecutive periods with same subject)
    const items = [];
    document.querySelectorAll('#mainTable tbody tr').forEach(tr=>{
      if(tr.classList.contains('interval')) return;
      const cells = tr.querySelectorAll('td');
      const periodText = cells[0]?.textContent?.trim() || '';
      const periodNum = parseInt(periodText, 10);
      const subject = (cells[colIndex]?.textContent || '').trim();
      items.push({ periodText, periodNum, subject });
    });
    
    // Group consecutive identical subjects
    const groups = [];
    let run = null;
    for(const it of items){
      if(!run){
        run = { subject: it.subject, periods: [it.periodText], nums: [it.periodNum] };
        continue;
      }
      const lastNum = run.nums[run.nums.length-1];
      if(it.subject === run.subject && !isNaN(it.periodNum) && !isNaN(lastNum) && it.periodNum === lastNum + 1){
        run.periods.push(it.periodText);
        run.nums.push(it.periodNum);
      }else{
        groups.push(run);
        run = { subject: it.subject, periods: [it.periodText], nums: [it.periodNum] };
      }
    }
    if(run) groups.push(run);
    
    // Build table rows
    let rows = '';
    for(const g of groups){
      const label = g.periods.length > 1 ? g.periods.join('&') : g.periods[0];
      const cls = g.periods.length > 1 ? 'double-period' : '';
      rows += `<tr class="${cls}"><td><span class="merged-badge">${label}</span></td><td class="popup-subject"><span class="merged-badge">${g.subject}</span></td></tr>`;
    }
    popupTable.innerHTML = rows;

    // Attach new hover listener to the popup table
    document.querySelectorAll('#popupTable .popup-subject').forEach(sub => {
      sub.addEventListener('mouseenter', e => {
        const subject = e.target.innerText.trim();
        const periodsInRow = sub.closest('tr').classList.contains('double-period') ? 2 : 1;
        const text = getSinhalaSubjectText(subject, periodsInRow);

        const popup = document.createElement('div');
        popup.className = 'popup popup-hover';
        popup.innerText = text;

        // Position the popup correctly inside the modal
        const subRect = e.target.getBoundingClientRect();
        const modalContentRect = modal.querySelector('.modal-content').getBoundingClientRect();
        
        popup.style.left = (subRect.left - modalContentRect.left) + 'px';
        popup.style.top = (subRect.bottom - modalContentRect.top) + 'px';

        modal.querySelector('.modal-content').appendChild(popup);

        e.target.addEventListener('mouseleave', () => popup.remove(), {once:true});
      });
    });

    modal.style.display='flex';
  });
});

// Close handlers
closeBtn?.addEventListener('click', ()=> modal.style.display='none');
modal?.addEventListener('click', (e)=>{ if(e.target===modal) modal.style.display='none'; });


// ===== Sinhala Subject Logic =====
function getSinhalaSubjectText(subject, periodsInRow){
  if(subject === "සිංහල" && periodsInRow >= 2){
    return "සිංහල සාහිත්‍ය හා රසස්වාදය";
  } else if(subject === "සිංහල") {
    return "සිංහල භාශාව හා අක්ශර වින්‍යාසය";
  }
  return subject;
}


// ===== New Calendar Functionality =====
const calendarModal = document.getElementById('calendarModal');
const closeCalendarBtn = calendarModal.querySelector('.close-calendar');
const currentMonthYear = document.getElementById('currentMonthYear');
const calendarBody = document.getElementById('calendarBody');
const prevMonthBtn = document.getElementById('prevMonth');
const nextMonthBtn = document.getElementById('nextMonth');
const sidePanel = document.getElementById('sidePanel');
const panelDateEl = document.getElementById('panelDate');
const scheduleContent = document.getElementById('scheduleContent');
const noteInput = document.getElementById('noteInput');
const saveNoteBtn = document.getElementById('saveNoteBtn');
const noteStatusEl = document.getElementById('noteStatus');

// NEW reminder modal elements
const reminderModal = document.getElementById('reminderModal');
const reminderNoteEl = document.getElementById('reminderNote');
const closeReminderBtn = document.getElementById('closeReminderBtn');

let date = new Date();
let currentYear = date.getFullYear();
let currentMonth = date.getMonth();
let selectedDayDiv = null;

let touchStartX = 0;
let touchEndX = 0;
const minSwipeDistance = 50;

const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const dayMap = {
  "Sunday": [],
  "Monday": [{ time: '8:00 PM', subject: 'IT Class' }],
  "Tuesday": [],
  "Wednesday": [],
  "Thursday": [],
  "Friday": [],
  "Saturday": [{ time: '3:00 PM', subject: 'English Class' }]
};

function renderCalendar() {
    calendarBody.innerHTML = '';

    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const today = new Date();

    currentMonthYear.textContent = `${months[currentMonth]} ${currentYear}`;

    for (let i = 0; i < firstDayOfMonth; i++) {
        const emptyDiv = document.createElement('div');
        calendarBody.appendChild(emptyDiv);
    }

    for (let i = 1; i <= daysInMonth; i++) {
        const dayDiv = document.createElement('div');
        dayDiv.classList.add('calendar-day');
        dayDiv.textContent = i;
        dayDiv.dataset.date = `${currentYear}-${currentMonth + 1}-${i}`;

        // Highlight today's date
        if (i === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear()) {
            dayDiv.classList.add('current-day');
        }

        // Check for special events
        const dayOfWeek = new Date(currentYear, currentMonth, i).getDay();
        const classes = dayMap[dayNames[dayOfWeek]];
        if (classes.length > 0) {
            dayDiv.classList.add('special-event');
        }

        // Check for notes
        const note = localStorage.getItem(`note-${dayDiv.dataset.date}`);
        if (note) {
            dayDiv.classList.add('has-note');
        }
        
        dayDiv.addEventListener('click', () => {
          if (selectedDayDiv) {
            selectedDayDiv.classList.remove('selected-day');
          }
          dayDiv.classList.add('selected-day');
          selectedDayDiv = dayDiv;
          showDayDetails(dayDiv.dataset.date);
        });

        calendarBody.appendChild(dayDiv);
    }
}

function showDayDetails(dateStr) {
    sidePanel.style.display = 'block';

    scheduleContent.innerHTML = '';
    const dateObj = new Date(dateStr);
    const dayName = dayNames[dateObj.getDay()];
    panelDateEl.textContent = `${dayName}, ${dateStr}`;

    // --- Show Class Schedule ---
    const classes = dayMap[dayName];
    if (classes.length === 0) {
        scheduleContent.innerHTML = '<p>No classes scheduled.</p>';
    } else {
        classes.forEach(cls => {
            const classId = `${dateStr}-${cls.subject.replace(/\s/g, '-')}`;
            const attendance = localStorage.getItem(classId);

            const itemDiv = document.createElement('div');
            itemDiv.className = 'schedule-item';
            if (attendance === 'attended') {
                itemDiv.classList.add('attended');
            } else if (attendance === 'missed') {
                itemDiv.classList.add('missed');
            }

            itemDiv.innerHTML = `
                <span>${cls.time}: ${cls.subject}</span>
                <div class="attendance-buttons">
                    <button class="attendance-button attended-icon" data-status="attended" data-id="${classId}">✔️</button>
                    <button class="attendance-button missed-icon" data-status="missed" data-id="${classId}">❌</button>
                </div>
            `;
            scheduleContent.appendChild(itemDiv);
        });
    }

    // --- Show Notes ---
    const note = localStorage.getItem(`note-${dateStr}`) || '';
    noteInput.value = note;
    noteStatusEl.textContent = '';
    
    // Add event listeners for attendance buttons
    document.querySelectorAll('.attendance-button').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const classId = e.target.dataset.id;
            const status = e.target.dataset.status;
            localStorage.setItem(classId, status);
            updateAttendanceUI(e.target.closest('.schedule-item'), status);
        });
    });
}

function updateAttendanceUI(itemEl, status) {
    itemEl.classList.remove('attended', 'missed');
    if (status === 'attended') {
        itemEl.classList.add('attended');
    } else if (status === 'missed') {
        itemEl.classList.add('missed');
    }
}

// Button listeners
calendarToggle.addEventListener('click', () => {
    calendarModal.style.display = 'flex';
    sidePanel.style.display = 'none'; // Hide the side panel initially
    renderCalendar();
});

closeCalendarBtn.addEventListener('click', () => {
    calendarModal.style.display = 'none';
    selectedDayDiv?.classList.remove('selected-day');
    selectedDayDiv = null;
    sidePanel.style.display = 'none';
});

// NEW reminder modal close handler
closeReminderBtn.addEventListener('click', () => {
    reminderModal.style.display = 'none';
});

prevMonthBtn.addEventListener('click', () => {
    currentMonth--;
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }
    renderCalendar();
    sidePanel.style.display = 'none'; // Hide the side panel when changing months
});

nextMonthBtn.addEventListener('click', () => {
    currentMonth++;
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    renderCalendar();
    sidePanel.style.display = 'none'; // Hide the side panel when changing months
});

saveNoteBtn.addEventListener('click', () => {
    const selectedDate = panelDateEl.textContent.split(', ')[1];
    const note = noteInput.value.trim();
    if (note) {
        localStorage.setItem(`note-${selectedDate}`, note);
        noteStatusEl.textContent = 'Note saved!';
    } else {
        localStorage.removeItem(`note-${selectedDate}`);
        noteStatusEl.textContent = 'Note removed!';
    }
    renderCalendar(); // Re-render to show/hide note indicator
});

// Swipe functionality
calendarModal.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
});

calendarModal.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipeGesture();
});

function handleSwipeGesture() {
    if (touchEndX < touchStartX - minSwipeDistance) {
        // Swiped left
        nextMonthBtn.click();
    } else if (touchEndX > touchStartX + minSwipeDistance) {
        // Swiped right
        prevMonthBtn.click();
    }
}


// ===== New Function to check for today's note and show reminder =====
function showTodayReminder() {
  const today = new Date();
  const todayDateStr = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
  const todayNote = localStorage.getItem(`note-${todayDateStr}`);

  if (todayNote) {
    reminderNoteEl.textContent = todayNote;
    reminderModal.style.display = 'flex';
  }
}

// Call the function on page load
document.addEventListener('DOMContentLoaded', showTodayReminder);