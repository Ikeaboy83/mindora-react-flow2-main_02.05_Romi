// Generalisiertes 5-Spalten-Layout fuer alle Course-Overview-Levels.
// Jede Ebene folgt demselben Schema:
//
//   Card-L | Theme-L | Center | Theme-R | Card-R
//
// und unterscheidet sich nur durch die Konfiguration (Layout-Parameter,
// Themen). Themes mit Sub-Hierarchie haben statt einer regulären Card einen
// Drill-Down-Annex im Card-Slot derselben Seite — sonst sind sie strukturell
// identisch zu allen anderen Themes (gleiche Hub↔Theme-Edge, gleiche
// Theme↔Theme-Spacing-Constraints). Pro Level eine Config; die Funktion
// `computeLevelPositions(config)` berechnet alle Node-Positionen deterministisch.

import { GRID_BASE_SIZES, getGridDimensions } from './GridboxNode/gridUtils';

// === HELPER ===

// Card-Hoehe entspricht der TATSAECHLICH gerenderten Hoehe (level-aware).
// getGridDimensions liest den 'level-N'-Suffix aus der cardId und wendet
// den passenden Skalierungsfaktor an — sonst werden Level-2-Cards mit
// Level-1-Hoehe positioniert und liegen ~23k Units zu weit oben.
const cardHeightForId = (cardId) => {
  if (!cardId) return GRID_BASE_SIZES['9er'].height;
  return getGridDimensions(cardId).height;
};

// === GENERALISIERTE LAYOUT-BERECHNUNG ===

/**
 * Berechnet alle Positionen eines Course-Levels aus dessen Config.
 *
 * Config-Struktur:
 *   layout: {
 *     COLUMN_GAPS: [number, number, number, number],
 *     ROW_GAP: number,
 *     THEME_DIAMETER: number,
 *     CENTER_DIAMETER: number,
 *     CARD_WIDTH: number,
 *     ORIGIN: { x: number, y: number },
 *   }
 *   center: { id: string, label: string }
 *   themes: [{
 *     id, label, side, row,
 *     // Entweder Card (Standard) ODER Annex (Drill-Down) — nicht beides:
 *     cardId?, tileCount?,                  // Theme mit Lerneinheiten-Card
 *     annexId?, annexWidth?, annexHeight?,  // Theme mit eingebetteter Sub-Hierarchie
 *   }]
 *
 * Garantien:
 *   - Theme-pair (left+right) auf gleicher row haben identische Y
 *   - Card-Mitte = Theme-Mitte fuer jeden Card-Theme
 *   - Annex-Y-Mitte = Theme-Y-Mitte; Annex sitzt im Card-Slot derselben Seite
 *     (Card-Slot enthält bei einem Annex-Theme keine reguläre Card)
 *   - Center horizontal exakt zwischen Theme-L und Theme-R Spalte
 *   - Center vertikal exakt zwischen oberster und unterster Theme-Reihe
 *
 * Rueckgabe:
 *   {
 *     center:   { x, y },
 *     themes:   { [themeId]:  { x, y } },
 *     cards:    { [cardId]:   { x, y } },
 *     annexes:  { [annexId]:  { x, y } },  // {} wenn keine Annex-Themes
 *     rowMidYs: number[],
 *   }
 */
export const computeLevelPositions = (config) => {
  const { layout, themes } = config;
  const { COLUMN_GAPS, ROW_GAP, THEME_DIAMETER, CENTER_DIAMETER, CARD_WIDTH, ORIGIN } = layout;

  // Spalten-Start-X (Indizes: 0=cardL, 1=themeL, 2=center, 3=themeR, 4=cardR)
  const colWidths = [CARD_WIDTH, THEME_DIAMETER, CENTER_DIAMETER, THEME_DIAMETER, CARD_WIDTH];
  const colStartXs = [];
  let xCursor = ORIGIN.x;
  for (let i = 0; i < 5; i++) {
    colStartXs.push(xCursor);
    xCursor += colWidths[i];
    if (i < 4) xCursor += COLUMN_GAPS[i];
  }

  const numRows = Math.max(...themes.map((t) => t.row)) + 1;
  const rowYs = [];
  for (let r = 0; r < numRows; r++) {
    rowYs.push(ORIGIN.y + r * (THEME_DIAMETER + ROW_GAP));
  }
  const rowMidYs = rowYs.map((y) => y + THEME_DIAMETER / 2);

  // Center vertikal mittig zwischen erster und letzter Theme-Reihe
  const centerCircleMidY = (rowMidYs[0] + rowMidYs[numRows - 1]) / 2;
  const center = {
    x: colStartXs[2],
    y: centerCircleMidY - CENTER_DIAMETER / 2,
  };

  const themePositions = {};
  const cardPositions = {};
  const annexPositions = {};

  themes.forEach((theme) => {
    const isLeft = theme.side === 'left';
    const themeColIdx = isLeft ? 1 : 3;
    const cardColIdx = isLeft ? 0 : 4;

    const themeX = colStartXs[themeColIdx];
    const themeY = rowYs[theme.row];
    const themeMidY = themeY + THEME_DIAMETER / 2;

    themePositions[theme.id] = { x: themeX, y: themeY };

    if (theme.annexId) {
      // Drill-Down-Annex: belegt den Card-Slot der Theme-Seite, Y zentriert
      // auf Theme-Mitte. Größe ist explizit (annexWidth/annexHeight) — das
      // Spacing-System der Card-Slots wird NICHT angepasst, ein Annex darf
      // nach außen überhängen.
      const annexX = colStartXs[cardColIdx];
      const annexY = themeMidY - theme.annexHeight / 2;
      annexPositions[theme.annexId] = { x: annexX, y: annexY };
    } else if (theme.cardId) {
      // Standard-Card: einheitliche Breite (= CARD_WIDTH), Card-Mitte
      // aligniert mit Theme-Mitte.
      const cardH = cardHeightForId(theme.cardId);
      const cardX = colStartXs[cardColIdx];
      const cardY = themeMidY - cardH / 2;
      cardPositions[theme.cardId] = { x: cardX, y: cardY };
    }
  });

  return {
    center,
    themes: themePositions,
    cards: cardPositions,
    annexes: annexPositions,
    rowMidYs,
  };
};

// === NODE-SPACING (SINGLE SOURCE OF TRUTH) ===
// Einheitliche EDGE-to-EDGE-Lücke zwischen direkt verbundenen Knoten —
// also der sichtbare Abstand zwischen Knoten-Rändern, NICHT zwischen Centern.
// Gilt symmetrisch für alle drei Beziehungen:
//   - Hub↔Theme   (horizontal)
//   - Theme↔Theme (vertikal, adjacent rows derselben Seite)
//   - Theme↔Card  (horizontal, ganz außen)
// L1-Wert kalibriert auf den bisherigen Theme↔Theme-Edge — der wirkt visuell
// stimmig. L2/L3 skalieren mit scaleFactor (THEME_DIAMETER_LX / THEME_DIAMETER_L1).
// Kalibrierungs-Historie:
//   - 2026-05: −25 % (× 0.75) für engere Lücken
//   - +20 % (× 1.2) parallel zum Knoten-Diameter-Bump (Gap-zu-Theme-Verhältnis
//     bleibt damit identisch zur 0.75-Stufe).
const NODE_GAP_FLOW_L1 = 22900.875 * 0.75 * 1.2;

