/**
 * 갓생 루틴 트래커 (Godsaeng Daily Routine Tracker)
 * 중앙 집중식 상태 관리 및 DOM 렌더링 엔진
 */
import { MINDSET_QUOTES } from './quotes.js';

const STORAGE_KEY = 'godsaeng_v1';
const BACKUP_KEY = 'godsaeng_v1_backup';
const CELEBRATION_KEY = 'godsaeng_celebrated_dates';

/**
 * 전역 상태 객체
 */
export const AppState = {
  schemaVersion: 1,
  routines: [],
  journal: {},
  settings: {
    theme: 'dark', // default dark as per UI design
    notifications: true,
    reminderTime: '아침 07:00 · 저녁 22:00',
    sound: true
  },
  ui: {
    tab: 'today',
    filter: 'all',
    calendarMonth: '', // 'YYYY-MM'
    selectedDate: '', // 'YYYY-MM-DD'
    editingRoutineId: null,
    statsPeriod: 'weekly', // 'weekly' | 'monthly' | 'all'
    lastLevel: 1
  }
};

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];

/**
 * XSS 공격 방지를 위한 문자열 이스케이프 처리
 * @param {string} str
 * @returns {string}
 */
export function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * 로컬 시간 기준 날짜를 'YYYY-MM-DD' 형식의 문자열로 변환 (toISOString 사용 금지 준수)
 * @param {Date} [date=new Date()]
 * @returns {string}
 */
export function getLocalDateString(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * 날짜 문자열('YYYY-MM-DD')을 'YYYY-MM-DD (요일)' 형식으로 반환
 * @param {string} dateStr
 * @returns {string}
 */
export function formatDateWithDay(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const dayName = DAY_NAMES[date.getDay()];
  return `${dateStr} (${dayName})`;
}

/**
 * 날짜에 맞는 요일 인덱스(0~6, 0=일요일) 반환
 * @param {string} dateStr
 * @returns {number}
 */
export function getDayOfWeek(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).getDay();
}

/**
 * 날짜에 고정된 마인드셋 문구 반환 (해시 기반)
 * @param {string} dateStr
 * @returns {string}
 */
export function getMindsetQuoteForDate(dateStr) {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash * 31 + dateStr.charCodeAt(i)) & 0xffffffff;
  }
  const index = Math.abs(hash) % MINDSET_QUOTES.length;
  return MINDSET_QUOTES[index];
}

/**
 * 초기 기본 샘플 루틴 생성 (새로운 사용자용)
 * @returns {Array<object>}
 */
export function getDefaultRoutines() {
  const today = getLocalDateString();
  const nowIso = new Date().toISOString();
  
  // 최근 5일간의 히스토리를 일부 생성하여 첫 화면에서도 스트릭과 통계가 살아있게 함
  const getPastDate = (daysAgo) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return getLocalDateString(d);
  };

  return [
    {
      id: 'rt_sample_1',
      title: '기상 직후 미온수 한 잔',
      emoji: '💧',
      category: 'workout',
      targetTime: '07:00',
      repeatDays: [0, 1, 2, 3, 4, 5, 6],
      history: {
        [getPastDate(3)]: true,
        [getPastDate(2)]: true,
        [getPastDate(1)]: true
      },
      createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
      status: 'active'
    },
    {
      id: 'rt_sample_2',
      title: '가벼운 전신 스트레칭 10분',
      emoji: '🧘',
      category: 'workout',
      targetTime: '07:15',
      repeatDays: [0, 1, 2, 3, 4, 5, 6],
      history: {
        [getPastDate(3)]: true,
        [getPastDate(2)]: true,
        [getPastDate(1)]: true
      },
      createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
      status: 'active'
    },
    {
      id: 'rt_sample_3',
      title: '모닝 경제/IT 뉴스 10분 읽기',
      emoji: '📰',
      category: 'study',
      targetTime: '08:30',
      repeatDays: [1, 2, 3, 4, 5],
      history: {
        [getPastDate(2)]: true,
        [getPastDate(1)]: true
      },
      createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
      status: 'active'
    },
    {
      id: 'rt_sample_4',
      title: '비타민 및 영양제 챙겨먹기',
      emoji: '💊',
      category: 'workout',
      targetTime: '13:00',
      repeatDays: [0, 1, 2, 3, 4, 5, 6],
      history: {
        [getPastDate(3)]: true,
        [getPastDate(2)]: true,
        [getPastDate(1)]: true
      },
      createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
      status: 'active'
    },
    {
      id: 'rt_sample_5',
      title: '오후 핵심 업무 뽀모도로 50분',
      emoji: '💻',
      category: 'work',
      targetTime: '15:00',
      repeatDays: [1, 2, 3, 4, 5],
      history: {
        [getPastDate(2)]: true,
        [getPastDate(1)]: true
      },
      createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
      status: 'active'
    },
    {
      id: 'rt_sample_6',
      title: '취침 전 감사 일기 작성',
      emoji: '📝',
      category: 'mindset',
      targetTime: '22:30',
      repeatDays: [0, 1, 2, 3, 4, 5, 6],
      history: {
        [getPastDate(3)]: true,
        [getPastDate(2)]: true,
        [getPastDate(1)]: true
      },
      createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
      status: 'active'
    }
  ];
}

