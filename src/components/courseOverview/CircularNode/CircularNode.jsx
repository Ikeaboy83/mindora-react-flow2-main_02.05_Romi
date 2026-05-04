import React from 'react';
import { Handle, Position } from '@xyflow/react';
import {
  LEVEL1_POSITIONS, LEVEL1_THEMES, LEVEL1_CENTER, LEVEL1_LAYOUT,
  LEVEL2_POSITIONS, LEVEL2_THEMES, LEVEL2_CENTER, LEVEL2_LAYOUT,
  LEVEL3_POSITIONS, LEVEL3_THEMES, LEVEL3_CENTER, LEVEL3_LAYOUT,
  RENDER_BY_LEVEL, SCALE_FACTORS, nodeShadow,
  getSideFor, getAnnexIdFor,
} from '../levelLayout';
import NotificationBadge from '../../home/NotificationBadge';
import CalendarIconNode from '../CalendarIconNode';

// Fortschritts-Badge — Größe in Flow-Units, pro Level mit scaleFactor
// multipliziert (Werte aus früherer Kalibrierung am L1-Look).
// Größe == Sehnenlänge zwischen Badge- und Marker-Mittelpunkt bei
// DRILL_DOWN_MARKER_ANGLE_OFFSET_DEG → Icons berühren sich exakt am
// Tangentenpunkt, ohne zu überlappen. Font-Size behält die Original-
// Ratio (0.325 × badge size).
const BADGE_SIZE_FLOW_L1 = 10976;
const BADGE_FONT_SIZE_FLOW_L1 = 10976 * 0.325;  // ≈ 3567.2
// Drill-Down-Marker (Kalender) — gleicher L1-Anker wie der Notification-Badge,
// damit Marker und Badge auf jedem Level optisch gleich gewichtet sind.
const DRILL_DOWN_MARKER_SIZE_FLOW_L1 = 10976;
// Winkel-Versatz zum Notification-Badge entlang des Kreis-Rands. Badge sitzt
// auf 45° vom Top (oben rechts/links); Marker rückt um diesen Versatz weiter
// Richtung Top. Beide Icons sitzen mit Mittelpunkt auf der Kreis-Rand-Kurve.
// Center-zu-Center-Distanz (Sehne) = 2 × theme_radius × sin(offset/2).
// Bei 20° und L1-Theme-Radius 31603 ergibt sich eine Sehne von ~10976 ==
// BADGE_SIZE_FLOW_L1 → Icons berühren sich exakt an einem Tangentenpunkt,
// ohne zu überlappen. Wenn Icon-Größe oder Offset geändert werden, muss
// die jeweils andere Konstante mitgepflegt werden, damit die Tangenten-
// Beziehung erhalten bleibt. Skaliert über scaleFactor analog für L2/L3.
const DRILL_DOWN_MARKER_ANGLE_OFFSET_DEG = 20;
const BADGE_DEFAULT_LABEL = '0/0';

// === Badge-Zahlen pro Theme — hier hardcoden ===
// Lookup über die Theme-Node-IDs (siehe LEVEL_X_CONFIG.themes in levelLayout.js).
// Zentrale Mitte (Hub) bekommt kein Badge → nicht aufführen.
// Format: 'erledigt/gesamt'.
const BADGE_LABELS_BY_ID = {
  // Level 1 — äußere Themen-Kreise
  'one-level-category-node-top-left':       '1/9',  // 1. Führungskompetenzen
  'one-level-category-node-middle-left-l1': '0/1',  // 2. Diversity & Inclusion
  'one-level-category-node-bottom-left':    '0/5',  // 3. Konfliktmanagement
  'one-level-category-node-middle-right':   '2/4',  // 5. Agiles Arbeiten
  'one-level-category-node-bottom-right':   '0/2',  // 6. Teamdynamik
  'one-level-category-node-top-right':      '6/28',  // 4. Change Management (Drill-Down-Theme)

  // Level 2 — Themen innerhalb des L1-Annex
  'two-level-category-node-left-top':       '3/7',  // Grundlagen Change Management
  'two-level-category-node-bottom-left':    '0/4',  // Kommunikation im Veränderungsprozess
  'two-level-category-node-bottom-right':   '0/1',  // Widerstände verstehen & überwinden
  'two-level-category-node-top-right':      '3/16',  // 3. Change Leadership Rollen (Drill-Down-Theme)

  // Level 3 — Themen innerhalb des L2-Annex
  'three-level-category-top-left':          '0/1',  // Visionär
  'three-level-category-middle-left':       '3/8',  // Kommunikator
  'three-level-category-bottom-left':       '0/2',  // Coach & Mentor
  'three-level-category-top-right':         '0/1',  // Umsetzer & Projektmanager
  'three-level-category-middle-right':      '0/4',  // Netzwerker
};

