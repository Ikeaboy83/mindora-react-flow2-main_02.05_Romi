// Zentrale Status-Konfiguration für Lerneinheiten.
// Single source of truth: Status-Enum + Status -> Rahmenfarbe.
// Das favoritIcon (Herz) ist bewusst NICHT enthalten — es ist
// status-unabhängig und beeinflusst die Rahmenfarbe nicht.

export const STATUS = Object.freeze({
  DONE: 'done',
  IN_PROGRESS: 'inProgress',
  SCHEDULED: 'scheduled',
  LOCKED: 'locked',
  DEFAULT: 'default',
});

// Rahmenfarbe pro Hauptstatus (Header ist seit dem Layout-Refactor immer weiß).
// DONE/IN_PROGRESS matchen die Hintergrundfarben der jeweiligen Icons
// (DoneIconNode #00D58A, StartedIconNode #FFB800) — Icon und Rahmen in
// derselben Farbe.
export const STATUS_BORDER_COLORS = Object.freeze({
  [STATUS.DONE]:        '#00D58A',
  [STATUS.IN_PROGRESS]: '#FFB800',
  [STATUS.SCHEDULED]:   '#2563eb',
  [STATUS.LOCKED]:      '#64748b',
  [STATUS.DEFAULT]:     '#1f2937',
});

// Mapping vom Icon-Typ (data.statusIcons[i].type) auf den abgeleiteten Status.
const ICON_TYPE_TO_STATUS = Object.freeze({
  doneIcon:     STATUS.DONE,
  startedIcon:  STATUS.IN_PROGRESS,
  deadlineIcon: STATUS.SCHEDULED,
  lockedIcon:   STATUS.LOCKED,
});

// Reihenfolge bei Konflikten: höherer Index gewinnt, wenn mehrere
// Status-Icons gleichzeitig auf einer Kachel liegen.
const STATUS_PRIORITY = [
  STATUS.LOCKED,
  STATUS.SCHEDULED,
  STATUS.IN_PROGRESS,
  STATUS.DONE,
];

export function getStatusFromIcons(statusIcons) {
  if (!Array.isArray(statusIcons) || statusIcons.length === 0) return STATUS.DEFAULT;

  let best = STATUS.DEFAULT;
  let bestPrio = -1;
  for (const icon of statusIcons) {
    const status = ICON_TYPE_TO_STATUS[icon?.type];
    if (!status) continue;
    const prio = STATUS_PRIORITY.indexOf(status);
    if (prio > bestPrio) {
      bestPrio = prio;
      best = status;
    }
  }
  return best;
}

export function getBorderColorForStatus(status) {
  return STATUS_BORDER_COLORS[status] ?? STATUS_BORDER_COLORS[STATUS.DEFAULT];
}