// Berechnet COLUMN_GAPS + ROW_GAP, sodass die sichtbaren Edge-to-Edge-Lücken
// für jedes Knoten-Paar exakt `gap` ergeben — egal ob Hub↔Theme, Theme↔Theme
// oder Theme↔Card. Pro Paar wird zunächst die nötige Center-to-Center-Distanz
// aus dem konstanten Edge-Gap und den jeweiligen Knoten-Maßen abgeleitet
// (umgekehrt zur alten Logik, die einen festen C2C-Wert in unterschiedliche
// Gaps zerlegte). Diese — jetzt unterschiedlichen — C2C-Werte werden
// anschließend in COLUMN_GAPS und ROW_GAP umgerechnet.
const computeUniformGaps = (gap, themeDiameter, centerDiameter, cardWidth) => {
  // C2C-Distanzen, die den konstanten Edge-Gap ergeben (entlang der jeweiligen
  // Layout-Achse: horizontal für Card↔Theme & Hub↔Theme, vertikal für
  // Theme↔Theme).
  const c2cCardTheme = gap + (cardWidth + themeDiameter) / 2;
  const c2cThemeCenter = gap + (themeDiameter + centerDiameter) / 2;
  const c2cThemeTheme = gap + themeDiameter;

  return {
    COLUMN_GAPS: [
      c2cCardTheme - (cardWidth + themeDiameter) / 2,    // cardL ↔ themeL
      c2cThemeCenter - (themeDiameter + centerDiameter) / 2, // themeL ↔ center
      c2cThemeCenter - (centerDiameter + themeDiameter) / 2, // center ↔ themeR
      c2cCardTheme - (themeDiameter + cardWidth) / 2,    // themeR ↔ cardR
    ],
    ROW_GAP: c2cThemeTheme - themeDiameter,
  };
};

// === SHARED SCALE FACTORS (vorgezogen) ===
// L2/L3 leiten alle Maße über diese Faktoren von L1 ab. Vorgezogen, weil
// LEVEL1_ANNEX_HEIGHT (im Level-1-Block) auf L2-Content-Höhe + symmetrisches
// Padding gefittet wird, und LEVEL2_ANNEX_HEIGHT analog auf L3-Content. Die
// Faktoren werden weiter unten in den L2/L3-Blöcken referenziert (NICHT
// re-deklariert), damit ein single source of truth bleibt.
const SCALE_TO_L2 = 1 / 8;                  // = 0.125
const SCALE_TO_L3 = 640 / 52672;            // ≈ 0.01215146 (kalibriert auf Original-L1)

// Top-Inset der inneren Layout-Wurzel innerhalb des umgebenden Annex (lokale
// Koords). Dient gleichzeitig als symmetrisches Bottom-Padding → die Mini-
// Übersicht sitzt vertikal zentriert ohne überschüssigen Leerraum.
const LEVEL_2_ORIGIN_Y = 9614;              // L2-Wurzel innerhalb L1-Annex
const LEVEL_3_ORIGIN_Y = 900;               // L3-Wurzel innerhalb L2-Annex

// === LEVEL 1 CONFIG ===

// 2026-05: Knoten-Diameter um +20 % erhöht (52672→63206, 73741→88489), damit
// längere Theme-Labels mehr Innenraum bekommen. NODE_GAP_FLOW_L1 wurde
// parallel × 1.2 mitskaliert (siehe oben), sodass Gap-zu-Theme-Verhältnis
// identisch bleibt. Annex-Größen ebenfalls × 1.2 — sonst überlaufen die
// proportionalen L2/L3-Layouts den Container.
const LEVEL1_THEME_DIAMETER = 52672 * 1.2;   // 63206.4
const LEVEL1_CENTER_DIAMETER = 73741 * 1.2;  // 88489.2 (~1.4 × THEME_DIAMETER)
const LEVEL1_CARD_WIDTH = GRID_BASE_SIZES['9er'].width;
// Annex (Drill-Down-Container) für Theme „4. Change Management" — sitzt im
// Card-Slot rechts vom Circle, beherbergt die L2-Sub-Hierarchie als Children.
// Wird von AnnexNode (CSS) und CourseOverviewFlowCanvas (style) konsumiert,
// damit alle drei Stellen synchron bleiben.
//
// Höhe ist an die tatsächliche L2-Content-Extent gefittet (+ symmetrisches
// vertikales Padding LEVEL_2_ORIGIN_Y oben und unten), damit die Mini-
// Übersicht visuell zentriert sitzt ohne überschüssigen Leerraum unten.
//   L2-Content-Höhe = 2 × THEME_L2 + 1 × ROW_GAP_L2  (2 Theme-Reihen)
//                   = SCALE_TO_L2 × (2 × THEME_L1 + NODE_GAP_FLOW_L1)
// Hub, Cards und L2-Annex liegen alle innerhalb dieses Y-Bereichs.
export const LEVEL1_ANNEX_WIDTH = 52672 * 1.2;      // 63206.4
export const LEVEL1_ANNEX_HEIGHT =
  2 * LEVEL_2_ORIGIN_Y
  + SCALE_TO_L2 * (2 * LEVEL1_THEME_DIAMETER + NODE_GAP_FLOW_L1);
const LEVEL1_GAPS = computeUniformGaps(
  NODE_GAP_FLOW_L1,
  LEVEL1_THEME_DIAMETER,
  LEVEL1_CENTER_DIAMETER,
  LEVEL1_CARD_WIDTH,
);

export const LEVEL_1_CONFIG = {
  layout: {
    COLUMN_GAPS: LEVEL1_GAPS.COLUMN_GAPS,
    ROW_GAP: LEVEL1_GAPS.ROW_GAP,
    THEME_DIAMETER: LEVEL1_THEME_DIAMETER,
    CENTER_DIAMETER: LEVEL1_CENTER_DIAMETER,
    CARD_WIDTH: LEVEL1_CARD_WIDTH,
    ORIGIN: { x: -10000, y: 60000 },
  },
  center: {
    id: 'one-level-central-node',
    label: 'LEADERSHIP & TEAMS',
  },
  themes: [
    {
      id: 'one-level-category-node-top-left',
      label: '1.\nFÜHRUNGS-\nKOMPETENZEN',
      side: 'left',
      row: 0,
      cardId: '9erContainer-level-1',
      tileCount: 9,
    },
    {
      id: 'one-level-category-node-middle-left-l1',
      label: '2.\nDIVERSITY & INCLUSION',
      side: 'left',
      row: 1,
      cardId: '3erContainer-level-1',
      tileCount: 1,
    },
    {
      id: 'one-level-category-node-bottom-left',
      label: '3.\nKONFLIKT-\nMANAGEMENT',
      side: 'left',
      row: 2,
      cardId: '6erContainer-level-1',
      tileCount: 5,
    },
    {
      id: 'one-level-category-node-middle-right',
      label: '5.\nAGILES\nARBEITEN',
      side: 'right',
      row: 1,
      cardId: '6erContainer-level-1-main',
      tileCount: 4,
    },
    {
      id: 'one-level-category-node-bottom-right',
      label: '6.\nTEAM-\nDYNAMIK',
      side: 'right',
      row: 2,
      cardId: '3erContainer-level-1-main',
      tileCount: 2,
    },
    {
      id: 'one-level-category-node-top-right',
      label: '4.\nCHANGE MANAGEMENT',
      side: 'right',
      row: 0,
      annexId: 'one-level-annex',
      annexWidth: LEVEL1_ANNEX_WIDTH,
      annexHeight: LEVEL1_ANNEX_HEIGHT,
    },
  ],
};