/**
 * 데이터 스키마 마이그레이션 함수
 * @param {object} rawData
 * @returns {object}
 */
export function migrate(rawData) {
  const version = rawData.schemaVersion || 0;
  let data = { ...rawData };

  if (version < 1) {
    data.schemaVersion = 1;
    if (!Array.isArray(data.routines)) data.routines = [];
    if (!data.journal || typeof data.journal !== 'object') data.journal = {};
    if (!data.settings || typeof data.settings !== 'object') data.settings = { theme: 'dark' };
  }

  // 루틴 속성 누락 보정
  if (Array.isArray(data.routines)) {
    data.routines = data.routines.map(r => ({
      id: r.id || ('rt_' + Math.random().toString(36).substring(2, 9)),
      title: r.title || '이름 없는 루틴',
      emoji: r.emoji || '✨',
      category: ['workout', 'study', 'mindset', 'work'].includes(r.category) ? r.category : 'workout',
      targetTime: r.targetTime || null,
      repeatDays: Array.isArray(r.repeatDays) && r.repeatDays.length > 0 ? r.repeatDays : [0, 1, 2, 3, 4, 5, 6],
      history: r.history && typeof r.history === 'object' ? r.history : {},
      createdAt: r.createdAt || new Date().toISOString(),
      status: r.status === 'archived' ? 'archived' : 'active'
    }));
  }

  return data;
}

/**
 * 로컬스토리지에서 상태 로드
 */
export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // 최초 실행 시 기본 데이터 설정
      AppState.routines = getDefaultRoutines();
      AppState.journal = {
        [getLocalDateString()]: '오늘도 꾸준하게 나만의 갓생 루틴을 시작해보자!'
      };
      AppState.settings.theme = 'dark';
      saveState();
      return;
    }

    const parsed = JSON.parse(raw);
    const migrated = migrate(parsed);

    AppState.schemaVersion = migrated.schemaVersion || 1;
    AppState.routines = migrated.routines || [];
    AppState.journal = migrated.journal || {};
    AppState.settings = Object.assign(AppState.settings, migrated.settings || {});
  } catch (err) {
    console.error('Failed to load state from localStorage:', err);
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) localStorage.setItem(BACKUP_KEY, raw);
    } catch (e) {
      console.error('Backup write failed:', e);
    }
    // 기본 상태로 안전하게 복구
    AppState.routines = getDefaultRoutines();
    AppState.journal = {};
    saveState();
    showToast('데이터 복구: 이전 데이터 백업을 저장하고 기본 설정으로 복원했습니다.');
  }
}

/**
 * 상태를 로컬스토리지에 영구 저장
 */