// Level wird aus dem ID-Präfix der Theme-Node abgeleitet (single source).
const getLevelFromCircleId = (id) => {
  if (typeof id !== 'string') return null;
  if (id.startsWith('one-level-')) return 1;
  if (id.startsWith('two-level-')) return 2;
  if (id.startsWith('three-level-')) return 3;
  return null;
};

// scaleFactor pro Level — Re-Export aus levelLayout, damit Badge-Größe und
// alle anderen skalierten Werte vom selben Anker abhängen.
const SCALE_FACTOR_BY_LEVEL = SCALE_FACTORS;

// Einheitlicher CircularNode für alle runden Nodes.
// Border-Stärken und Font-Sizes kommen aus RENDER_BY_LEVEL (single source of
// truth in levelLayout.js) — nicht hier hardcoden, sonst driften L1/L2/L3
// auseinander. Handle-Größe BEWUSST nicht skaliert (siehe Kommentar unten).
export default function CircularNode({ id, data }) {
  const { size = 'medium', type = 'category', label, customStyle } = data;

  // Handle-Sizes bleiben absichtlich pro Größe konstant (nicht mit scaleFactor
  // skaliert). Grund: Handles sind transparent und dienen nur als Klick-
  // Trefferfläche. Auf kleinen Levels (L3) wäre ein 0.15-Pixel-Handle
  // unklickbar; lieber großzügig dimensionieren. Wenn das später skaliert
  // werden soll: Werte hier in RENDER_BY_LEVEL aufnehmen.
  // boxShadow kommt aus nodeShadow(level) — single source of truth in
  // levelLayout. Identische Geometrie fuer Theme & Hub pro Level (frueher
  // hatte der Hub einen 1.5x-groesseren Schatten; das war manuelle Skalierung
  // und ist mit dem zentralen scaleFactor-Pattern obsolet).
  const sizeConfigs = {
    tiny: {
      width: LEVEL3_LAYOUT.THEME_DIAMETER,
      height: LEVEL3_LAYOUT.THEME_DIAMETER,
      fontSize: RENDER_BY_LEVEL[3].themeFontSize,
      border: `${RENDER_BY_LEVEL[3].themeBorder}px solid #01D2BC`,
      boxShadow: nodeShadow(3),
      handleSize: 12,
    },
    tinyCentral: {
      width: LEVEL3_LAYOUT.CENTER_DIAMETER,
      height: LEVEL3_LAYOUT.CENTER_DIAMETER,
      fontSize: RENDER_BY_LEVEL[3].hubFontSize,
      border: `${RENDER_BY_LEVEL[3].hubBorder}px solid #01D2BC`,
      boxShadow: nodeShadow(3),
      handleSize: 20,
    },
    small: {
      width: LEVEL2_LAYOUT.THEME_DIAMETER,
      height: LEVEL2_LAYOUT.THEME_DIAMETER,
      fontSize: RENDER_BY_LEVEL[2].themeFontSize,
      border: `${RENDER_BY_LEVEL[2].themeBorder}px solid #01D2BC`,
      boxShadow: nodeShadow(2),
      handleSize: 12,
    },
    smallCentral: {
      width: LEVEL2_LAYOUT.CENTER_DIAMETER,
      height: LEVEL2_LAYOUT.CENTER_DIAMETER,
      fontSize: RENDER_BY_LEVEL[2].hubFontSize,
      border: `${RENDER_BY_LEVEL[2].hubBorder}px solid #01D2BC`,
      boxShadow: nodeShadow(2),
      handleSize: 12,
    },
    medium: {
      width: LEVEL1_LAYOUT.THEME_DIAMETER,
      height: LEVEL1_LAYOUT.THEME_DIAMETER,
      fontSize: RENDER_BY_LEVEL[1].themeFontSize,
      border: `${RENDER_BY_LEVEL[1].themeBorder}px solid #01D2BC`,
      boxShadow: nodeShadow(1),
      handleSize: 12,
    },
    large: {
      width: LEVEL1_LAYOUT.CENTER_DIAMETER,
      height: LEVEL1_LAYOUT.CENTER_DIAMETER,
      fontSize: RENDER_BY_LEVEL[1].hubFontSize,
      border: `${RENDER_BY_LEVEL[1].hubBorder}px solid #01D2BC`,
      boxShadow: nodeShadow(1),
      handleSize: 34,
    },
  };
  
  const config = sizeConfigs[size];
  const displayLabel = label || type.toUpperCase();

  // Fortschritts-Badge: nur Theme-Nodes (data.type !== 'central'),
  // und nur wenn die Theme-Side ('left'/'right') auflösbar ist.
  // getSideFor matcht via theme.id; Hub-Kreise stehen nicht in den
  // theme-Listen → automatisch null → kein Badge.
  const level = getLevelFromCircleId(id);
  const side = type !== 'central' ? getSideFor(id, level) : null;
  const renderBadge = side === 'left' || side === 'right';
  const badgeScale = SCALE_FACTOR_BY_LEVEL[level] ?? 1;
  const badgeSize = BADGE_SIZE_FLOW_L1 * badgeScale;
  const badgeFontSize = BADGE_FONT_SIZE_FLOW_L1 * badgeScale;

  // Badge-Mittelpunkt auf den Kreis-Rand bei 225° (oben links) bzw.
  // 315° (oben rechts) — nicht auf die Bounding-Box-Ecke. Das schließt
  // die optische Lücke zwischen Badge und Kreis-Rand.
  // offset = r · cos(π/4) ≈ 0.7071 · r in beide Achsen.
  const radius = config.width / 2;
  const offset = radius * Math.cos(Math.PI / 4);
  const dx = side === 'left' ? -offset : offset;
  const dy = -offset;
  const badgeTransform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;

  // Drill-Down-Marker: nur an Themes mit Sub-Hierarchie (theme.annexId gesetzt).
  // Sitzt analog zum Badge mit Mittelpunkt AUF dem Kreis-Rand (halb innen, halb
  // außen) — nur entlang der Rand-Kurve um DRILL_DOWN_MARKER_ANGLE_OFFSET_DEG
  // weiter Richtung Top verschoben, sodass beide Icons nebeneinander andocken.
  // Badge-Winkel: 315° (oben rechts) bzw. 225° (oben links), gemessen ab +X-Achse CCW.
  // Marker rückt jeweils 20° Richtung 270° (Top): -65° bzw. -115°.
  const annexId = type !== 'central' ? getAnnexIdFor(id, level) : null;
  const renderDrillDownMarker = !!annexId;
  const drillDownMarkerSize = DRILL_DOWN_MARKER_SIZE_FLOW_L1 * badgeScale;
  const badgeAngleDeg = side === 'left' ? -135 : -45;
  const markerAngleDeg = side === 'left'
    ? badgeAngleDeg + DRILL_DOWN_MARKER_ANGLE_OFFSET_DEG
    : badgeAngleDeg - DRILL_DOWN_MARKER_ANGLE_OFFSET_DEG;
  const markerAngleRad = markerAngleDeg * Math.PI / 180;
  const markerDx = radius * Math.cos(markerAngleRad);
  const markerDy = radius * Math.sin(markerAngleRad);
  const drillDownMarkerTransform = `translate(calc(-50% + ${markerDx}px), calc(-50% + ${markerDy}px))`;

  return (
    <div
      className="course-overview-node"
      style={{
        // border-box: spezifizierte width/height = sichtbare Außenbox.
        // Border zieht NACH INNEN, dadurch sitzt ein Handle mit top:50%
        // exakt auf node.y + height/2 → keine Y-Skew-Versätze mehr.
        boxSizing: 'border-box',
        width: config.width,
        height: config.height,
        borderRadius: '50%',
        background: '#01D2BC',
        border: config.border,
        color: '#fff',
        fontFamily: 'var(--font-overview), sans-serif',
        fontWeight: 'bold',
        fontSize: config.fontSize,
        textAlign: 'center',
        whiteSpace: 'pre-line',
        // Kompakter Zeilenabstand für mehrzeilige Theme-/Hub-Labels — der
        // globale Browser-Default (line-height: 1.5 aus :root) reißt die
        // Zeilen sichtbar auseinander. 1.1 rückt sie zusammen, ohne dass
        // Umlaut-Punkte (Ä/Ö/Ü) in die obere Zeile schneiden.
        lineHeight: 1.1,
        // Schrift-Konsistenz beim Zoomen über React-Flow's transform: scale().
        // KEIN translate3d/will-change auf den Nodes — würde einen eigenen GPU-
        // Compositing-Layer erzwingen, der unter dem äußeren scale() je nach
        // Zoom-Stufe mit unterschiedlicher Subpixel-Rasterung kompositet wird
        // (bekanntes React-Flow-Symptom: Schnitt wirkt bei manchen Zoom-Stufen
        // schärfer/leicht kursiv). Stattdessen:
        //   - text-rendering: geometricPrecision → Browser rastert Glyphen
        //     geometrisch, ohne größenabhängigen Strategie-Wechsel (überschreibt
        //     das globale optimizeLegibility aus index.css gezielt für diese
        //     Labels).
        //   - font-smoothing: antialiased / grayscale → Anti-Aliasing-Modus
        //     fest, kein Springen zwischen Subpixel- und Grayscale-Rendering.
        textRendering: 'geometricPrecision',
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
        // Schrift-Variante & OpenType-Features hart festgeschrieben, damit
        // beim Zoomen weder Small-Caps noch andere Caps-Mappings einspringen
        // können — egal welche Default-Aktivierungen die Font-Datei intern
        // mitbringt:
        //   - fontVariant: 'normal'             → alle font-variant-*
        //                                          (caps, ligatures, numeric)
        //                                          auf default zurücksetzen.
        //   - fontFeatureSettings: '"liga" 1'   → nur Standardligaturen aktiv,
        //                                          alles andere (smcp/c2sc/
        //                                          case/cv01…) explizit aus.
        fontVariant: 'normal',
        fontFeatureSettings: '"liga" 1',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: config.boxShadow,
        position: 'relative',
        ...customStyle
      }}
    >
      {displayLabel}

      {renderBadge && (
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: badgeTransform,
            zIndex: 5,
            pointerEvents: 'none',
          }}
        >
          <NotificationBadge
            data={{
              size: badgeSize,
              fontSize: badgeFontSize,
              label: BADGE_LABELS_BY_ID[id] ?? data?.badgeLabel ?? BADGE_DEFAULT_LABEL,
            }}
          />
        </div>
      )}

      {renderDrillDownMarker && (
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: drillDownMarkerTransform,
            zIndex: 6,
            pointerEvents: 'none',
          }}
        >
          <CalendarIconNode data={{ size: drillDownMarkerSize }} />
        </div>
      )}
      
      {/* Links: Source und Target */}
      <Handle
        type="source"
        position={Position.Left}
        id="left-source"
        style={{
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'transparent',
          border: 'none',
          opacity: 0.3,
        }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left-target"
        style={{
          background: 'transparent',
          width: config.handleSize,
          height: config.handleSize,
          left: -(config.handleSize / 2),
          border: 'none',
          opacity: 0.3,
        }}
      />
      
      {/* Rechts: Source und Target */}
      <Handle
        type="source"
        position={Position.Right}
        id="right-source"
        style={{
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'transparent',
          border: 'none',
          opacity: 0.3,
        }}
      />
      <Handle
        type="target"
        position={Position.Right}
        id="right-target"
        style={{
          background: 'transparent',
          width: config.handleSize,
          height: config.handleSize,
          right: -(config.handleSize / 2),
          border: 'none',
          opacity: 0.3,
        }}
      />
    </div>
  );
}