// === BACKWARDS-COMPAT EXPORTS ===
// Damit bestehende Imports (CircularNode, CourseOverviewFlowCanvas) ohne
// Aenderung weiterlaufen — die alten Konstanten/Helper bleiben verfuegbar.

export const LEVEL1_LAYOUT = LEVEL_1_CONFIG.layout;
export const LEVEL1_THEMES = LEVEL_1_CONFIG.themes;
export const LEVEL1_CENTER = LEVEL_1_CONFIG.center;
export const LEVEL1_POSITIONS = computeLevelPositions(LEVEL_1_CONFIG);

export const getTileCountFor = (cardId) =>
  LEVEL_1_CONFIG.themes.find((t) => t.cardId === cardId)?.tileCount;

// Legacy-Wrapper ueber computeLevelPositions, falls noch extern aufgerufen.
export const computeLevel1Positions = (themes, layout) => {
  const cfg = themes
    ? { ...LEVEL_1_CONFIG, themes, layout: layout ?? LEVEL_1_CONFIG.layout }
    : LEVEL_1_CONFIG;
  return computeLevelPositions(cfg);
};

// === LEVEL 2 CONFIG ===

// Level 2 ist KIND des L1-Annex (parentId='one-level-annex'), Koordinaten lokal.
// Alle L2-Maße leiten sich über SCALE_TO_L2 (oben deklariert) von L1 ab —
// wenn L1 wächst, wachsen L2 und L3 automatisch mit.
const LEVEL2_THEME_DIAMETER = LEVEL1_THEME_DIAMETER  * SCALE_TO_L2;  // 7900.8 (war 6584)
const LEVEL2_CENTER_DIAMETER = LEVEL1_CENTER_DIAMETER * SCALE_TO_L2; // 11061.15 (war 9216)
const LEVEL2_CARD_WIDTH      = LEVEL1_CARD_WIDTH      * SCALE_TO_L2; // 8850 (unchanged — L1_CARD_WIDTH didn't change)
// Annex für Theme „3. Change Leadership Rollen" — sitzt im L2-Card-Slot
// rechts vom Circle, beherbergt die L3-Sub-Hierarchie. Width skaliert über
// SCALE_TO_L2 von L1-Annex ab; Height ist analog zu L1-Annex an die L3-
// Content-Extent gefittet (+ symmetrisches LEVEL_3_ORIGIN_Y-Padding):
//   L3-Content-Höhe = 3 × THEME_L3 + 2 × ROW_GAP_L3  (3 Theme-Reihen)
//                   = SCALE_TO_L3 × (3 × THEME_L1 + 2 × NODE_GAP_FLOW_L1)
// Damit hat der Annex auf jedem Level dasselbe Verhältnis zu seinem Inhalt.
export const LEVEL2_ANNEX_WIDTH  = LEVEL1_ANNEX_WIDTH  * SCALE_TO_L2;  // 7900.8 (war 6584)
export const LEVEL2_ANNEX_HEIGHT =
  2 * LEVEL_3_ORIGIN_Y
  + SCALE_TO_L3 * (3 * LEVEL1_THEME_DIAMETER + 2 * NODE_GAP_FLOW_L1);
const LEVEL2_GAP = NODE_GAP_FLOW_L1 * (LEVEL2_THEME_DIAMETER / LEVEL1_THEME_DIAMETER);
const LEVEL2_GAPS = computeUniformGaps(
  LEVEL2_GAP,
  LEVEL2_THEME_DIAMETER,
  LEVEL2_CENTER_DIAMETER,
  LEVEL2_CARD_WIDTH,
);

// Layout-Gesamtbreite des L2-Schemas (Card-L|Theme-L|Center|Theme-R|Card-R + 4
// Column-Gaps). Da computeUniformGaps alle 4 COLUMN_GAPS auf denselben Wert
// (= LEVEL2_GAP) setzt, vereinfacht sich die Summe der Gaps zu 4 × LEVEL2_GAP.
// Aus annex_width minus layout_width minus jeweils gleichmäßiges Padding folgt
// der ORIGIN.x für horizontale Zentrierung der Mini-Übersicht im L1-Annex.
const LEVEL2_LAYOUT_WIDTH =
  2 * LEVEL2_CARD_WIDTH + 2 * LEVEL2_THEME_DIAMETER + LEVEL2_CENTER_DIAMETER + 4 * LEVEL2_GAP;
const LEVEL_2_ORIGIN_X = (LEVEL1_ANNEX_WIDTH - LEVEL2_LAYOUT_WIDTH) / 2;

export const LEVEL_2_CONFIG = {
  layout: {
    COLUMN_GAPS: LEVEL2_GAPS.COLUMN_GAPS,
    ROW_GAP: LEVEL2_GAPS.ROW_GAP,
    THEME_DIAMETER: LEVEL2_THEME_DIAMETER,
    CENTER_DIAMETER: LEVEL2_CENTER_DIAMETER,
    CARD_WIDTH: LEVEL2_CARD_WIDTH,
    ORIGIN: { x: LEVEL_2_ORIGIN_X, y: LEVEL_2_ORIGIN_Y },
  },
  center: {
    id: 'two-level-central-node',
    label: 'CHANGE MANAGEMENT',
  },
  themes: [
    {
      id: 'two-level-category-node-left-top',
      label: '1.\nGRUNDLAGEN',
      side: 'left',
      row: 0,
      cardId: '9erContainer-level-2',
      tileCount: 9,
    },
    {
      id: 'two-level-category-node-bottom-left',
      label: '2.\nDIALOG\nIM\nWANDEL',
      side: 'left',
      row: 1,
      cardId: '6erContainer-level-2',
      tileCount: 6,
    },
    {
      id: 'two-level-category-node-bottom-right',
      label: '4.\nWIDERSTÄNDE VERSTEHEN & ÜBERWINDEN',
      side: 'right',
      row: 1,
      cardId: '3erContainer-level-2',
      tileCount: 1,
    },
    {
      id: 'two-level-category-node-top-right',
      label: '3.\nCHANGE LEADERSHIP ROLLEN',
      side: 'right',
      row: 0,
      annexId: 'two-level-annex',
      annexWidth: LEVEL2_ANNEX_WIDTH,
      annexHeight: LEVEL2_ANNEX_HEIGHT,
    },
  ],
};

export const LEVEL2_LAYOUT = LEVEL_2_CONFIG.layout;
export const LEVEL2_THEMES = LEVEL_2_CONFIG.themes;
export const LEVEL2_CENTER = LEVEL_2_CONFIG.center;
export const LEVEL2_POSITIONS = computeLevelPositions(LEVEL_2_CONFIG);

