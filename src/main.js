/**
 * 갓생 루틴 트래커 - 애플리케이션 진입점 및 탭 관리자
 */
import {
  AppState,
  loadState,
  getLocalDateString
} from './godsaeng.js';

import {
  renderHeader,
  renderToday,
  renderCalendar,
  renderExplore,
  renderStats,
  renderSettings,
  applyTheme,
  closeRoutineModal,
  handleSaveRoutineModal
} from './render.js';

let currentDateStr = getLocalDateString();

/**
 * 탭 전환 함수
 * @param {string} tabId 'today' | 'calendar' | 'explore' | 'stats' | 'settings'
 */
export function switchTab(tabId) {
  AppState.ui.tab = tabId;

  // 1. 모든 view-* 숨기기
  const views = ['today', 'calendar', 'explore', 'stats', 'settings'];
  views.forEach(v => {
    const el = document.getElementById(`view-${v}`);
    if (el) {
      if (v === tabId) {
        el.classList.remove('hidden');
      } else {
        el.classList.add('hidden');
      }
    }
  });

  // 2. 하단 네비게이션 활성 상태 표시 (사용자 제공 디자인 일치)
  document.querySelectorAll('nav a[data-path]').forEach(link => {
    const path = link.dataset.path;
    const isTarget = (path === tabId) || (path === 'explore-routines' && tabId === 'explore') || (path === 'analytics' && tabId === 'stats');
    const iconDiv = link.querySelector('div');

    if (isTarget) {
      link.classList.add('text-emerald-400');
      link.classList.remove('text-slate-400');
      if (iconDiv) {
        iconDiv.className = 'w-9 h-7 rounded-2xl flex items-center justify-center transition-all bg-emerald-500/15 text-emerald-400 shadow-[0_0_14px_rgba(16,185,129,0.35)] ring-1 ring-emerald-500/30';
      }
    } else {
      link.classList.remove('text-emerald-400');
      link.classList.add('text-slate-400');
      if (iconDiv) {
        iconDiv.className = 'w-9 h-7 rounded-2xl flex items-center justify-center transition-all';
      }
    }
  });

  // 3. 해당 탭 화면 렌더링
  if (tabId === 'today') renderToday();
  else if (tabId === 'calendar') renderCalendar();
  else if (tabId === 'explore') renderExplore();
  else if (tabId === 'stats') renderStats();
  else if (tabId === 'settings') renderSettings();

  window.scrollTo({ top: 0, behavior: 'instant' });
}

/**
 * 자정(날짜 변경) 감지: 1분마다 검사하여 날짜가 바뀌면 화면 자동 갱신
 */
function checkMidnightChange() {
  const nowStr = getLocalDateString();
  if (nowStr !== currentDateStr) {
    currentDateStr = nowStr;
    renderHeader();
    if (AppState.ui.tab === 'today') renderToday();
    if (AppState.ui.tab === 'calendar') renderCalendar();
    if (AppState.ui.tab === 'stats') renderStats();
  }
}

/**
 * 모달 및 네비게이션 전역 이벤트 등록
 */
function initGlobalListeners() {
  // 하단 네비게이션 클릭
  document.querySelectorAll('nav a[data-path]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const rawPath = link.dataset.path;
      let targetTab = rawPath;
      if (rawPath === 'explore-routines') targetTab = 'explore';
      if (rawPath === 'analytics') targetTab = 'stats';
      switchTab(targetTab);
    });
  });

  // 루틴 모달 버튼들
  document.getElementById('modal-btn-cancel')?.addEventListener('click', closeRoutineModal);
  document.getElementById('modal-btn-close')?.addEventListener('click', closeRoutineModal);
  document.getElementById('modal-btn-save')?.addEventListener('click', handleSaveRoutineModal);

  // 모달 배경 클릭 시 닫기
  const modal = document.getElementById('routine-modal');
  modal?.addEventListener('click', (e) => {
    if (e.target === modal) closeRoutineModal();
  });

  // ESC 키로 모달 닫기
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeRoutineModal();
  });
}

/**
 * 앱 초기화
 */
function initApp() {
  loadState();
  applyTheme(AppState.settings.theme || 'dark');

  initGlobalListeners();

  // 초기 로딩 시 스켈레톤 잠깐 표시 (부드러운 UX)
  const skeleton = document.getElementById('loading-skeleton');
  const mainContent = document.getElementById('main-content');

  setTimeout(() => {
    if (skeleton) skeleton.classList.add('hidden');
    if (mainContent) mainContent.classList.remove('hidden');

    renderHeader();
    switchTab(AppState.ui.tab || 'today');
  }, 180);

  // 1분마다 자정 검사
  setInterval(checkMidnightChange, 60000);
}

// DOM 준비 완료 시 구동
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