// Node-Definitionen für den Import
// Helper function to make nodes draggable
const makeNodeDraggable = (node) => ({
  ...node,
  draggable: true,
  selectable: true
});

// Level-1-Nodes (Center + 5 Kategorien) werden aus levelLayout.js berechnet.
// Damit gilt: Theme-Y links == Theme-Y rechts pro row, Card-Mitte == Theme-Mitte,
// Center horizontal+vertikal mittig — keine Magic Numbers.
const level1CentralNode = {
  id: LEVEL1_CENTER.id,
  type: 'circular',
  position: LEVEL1_POSITIONS.center,
  data: {
    size: 'large',
    type: 'central',
    label: LEVEL1_CENTER.label,
    customStyle: {
      width: LEVEL1_LAYOUT.CENTER_DIAMETER,
      height: LEVEL1_LAYOUT.CENTER_DIAMETER,
    },
  },
};

const level1CategoryNodes = LEVEL1_THEMES.map((theme) => ({
  id: theme.id,
  type: 'circular',
  position: LEVEL1_POSITIONS.themes[theme.id],
  data: {
    size: 'medium',
    type: 'category',
    label: theme.label,
    customStyle: {
      width: LEVEL1_LAYOUT.THEME_DIAMETER,
      height: LEVEL1_LAYOUT.THEME_DIAMETER,
    },
  },
}));