export const getLevel2TileCountFor = (cardId) =>
  LEVEL_2_CONFIG.themes.find((t) => t.cardId === cardId)?.tileCount;

// Liefert die Layout-Seite ('left' | 'right') eines Grid-Containers.
// Single source of truth: LEVEL_X_CONFIG.themes[].side.
// Wenn `level` angegeben ist, wird nur in dieser Config gesucht — verhindert,
// dass cardIds, die in mehreren Levels vorkommen könnten, fälschlich den
// ersten Treffer ausliefern. Ohne `level` als Fallback alle Levels durchsuchen.
const LEVEL_CONFIGS_BY_NUMBER = { 1: null, 2: null, 3: null };
// Lazy: Configs werden im Funktionskörper aufgelöst, weil LEVEL_X_CONFIG
// teilweise nach getSideFor deklariert wird (Hoisting-sicher zur Laufzeit).
const getConfigForLevel = (level) => {
  if (level === 1) return LEVEL_1_CONFIG;
  if (level === 2) return LEVEL_2_CONFIG;
  if (level === 3) return LEVEL_3_CONFIG;
  return null;
};

// Lookup matcht sowohl theme.cardId (Grid-Container-IDs) als auch theme.id
// (Circle-Theme-Node-IDs). Damit funktionieren GridContainerNode UND
// CircularNode mit derselben Helper-Funktion.
const themeMatches = (theme, idOrCardId) =>
  theme.cardId === idOrCardId || theme.id === idOrCardId;

export const getSideFor = (idOrCardId, level) => {
  if (typeof level === 'number') {
    const cfg = getConfigForLevel(level);
    if (!cfg) return null;
    const theme = cfg.themes.find((t) => themeMatches(t, idOrCardId));
    return theme?.side ?? null;
  }
  // Fallback ohne Level: alle Level durchsuchen, ersten Treffer nehmen.
  for (const cfg of [LEVEL_1_CONFIG, LEVEL_2_CONFIG, LEVEL_3_CONFIG]) {
    const theme = cfg.themes.find((t) => themeMatches(t, idOrCardId));
    if (theme) return theme.side;
  }
  return null;
};

// Liefert theme.annexId, falls das Theme einen Drill-Down-Annex hat — sonst null.
// Single source: LEVEL_X_CONFIG.themes[].annexId. Wird vom CircularNode genutzt,
// um den Drill-Down-Marker (Kalender-Icon) NUR an Themes mit Sub-Hierarchie
// zu rendern.
export const getAnnexIdFor = (idOrCardId, level) => {
  if (typeof level === 'number') {
    const cfg = getConfigForLevel(level);
    if (!cfg) return null;
    const theme = cfg.themes.find((t) => themeMatches(t, idOrCardId));
    return theme?.annexId ?? null;
  }
  for (const cfg of [LEVEL_1_CONFIG, LEVEL_2_CONFIG, LEVEL_3_CONFIG]) {
    const theme = cfg.themes.find((t) => themeMatches(t, idOrCardId));
    if (theme) return theme.annexId ?? null;
  }
  return null;
};

// === LEVEL 3 CONFIG ===

// Level 3 ist KIND des L2-Annex (parentId='two-level-annex'), Koordinaten lokal.
// Proportionen analog Level 1 (THEME_DIAMETER=640 = 'tiny' Size aus CircularNode):
//   ROW_GAP/THEME ≈ 0.152, COLUMN_GAPS outer/THEME ≈ 0.342, inner/THEME ≈ 0.380.
//   CENTER_DIAMETER ≈ 1.375 × THEME (= 'tinyCentral' Size 880).
//   CARD_WIDTH = 9er-L3 width (GRID_BASE_SIZES['9er'].width × 0.01215).
// Theme-Arrangement: 3 links (rows 0/1/2) + 2 rechts (rows 0/1), kein Annex.
// Alle L3-Maße leiten sich über SCALE_TO_L3 (oben deklariert) von L1 ab —
// analog zu SCALE_TO_L2. Der Faktor entspricht der Original-Kalibrierung
// (LEVEL3_THEME_DIAMETER 640 vs LEVEL1_THEME_DIAMETER 52672 ≈ 0.01215146);
// wenn L1 wächst, wächst L3 proportional mit.
const LEVEL3_THEME_DIAMETER  = LEVEL1_THEME_DIAMETER  * SCALE_TO_L3;  // 768.07 (war 640)
const LEVEL3_CENTER_DIAMETER = LEVEL1_CENTER_DIAMETER * SCALE_TO_L3;  // 1075.42 (war 880)
const LEVEL3_CARD_WIDTH      = LEVEL1_CARD_WIDTH      * SCALE_TO_L3;  // 860.32 (unchanged — L1_CARD_WIDTH didn't change)
const LEVEL3_GAP = NODE_GAP_FLOW_L1 * (LEVEL3_THEME_DIAMETER / LEVEL1_THEME_DIAMETER);
const LEVEL3_GAPS = computeUniformGaps(
  LEVEL3_GAP,
  LEVEL3_THEME_DIAMETER,
  LEVEL3_CENTER_DIAMETER,
  LEVEL3_CARD_WIDTH,
);

// Layout-Gesamtbreite des L3-Schemas — analog zu LEVEL2_LAYOUT_WIDTH (Summe
// der COLUMN_GAPS = 4 × LEVEL3_GAP). ORIGIN.x ergibt sich aus der horizontalen
// Zentrierung im L2-Annex.
const LEVEL3_LAYOUT_WIDTH =
  2 * LEVEL3_CARD_WIDTH + 2 * LEVEL3_THEME_DIAMETER + LEVEL3_CENTER_DIAMETER + 4 * LEVEL3_GAP;
const LEVEL_3_ORIGIN_X = (LEVEL2_ANNEX_WIDTH - LEVEL3_LAYOUT_WIDTH) / 2;

export const LEVEL_3_CONFIG = {
  layout: {
    COLUMN_GAPS: LEVEL3_GAPS.COLUMN_GAPS,
    ROW_GAP: LEVEL3_GAPS.ROW_GAP,
    THEME_DIAMETER: LEVEL3_THEME_DIAMETER,
    CENTER_DIAMETER: LEVEL3_CENTER_DIAMETER,
    CARD_WIDTH: LEVEL3_CARD_WIDTH,
    ORIGIN: { x: LEVEL_3_ORIGIN_X, y: LEVEL_3_ORIGIN_Y },
  },
  center: {
    id: 'three-level-central-node',
    label: 'CHANGE LEADERSHIP ROLLEN',
  },
  themes: [
    {
      id: 'three-level-category-top-left',
      label: '1.\nVISION',
      side: 'left',
      row: 0,
      cardId: '3erContainer-level-3-second',
    },
    {
      id: 'three-level-category-middle-left',
      label: '2.\nKOMMUNIKATION',
      side: 'left',
      row: 1,
      cardId: '9erContainer-level-3',
    },
    {
      id: 'three-level-category-bottom-left',
      label: '3.\nCOACHING & MENTORING',
      side: 'left',
      row: 2,
      cardId: '3erContainer-level-3-third',
    },
    {
      id: 'three-level-category-top-right',
      label: '4.\nUMSETZUNG & PROJEKTLEITUNG',
      side: 'right',
      row: 0,
      cardId: '3erContainer-level-3',
    },
    {
      id: 'three-level-category-middle-right',
      label: '5.\nNETWORKING',
      side: 'right',
      row: 1,
      cardId: '6erContainer-level-3',
    },
  ],
};