export function saveState() {
  try {
    const dataToSave = {
      schemaVersion: AppState.schemaVersion,
      routines: AppState.routines,
      journal: AppState.journal,
      settings: AppState.settings
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
  } catch (err) {
    console.error('Failed to save state to localStorage:', err);
    showToast('저장 공간 오류로 데이터 저장에 실패했습니다.');
  }
}

/**
 * 공통 함수: 특정 날짜에 예정된 활성 루틴 목록 반환
 * - 해당 날짜의 요일이 repeatDays에 포함
 * - createdAt 날짜 당일 또는 그 이후 날짜
 * - status === 'active'
 * @param {string} dateStr 'YYYY-MM-DD'
 * @returns {Array<object>}
 */
export function getRoutinesForDate(dateStr) {
  if (!dateStr || !Array.isArray(AppState.routines)) return [];
  const dayOfWeek = getDayOfWeek(dateStr);

  return AppState.routines.filter(r => {
    if (r.status !== 'active') return false;
    if (!Array.isArray(r.repeatDays) || !r.repeatDays.includes(dayOfWeek)) return false;

    // createdAt 날짜 검사
    const createdDateStr = getLocalDateString(new Date(r.createdAt));
    if (dateStr < createdDateStr) return false;

    return true;
  });
}

/**
 * 특정 날짜의 완료 건수 및 완수율 계산
 * @param {string} dateStr 'YYYY-MM-DD'
 * @returns {{ scheduled: number, completed: number, rate: number }}
 */
export function getDateCompletionStats(dateStr) {
  const scheduledRoutines = getRoutinesForDate(dateStr);
  const scheduled = scheduledRoutines.length;
  if (scheduled === 0) return { scheduled: 0, completed: 0, rate: 0 };

  const completed = scheduledRoutines.filter(r => Boolean(r.history && r.history[dateStr])).length;
  const rate = Math.round((completed / scheduled) * 100);
  return { scheduled, completed, rate };
}

/**
 * 연속 달성일(스트릭) 계산
 * '예정 루틴이 있던 날 중 모두 완료한 날'을 달성일로 보고,
 * 예정 루틴이 없는 날은 건너뛰며(스트릭 유지),
 * 오늘 미완료면 어제까지의 연속일을 표시.
 * @returns {{ currentStreak: number, bestStreak: number }}
 */
export function calculateStreaks() {
  const todayStr = getLocalDateString();
  const todayStats = getDateCompletionStats(todayStr);

  let currentStreak = 0;
  let checkDate = new Date();

  // 오늘 완료 검사
  if (todayStats.scheduled > 0 && todayStats.completed === todayStats.scheduled) {
    currentStreak += 1;
  }
  // 하루 전으로 이동하여 과거로 탐색
  checkDate.setDate(checkDate.getDate() - 1);

  // 최대 365일 탐색
  for (let i = 0; i < 365; i++) {
    const dateStr = getLocalDateString(checkDate);
    const stats = getDateCompletionStats(dateStr);

    if (stats.scheduled === 0) {
      // 예정 루틴이 없는 날은 건너뛰며 스트릭 유지
      checkDate.setDate(checkDate.getDate() - 1);
      continue;
    }

    if (stats.completed === stats.scheduled) {
      currentStreak += 1;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      // 미완료 날을 만나면 연속 종료
      break;
    }
  }

  // 최고 스트릭(Best streak) 계산: 과거 180일 동안의 최대 연속값
  let bestStreak = currentStreak;
  let tempStreak = 0;
  const scanDate = new Date();
  scanDate.setDate(scanDate.getDate() - 180);

  for (let i = 0; i <= 180; i++) {
    const dateStr = getLocalDateString(scanDate);
    const stats = getDateCompletionStats(dateStr);

    if (stats.scheduled > 0) {
      if (stats.completed === stats.scheduled) {
        tempStreak++;
        if (tempStreak > bestStreak) bestStreak = tempStreak;
      } else {
        tempStreak = 0;
      }
    }
    scanDate.setDate(scanDate.getDate() + 1);
  }

  return { currentStreak, bestStreak: Math.max(bestStreak, currentStreak) };
}

/**
 * XP 및 레벨 실시간 계산
 * 완료 1건당 10XP, 하루 100% 달성 시 보너스 30XP
 * 레벨 = floor(총XP / 200) + 1
 * @returns {{ totalXP: number, level: number, currentLevelXP: number, nextLevelMaxXP: number, percent: number }}
 */
export function calculateLevelAndXP() {
  let completedCount = 0;
  const allDaysWithCompletion = new Set();

  // 1. 전체 루틴 히스토리에서 완료 건수 집계
  AppState.routines.forEach(r => {
    if (r.history && typeof r.history === 'object') {
      Object.keys(r.history).forEach(dateStr => {
        if (r.history[dateStr]) {
          completedCount += 1;
          allDaysWithCompletion.add(dateStr);
        }
      });
    }
  });

  // 2. 100% 달성한 날 수 계산 (보너스 30XP)
  let perfectDaysCount = 0;
  allDaysWithCompletion.forEach(dateStr => {
    const stats = getDateCompletionStats(dateStr);
    if (stats.scheduled > 0 && stats.completed === stats.scheduled) {
      perfectDaysCount += 1;
    }
  });

  const totalXP = (completedCount * 10) + (perfectDaysCount * 30);
  const level = Math.floor(totalXP / 200) + 1;
  const currentLevelXP = totalXP % 200;
  const nextLevelMaxXP = 200;
  const percent = Math.round((currentLevelXP / nextLevelMaxXP) * 100);

  return { totalXP, level, currentLevelXP, nextLevelMaxXP, percent, completedCount, perfectDaysCount };
}

/**
 * 토스트 알림 표시
 * @param {string} message
 * @param {number} [duration=2500]
 */
export function showToast(message, duration = 2500) {
  const toastEl = document.getElementById('toast');
  const toastText = document.getElementById('toast-text');
  if (!toastEl || !toastText) return;

  toastText.textContent = message;
  toastEl.classList.remove('opacity-0', 'scale-90', 'pointer-events-none');
  toastEl.classList.add('opacity-100', 'scale-100');

  if (window._toastTimer) clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => {
    toastEl.classList.remove('opacity-100', 'scale-100');
    toastEl.classList.add('opacity-0', 'scale-90', 'pointer-events-none');
  }, duration);
}

/**
 * 100% 완료 달성 축하 오버레이 (하루 1회만 표시)
 */
export function checkAndTriggerCelebration() {
  const todayStr = getLocalDateString();
  const stats = getDateCompletionStats(todayStr);

  if (stats.scheduled > 0 && stats.completed === stats.scheduled) {
    try {
      const celebrated = JSON.parse(localStorage.getItem(CELEBRATION_KEY) || '{}');
      if (!celebrated[todayStr]) {
        celebrated[todayStr] = true;
        localStorage.setItem(CELEBRATION_KEY, JSON.stringify(celebrated));

        const overlay = document.getElementById('celebration-overlay');
        if (overlay) {
          overlay.classList.remove('hidden');
          setTimeout(() => {
            overlay.classList.add('hidden');
          }, 2400);
        }
      }
    } catch (e) {
      console.error('Celebration trigger error:', e);
    }
  }
}
