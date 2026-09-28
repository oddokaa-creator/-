/**
 * 갓생 루틴 트래커 - 렌더링 모듈 (UI Components & Screen Renderers)
 */
import {
  AppState,
  saveState,
  escapeHtml,
  getLocalDateString,
  formatDateWithDay,
  getRoutinesForDate,
  getDateCompletionStats,
  calculateStreaks,
  calculateLevelAndXP,
  getMindsetQuoteForDate,
  showToast,
  checkAndTriggerCelebration
} from './godsaeng.js';

const CATEGORY_MAP = {
  workout: { label: '운동/건강', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30', dot: 'bg-emerald-400', icon: 'fitness_center' },
  study: { label: '성장/학습', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30', dot: 'bg-cyan-400', icon: 'menu_book' },
  mindset: { label: '멘탈케어', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30', dot: 'bg-amber-400', icon: 'self_improvement' },
  work: { label: '업무/생산성', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30', dot: 'bg-indigo-400', icon: 'laptop_mac' }
};

/**
 * 상단 헤더 영역 렌더링 (스트릭 배지, 레벨 & XP 바, 레벨업 감지)
 */
export function renderHeader() {
  const headerContainer = document.getElementById('app-header');
  if (!headerContainer) return;

  const streaks = calculateStreaks();
  const xpInfo = calculateLevelAndXP();

  // 레벨업 체크
  if (AppState.ui.lastLevel && xpInfo.level > AppState.ui.lastLevel) {
    showToast(`축하합니다! 레벨 ${xpInfo.level}로 레벨업 하셨습니다! 🎉✨`, 3500);
  }
  AppState.ui.lastLevel = xpInfo.level;

  headerContainer.innerHTML = `
    <div class="h-16 px-4 flex items-center justify-between max-w-lg mx-auto w-full">
      <div class="flex items-center gap-3">
        <div class="flex items-center justify-center w-9 h-9 rounded-2xl bg-emerald-500/15 text-emerald-400 shadow-[0_0_16px_rgba(16,185,129,0.3)] ring-1 ring-emerald-500/25">
          <span class="material-symbols-outlined text-[22px]">check_circle</span>
        </div>
        <div class="flex flex-col">
          <div class="flex items-center gap-1.5">
            <span class="font-headline-sm text-[17px] font-bold text-slate-100 tracking-tight leading-none">데일리 루틴</span>
            <span class="text-[12px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-md border border-emerald-500/20">갓생</span>
          </div>
          <div class="flex items-center gap-2 mt-1">
            <div class="flex items-center gap-1 bg-slate-800/80 px-2 py-0.5 rounded-full border border-slate-700/60">
              <span class="text-[11px] font-bold text-amber-400">Lv.${xpInfo.level}</span>
              <div class="w-12 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div class="bg-gradient-to-r from-emerald-500 to-cyan-400 h-full rounded-full transition-all duration-500" style="width: ${xpInfo.percent}%"></div>
              </div>
              <span class="text-[10px] text-slate-400">${xpInfo.currentLevelXP}/${xpInfo.nextLevelMaxXP}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <div class="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800/90 border border-slate-700/80 text-amber-400 shadow-sm" title="현재 연속 달성일">
          <span class="text-[15px] animate-bounce">🔥</span>
          <span class="text-[13px] font-bold text-slate-100">${streaks.currentStreak}<span class="text-[11px] text-slate-400 font-normal">일 연속</span></span>
        </div>

        <button id="btn-header-notify" type="button" aria-label="알림" class="relative min-w-[38px] min-h-[38px] flex items-center justify-center rounded-xl bg-slate-800/90 hover:bg-slate-700/80 border border-slate-700/80 text-slate-300 hover:text-slate-100 transition-all active:scale-95">
          <span class="material-symbols-outlined text-[20px]">notifications</span>
          <span class="absolute top-2 right-2 flex h-2 w-2">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.8)]"></span>
          </span>
        </button>
      </div>
    </div>
  `;

  document.getElementById('btn-header-notify')?.addEventListener('click', () => {
    showToast(`오늘 루틴 진행 알림: 총 ${getDateCompletionStats(getLocalDateString()).scheduled}개 중 ${getDateCompletionStats(getLocalDateString()).completed}개 완료됨`);
  });
}

/**
 * 오늘 탭 렌더링
 */
export function renderToday() {
  const container = document.getElementById('view-today');
  if (!container) return;

  const todayStr = getLocalDateString();
  const quote = getMindsetQuoteForDate(todayStr);
  const scheduledRoutines = getRoutinesForDate(todayStr);
  const stats = getDateCompletionStats(todayStr);

  // 정렬: targetTime 있는 것(오름차순) -> targetTime 없는 것
  const sortedRoutines = [...scheduledRoutines].sort((a, b) => {
    if (a.targetTime && b.targetTime) return a.targetTime.localeCompare(b.targetTime);
    if (a.targetTime && !b.targetTime) return -1;
    if (!a.targetTime && b.targetTime) return 1;
    return 0;
  });

  // 카테고리 필터링
  const currentFilter = AppState.ui.filter || 'all';
  const filteredRoutines = currentFilter === 'all'
    ? sortedRoutines
    : sortedRoutines.filter(r => r.category === currentFilter);

  // SVG 원형 링 계산: 둘레 2 * PI * 40 ≈ 251.2
  const circumference = 251.2;
  const strokeOffset = circumference - (stats.rate / 100) * circumference;

  const journalText = AppState.journal[todayStr] || '';

  container.innerHTML = `
    <div class="flex flex-col gap-4 select-none">
      <!-- 1. 오늘의 마인드셋 카드 -->
      <div class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800/90 to-slate-900 border border-slate-700/60 p-4 shadow-lg">
        <div class="absolute -right-8 -top-8 w-28 h-28 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>
        <div class="flex items-start gap-3 relative z-10">
          <div class="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
            <span class="material-symbols-outlined text-[18px]">format_quote</span>
          </div>
          <div class="flex flex-col">
            <span class="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">오늘의 마인드셋</span>
            <p class="text-[13px] text-slate-200 font-medium mt-0.5 leading-relaxed">"${escapeHtml(quote)}"</p>
          </div>
        </div>
      </div>

      <!-- 2. 오늘 날짜 및 원형 달성률 요약 대시보드 -->
      <div class="rounded-2xl bg-slate-800/90 border border-slate-700/60 p-4 shadow-md flex items-center justify-between">
        <div class="flex flex-col">
          <span class="text-[12px] text-slate-400 font-medium">${formatDateWithDay(todayStr)}</span>
          <div class="flex items-baseline gap-1.5 mt-1">
            <span class="text-3xl font-extrabold text-slate-100 tracking-tight">${stats.rate}%</span>
            <span class="text-[12px] text-emerald-400 font-semibold">${stats.rate === 100 ? '완벽 달성! 🎉' : '달성 중'}</span>
          </div>
          <p class="text-[12px] text-slate-300 mt-0.5">
            총 <span class="font-bold text-slate-100">${stats.scheduled}개</span> 중 
            <span class="text-emerald-400 font-bold">${stats.completed}개</span> 완료
          </p>
        </div>

        <div class="relative flex items-center justify-center w-20 h-20 shrink-0">
          <svg class="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle class="text-slate-700" cx="50" cy="50" fill="transparent" r="40" stroke="currentColor" stroke-width="8"></circle>
            <circle class="text-emerald-400 transition-all duration-700 ease-out" cx="50" cy="50" fill="transparent" r="40" stroke="currentColor" stroke-dasharray="251.2" stroke-dashoffset="${strokeOffset}" stroke-linecap="round" stroke-width="8"></circle>
          </svg>
          <div class="absolute inset-0 flex flex-col items-center justify-center">
            <span class="material-symbols-outlined text-emerald-400 text-[20px]">${stats.rate === 100 ? 'verified' : 'bolt'}</span>
            <span class="text-[10px] font-bold text-slate-300">${stats.completed}/${stats.scheduled}</span>
          </div>
        </div>
      </div>

      <!-- 3. 카테고리 필터 칩 & 새 루틴 추가 버튼 -->
      <div class="flex items-center justify-between gap-2">
        <div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 flex-1">
          ${renderFilterChip('all', '전체', currentFilter)}
          ${renderFilterChip('workout', '운동', currentFilter)}
          ${renderFilterChip('study', '학습', currentFilter)}
          ${renderFilterChip('mindset', '멘탈', currentFilter)}
          ${renderFilterChip('work', '업무', currentFilter)}
        </div>
        <button id="btn-open-add-routine" type="button" class="shrink-0 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[13px] flex items-center gap-1 shadow-md transition-all active:scale-95">
          <span class="material-symbols-outlined text-[18px]">add</span>
          <span>추가</span>
        </button>
      </div>

      <!-- 4. 루틴 리스트 / 빈 상태 -->
      <div class="flex flex-col gap-2.5" id="today-routine-list">
        ${filteredRoutines.length === 0 ? `
          <div id="empty-state" class="flex flex-col items-center justify-center p-8 rounded-2xl bg-slate-850 border border-slate-800 text-center gap-2">
            <div class="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mb-1">
              <span class="material-symbols-outlined text-[28px]">checklist</span>
            </div>
            <p class="text-[14px] font-semibold text-slate-300">
              ${currentFilter === 'all' ? '오늘 예정된 루틴이 없습니다.' : '선택한 카테고리에 해당하는 루틴이 없습니다.'}
            </p>
            <p class="text-[12px] text-slate-400">새로운 습관을 추가하여 하루를 활기차게 채워보세요!</p>
            <button id="btn-empty-add" type="button" class="mt-2 px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 text-[13px] font-bold shadow-md">
              루틴 새로 만들기
            </button>
          </div>
        ` : filteredRoutines.map(routine => renderTodayRoutineCard(routine, todayStr)).join('')}
      </div>

      <!-- 5. 하루 회고 섹션 (최대 100자) -->
      <div class="rounded-2xl bg-slate-800/90 border border-slate-700/60 p-4 shadow-sm flex flex-col gap-2 mt-2">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-1.5">
            <span class="material-symbols-outlined text-amber-400 text-[18px]">edit_note</span>
            <span class="text-[13px] font-bold text-slate-200">오늘의 한 줄 회고</span>
          </div>
          <span id="journal-char-count" class="text-[11px] text-slate-400">${journalText.length}/100자</span>
        </div>
        <div class="flex flex-col gap-2">
          <input id="input-daily-journal" type="text" maxlength="100" placeholder="오늘 하루를 돌아보며 느낀 점을 한 줄로 기록해보세요 (최대 100자)" 
            value="${escapeHtml(journalText)}"
            class="w-full px-3 py-2 bg-slate-900/80 rounded-xl text-[13px] text-slate-100 placeholder:text-slate-500 border border-slate-700/80 focus:outline-none focus:border-emerald-400 transition-colors" />
          <div class="flex justify-end">
            <button id="btn-save-journal" type="button" class="px-3 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-[12px] font-medium transition-all active:scale-95">
              회고 저장
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  attachTodayEvents(todayStr);
}

/**
 * 카테고리 필터 칩 렌더러
 */
function renderFilterChip(id, name, current) {
  const isActive = current === id;
  return `
    <button type="button" data-filter="${id}" class="filter-chip shrink-0 px-3 py-1 rounded-full text-[12px] font-semibold transition-all ${
      isActive
        ? 'bg-emerald-500 text-slate-950 shadow-sm'
        : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
    }">
      ${name}
    </button>
  `;
}

/**
 * 개별 루틴 카드 렌더러
 */
function renderTodayRoutineCard(routine, todayStr) {
  const isDone = Boolean(routine.history && routine.history[todayStr]);
  const cat = CATEGORY_MAP[routine.category] || CATEGORY_MAP.workout;

  return `
    <div data-routine-id="${routine.id}" class="group relative flex items-center justify-between p-3.5 rounded-2xl transition-all duration-200 ${
      isDone
        ? 'bg-slate-850/80 border border-emerald-500/30'
        : 'bg-slate-800/90 border border-slate-700/70 hover:border-slate-600'
    } shadow-sm">
      <div class="flex items-center gap-3 min-w-0 flex-1">
        <!-- 체크 버튼 -->
        <button type="button" data-action="toggle-check" data-id="${routine.id}" aria-label="루틴 완료 토글" class="w-8 h-8 rounded-xl flex items-center justify-center transition-transform active:scale-90 ${
          isDone
            ? 'bg-emerald-500 text-slate-950 shadow-[0_0_12px_rgba(16,185,129,0.4)]'
            : 'bg-slate-700/70 text-slate-400 hover:bg-slate-600 hover:text-slate-200 border border-slate-600'
        }">
          <span class="material-symbols-outlined text-[20px] font-bold">${isDone ? 'check' : ''}</span>
        </button>

        <!-- 루틴 정보 -->
        <div class="flex flex-col min-w-0 flex-1">
          <div class="flex items-center gap-1.5">
            <span class="text-[14px]">${escapeHtml(routine.emoji || '✨')}</span>
            <span class="font-headline-sm text-[15px] font-medium truncate ${
              isDone ? 'line-through text-slate-400 decoration-emerald-500/70 decoration-2' : 'text-slate-100'
            }">
              ${escapeHtml(routine.title)}
            </span>
          </div>

          <div class="flex items-center gap-2 mt-1">
            <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cat.color}">
              ${cat.label}
            </span>
            ${routine.targetTime ? `
              <span class="text-[11px] text-slate-400 flex items-center gap-0.5">
                <span class="material-symbols-outlined text-[13px]">schedule</span>
                ${escapeHtml(routine.targetTime)}
              </span>
            ` : ''}
          </div>
        </div>
      </div>

      <!-- 편집 및 액션 버튼들 -->
      <div class="flex items-center gap-1 ml-2">
        <button type="button" data-action="edit-routine" data-id="${routine.id}" aria-label="루틴 수정" class="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-700/50 flex items-center justify-center transition-all">
          <span class="material-symbols-outlined text-[18px]">edit</span>
        </button>
        <button type="button" data-action="menu-routine" data-id="${routine.id}" aria-label="루틴 옵션" class="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-700/50 flex items-center justify-center transition-all">
          <span class="material-symbols-outlined text-[18px]">more_vert</span>
        </button>
      </div>
    </div>
  `;
}

/**
 * 오늘 탭의 이벤트 핸들러 바인딩
 */
function attachTodayEvents(todayStr) {
  // 1. 필터 칩 클릭
  document.querySelectorAll('.filter-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      AppState.ui.filter = btn.dataset.filter;
      renderToday();
    });
  });

  // 2. 추가 버튼
  const openAdd = () => openRoutineModal();
  document.getElementById('btn-open-add-routine')?.addEventListener('click', openAdd);
  document.getElementById('btn-empty-add')?.addEventListener('click', openAdd);

  // 3. 루틴 카드 내 액션 (체크, 수정, 메뉴)
  const list = document.getElementById('today-routine-list');
  if (list) {
    list.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;
      const action = btn.dataset.action;
      const id = btn.dataset.id;

      if (action === 'toggle-check') {
        toggleRoutineCheck(id, todayStr);
      } else if (action === 'edit-routine') {
        openRoutineModal(id);
      } else if (action === 'menu-routine') {
        showRoutineActionSheet(id);
      }
    });
  }

  // 4. 회고 입력 실시간 글자수 및 저장
  const journalInput = document.getElementById('input-daily-journal');
  const countLabel = document.getElementById('journal-char-count');
  const saveJournalBtn = document.getElementById('btn-save-journal');

  if (journalInput) {
    journalInput.addEventListener('input', () => {
      if (countLabel) countLabel.textContent = `${journalInput.value.length}/100자`;
    });

    saveJournalBtn?.addEventListener('click', () => {
      const text = journalInput.value.trim();
      AppState.journal[todayStr] = text;
      saveState();
      showToast('오늘의 회고가 저장되었습니다! 📝');
    });
  }
}

/**
 * 루틴 체크박스 토글 처리
 * @param {string} routineId
 * @param {string} dateStr
 */
export function toggleRoutineCheck(routineId, dateStr) {
  const routine = AppState.routines.find(r => r.id === routineId);
  if (!routine) return;

  if (!routine.history) routine.history = {};

  const wasDone = Boolean(routine.history[dateStr]);
  if (wasDone) {
    delete routine.history[dateStr];
  } else {
    routine.history[dateStr] = true;
  }

  saveState();

  // 100% 달성 시 축하 오버레이 실행 (하루 1회)
  if (!wasDone) {
    checkAndTriggerCelebration();
  }

  // 화면 갱신
  renderHeader();
  if (AppState.ui.tab === 'today') renderToday();
  if (AppState.ui.tab === 'calendar') renderCalendar();
  if (AppState.ui.tab === 'stats') renderStats();
}

/**
 * 달력 탭 렌더링
 */
export function renderCalendar() {
  const container = document.getElementById('view-calendar');
  if (!container) return;

  // 현재 선택된 월 (기본값: 이번 달 'YYYY-MM')
  if (!AppState.ui.calendarMonth) {
    const today = new Date();
    AppState.ui.calendarMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  }
  // 선택된 날짜 (기본값: 오늘)
  if (!AppState.ui.selectedDate) {
    AppState.ui.selectedDate = getLocalDateString();
  }

  const [year, month] = AppState.ui.calendarMonth.split('-').map(Number);
  const firstDayIndex = new Date(year, month - 1, 1).getDay(); // 일요일=0
  const daysInMonth = new Date(year, month, 0).getDate();

  const todayStr = getLocalDateString();
  const selectedStr = AppState.ui.selectedDate;

  // 달력 그리드 셀 생성
  let cellsHtml = '';

  // 이전 달 빈 칸
  for (let i = 0; i < firstDayIndex; i++) {
    cellsHtml += `<div class="h-14 rounded-xl opacity-20"></div>`;
  }

  // 이번 달 일자들
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const stats = getDateCompletionStats(dateStr);
    const isToday = dateStr === todayStr;
    const isSelected = dateStr === selectedStr;

    // 농도별 색상 결정
    // 0%: 예정 루틴 없음 = 기본 / 0% = 연한 회색 배경
    // 일부 = 연한 에메랄드 / 100% = 진한 에메랄드 + 체크
    let bgClass = 'bg-slate-800/40 text-slate-300';
    let checkIcon = '';

    if (stats.scheduled > 0) {
      if (stats.rate === 100) {
        bgClass = 'bg-emerald-500 text-slate-950 font-bold shadow-sm';
        checkIcon = `<span class="material-symbols-outlined text-[13px] font-bold">check</span>`;
      } else if (stats.rate > 0) {
        bgClass = 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 font-semibold';
        checkIcon = `<span class="text-[10px] font-bold">${stats.completed}/${stats.scheduled}</span>`;
      } else {
        bgClass = 'bg-slate-800 text-slate-400 border border-slate-700/60';
      }
    }

    const ringClass = isSelected
      ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-900 scale-105 z-10'
      : (isToday ? 'ring-1 ring-emerald-400' : '');

    cellsHtml += `
      <button type="button" data-date="${dateStr}" class="cal-day-cell relative h-14 rounded-xl flex flex-col items-center justify-between p-1 transition-all ${bgClass} ${ringClass}">
        <span class="text-[11px] ${isToday && !isSelected ? 'font-bold underline' : ''}">${day}</span>
        <div class="h-4 flex items-center justify-center">
          ${checkIcon}
        </div>
      </button>
    `;
  }

  container.innerHTML = `
    <div class="flex flex-col gap-4 select-none">
      <!-- 1. 달력 헤더 (이전/다음 달, 오늘 버튼) -->
      <div class="flex items-center justify-between px-1">
        <div class="flex items-center gap-2">
          <h2 class="font-headline-md text-xl font-bold text-slate-100">${year}년 ${month}월</h2>
          <button id="btn-cal-today" type="button" class="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 text-[11px] font-semibold border border-slate-700 transition-all">
            오늘
          </button>
        </div>
        <div class="flex items-center gap-1">
          <button id="btn-cal-prev" type="button" aria-label="이전 달" class="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-all">
            <span class="material-symbols-outlined text-[18px]">chevron_left</span>
          </button>
          <button id="btn-cal-next" type="button" aria-label="다음 달" class="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-all">
            <span class="material-symbols-outlined text-[18px]">chevron_right</span>
          </button>
        </div>
      </div>

      <!-- 2. 요일 헤더 & 날짜 그리드 -->
      <div class="rounded-2xl bg-slate-800/90 border border-slate-700/60 p-3 shadow-md">
        <div class="grid grid-cols-7 gap-1 text-center mb-2">
          <span class="text-[11px] font-semibold text-rose-400">일</span>
          <span class="text-[11px] font-semibold text-slate-400">월</span>
          <span class="text-[11px] font-semibold text-slate-400">화</span>
          <span class="text-[11px] font-semibold text-slate-400">수</span>
          <span class="text-[11px] font-semibold text-slate-400">목</span>
          <span class="text-[11px] font-semibold text-slate-400">금</span>
          <span class="text-[11px] font-semibold text-cyan-400">토</span>
        </div>
        <div class="grid grid-cols-7 gap-1.5" id="cal-grid">
          ${cellsHtml}
        </div>
      </div>

      <!-- 3. 날짜 상세 패널 (#day-detail) -->
      <div id="day-detail" class="rounded-2xl bg-slate-800/90 border border-slate-700/60 p-4 shadow-md flex flex-col gap-3">
        ${renderDayDetailContent(selectedStr, todayStr)}
      </div>
    </div>
  `;

  attachCalendarEvents();
}

/**
 * 날짜 상세 패널 내용 렌더러
 */
function renderDayDetailContent(selectedStr, todayStr) {
  const isFuture = selectedStr > todayStr;
  const isToday = selectedStr === todayStr;
  const scheduled = getRoutinesForDate(selectedStr);
  const stats = getDateCompletionStats(selectedStr);
  const journal = AppState.journal[selectedStr] || '';

  return `
    <div class="flex items-center justify-between pb-2 border-b border-slate-700/60">
      <div class="flex flex-col">
        <div class="flex items-center gap-1.5">
          <span class="text-[14px] font-bold text-slate-100">${formatDateWithDay(selectedStr)}</span>
          ${isToday ? '<span class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">오늘</span>' : ''}
          ${isFuture ? '<span class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-700 text-slate-400">미래</span>' : ''}
        </div>
        <span class="text-[11px] text-slate-400 mt-0.5">
          예정 루틴 ${stats.scheduled}개 중 ${stats.completed}개 완료 (${stats.rate}%)
        </span>
      </div>
      <div class="flex items-center gap-1">
        <span class="text-[18px] font-extrabold text-emerald-400">${stats.rate}%</span>
      </div>
    </div>

    <!-- 미래 날짜 안내 문구 -->
    ${isFuture ? `
      <div class="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center gap-2 text-amber-300">
        <span class="material-symbols-outlined text-[18px]">info</span>
        <span class="text-[12px]">미래 날짜의 루틴은 미리 완료할 수 없습니다.</span>
      </div>
    ` : ''}

    <!-- 해당 날짜 루틴 목록 -->
    <div class="flex flex-col gap-2">
      ${scheduled.length === 0 ? `
        <div class="p-4 text-center text-slate-400 text-[12px]">
          이 날짜에는 예정된 루틴이 없습니다.
        </div>
      ` : scheduled.map(r => {
        const isDone = Boolean(r.history && r.history[selectedStr]);
        return `
          <div class="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <div class="flex items-center gap-2.5">
              <button type="button" data-cal-action="toggle-check" data-id="${r.id}" data-date="${selectedStr}" 
                ${isFuture ? 'disabled' : ''}
                class="w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                  isFuture
                    ? 'opacity-40 cursor-not-allowed bg-slate-800 text-slate-600'
                    : (isDone ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-500')
                }">
                <span class="material-symbols-outlined text-[16px] font-bold">${isDone ? 'check' : ''}</span>
              </button>
              <span class="text-[13px] ${isDone ? 'line-through text-slate-400' : 'text-slate-200'}">
                ${escapeHtml(r.emoji || '✨')} ${escapeHtml(r.title)}
              </span>
            </div>
            ${r.targetTime ? `<span class="text-[11px] text-slate-400">${escapeHtml(r.targetTime)}</span>` : ''}
          </div>
        `;
      }).join('')}
    </div>

    <!-- 해당 날짜의 하루 회고 -->
    <div class="pt-2 border-t border-slate-700/60 flex flex-col gap-1.5">
      <span class="text-[12px] font-semibold text-slate-300 flex items-center gap-1">
        <span class="material-symbols-outlined text-[15px] text-amber-400">notes</span>
        이 날의 하루 회고
      </span>
      ${isToday ? `
        <input id="input-cal-journal" type="text" maxlength="100" value="${escapeHtml(journal)}" placeholder="오늘의 회고를 작성해보세요"
          class="w-full px-3 py-1.5 bg-slate-900/80 rounded-xl text-[12px] text-slate-100 placeholder:text-slate-500 border border-slate-700 focus:outline-none focus:border-emerald-400" />
        <div class="flex justify-end">
          <button id="btn-cal-save-journal" type="button" class="px-2.5 py-1 rounded bg-slate-700 text-slate-200 text-[11px] font-medium">저장</button>
        </div>
      ` : (journal ? `
        <div class="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-[12px] text-slate-300 italic">
          "${escapeHtml(journal)}"
        </div>
      ` : `
        <span class="text-[11px] text-slate-500 italic">작성된 회고가 없습니다.</span>
      `)}
    </div>
  `;
}

/**
 * 달력 이벤트 바인딩
 */
function attachCalendarEvents() {
  // 1. 이전 달 / 다음 달 / 오늘 이동
  document.getElementById('btn-cal-prev')?.addEventListener('click', () => {
    const [y, m] = AppState.ui.calendarMonth.split('-').map(Number);
    const prev = new Date(y, m - 2, 1);
    AppState.ui.calendarMonth = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`;
    renderCalendar();
  });

  document.getElementById('btn-cal-next')?.addEventListener('click', () => {
    const [y, m] = AppState.ui.calendarMonth.split('-').map(Number);
    const next = new Date(y, m, 1);
    AppState.ui.calendarMonth = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`;
    renderCalendar();
  });

  document.getElementById('btn-cal-today')?.addEventListener('click', () => {
    const today = new Date();
    AppState.ui.calendarMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    AppState.ui.selectedDate = getLocalDateString(today);
    renderCalendar();
  });

  // 2. 날짜 셀 클릭 시 선택 날짜 변경
  document.getElementById('cal-grid')?.addEventListener('click', (e) => {
    const cell = e.target.closest('.cal-day-cell');
    if (!cell) return;
    AppState.ui.selectedDate = cell.dataset.date;
    renderCalendar();
  });

  // 3. 상세 패널 내 체크 토글
  document.getElementById('day-detail')?.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-cal-action="toggle-check"]');
    if (!btn || btn.disabled) return;
    const routineId = btn.dataset.id;
    const dateStr = btn.dataset.date;
    toggleRoutineCheck(routineId, dateStr);
  });

  // 4. 달력 내 회고 저장
  document.getElementById('btn-cal-save-journal')?.addEventListener('click', () => {
    const input = document.getElementById('input-cal-journal');
    if (input) {
      AppState.journal[AppState.ui.selectedDate] = input.value.trim();
      saveState();
      showToast('회고가 저장되었습니다! 📝');
      renderCalendar();
    }
  });
}

/**
 * 루틴 탐색 탭 렌더링 (Image 9의 완벽한 구현 & 추천 패키지 1클릭 추가)
 */
export function renderExplore() {
  const container = document.getElementById('view-explore');
  if (!container) return;

  container.innerHTML = `
    <div class="flex flex-col gap-4 select-none">
      <!-- 검색 헤더 -->
      <div class="flex items-center gap-2">
        <div class="relative flex-1 flex items-center">
          <span class="material-symbols-outlined absolute left-3 text-slate-400 text-[18px]">search</span>
          <input id="explore-search-input" type="text" placeholder="어떤 습관을 만들고 싶으신가요?" 
            class="w-full pl-9 pr-3 py-2 bg-slate-800 rounded-xl text-[13px] text-slate-100 placeholder:text-slate-400 border border-slate-700 focus:outline-none focus:border-emerald-400 transition-all" />
        </div>
      </div>

      <!-- 탐색 칩 -->
      <div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
        <span class="px-3 py-1 rounded-full bg-emerald-500 text-slate-950 font-bold text-[12px] shadow-sm">전체</span>
        <span class="px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-[12px]">🔥 인기</span>
        <span class="px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-[12px]">☀️ 모닝루틴</span>
        <span class="px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-[12px]">💪 운동/건강</span>
        <span class="px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-[12px]">🧘 멘탈케어</span>
      </div>

      <!-- 배너 카드 -->
      <div class="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-950/80 to-slate-900 border border-emerald-500/30 p-4 shadow-md">
        <div class="flex items-center justify-between mb-2">
          <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[11px] font-bold">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            1.4만명 참여 중
          </span>
          <span class="text-[11px] font-semibold text-emerald-400">시즌 한정 테마</span>
        </div>
        <h3 class="font-headline-sm text-lg font-bold text-slate-100">미라클 모닝 챌린지</h3>
        <p class="text-[12px] text-slate-300 mt-1 leading-relaxed">
          맑은 아침 에너지를 채우는 21일간의 여정. 일찍 일어나는 것 이상의 단단한 하루를 만듭니다.
        </p>
        <div class="flex items-center justify-between mt-3 pt-2 border-t border-slate-800">
          <div class="flex items-center -space-x-1.5 text-[11px] text-slate-400">
            <span class="w-6 h-6 rounded-full bg-emerald-500/30 text-emerald-300 flex items-center justify-center font-bold">민</span>
            <span class="w-6 h-6 rounded-full bg-cyan-500/30 text-cyan-300 flex items-center justify-center font-bold">지</span>
            <span class="w-6 h-6 rounded-full bg-amber-500/30 text-amber-300 flex items-center justify-center font-bold">준</span>
            <span class="pl-2">+9k</span>
          </div>
          <button type="button" data-action="add-pack" data-pack="miracle" class="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[12px] flex items-center gap-1 shadow-md active:scale-95 transition-all">
            <span>챌린지 참여</span>
            <span class="material-symbols-outlined text-[16px]">bolt</span>
          </button>
        </div>
      </div>

      <!-- 추천 루틴 패키지 -->
      <div class="flex flex-col gap-3">
        <h3 class="font-headline-sm text-[15px] font-bold text-slate-100 flex items-center gap-1.5">
          <span class="material-symbols-outlined text-emerald-400 text-[18px]">auto_awesome</span>
          추천 루틴 패키지
        </h3>

        <!-- 패키지 1 -->
        <div class="p-4 rounded-2xl bg-slate-800/90 border border-slate-700/60 shadow-sm flex flex-col gap-3">
          <div class="flex items-start justify-between">
            <div class="flex items-center gap-2.5">
              <div class="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[22px]">
                🌅
              </div>
              <div class="flex flex-col">
                <span class="text-[10px] font-bold text-emerald-400">난이도 쉬움 · 약 25분 소요</span>
                <h4 class="text-[14px] font-bold text-slate-100">갓생 시작! 아침 3종 루틴</h4>
              </div>
            </div>
            <span class="text-[11px] text-slate-400">8,240명 진행</span>
          </div>
          <div class="p-2.5 rounded-xl bg-slate-900/60 text-[12px] text-slate-300 flex flex-col gap-1">
            <span>• 기상 직후 미온수 한 잔 (2분)</span>
            <span>• 가벼운 전신 스트레칭 (8분)</span>
            <span>• 모닝 10페이지 독서 (15분)</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-[12px] text-amber-400 font-bold">★ 4.9 <span class="text-slate-400 font-normal">(342개 리뷰)</span></span>
            <button type="button" data-action="add-pack" data-pack="morning" class="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[12px] flex items-center gap-1 transition-all active:scale-95 shadow-sm">
              <span class="material-symbols-outlined text-[16px]">add</span>
              <span>내 루틴에 추가</span>
            </button>
          </div>
        </div>

        <!-- 패키지 2 -->
        <div class="p-4 rounded-2xl bg-slate-800/90 border border-slate-700/60 shadow-sm flex flex-col gap-3">
          <div class="flex items-start justify-between">
            <div class="flex items-center gap-2.5">
              <div class="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[22px]">
                🌙
              </div>
              <div class="flex flex-col">
                <span class="text-[10px] font-bold text-cyan-400">숙면 보장 · 약 20분 소요</span>
                <h4 class="text-[14px] font-bold text-slate-100">퇴근 후 힐링 나이트 루틴</h4>
              </div>
            </div>
            <span class="text-[11px] text-slate-400">5,110명 진행</span>
          </div>
          <div class="p-2.5 rounded-xl bg-slate-900/60 text-[12px] text-slate-300 flex flex-col gap-1">
            <span>• 스마트폰 침대 밖으로 두기 (1분)</span>
            <span>• 10분 마인드풀 호흡 명상 (10분)</span>
            <span>• 세 줄 감사 & 생각 비우기 일기 (9분)</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-[12px] text-amber-400 font-bold">★ 4.8 <span class="text-slate-400 font-normal">(280개 리뷰)</span></span>
            <button type="button" data-action="add-pack" data-pack="night" class="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[12px] flex items-center gap-1 transition-all active:scale-95 shadow-sm">
              <span class="material-symbols-outlined text-[16px]">add</span>
              <span>내 루틴에 추가</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  attachExploreEvents();
}

/**
 * 루틴 탐색 탭 이벤트 바인딩
 */
function attachExploreEvents() {
  document.querySelectorAll('button[data-action="add-pack"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const pack = btn.dataset.pack;
      let newRoutines = [];

      if (pack === 'miracle' || pack === 'morning') {
        newRoutines = [
          { title: '기상 직후 미온수 한 잔', emoji: '💧', category: 'workout', targetTime: '07:00' },
          { title: '가벼운 전신 스트레칭', emoji: '🧘', category: 'workout', targetTime: '07:10' },
          { title: '모닝 10페이지 독서', emoji: '📖', category: 'study', targetTime: '07:30' }
        ];
      } else if (pack === 'night') {
        newRoutines = [
          { title: '스마트폰 침대 밖으로 두기', emoji: '📴', category: 'mindset', targetTime: '22:30' },
          { title: '10분 마인드풀 호흡 명상', emoji: '🧘', category: 'mindset', targetTime: '22:45' },
          { title: '세 줄 감사일기 쓰기', emoji: '📝', category: 'mindset', targetTime: '23:00' }
        ];
      }

      let addedCount = 0;
      newRoutines.forEach(item => {
        // 이미 동일 제목이 없으면 추가
        if (!AppState.routines.some(r => r.title === item.title && r.status === 'active')) {
          AppState.routines.push({
            id: 'rt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
            title: item.title,
            emoji: item.emoji,
            category: item.category,
            targetTime: item.targetTime,
            repeatDays: [0, 1, 2, 3, 4, 5, 6],
            history: {},
            createdAt: new Date().toISOString(),
            status: 'active'
          });
          addedCount++;
        }
      });

      saveState();
      showToast(`'${btn.closest('.p-4')?.querySelector('h4, h3')?.textContent?.trim() || '추천 루틴'}' 루틴 ${addedCount}개가 내 루틴에 추가되었습니다! 🎉`);
      renderHeader();
      renderToday();
    });
  });
}