export const LEVEL3_LAYOUT = LEVEL_3_CONFIG.layout;
export const LEVEL3_THEMES = LEVEL_3_CONFIG.themes;
export const LEVEL3_CENTER = LEVEL_3_CONFIG.center;
export const LEVEL3_POSITIONS = computeLevelPositions(LEVEL_3_CONFIG);

// === RENDER-WERTE PRO LEVEL (Borders, Edge-Strokes, Font-Sizes) ===
// Single source of truth für alle visuellen Werte, die mit dem Level skalieren.
// Konsumiert von CircularNode (Borders, Font-Sizes) und Edges.jsx (strokeWidth).
//
// scaleFactor pro Level wird aus THEME_DIAMETER abgeleitet — identisches Mapping
// wie Badge-Größen in CircularNode, damit alle "skalierte" Werte vom selben
// Anker abhängen.

export const SCALE_FACTORS = {
  1: 1.0,
  2: LEVEL2_THEME_DIAMETER / LEVEL1_THEME_DIAMETER,
  3: LEVEL3_THEME_DIAMETER / LEVEL1_THEME_DIAMETER,
};

// Theme- und Hub-Border in Flow-Units. L1 ist die visuelle Kalibrierung;
// L2/L3 = L1 × scaleFactor. Damit sind Borders bei Zoom-Äquivalenz optisch
// gleich dick auf allen Levels.
export const THEME_BORDER_FLOW_L1 = 80;
export const HUB_BORDER_FLOW_L1   = 2;

// Edge-strokeWidth in Flow-Units. Hub→Theme ist absichtlich dicker als
// Theme→Card (visuelle Hierarchie): die "Hauptäste" sollen bewusster wirken
// als die Verbindungen zu den Lerneinheit-Cards.
export const EDGE_STROKE_HUB_THEME_FLOW_L1  = 1800;
export const EDGE_STROKE_THEME_CARD_FLOW_L1 = 1277;

// Box-Shadow in Flow-Units — kanonische Lift-Shadow für Theme-Circles, Hub,
// Annex und Grid-Container. Zwei Lagen: erste (näher, dunkler) trägt den
// Hauptkontrast, zweite (weiter, weicher) erweitert den Verlauf nach außen.
// Negative X / positive Y == Lichtquelle oben rechts. Werte am L1-Theme-Look
// kalibriert (war: '-2000px 2000px 5000px rgba(0,0,0,0.25), -3000px 3000px
// 5000px rgba(0,0,0,0.08)'); L2/L3 multiplizieren mit SCALE_FACTORS[level],
// damit beim Reinzoomen optisch dieselbe Schatten-Geometrie sichtbar ist.
// Vorher waren Theme/Hub/Annex/Grid jeweils eigene Werte mit Drift gegenueber
// scaleFactor — das fiel u.a. auf, weil Grid-Container gar keinen Schatten
// hatten. Konsumenten: CircularNode, AnnexNode, GridContainerNode.
export const NODE_SHADOW_FLOW_L1 = {
  layer1: { offsetX: -2000, offsetY: 2000, blur: 5000, color: 'rgba(0, 0, 0, 0.25)' },
  layer2: { offsetX: -3000, offsetY: 3000, blur: 5000, color: 'rgba(0, 0, 0, 0.08)' },
};

// CSS-box-shadow-String fuer das gegebene Level. Skaliert die Flow-Unit-
// Konstanten mit SCALE_FACTORS[level] — analog zu THEME_BORDER und
// EDGE_STROKE_*. Ein Aufrufer = eine Zeile, kein Hardcoding mehr.
export const nodeShadow = (level) => {
  const s = SCALE_FACTORS[level] ?? 1;
  const { layer1, layer2 } = NODE_SHADOW_FLOW_L1;
  const fmt = (l) => `${l.offsetX * s}px ${l.offsetY * s}px ${l.blur * s}px ${l.color}`;
  return `${fmt(layer1)}, ${fmt(layer2)}`;
};

// Font-Size-Ratios (Font / Knoten-Diameter). EIN globaler Wert pro Knotentyp,
// über ALLE Levels identisch. Damit ist visuelle Selbstähnlichkeit zwischen
// Levels strikt garantiert: L2/L3 reingezoomt bis Knoten gleich groß wie L1
// default = identischer Look bis ins Detail. Keine Pro-Level-Multiplier.
// Lesbarkeit bei kleinen Levels kommt aus dem User-Zoom, nicht aus
// gefakten Größen-Verhältnissen.

// Kalibriert am längsten realen Theme-Wort "VERÄNDERUNGSPROZESS" (19 Zeichen)
// bei 10 % Padding zum Circle-Rand. Annahme: durchschnittliche Glyph-Breite
// ~0.55 × Font-Size (kalibriert für Blogger Sans Bold; DM Sans Bold liegt nahe
// genug, dass die bisherige Ratio passt — bei Bedarf neu justieren).
const THEME_FONT_RATIO = 0.11;

// Hub-Labels sind kürzer (max "LEADERSHIP" / "MANAGEMENT", 10 Zeichen) und
// haben kein Längen-Problem. L1-Original-Kalibrierung 8750/73741 bleibt.
const HUB_FONT_RATIO = 8750 / 73741;   // ≈ 0.1187

const themeDiameterByLevel  = { 1: LEVEL1_THEME_DIAMETER,  2: LEVEL2_THEME_DIAMETER,  3: LEVEL3_THEME_DIAMETER  };
const centerDiameterByLevel = { 1: LEVEL1_CENTER_DIAMETER, 2: LEVEL2_CENTER_DIAMETER, 3: LEVEL3_CENTER_DIAMETER };

