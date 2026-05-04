// Grid-Utilities für Container-Dimensionen und Positionierung
// Berechnet Container-Dimensionen und Lerneinheit-Positionen in Grid-Zellen

// === ZENTRALE STYLE-TOKENS ===
// Single Source of Truth für alle Grid-Container-Größen.
// Padding und Gap werden als Verhältnis zur Tile-Höhe definiert — damit
// skaliert das gesamte Verhältnis automatisch mit, wenn Tiles sich ändern.

// Standardgröße einer Lerneinheit (Tile)
export const TILE = {
  width: 18000,
  height: 12000,
};

// Padding (Container-Edge → erste/letzte Tile) als Verhältnis zur Tile-Höhe.
export const PADDING_RATIO = 0.40;
// Gap zwischen zwei Tiles als Verhältnis zur Tile-Höhe.
export const GAP_RATIO = 0.30;

// Effektive Werte (Level 1 — Basis).
export const CARD_PADDING = TILE.height * PADDING_RATIO;
export const CARD_GAP = TILE.height * GAP_RATIO;

// Grid-Konfigurationen (Spalten × Zeilen). Wird auch für Layout verwendet.
export const GRID_CONFIGS = {
  '3er': { cols: 3, rows: 1 },
  '6er': { cols: 3, rows: 2 },
  '9er': { cols: 3, rows: 3 },
};

// Container-Dimensionen abgeleitet aus Tile + Padding + Gap.
// Formel:
//   width  = 2 × padding + cols × tile.width  + (cols-1) × gap
//   height = 2 × padding + rows × tile.height + (rows-1) × gap
const containerWidthFor = (cols, tileW = TILE.width, padding = CARD_PADDING, gap = CARD_GAP) =>
  2 * padding + cols * tileW + (cols - 1) * gap;
const containerHeightFor = (rows, tileH = TILE.height, padding = CARD_PADDING, gap = CARD_GAP) =>
  2 * padding + rows * tileH + (rows - 1) * gap;

// Basis-Größen pro Grid-Typ (Level 1).
export const GRID_BASE_SIZES = {
  '3er': { width: containerWidthFor(3), height: containerHeightFor(1) },
  '6er': { width: containerWidthFor(3), height: containerHeightFor(2) },
  '9er': { width: containerWidthFor(3), height: containerHeightFor(3) },
};

// Level-Skalierungsfaktoren
const LEVEL_SCALE_FACTORS = {
  1: 1.0,        // Basis-Größe
  2: 0.125,      // Angepasst für 9er-Grid: ~7200x5401px
  3: 0.01215,    // 1.215% der Basis - Container: ~700x525px
  4: 0.04375     // 4.375% der Basis (Level 4) - Lerneinheit height = 525px
};

// Border-Radius des GridContainers in Flow-Units auf L1.
// Pro Level über getLevelScaleFactor multipliziert — analog zur BADGE_SIZE_FLOW-Logik.
// Einheitlich für alle Grid-Varianten (3er/6er/9er); ersetzt die alte
// gridType-abhängige `Math.min(containerWidth, containerHeight) / 5`-Formel.
export const CONTAINER_BORDER_RADIUS_FLOW_L1 = 7440;

// Cap-Verhältnis für flache Container (3er) — verhindert Pillen-Look
// durch übergroßen absoluten Radius.
export const CONTAINER_BORDER_RADIUS_RATIO = 0.20;

// Hilfsfunktionen für ID-Parsing
const extractGridTypeFromId = (id) => {
  if (id.includes('3er')) return '3er';
  if (id.includes('6er')) return '6er';
  if (id.includes('9er')) return '9er';
  return '9er'; // Default
};

const extractLevelFromId = (id) => {
  const match = id.match(/level-(\d+)/);
  return match ? parseInt(match[1]) : 1;
};

/**
 * Container-Dimensionen basierend auf Container-ID.
 * Single Source of Truth: berechnet aus GRID_BASE_SIZES und LEVEL_SCALE_FACTORS.
 * @param {string} containerId - ID des Containers
 * @returns {Object} Container-Dimensionen { width, height }
 */
export const getContainerDimensions = (containerId) => getGridDimensions(containerId);

/**
 * Grid-Dimensionen basierend auf Grid-Typ und Level
 * @param {string} containerId - ID des Containers
 * @param {string} gridType - Grid-Typ ('3er', '6er', '9er')
 * @param {number} level - Level (1, 2, 3)
 * @returns {Object} Container-Dimensionen { width, height }
 */