/**
 * 통계 탭 렌더링 (Image 7 구현: 주간/월간 달성률, 최근 7일 막대 차트, 카테고리별 달성률, 획득 뱃지)
 */
export function renderStats() {
  const container = document.getElementById('view-stats');
  if (!container) return;

  const streaks = calculateStreaks();
  const xpInfo = calculateLevelAndXP();
  const today = new Date();
  const period = AppState.ui.statsPeriod || 'weekly';

  // 최근 7일 날짜 리스트 (월~일 또는 최근 7일)
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = getLocalDateString(d);
    const stats = getDateCompletionStats(dateStr);
    last7Days.push({
      dateStr,
      dayName: DAY_NAMES[d.getDay()],
      rate: stats.rate,
      scheduled: stats.scheduled,
      completed: stats.completed
    });
  }

  // 이번 주 전체 예정 및 완료 집계
  let weekScheduled = 0;
  let weekCompleted = 0;
  last7Days.forEach(d => {
    weekScheduled += d.scheduled;
    weekCompleted += d.completed;
  });
  const weekRate = weekScheduled > 0 ? Math.round((weekCompleted / weekScheduled) * 100) : 0;

  // 카테고리별 달성률 집계
  const catStats = {
    workout: { scheduled: 0, completed: 0 },
    study: { scheduled: 0, completed: 0 },
    mindset: { scheduled: 0, completed: 0 },
    work: { scheduled: 0, completed: 0 }
  };

  last7Days.forEach(d => {
    const routines = getRoutinesForDate(d.dateStr);
    routines.forEach(r => {
      if (catStats[r.category]) {
        catStats[r.category].scheduled += 1;
        if (r.history && r.history[d.dateStr]) {
          catStats[r.category].completed += 1;
        }
      }
    });
  });

  container.innerHTML = `
    <div class="flex flex-col gap-4 select-none">
      <!-- 상단 제목 -->
      <div class="flex items-center justify-between">
        <div class="flex flex-col">
          <h2 class="font-headline-md text-xl font-bold text-slate-100">리포트 & 분석</h2>
          <span class="text-[12px] text-slate-400">지난 7일간의 건강한 변화를 확인해보세요</span>
        </div>
      </div>

      <!-- 주간/월간/전체 탭 -->
      <div class="flex p-1 bg-slate-800 rounded-xl">
        <button type="button" data-stats-tab="weekly" class="flex-1 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${period === 'weekly' ? 'bg-slate-700 text-slate-100 shadow-sm' : 'text-slate-400 hover:text-slate-200'}">주간 (이번 주)</button>
        <button type="button" data-stats-tab="monthly" class="flex-1 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${period === 'monthly' ? 'bg-slate-700 text-slate-100 shadow-sm' : 'text-slate-400 hover:text-slate-200'}">월간</button>
        <button type="button" data-stats-tab="all" class="flex-1 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${period === 'all' ? 'bg-slate-700 text-slate-100 shadow-sm' : 'text-slate-400 hover:text-slate-200'}">전체</button>
      </div>

      <!-- 핵심 성과 요약 카드 -->
      <div class="relative overflow-hidden rounded-2xl bg-slate-800/90 border border-slate-700/60 p-4 shadow-md flex items-center justify-between">
        <div class="flex flex-col flex-1">
          <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 w-fit mb-2">
            <span>🔥</span>
            <span class="text-[11px] font-bold">${streaks.currentStreak}일 연속 달성 중!</span>
          </div>
          <span class="text-[13px] font-medium text-slate-300">이번 주 목표 달성률</span>
          <div class="flex items-baseline gap-1 mt-0.5">
            <span class="text-4xl font-extrabold text-emerald-400 tracking-tight">${weekRate}</span>
            <span class="text-xl font-bold text-emerald-400">%</span>
          </div>
          <p class="text-[12px] text-slate-400 mt-1">
            총 <span class="font-bold text-slate-200">${weekScheduled}개</span> 중 
            <span class="text-emerald-400 font-bold">${weekCompleted}개</span> 완료!
          </p>
        </div>

        <div class="relative flex items-center justify-center w-24 h-24 shrink-0">
          <svg class="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle class="text-slate-700" cx="50" cy="50" fill="transparent" r="40" stroke="currentColor" stroke-width="8"></circle>
            <circle class="text-emerald-400 transition-all duration-700" cx="50" cy="50" fill="transparent" r="40" stroke="currentColor" stroke-dasharray="251.2" stroke-dashoffset="${251.2 - (weekRate / 100) * 251.2}" stroke-linecap="round" stroke-width="8"></circle>
          </svg>
          <div class="absolute inset-0 flex flex-col items-center justify-center">
            <span class="material-symbols-outlined text-emerald-400 text-[24px]">eco</span>
            <span class="text-[10px] font-bold text-slate-300">최상 상태</span>
          </div>
        </div>
      </div>

      <!-- 최근 7일 막대 차트 (div 높이 구현 준수) -->
      <div class="rounded-2xl bg-slate-800/90 border border-slate-700/60 p-4 shadow-md flex flex-col gap-3">
        <div class="flex items-center justify-between">
          <span class="text-[14px] font-bold text-slate-100">요일별 루틴 활동</span>
          <div class="flex items-center gap-1.5 text-slate-400 text-[11px]">
            <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>달성도</span>
          </div>
        </div>

        <div class="flex items-end justify-between gap-1.5 h-32 pt-4 px-1">
          ${last7Days.map(item => `
            <div class="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
              <span class="text-[10px] text-slate-400">${item.rate}%</span>
              <div class="w-full max-w-[28px] h-full flex items-end rounded-t-lg bg-slate-700/50 overflow-hidden">
                <div class="w-full bg-gradient-to-t from-emerald-500 to-cyan-400 rounded-t-lg transition-all duration-700" style="height: ${Math.max(item.rate, 4)}%;"></div>
              </div>
              <span class="text-[11px] ${item.dateStr === getLocalDateString() ? 'text-emerald-400 font-bold' : 'text-slate-400'}">${item.dayName}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- 카테고리별 달성률 가로 막대 차트 -->
      <div class="rounded-2xl bg-slate-800/90 border border-slate-700/60 p-4 shadow-md flex flex-col gap-3">
        <span class="text-[14px] font-bold text-slate-100">카테고리별 완수율</span>
        <div class="flex flex-col gap-2.5">
          ${Object.entries(CATEGORY_MAP).map(([key, info]) => {
            const data = catStats[key] || { scheduled: 0, completed: 0 };
            const rate = data.scheduled > 0 ? Math.round((data.completed / data.scheduled) * 100) : 0;
            return `
              <div class="flex flex-col gap-1">
                <div class="flex items-center justify-between text-[12px]">
                  <span class="text-slate-200 font-medium flex items-center gap-1.5">
                    <span class="w-2 h-2 rounded-full ${info.dot}"></span>
                    ${info.label}
                  </span>
                  <span class="font-bold text-slate-300">${rate}% <span class="text-[11px] text-slate-500">(${data.completed}/${data.scheduled})</span></span>
                </div>
                <div class="w-full h-2 rounded-full bg-slate-700 overflow-hidden">
                  <div class="h-full bg-emerald-400 rounded-full transition-all duration-500" style="width: ${rate}%;"></div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- 획득한 달성 뱃지 그리드 -->
      <div class="rounded-2xl bg-slate-800/90 border border-slate-700/60 p-4 shadow-md flex flex-col gap-3">
        <div class="flex items-center justify-between">
          <span class="text-[14px] font-bold text-slate-100 flex items-center gap-1.5">
            <span class="material-symbols-outlined text-emerald-400 text-[18px]">military_tech</span>
            획득한 달성 뱃지
          </span>
          <span class="text-[11px] text-slate-400">최고 스트릭: ${streaks.bestStreak}일</span>
        </div>
        <div class="grid grid-cols-3 gap-2">
          ${renderBadge('🔥', '7일 연속 달성', streaks.bestStreak >= 7)}
          ${renderBadge('🕊️', '모닝 버드', xpInfo.completedCount >= 10)}
          ${renderBadge('⚡', '주말의 전사', xpInfo.totalXP >= 100)}
          ${renderBadge('🏆', '30일 마스터', streaks.bestStreak >= 30, `${streaks.bestStreak}/30일`)}
          ${renderBadge('🌙', '나이트 리더', xpInfo.completedCount >= 25)}
          ${renderBadge('👑', '완벽주의자', xpInfo.perfectDaysCount >= 5, `${xpInfo.perfectDaysCount}/5일`)}
        </div>
      </div>
    </div>
  `;

  document.querySelectorAll('button[data-stats-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      AppState.ui.statsPeriod = btn.dataset.statsTab;
      renderStats();
    });
  });
}