// Pro Level vorgekautete Render-Werte. Komponenten lesen daraus statt selbst
// zu multiplizieren — verhindert Drift zwischen Diagnose und tatsächlich
// gerenderten Werten.
export const RENDER_BY_LEVEL = {
  1: {
    themeBorder:         THEME_BORDER_FLOW_L1 * SCALE_FACTORS[1],
    hubBorder:           HUB_BORDER_FLOW_L1   * SCALE_FACTORS[1],
    edgeStrokeHubTheme:  EDGE_STROKE_HUB_THEME_FLOW_L1  * SCALE_FACTORS[1],
    edgeStrokeThemeCard: EDGE_STROKE_THEME_CARD_FLOW_L1 * SCALE_FACTORS[1],
    themeFontSize:       themeDiameterByLevel[1]  * THEME_FONT_RATIO,
    hubFontSize:         centerDiameterByLevel[1] * HUB_FONT_RATIO,
    shadowOffsetY:       NODE_SHADOW_FLOW_L1.layer1.offsetY * SCALE_FACTORS[1],
    shadowBlur:          NODE_SHADOW_FLOW_L1.layer1.blur    * SCALE_FACTORS[1],
    boxShadow:           nodeShadow(1),
  },
  2: {
    themeBorder:         THEME_BORDER_FLOW_L1 * SCALE_FACTORS[2],
    hubBorder:           HUB_BORDER_FLOW_L1   * SCALE_FACTORS[2],
    edgeStrokeHubTheme:  EDGE_STROKE_HUB_THEME_FLOW_L1  * SCALE_FACTORS[2],
    edgeStrokeThemeCard: EDGE_STROKE_THEME_CARD_FLOW_L1 * SCALE_FACTORS[2],
    themeFontSize:       themeDiameterByLevel[2]  * THEME_FONT_RATIO,
    hubFontSize:         centerDiameterByLevel[2] * HUB_FONT_RATIO,
    shadowOffsetY:       NODE_SHADOW_FLOW_L1.layer1.offsetY * SCALE_FACTORS[2],
    shadowBlur:          NODE_SHADOW_FLOW_L1.layer1.blur    * SCALE_FACTORS[2],
    boxShadow:           nodeShadow(2),
  },
  3: {
    themeBorder:         THEME_BORDER_FLOW_L1 * SCALE_FACTORS[3],
    hubBorder:           HUB_BORDER_FLOW_L1   * SCALE_FACTORS[3],
    edgeStrokeHubTheme:  EDGE_STROKE_HUB_THEME_FLOW_L1  * SCALE_FACTORS[3],
    edgeStrokeThemeCard: EDGE_STROKE_THEME_CARD_FLOW_L1 * SCALE_FACTORS[3],
    themeFontSize:       themeDiameterByLevel[3]  * THEME_FONT_RATIO,
    hubFontSize:         centerDiameterByLevel[3] * HUB_FONT_RATIO,
    shadowOffsetY:       NODE_SHADOW_FLOW_L1.layer1.offsetY * SCALE_FACTORS[3],
    shadowBlur:          NODE_SHADOW_FLOW_L1.layer1.blur    * SCALE_FACTORS[3],
    boxShadow:           nodeShadow(3),
  },
};

// Convenience-Helpers für Edges.jsx, damit jede Edge-Definition kompakt bleibt:
//   strokeWidth: edgeStrokeHubTheme(1)   → 1800
//   strokeWidth: edgeStrokeThemeCard(2)  → 159.6
export const edgeStrokeHubTheme  = (level) => RENDER_BY_LEVEL[level].edgeStrokeHubTheme;
export const edgeStrokeThemeCard = (level) => RENDER_BY_LEVEL[level].edgeStrokeThemeCard;

// === DIAGNOSE: Center-to-Center- UND Edge-to-Edge-Distanzen pro Level ===
// Zeigt für jedes Level: Hub-Center, Theme-Centers, Card-Centers, die C2C-
// Distanzen (Theme↔Hub, Theme↔Card, Theme↔Theme adjacent) UND die daraus
// resultierenden sichtbaren Edge-to-Edge-Lücken. Letztere sind das, was nach
// dem Edge-Spacing-Refactor pro Level konstant sein muss.
const round = (n) => Math.round(n * 10) / 10;

const diagnoseLevel = (config, levelName, positions) => {
  const { layout, themes } = config;
  const { THEME_DIAMETER, CENTER_DIAMETER, CARD_WIDTH, ROW_GAP } = layout;
  const themeRadius = THEME_DIAMETER / 2;
  const hubRadius = CENTER_DIAMETER / 2;
  const cardHalfWidth = CARD_WIDTH / 2;

  const hubCenter = {
    x: round(positions.center.x + CENTER_DIAMETER / 2),
    y: round(positions.center.y + CENTER_DIAMETER / 2),
  };

  const themeRows = themes.map((theme) => {
    const themePos = positions.themes[theme.id];
    const themeC = {
      x: themePos.x + THEME_DIAMETER / 2,
      y: themePos.y + THEME_DIAMETER / 2,
    };
    const hubΔX = Math.abs(themeC.x - hubCenter.x);

    // Annex-Themes haben keine Card → Card-Distanzen entfallen für sie
    // (das Spacing-Modell gilt nur für Theme↔Hub und Theme↔Theme).
    const hasCard = Boolean(theme.cardId);
    let cardC = null;
    let cardΔX = null;
    if (hasCard) {
      const cardPos = positions.cards[theme.cardId];
      const cardH = cardHeightForId(theme.cardId);
      cardC = {
        x: cardPos.x + CARD_WIDTH / 2,
        y: cardPos.y + cardH / 2,
      };
      cardΔX = Math.abs(themeC.x - cardC.x);
    }

    return {
      id: theme.id,
      side: theme.side,
      row: theme.row,
      kind: hasCard ? 'card' : 'annex',
      themeCenter: { x: round(themeC.x), y: round(themeC.y) },
      cardCenter: cardC ? { x: round(cardC.x), y: round(cardC.y) } : null,
      hubΔX: round(hubΔX),
      hubΔ: round(Math.hypot(themeC.x - hubCenter.x, themeC.y - hubCenter.y)),
      cardΔX: cardΔX !== null ? round(cardΔX) : null,
      cardΔ: cardC ? round(Math.hypot(themeC.x - cardC.x, themeC.y - cardC.y)) : null,
      // Edge-to-Edge entlang Layout-Achse:
      hubEdgeX: round(hubΔX - hubRadius - themeRadius),
      cardEdgeX: cardΔX !== null ? round(cardΔX - themeRadius - cardHalfWidth) : null,
    };
  });

  // Theme↔Theme Y-Distanz + Edge-Gap zwischen aufeinanderfolgenden Reihen
  // (gleiche Seite). Edge = ΔY - 2 × themeRadius.
  const adjacentYBySide = {};
  const themeThemeEdgesBySide = {};
  for (const side of ['left', 'right']) {
    const sideRows = themeRows
      .filter((t) => t.side === side)
      .sort((a, b) => a.row - b.row);
    if (sideRows.length >= 2) {
      adjacentYBySide[side] = sideRows.slice(1).map((t, i) => ({
        rows: `${sideRows[i].row}→${t.row}`,
        ΔY: round(Math.abs(t.themeCenter.y - sideRows[i].themeCenter.y)),
      }));
      themeThemeEdgesBySide[side] = sideRows.slice(1).map((t, i) => ({
        rows: `${sideRows[i].row}→${t.row}`,
        edge: round(Math.abs(t.themeCenter.y - sideRows[i].themeCenter.y) - 2 * themeRadius),
      }));
    }
  }

  // Card-bezogene Konsistenz nur über Card-Themes; Annex-Themes haben keine
  // Card und werden in diesen Sets übersprungen.
  const cardThemeRows = themeRows.filter((t) => t.kind === 'card');
  const themeHubXValues = [...new Set(themeRows.map((t) => t.hubΔX))];
  const themeCardXValues = [...new Set(cardThemeRows.map((t) => t.cardΔX))];
  const hubEdgeValues = [...new Set(themeRows.map((t) => t.hubEdgeX))];
  const cardEdgeValues = [...new Set(cardThemeRows.map((t) => t.cardEdgeX))];
  const themeThemeEdgeValues = [
    ...new Set(Object.values(themeThemeEdgesBySide).flat().map((e) => e.edge)),
  ];

  // eslint-disable-next-line no-console
  console.log(`[LayoutDiag] ${levelName}`, {
    layout: { THEME_DIAMETER, CENTER_DIAMETER, CARD_WIDTH, ROW_GAP, COLUMN_GAPS: layout.COLUMN_GAPS },
    hubCenter,
    themes: themeRows,
    spacing: {
      'Theme↔Hub ΔX (alle Themes)': themeHubXValues.length === 1 ? `konsistent: ${themeHubXValues[0]}` : `inkonsistent: ${themeHubXValues}`,
      'Theme↔Card ΔX (alle Themes)': themeCardXValues.length === 1 ? `konsistent: ${themeCardXValues[0]}` : `inkonsistent: ${themeCardXValues}`,
      'Theme↔Theme ΔY (adjacent rows)': adjacentYBySide,
    },
    edges: {
      'Hub↔Theme Edge (horizontal)': hubEdgeValues.length === 1 ? `konsistent: ${hubEdgeValues[0]}` : `inkonsistent: ${hubEdgeValues}`,
      'Theme↔Card Edge (horizontal)': cardEdgeValues.length === 1 ? `konsistent: ${cardEdgeValues[0]}` : `inkonsistent: ${cardEdgeValues}`,
      'Theme↔Theme Edge (vertikal, adjacent)': themeThemeEdgeValues.length === 1 ? `konsistent: ${themeThemeEdgeValues[0]}` : `inkonsistent: ${themeThemeEdgeValues}`,
    },
  });
};