// Level-2-Nodes (Center + 4 Kategorien inkl. Theme 3) — parentId='one-level-annex',
// lokale Koords aus computeLevelPositions(LEVEL_2_CONFIG). Symmetrie analog Level 1.
const level2CentralNode = {
  id: LEVEL2_CENTER.id,
  type: 'circular',
  position: LEVEL2_POSITIONS.center,
  parentId: 'one-level-annex',
  data: {
    size: 'smallCentral',
    type: 'central',
    label: LEVEL2_CENTER.label,
    customStyle: {
      width: LEVEL2_LAYOUT.CENTER_DIAMETER,
      height: LEVEL2_LAYOUT.CENTER_DIAMETER,
    },
  },
};

const level2CategoryNodes = LEVEL2_THEMES.map((theme) => ({
  id: theme.id,
  type: 'circular',
  position: LEVEL2_POSITIONS.themes[theme.id],
  parentId: 'one-level-annex',
  data: {
    size: 'small',
    type: 'category',
    label: theme.label,
    customStyle: {
      width: LEVEL2_LAYOUT.THEME_DIAMETER,
      height: LEVEL2_LAYOUT.THEME_DIAMETER,
    },
  },
}));

// Level-3-Nodes (Center + 5 Kategorien) — parentId='two-level-annex', lokale Koords
// aus computeLevelPositions(LEVEL_3_CONFIG). Symmetrie-Garantien analog Level 1.
const level3CentralNode = {
  id: LEVEL3_CENTER.id,
  type: 'circular',
  position: LEVEL3_POSITIONS.center,
  parentId: 'two-level-annex',
  data: {
    size: 'tinyCentral',
    type: 'central',
    label: LEVEL3_CENTER.label,
    customStyle: {
      width: LEVEL3_LAYOUT.CENTER_DIAMETER,
      height: LEVEL3_LAYOUT.CENTER_DIAMETER,
    },
  },
};

const level3CategoryNodes = LEVEL3_THEMES.map((theme) => ({
  id: theme.id,
  type: 'circular',
  position: LEVEL3_POSITIONS.themes[theme.id],
  parentId: 'two-level-annex',
  data: {
    size: 'tiny',
    type: 'category',
    label: theme.label,
    customStyle: {
      width: LEVEL3_LAYOUT.THEME_DIAMETER,
      height: LEVEL3_LAYOUT.THEME_DIAMETER,
    },
  },
}));

export const circularNodes = [
  level1CentralNode,
  ...level1CategoryNodes,

  level2CentralNode,
  ...level2CategoryNodes,

  level3CentralNode,
  ...level3CategoryNodes,
].map(makeNodeDraggable);