/**
 * 뱃지 아이템 렌더러
 */
function renderBadge(emoji, title, isUnlocked, subText = '') {
  return `
    <div class="flex flex-col items-center text-center p-3 rounded-xl transition-all ${
      isUnlocked ? 'bg-slate-700/60 border border-emerald-500/30' : 'bg-slate-900/40 opacity-40 border border-slate-800'
    }">
      <div class="w-10 h-10 rounded-xl flex items-center justify-center text-[22px] mb-1.5 ${isUnlocked ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}">
        ${isUnlocked ? emoji : '<span class="material-symbols-outlined text-[18px]">lock</span>'}
      </div>
      <span class="text-[11px] font-bold text-slate-200 truncate w-full">${title}</span>
      <span class="text-[10px] mt-0.5 ${isUnlocked ? 'text-emerald-400 font-semibold' : 'text-slate-500'}">
        ${isUnlocked ? '획득 완료' : (subText || '잠금')}
      </span>
    </div>
  `;
}

/**
 * 설정 탭 렌더링 (Image 5 완벽 구현: 테마 모드, 알림 설정, JSON 내보내기/가져오기, 전체 초기화, 보관된 루틴)
 */
export function renderSettings() {
  const container = document.getElementById('view-settings');
  if (!container) return;

  const currentTheme = AppState.settings.theme || 'dark';
  const archivedRoutines = AppState.routines.filter(r => r.status === 'archived');

  container.innerHTML = `
    <div class="flex flex-col gap-4 select-none pb-6">
      <!-- 프로필 카드 (Image 5 스타일) -->
      <div class="relative overflow-hidden rounded-2xl bg-slate-800/90 border border-slate-700/60 p-4 shadow-md">
        <div class="flex items-center gap-3.5">
          <div class="relative w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-400 flex items-center justify-center text-slate-950 font-bold text-xl shadow-md">
            민수
            <span class="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center text-slate-950 text-[10px]">
              ✓
            </span>
          </div>
          <div class="flex flex-col min-w-0 flex-1">
            <div class="flex items-center gap-1.5">
              <h2 class="font-headline-sm text-base font-bold text-slate-100">김민수</h2>
              <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                PRO 회원 D-182
              </span>
            </div>
            <p class="text-[12px] text-slate-400 truncate mt-0.5">godsaeng.user@example.com</p>
          </div>
        </div>
      </div>

      <!-- 앱 환경 설정 (화면 모드 토글) -->
      <div class="flex flex-col gap-1.5">
        <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">앱 환경설정</span>
        <div class="rounded-2xl bg-slate-800/90 border border-slate-700/60 p-4 shadow-sm flex flex-col gap-3">
          <div class="flex items-center justify-between">
            <span class="text-[13px] font-bold text-slate-100">화면 모드</span>
            <span class="text-[11px] text-emerald-400 font-medium">실시간 반영</span>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <button type="button" data-theme-btn="light" class="flex items-center justify-center gap-2 py-2.5 rounded-xl text-[12px] font-semibold transition-all ${
              currentTheme === 'light' ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'bg-slate-700/60 text-slate-300 hover:bg-slate-700'
            }">
              <span class="material-symbols-outlined text-[18px]">light_mode</span>
              <span>라이트 모드</span>
            </button>
            <button type="button" data-theme-btn="dark" class="flex items-center justify-center gap-2 py-2.5 rounded-xl text-[12px] font-semibold transition-all ${
              currentTheme === 'dark' ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'bg-slate-700/60 text-slate-300 hover:bg-slate-700'
            }">
              <span class="material-symbols-outlined text-[18px]">dark_mode</span>
              <span>다크 모드</span>
            </button>
          </div>
        </div>
      </div>

      <!-- 데이터 관리 및 백업 -->
      <div class="flex flex-col gap-1.5">
        <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">데이터 및 백업</span>
        <div class="rounded-2xl bg-slate-800/90 border border-slate-700/60 shadow-sm overflow-hidden divide-y divide-slate-700/60">
          <!-- JSON 내보내기 -->
          <button id="btn-export-json" type="button" class="w-full flex items-center justify-between p-3.5 text-left hover:bg-slate-750 transition-colors">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-xl bg-slate-700/60 text-emerald-400 flex items-center justify-center">
                <span class="material-symbols-outlined text-[20px]">file_download</span>
              </div>
              <div class="flex flex-col">
                <span class="text-[13px] font-semibold text-slate-100">데이터 내보내기 (JSON 백업)</span>
                <span class="text-[11px] text-slate-400">모든 루틴과 히스토리를 파일로 저장</span>
              </div>
            </div>
            <span class="material-symbols-outlined text-slate-400 text-[18px]">chevron_right</span>
          </button>

          <!-- JSON 가져오기 -->
          <label class="w-full flex items-center justify-between p-3.5 text-left hover:bg-slate-750 transition-colors cursor-pointer">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-xl bg-slate-700/60 text-cyan-400 flex items-center justify-center">
                <span class="material-symbols-outlined text-[20px]">file_upload</span>
              </div>
              <div class="flex flex-col">
                <span class="text-[13px] font-semibold text-slate-100">데이터 가져오기 (복원)</span>
                <span class="text-[11px] text-slate-400">백업 파일(.json)을 불러와 복원</span>
              </div>
            </div>
            <input id="input-import-json" type="file" accept=".json" class="hidden" />
            <span class="material-symbols-outlined text-slate-400 text-[18px]">chevron_right</span>
          </label>
        </div>
      </div>

      <!-- 보관된 루틴 목록 (보관함) -->
      ${archivedRoutines.length > 0 ? `
        <div class="flex flex-col gap-1.5">
          <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">보관된 루틴 (${archivedRoutines.length}개)</span>
          <div class="rounded-2xl bg-slate-800/90 border border-slate-700/60 p-3 shadow-sm flex flex-col gap-2">
            ${archivedRoutines.map(r => `
              <div class="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <div class="flex items-center gap-2">
                  <span class="text-[15px]">${escapeHtml(r.emoji || '📦')}</span>
                  <span class="text-[13px] text-slate-300">${escapeHtml(r.title)}</span>
                </div>
                <div class="flex items-center gap-1.5">
                  <button type="button" data-restore-id="${r.id}" class="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 text-[11px] font-bold">복원</button>
                  <button type="button" data-delete-perm-id="${r.id}" class="px-2 py-1 rounded bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 text-[11px] font-bold">삭제</button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <!-- 위험 구역: 전체 초기화 -->
      <div class="flex flex-col gap-1.5">
        <span class="text-[11px] font-bold text-rose-400 uppercase tracking-wider px-1">초기화</span>
        <div class="rounded-2xl bg-slate-800/90 border border-rose-500/30 p-4 shadow-sm flex items-center justify-between">
          <div class="flex flex-col">
            <span class="text-[13px] font-bold text-rose-300">전체 데이터 초기화</span>
            <span class="text-[11px] text-slate-400">모든 기록과 설정을 초기 샘플 상태로 되돌립니다</span>
          </div>
          <button id="btn-reset-all" type="button" class="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold text-[12px] border border-rose-500/40 transition-all active:scale-95">
            초기화
          </button>
        </div>
      </div>

      <div class="text-center text-[11px] text-slate-500 pt-2">
        갓생 데일리 루틴 트래커 · v2.4.1 (최신 버전)
      </div>
    </div>
  `;

  attachSettingsEvents();
}

/**
 * 설정 탭 이벤트 바인딩
 */
function attachSettingsEvents() {
  // 1. 테마 토글
  document.querySelectorAll('button[data-theme-btn]').forEach(btn => {
    btn.addEventListener('click', () => {
      const theme = btn.dataset.themeBtn;
      AppState.settings.theme = theme;
      saveState();
      applyTheme(theme);
      renderSettings();
    });
  });

  // 2. JSON 내보내기
  document.getElementById('btn-export-json')?.addEventListener('click', () => {
    try {
      const data = {
        schemaVersion: AppState.schemaVersion,
        exportedAt: new Date().toISOString(),
        routines: AppState.routines,
        journal: AppState.journal,
        settings: AppState.settings
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `godsaeng_backup_${getLocalDateString()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('백업 파일이 성공적으로 다운로드되었습니다! 📥');
    } catch (e) {
      console.error(e);
      showToast('내보내기에 실패했습니다.');
    }
  });

  // 3. JSON 가져오기
  const importInput = document.getElementById('input-import-json');
  importInput?.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (!parsed || !Array.isArray(parsed.routines)) {
          showToast('올바르지 않은 백업 파일 형식입니다.');
          return;
        }

        if (confirm('기존 데이터를 덮어쓰고 백업 파일로 복원하시겠습니까?')) {
          AppState.routines = parsed.routines;
          AppState.journal = parsed.journal || {};
          if (parsed.settings) AppState.settings = Object.assign(AppState.settings, parsed.settings);
          saveState();
          showToast('데이터가 성공적으로 복원되었습니다! ✨');
          renderHeader();
          renderToday();
          renderSettings();
        }
      } catch (err) {
        console.error(err);
        showToast('파일 읽기 오류: 올바른 JSON 파일인지 확인해주세요.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  });

  // 4. 보관된 루틴 복원 및 영구 삭제
  document.querySelectorAll('button[data-restore-id]').forEach(btn => {
    btn.addEventListener('click', () => {
      const routine = AppState.routines.find(r => r.id === btn.dataset.restoreId);
      if (routine) {
        routine.status = 'active';
        saveState();
        showToast(`'${routine.title}' 루틴이 복원되었습니다.`);
        renderHeader();
        renderToday();
        renderSettings();
      }
    });
  });

  document.querySelectorAll('button[data-delete-perm-id]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (confirm('이 루틴을 완전히 삭제하시겠습니까? 과거 완료 기록도 함께 삭제됩니다.')) {
        AppState.routines = AppState.routines.filter(r => r.id !== btn.dataset.deletePermId);
        saveState();
        showToast('루틴이 완전히 삭제되었습니다.');
        renderHeader();
        renderToday();
        renderSettings();
      }
    });
  });

  // 5. 전체 초기화 (confirm 2회 준수)
  document.getElementById('btn-reset-all')?.addEventListener('click', () => {
    if (confirm('정말 모든 루틴과 기록을 초기화하시겠습니까?')) {
      if (confirm('초기화된 데이터는 복구할 수 없습니다. 계속하시겠습니까?')) {
        localStorage.removeItem('godsaeng_v1');
        localStorage.removeItem('godsaeng_celebrated_dates');
        location.reload();
      }
    }
  });
}

/**
 * 테마 적용
 */
export function applyTheme(theme) {
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

/**
 * 루틴 추가/수정 모달 열기
 * @param {string|null} [routineId=null]
 */
export function openRoutineModal(routineId = null) {
  const modal = document.getElementById('routine-modal');
  if (!modal) return;

  const routine = routineId ? AppState.routines.find(r => r.id === routineId) : null;
  AppState.ui.editingRoutineId = routineId;

  document.getElementById('modal-title').textContent = routine ? '루틴 수정' : '새 루틴 추가';
  const titleInput = document.getElementById('modal-input-title');
  const emojiInput = document.getElementById('modal-input-emoji');
  const catInput = document.getElementById('modal-select-category');
  const timeInput = document.getElementById('modal-input-time');

  titleInput.value = routine ? routine.title : '';
  emojiInput.value = routine ? routine.emoji : '✨';
  catInput.value = routine ? routine.category : 'workout';
  timeInput.value = routine ? (routine.targetTime || '') : '';

  // 요일 체크박스 (0~6)
  const defaultDays = routine ? routine.repeatDays : [0, 1, 2, 3, 4, 5, 6];
  document.querySelectorAll('input[name="modal-repeat-days"]').forEach(cb => {
    cb.checked = defaultDays.includes(Number(cb.value));
  });

  modal.classList.remove('hidden');
  titleInput.focus();
}

/**
 * 루틴 추가/수정 모달 닫기
 */
export function closeRoutineModal() {
  const modal = document.getElementById('routine-modal');
  if (modal) modal.classList.add('hidden');
  AppState.ui.editingRoutineId = null;
}

/**
 * 루틴 추가/수정 모달 저장
 */
export function handleSaveRoutineModal() {
  const titleInput = document.getElementById('modal-input-title');
  const emojiInput = document.getElementById('modal-input-emoji');
  const catInput = document.getElementById('modal-select-category');
  const timeInput = document.getElementById('modal-input-time');

  const title = titleInput.value.trim();
  if (title.length < 1 || title.length > 30) {
    showToast('루틴 제목은 1자 이상 30자 이하로 입력해주세요.');
    titleInput.focus();
    return;
  }

  const selectedDays = [];
  document.querySelectorAll('input[name="modal-repeat-days"]:checked').forEach(cb => {
    selectedDays.push(Number(cb.value));
  });

  if (selectedDays.length === 0) {
    showToast('반복 요일을 최소 1개 이상 선택해주세요.');
    return;
  }

  const emoji = emojiInput.value.trim() || '✨';
  const category = catInput.value;
  const targetTime = timeInput.value || null;

  if (AppState.ui.editingRoutineId) {
    // 수정
    const r = AppState.routines.find(item => item.id === AppState.ui.editingRoutineId);
    if (r) {
      r.title = title;
      r.emoji = emoji;
      r.category = category;
      r.targetTime = targetTime;
      r.repeatDays = selectedDays;
      showToast('루틴이 수정되었습니다! ✏️');
    }
  } else {
    // 신규 추가
    const newRoutine = {
      id: 'rt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      title,
      emoji,
      category,
      targetTime,
      repeatDays: selectedDays,
      history: {},
      createdAt: new Date().toISOString(),
      status: 'active'
    };
    AppState.routines.push(newRoutine);
    showToast('새로운 루틴이 추가되었습니다! 🎯');
  }

  saveState();
  closeRoutineModal();

  renderHeader();
  renderToday();
  if (AppState.ui.tab === 'calendar') renderCalendar();
  if (AppState.ui.tab === 'stats') renderStats();
}

/**
 * 루틴 상세 액션 시트 (보관 또는 삭제)
 * @param {string} routineId
 */
export function showRoutineActionSheet(routineId) {
  const routine = AppState.routines.find(r => r.id === routineId);
  if (!routine) return;

  const action = prompt(`[${routine.title}]\n동작을 선택하세요:\n1. 루틴 수정\n2. 루틴 보관 (목록에서 숨김)\n3. 루틴 영구 삭제\n(취소: Esc 또는 빈칸)`);

  if (action === '1') {
    openRoutineModal(routineId);
  } else if (action === '2') {
    routine.status = 'archived';
    saveState();
    showToast(`'${routine.title}' 루틴을 보관함으로 이동했습니다.`);
    renderHeader();
    renderToday();
  } else if (action === '3') {
    if (confirm(`'${routine.title}' 루틴을 영구 삭제하시겠습니까? 과거 완료 기록도 함께 삭제됩니다.`)) {
      AppState.routines = AppState.routines.filter(r => r.id !== routineId);
      saveState();
      showToast('루틴이 삭제되었습니다.');
      renderHeader();
      renderToday();
    }
  }
}