diagnoseLevel(LEVEL_1_CONFIG, 'L1', LEVEL1_POSITIONS);
diagnoseLevel(LEVEL_2_CONFIG, 'L2', LEVEL2_POSITIONS);
diagnoseLevel(LEVEL_3_CONFIG, 'L3', LEVEL3_POSITIONS);

// === L1-SYMMETRIE-DIAGNOSE (Y-Achse) ===
// Fokussierte Prüfung, ob das L1-Layout vertikal exakt achsensymmetrisch zum
// Hub liegt. Drei Invarianten:
//   (A) Pro Seite: mittleres Theme sitzt auf Hub-Y, Top/Bottom haben gleichen
//       absoluten Versatz mit umgekehrtem Vorzeichen.
//   (B) Pro Reihe: Theme-Y links == Theme-Y rechts (1↔4, 2↔5, 3↔6).
//   (C) Edge-to-Edge: alle Theme↔Theme-Lücken == NODE_GAP_FLOW_L1.
// Toleranz 0.001 Flow-Units fängt reine Float-Drift ab und meldet alles drüber
// als echte Asymmetrie. Rein math; sagt nichts über visuelle Verschiebungen
// durch Borders, Badges, Annex-Mass etc. — die müssten an der Render-Stelle
// untersucht werden (CircularNode/AnnexNode), nicht hier.
{
  const TOL = 0.001;
  const themeRadiusL1 = LEVEL1_THEME_DIAMETER / 2;
  const hubY = LEVEL1_POSITIONS.center.y + LEVEL1_CENTER_DIAMETER / 2;

  const themeRows = LEVEL_1_CONFIG.themes.map((t) => {
    const pos = LEVEL1_POSITIONS.themes[t.id];
    const centerY = pos.y + LEVEL1_THEME_DIAMETER / 2;
    return {
      id: t.id,
      side: t.side,
      row: t.row,
      centerY: round(centerY),
      deltaFromHub: round(centerY - hubY),
    };
  });

  // (A) Pro Seite: Symmetrie-Tripel (top, middle, bottom)
  const sides = ['left', 'right'].map((side) => {
    const rows = themeRows
      .filter((t) => t.side === side)
      .sort((a, b) => a.row - b.row);
    const top = rows.find((r) => r.row === 0);
    const mid = rows.find((r) => r.row === 1);
    const bot = rows.find((r) => r.row === 2);
    return {
      side,
      midOnHub: mid ? Math.abs(mid.deltaFromHub) < TOL : null,
      midDelta: mid?.deltaFromHub,
      topAbs: top ? Math.abs(top.deltaFromHub) : null,
      botAbs: bot ? Math.abs(bot.deltaFromHub) : null,
      symmetric: top && bot ? Math.abs(Math.abs(top.deltaFromHub) - Math.abs(bot.deltaFromHub)) < TOL : null,
    };
  });

  // (B) Reihen-Paare links↔rechts
  const pairs = [0, 1, 2].map((row) => {
    const left = themeRows.find((t) => t.side === 'left' && t.row === row);
    const right = themeRows.find((t) => t.side === 'right' && t.row === row);
    return {
      row,
      leftId: left?.id,
      rightId: right?.id,
      leftY: left?.centerY,
      rightY: right?.centerY,
      ΔY: left && right ? round(left.centerY - right.centerY) : null,
      identical: left && right ? Math.abs(left.centerY - right.centerY) < TOL : null,
    };
  });

  // (C) Edge-to-Edge per Seite: ΔY(adjacent) - 2 × themeRadius
  // Match-Vergleich mit UNGERUNDETEN Y-Werten, damit gerundete Display-Werte
  // keinen False-Negative gegen den ungerundeten NODE_GAP_FLOW_L1 produzieren
  // (die ~0.0125 Drift, die sonst durchschlaegt, ist reines Rundungs-Artefakt
  // der Display-Spalte, nicht der Layout-Math).
  const edgeGapsBySide = {};
  for (const side of ['left', 'right']) {
    const rows = themeRows
      .filter((t) => t.side === side)
      .sort((a, b) => a.row - b.row);
    edgeGapsBySide[side] = rows.slice(1).map((t, i) => {
      const prev = rows[i];
      const rawPrev = LEVEL1_POSITIONS.themes[prev.id].y + LEVEL1_THEME_DIAMETER / 2;
      const rawCur  = LEVEL1_POSITIONS.themes[t.id].y    + LEVEL1_THEME_DIAMETER / 2;
      const rawGap = Math.abs(rawCur - rawPrev) - LEVEL1_THEME_DIAMETER;
      return {
        between: `row ${prev.row}→${t.row}`,
        gap: round(rawGap),
        matchesNodeGap: Math.abs(rawGap - NODE_GAP_FLOW_L1) < TOL,
      };
    });
  }
  const expectedNodeGap = round(NODE_GAP_FLOW_L1);

  // eslint-disable-next-line no-console
  console.log('[L1SymmetryDiag]', {
    constants: {
      THEME_DIAMETER:    round(LEVEL1_THEME_DIAMETER),
      CENTER_DIAMETER:   round(LEVEL1_CENTER_DIAMETER),
      ROW_GAP:           round(LEVEL_1_CONFIG.layout.ROW_GAP),
      NODE_GAP_FLOW_L1:  expectedNodeGap,
      hubCenterY:        round(hubY),
    },
    themes: themeRows,
    '(A) per-side symmetry': sides,
    '(B) row pairs L↔R':     pairs,
    '(C) edge-to-edge gaps (must == NODE_GAP_FLOW_L1)': edgeGapsBySide,
    verdict: {
      A_allMidOnHub:    sides.every((s) => s.midOnHub),
      A_allTopBotMatch: sides.every((s) => s.symmetric),
      B_allPairsEqual:  pairs.every((p) => p.identical),
      C_allGapsMatchNodeGap: Object.values(edgeGapsBySide).flat().every((g) => g.matchesNodeGap),
    },
  });
}

