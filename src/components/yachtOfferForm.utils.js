// src/components/yachtOfferForm.utils.js

import {
  ELECTRICIAN_LICENSE_OPTIONS,
  ENGINEERING_LICENSE_OPTIONS,
  DECK_LICENSE_MAP,
  DECK_DOCUMENT_MAP,
} from './yachtOfferForm.constants';

export const getInferredYear = (monthValue) => {
  const month = Number(monthValue);
  if (!month) return null;
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  return month >= currentMonth ? now.getFullYear() : now.getFullYear() + 1;
};

export const getDaysInMonth = (monthValue) => {
  const month = Number(monthValue);
  if (!month) return 31;
  const year = getInferredYear(monthValue) || new Date().getFullYear();
  return new Date(year, month, 0).getDate();
};

export const DAY_RANGE_OPTIONS = [
  { value: 'beginning', label: 'Beginning' },
  { value: 'middle', label: 'Middle' },
  { value: 'end', label: 'End' },
];

const DAY_RANGE_LABELS = Object.fromEntries(
  DAY_RANGE_OPTIONS.map((option) => [option.value, option.label])
);

export const isDayRangeValue = (value) =>
  Object.prototype.hasOwnProperty.call(DAY_RANGE_LABELS, String(value || '').toLowerCase());

export const getDayRangeLabel = (value) =>
  DAY_RANGE_LABELS[String(value || '').toLowerCase()] || '';

export const getDaySelectOptions = (monthValue) => [
  ...DAY_RANGE_OPTIONS,
  ...Array.from({ length: getDaysInMonth(monthValue || '0') }, (_, i) => {
    const day = String(i + 1);
    return { value: day, label: day };
  }),
];

export const resolveDayValueForDate = (dayValue, monthValue) => {
  if (!dayValue) return '01';
  if (!isDayRangeValue(dayValue)) return String(dayValue).padStart(2, '0');

  const maxDay = getDaysInMonth(monthValue || '0');
  const normalized = String(dayValue).toLowerCase();
  if (normalized === 'beginning') return '01';
  if (normalized === 'middle') return String(Math.ceil(maxDay / 2)).padStart(2, '0');
  return String(maxDay).padStart(2, '0');
};

export const formatOfferDate = (dateStr, { monthOnly = false, dayRange = '' } = {}) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return String(dateStr);

  if (dayRange && !monthOnly) {
    const label = getDayRangeLabel(dayRange);
    const monthYear = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    return label ? `${label} of ${monthYear}` : monthYear;
  }

  const options = monthOnly
    ? { month: 'short', year: 'numeric' }
    : { day: '2-digit', month: 'short', year: 'numeric' };
  return date.toLocaleDateString('en-US', options);
};

export const readJsonResponse = async (res) => {
  const contentType = res.headers.get('content-type') || '';
  const text = await res.text();

  if (!contentType.includes('application/json')) {
    if (
      text.trim().startsWith('<!DOCTYPE') ||
      text.trim().startsWith('<!doctype')
    ) {
      throw new Error('API not available in local dev. Use Vercel dev or deploy.');
    }
    throw new Error('Unexpected API response.');
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error('Invalid JSON response.');
  }
};

export const adjustRemarksTextareaHeight = (el) => {
  if (!el) return;

  const doc = typeof document !== 'undefined' ? document : null;
  const scrollContainer =
    el.closest?.('.modal-content-wrapper') ||
    doc?.scrollingElement ||
    doc?.documentElement;

  const previousScrollTop = scrollContainer ? scrollContainer.scrollTop : null;

  el.style.height = 'auto';
  el.style.height = `${el.scrollHeight}px`;

  if (scrollContainer) {
    const restoreScroll = () => {
      scrollContainer.scrollTop = previousScrollTop ?? 0;
    };
    if (
      typeof window !== 'undefined' &&
      typeof window.requestAnimationFrame === 'function'
    ) {
      window.requestAnimationFrame(restoreScroll);
    } else {
      restoreScroll();
    }
  }
};

const SOLO_ENGINEER_EXCLUSIONS = new Set([
  'Chief Engineer Unlimited - STCW III/2',
  'Engineering Officer of the Watch (EOOW) - STCW III/1',
  'Y1 - Yacht Engineer (Unlimited)',
  'Second Engineer Unlimited - STCW III/2',
]);

const ENGINEERING_LICENSE_EXCLUSIONS = {
  'Chief Engineer': new Set([
    'AEC 2 - Approved Engine Course 2',
    'AEC 1 - Approved Engine Course 1',
    'Engineering Officer of the Watch (EOOW) - STCW III/1',
    'Second Engineer Unlimited - STCW III/2',
  ]),
  '3rd Engineer': new Set([
    'Chief Engineer Unlimited - STCW III/2',
    'Y1 - Yacht Engineer (Unlimited)',
  ]),
  'Solo Engineer': SOLO_ENGINEER_EXCLUSIONS,
  Engineer: SOLO_ENGINEER_EXCLUSIONS,
};

export const getEngineeringLicenseOptionsForRank = (rank) => {
  if (rank === 'Electrician') {
    return ELECTRICIAN_LICENSE_OPTIONS;
  }
  const exclusions = ENGINEERING_LICENSE_EXCLUSIONS[rank];
  if (!exclusions) {
    return ENGINEERING_LICENSE_OPTIONS;
  }
  return ENGINEERING_LICENSE_OPTIONS.filter((opt) => !exclusions.has(opt));
};

export const getDeckLicenseOptionsForRank = (rank) => DECK_LICENSE_MAP[rank] || [];

export const getDeckDocumentOptionsForRank = (rank) =>
  DECK_DOCUMENT_MAP[rank] || [];