export const getGridDimensions = (containerId, gridType = null, level = null) => {
  const finalGridType = gridType || extractGridTypeFromId(containerId);
  const finalLevel = level || extractLevelFromId(containerId);
  
  const baseSize = GRID_BASE_SIZES[finalGridType];
  const scaleFactor = LEVEL_SCALE_FACTORS[finalLevel];
  
  return {
    width: baseSize.width * scaleFactor,
    height: baseSize.height * scaleFactor
  };
};

/**
 * Level-Skalierungsfaktor abrufen
 * @param {number} level - Level (1, 2, 3)
 * @returns {number} Skalierungsfaktor
 */
export const getLevelScaleFactor = (level) => {
  return LEVEL_SCALE_FACTORS[level] || 1.0;
};

/**
 * Border-Radius für Grid-Container basierend auf Grid-Typ und Level berechnen
 * @param {string} gridType - Grid-Typ ('3er', '6er', '9er')
 * @param {number} level - Level (1, 2, 3)
 * @returns {number} Border-Radius in Pixeln
 */
export const getGridContainerBorderRadius = (gridType, level) => {
  // Basis-Border-Radius für Level 1 (in Pixeln)
  const BASE_BORDER_RADIUS = {
    '3er': 600,  // Standard-Rundung für 3er-Grid
    '6er': 600,  // Standard-Rundung für 6er-Grid
    '9er': 600   // Standard-Rundung für 9er-Grid
  };

  // Level-spezifische Modifikatoren für Border-Radius
  // Struktur: Level -> Grid-Typ -> Modifier (oder direkt Modifier für einheitliche Level)
  const LEVEL_BORDER_RADIUS_MODIFIERS = {
    1: 1.0,    // Level 1: Vollständige Basis-Rundung (einheitlich für alle Grid-Typen)
    
    2: {       // Level 2: Grid-spezifische reduzierte Rundungen
      '3er': 0.3,   // 30% der Basis-Rundung für 3er-Grid Level 2
      '6er': 0.3,   // 30% der Basis-Rundung für 6er-Grid Level 2
      '9er': 0.15   // 15% der Basis-Rundung für 9er-Grid Level 2 (stärker abgeschwächt)
    },
    
    3: {       // Level 3: Extrem minimale Rundungen (einheitlich für alle Grid-Typen)
      '3er': 0.02,  // 2% der Basis-Rundung für 3er-Grid Level 3
      '6er': 0.02,  // 2% der Basis-Rundung für 6er-Grid Level 3  
      '9er': 0.02   // 2% der Basis-Rundung für 9er-Grid Level 3
      // Alle Grid-Typen haben die gleiche minimale Rundung für einheitliches Aussehen
    },
    
    4: 0.1,    // Level 4: 10% der Basis-Rundung (einheitlich für alle Grid-Typen)
    
    // Zukünftige Level können hier einfach hinzugefügt werden:
    // 5: { '3er': 0.05, '6er': 0.05, '9er': 0.05 }  // Beispiel für Level 5
  };

  const baseRadius = BASE_BORDER_RADIUS[gridType] || BASE_BORDER_RADIUS['9er'];
  const levelModifier = LEVEL_BORDER_RADIUS_MODIFIERS[level];

  // Robuste Modifier-Verarbeitung für alle Level-Typen
  let finalModifier;
  
  if (typeof levelModifier === 'object') {
    // Grid-spezifische Modifikatoren (Level 2, 3, etc.)
    finalModifier = levelModifier[gridType] || levelModifier['9er'] || 1.0;
  } else if (typeof levelModifier === 'number') {
    // Einheitliche Modifikatoren (Level 1, 4, etc.)
    finalModifier = levelModifier;
  } else {
    // Fallback für unbekannte Level
    finalModifier = 1.0;
  }
  
  return Math.round(baseRadius * finalModifier);
};

/**
 * Berechnet die Position einer Lerneinheit innerhalb einer Grid-Zelle
 * ROBUSTE VERSION: Funktioniert unabhängig von Container-Größe und Level
 * @param {number} cellNumber - Zellennummer (1-3 für 3er-Grid, 1-6 für 6er-Grid, 1-9 für 9er-Grid)
 * @param {number} containerWidth - Container-Breite
 * @param {number} containerHeight - Container-Höhe
 * @param {string} gridType - Grid-Typ ('3er', '6er', '9er') - ERFORDERLICH für robuste Berechnung
 * @param {number} lerneinheitWidth - Breite der Lerneinheit (optional, Standard: 18000)
 * @param {number} lerneinheitHeight - Höhe der Lerneinheit (optional, Standard: 12000)
 * @returns {Object} Position { x, y }
 */