// === SCALING-DIAGNOSE: Layout- + Render-Werte vs scaleFactor ===
// Ziel: visuelle Selbstähnlichkeit über alle Levels. Wenn man L2/L3 so weit
// reinzoomt, dass Theme-Circles dieselbe Bildschirmgröße wie L1 default haben,
// muss JEDER Wert (Geometrie, Border, Font, Edge-Stroke, Handle) im selben
// Verhältnis stehen. Erwartete Verhältnisse:
//   scaleFactor_L2 = THEME_DIAMETER_L2 / THEME_DIAMETER_L1
//   scaleFactor_L3 = THEME_DIAMETER_L3 / THEME_DIAMETER_L1
// Werte aus mehreren Files referenziert (CircularNode, Edges, AnnexNode);
// Drift hier ↔ Source = visuell sichtbarer Bug. Hardcoded — soll genau das
// fangen, was nicht gemeinsam geupdatet wurde.
const SCALE_L2 = LEVEL2_THEME_DIAMETER / LEVEL1_THEME_DIAMETER;
const SCALE_L3 = LEVEL3_THEME_DIAMETER / LEVEL1_THEME_DIAMETER;

const fmtR = (n) => Math.round(n * 10000) / 10000;
const devPct = (actual, expected) => {
  const pct = ((actual - expected) / expected) * 100;
  return `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`;
};

const scalingRow = (label, l1, l2, l3, source) => {
  const r2 = l2 != null ? l2 / l1 : null;
  const r3 = l3 != null ? l3 / l1 : null;
  return {
    value: label,
    L1: l1,
    L2: l2 ?? '—',
    L3: l3 ?? '—',
    'L2/L1':  r2 != null ? fmtR(r2) : '—',
    'L2 dev': r2 != null ? devPct(r2, SCALE_L2) : '—',
    'L3/L1':  r3 != null ? fmtR(r3) : '—',
    'L3 dev': r3 != null ? devPct(r3, SCALE_L3) : '—',
    source,
  };
};

const SCALING_TABLE = [
  // Layout-Geometrie (single source of truth = levelLayout.js)
  scalingRow('THEME_DIAMETER',  LEVEL1_THEME_DIAMETER,  LEVEL2_THEME_DIAMETER,  LEVEL3_THEME_DIAMETER,  'levelLayout'),
  scalingRow('CENTER_DIAMETER', LEVEL1_CENTER_DIAMETER, LEVEL2_CENTER_DIAMETER, LEVEL3_CENTER_DIAMETER, 'levelLayout'),
  scalingRow('CARD_WIDTH',      LEVEL1_CARD_WIDTH,      LEVEL2_CARD_WIDTH,      LEVEL3_CARD_WIDTH,      'levelLayout'),
  scalingRow('NODE_GAP',        NODE_GAP_FLOW_L1,       LEVEL2_GAP,             LEVEL3_GAP,             'levelLayout'),
  // Annex (L1+L2; L3 hat keinen Annex)
  scalingRow('Annex Width',     LEVEL1_ANNEX_WIDTH,     LEVEL2_ANNEX_WIDTH,     null,                   'levelLayout'),
  scalingRow('Annex Height',    LEVEL1_ANNEX_HEIGHT,    LEVEL2_ANNEX_HEIGHT,    null,                   'levelLayout'),
  scalingRow('Annex Border',    80,                     10,                     null,                   'AnnexNode'),
  // Theme-Circle (CircularNode liest aus RENDER_BY_LEVEL → identisch zur SoT)
  scalingRow('Theme Border',    RENDER_BY_LEVEL[1].themeBorder, RENDER_BY_LEVEL[2].themeBorder, RENDER_BY_LEVEL[3].themeBorder, 'levelLayout → CircularNode'),
  scalingRow('Theme Font Size', RENDER_BY_LEVEL[1].themeFontSize, RENDER_BY_LEVEL[2].themeFontSize, RENDER_BY_LEVEL[3].themeFontSize, 'levelLayout → CircularNode'),
  // Hub-Circle (CircularNode liest aus RENDER_BY_LEVEL)
  scalingRow('Hub Border',      RENDER_BY_LEVEL[1].hubBorder,   RENDER_BY_LEVEL[2].hubBorder,   RENDER_BY_LEVEL[3].hubBorder,   'levelLayout → CircularNode'),
  scalingRow('Hub Font Size',   RENDER_BY_LEVEL[1].hubFontSize, RENDER_BY_LEVEL[2].hubFontSize, RENDER_BY_LEVEL[3].hubFontSize, 'levelLayout → CircularNode'),
  // Edges (Edges.jsx liest aus edgeStrokeHubTheme/edgeStrokeThemeCard helpers)
  scalingRow('Edge stroke (Hub→Theme)',  RENDER_BY_LEVEL[1].edgeStrokeHubTheme,  RENDER_BY_LEVEL[2].edgeStrokeHubTheme,  RENDER_BY_LEVEL[3].edgeStrokeHubTheme,  'levelLayout → Edges.jsx'),
  scalingRow('Edge stroke (Theme→Card)', RENDER_BY_LEVEL[1].edgeStrokeThemeCard, RENDER_BY_LEVEL[2].edgeStrokeThemeCard, RENDER_BY_LEVEL[3].edgeStrokeThemeCard, 'levelLayout → Edges.jsx'),
  // Box-Shadow (nodeShadow() — gemeinsam fuer Theme/Hub/Annex/Grid-Container).
  // Beide Werte muessen 0.0% Drift gegen scaleFactor zeigen — sonst hat
  // jemand wieder eine Stelle hardcodiert.
  scalingRow('Shadow offsetY (layer1)', RENDER_BY_LEVEL[1].shadowOffsetY, RENDER_BY_LEVEL[2].shadowOffsetY, RENDER_BY_LEVEL[3].shadowOffsetY, 'levelLayout → CircularNode/AnnexNode/GridContainerNode'),
  scalingRow('Shadow blur (layer1)',    RENDER_BY_LEVEL[1].shadowBlur,    RENDER_BY_LEVEL[2].shadowBlur,    RENDER_BY_LEVEL[3].shadowBlur,    'levelLayout → CircularNode/AnnexNode/GridContainerNode'),
  // Handle-Sizes BEWUSST nicht skaliert (Klick-Trefferfläche soll auf
  // kleineren Levels großzügig bleiben — wir wollen den Klick auf einen
  // L3-Knoten leichter treffen, nicht schwerer). Diag-Eintrag dokumentiert
  // den Drift als gewollt.
  scalingRow('Theme Handle (intentional)', 12, 12, 12, 'CircularNode (NICHT skaliert)'),
  scalingRow('Hub Handle (intentional)',   34, 12, 20, 'CircularNode (NICHT skaliert)'),
];

// eslint-disable-next-line no-console
console.log('[ScalingDiag] expected', { scaleFactor_L2: fmtR(SCALE_L2), scaleFactor_L3: fmtR(SCALE_L3) });
// eslint-disable-next-line no-console
console.table(SCALING_TABLE);