export const calculateLerneinheitPositionInCell = (cellNumber, containerWidth, containerHeight, gridType = null, lerneinheitWidth = TILE.width, lerneinheitHeight = TILE.height) => {
  // Grid-Typ automatisch bestimmen basierend auf Aspect-Ratio.
  // Aktuelle Verhältnisse mit Padding=0.45*h, Gap=0.30*h:
  //   3er ≈ 3.16, 6er ≈ 1.88, 9er ≈ 1.33
  let detectedGridType = gridType;
  if (!detectedGridType) {
    const aspectRatio = containerWidth / containerHeight;
    if (aspectRatio > 2.5) detectedGridType = '3er';
    else if (aspectRatio > 1.6) detectedGridType = '6er';
    else detectedGridType = '9er';
  }

  const config = GRID_CONFIGS[detectedGridType];
  if (!config) {
    console.error(`Unbekannter Grid-Typ: ${detectedGridType}`);
    return { x: 0, y: 0 };
  }

  // Zellen-Position (0-basiert)
  const col = (cellNumber - 1) % config.cols;
  const row = Math.floor((cellNumber - 1) / config.cols);

  // Padding und Gap proportional zur tatsaechlichen Tile-Hoehe — skaliert
  // mit fuer Level 2 / Level 3 / etc., ohne separate Konstanten zu brauchen.
  const padding = lerneinheitHeight * PADDING_RATIO;
  const gap = lerneinheitHeight * GAP_RATIO;

  const x = padding + col * (lerneinheitWidth + gap);
  const y = padding + row * (lerneinheitHeight + gap);

  return { x, y };
};

/**
 * Kanonische Tile-Position innerhalb eines Grid-Containers.
 * Single source: leitet gridType + level aus containerId ab, holt Container-
 * Dimensionen + Tile-Dimensionen passend zum Level und delegiert an
 * calculateLerneinheitPositionInCell (Methode A: padding + col×(tile+gap)).
 *
 * Gibt das top-left {x, y} fuer ReactFlow-Node-Position zurueck — direkt in
 * `position:` einsetzbar. Tile-data.width/height zum gleichen Level kommen
 * aus tileDimensionsForLevel().
 *
 * @param {number} cellNum - 1-basierte Zellennummer (1-9 fuer 9er, 1-6 fuer 6er, 1-3 fuer 3er)
 * @param {string} containerId - z.B. '9erContainer-level-1', '3erContainer-level-2'
 * @returns {{ x: number, y: number }}
 */
export const lerneinheitPositionFor = (cellNum, containerId) => {
  const gridType = extractGridTypeFromId(containerId);
  const level = extractLevelFromId(containerId);
  const { width, height } = getGridDimensions(containerId, gridType, level);
  const scale = getLevelScaleFactor(level);
  return calculateLerneinheitPositionInCell(
    cellNum,
    width,
    height,
    gridType,
    TILE.width * scale,
    TILE.height * scale,
  );
};

/**
 * Tile-Dimensionen fuer das gegebene Level. Werte direkt aus TILE × scaleFactor;
 * gehoert zur lerneinheitPositionFor-Familie als Single-source fuer alle Tile-
 * Groessen-Berechnungen, damit Position und Bounding-Box konsistent bleiben.
 */
export const tileDimensionsForLevel = (level) => ({
  width: TILE.width * getLevelScaleFactor(level),
  height: TILE.height * getLevelScaleFactor(level),
});

/**
 * Debug-Funktion: Zeigt alle Container-Dimensionen an
 */
export const debugContainerDimensions = () => {
  console.log('=== DEBUG: Container-Dimensionen ===');
  console.log('9er-Container:', getContainerDimensions('9erContainer-level-1'));
  console.log('6er-Container:', getContainerDimensions('6erContainer-level-1'));
};

/**
 * Debug-Funktion: Zeigt alle Zellen-Positionen an
 * @param {string} containerId - ID des Containers
 */
export const debugCellPositions = (containerId = '9erContainer-level-1') => {
  console.log(`=== DEBUG: Zellen-Positionen für ${containerId} ===`);
  const { width, height } = getContainerDimensions(containerId);
  const is6erGrid = containerId === '6erContainer-level-1';
  const maxCells = is6erGrid ? 6 : 9;
  
  for (let i = 1; i <= maxCells; i++) {
    const position = calculateLerneinheitPositionInCell(i, width, height);
    console.log(`Zelle ${i}: x=${position.x}, y=${position.y}`);
  }
};
