import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { getLevelScaleFactor, GRID_BASE_SIZES, GRID_CONFIGS, TILE, PADDING_RATIO, GAP_RATIO, CONTAINER_BORDER_RADIUS_FLOW_L1, CONTAINER_BORDER_RADIUS_RATIO } from './index.js';
import { nodeShadow } from '../levelLayout';
import LerneinheitNode from '../Content/LerneinheitNode';

// Hinweis: Fortschritts-Badges werden jetzt am Theme-Circle (CircularNode)
// gerendert, nicht mehr am Grid-Container. Siehe CircularNode.jsx.

// Grid-Konfigurationen (Spalten/Zeilen) — kommen jetzt aus gridUtils als Single Source of Truth.
const GRID_TYPES = GRID_CONFIGS;

// Hilfsfunktionen für ID-Parsing
const extractGridTypeFromId = (id) => {
  if (id.includes('3er')) return '3er';
  if (id.includes('6er')) return '6er';
  if (id.includes('9er')) return '9er';
};

const extractLevelFromId = (id) => {
  const match = id.match(/level-(\d+)/);
  return match ? parseInt(match[1]) : 1;
};

export default function GridContainerNode({ data, selected, id }) {
  // Grid-Typ und Level aus data oder id extrahieren
  const gridType = data?.gridType || extractGridTypeFromId(id);
  const level = data?.level || extractLevelFromId(id);

  // Tile-Dimensionen + Padding/Gap auf Level skaliert
  const scaleFactor = getLevelScaleFactor(level);
  const tileWidth = TILE.width * scaleFactor;
  const tileHeight = TILE.height * scaleFactor;
  const cardPadding = tileHeight * PADDING_RATIO;
  const cardGap = tileHeight * GAP_RATIO;
  // "Stride" — Distanz von Tile-Top-Left zu naechstem Tile-Top-Left.
  const cellWidth = tileWidth + cardGap;
  const cellHeight = tileHeight + cardGap;

  // Container-Box rendert immer auf voller Grid-Template-Groesse —
  // unabhaengig von tileCount. Damit fluchten alle Cards einer Seite.
  // Items in unvollstaendigen Reihen sitzen links-buendig (via
  // calculateLerneinheitPositionInCell), Leerraum bleibt rechts/unten.
  const gridConfig = GRID_TYPES[gridType];
  const containerWidth  = 2 * cardPadding + gridConfig.cols * tileWidth  + (gridConfig.cols - 1) * cardGap;
  const containerHeight = 2 * cardPadding + gridConfig.rows * tileHeight + (gridConfig.rows - 1) * cardGap;

  // Border-Radius mit Cap: proportional zur kleineren Container-Seite (L1),
  // gedeckelt auf den L1-Maximalwert; am Ende auf das aktuelle Level skaliert.
  // Verhindert Pillen-Look bei flachen 3er-Containern und hält 6er/9er
  // konsistent bei der gewünschten Maximal-Rundung.
  const baseSize = GRID_BASE_SIZES[gridType];
  const minSideL1 = Math.min(baseSize.width, baseSize.height);
  const borderRadius = Math.min(
    CONTAINER_BORDER_RADIUS_FLOW_L1,
    minSideL1 * CONTAINER_BORDER_RADIUS_RATIO
  ) * scaleFactor;
  
  // Hintergrundfarbe basierend auf Container-ID bestimmen
  const getBackgroundColor = (containerId, gridType, level) => {
    // Spezifische Container-Farben
    if (containerId === '9erContainer-level-3') {
      return 'white'; // Weißer Hintergrund für 9er-Grid Level 3
    }
    if (containerId === '6erContainer-level-3') {
      return 'white'; // Weißer Hintergrund für 6er-Grid Level 3
    }
    if (containerId === '3erContainer-level-3') {
      return 'white'; // Weißer Hintergrund für 3er-Grid Level 3
    }
    if (containerId === '3erContainer-level-3-second') {
      return 'white'; // Weißer Hintergrund für zweiten 3er-Grid Level 3
    }
    if (containerId === '3erContainer-level-3-third') {
      return 'white'; // Weißer Hintergrund für dritten 3er-Grid Level 3
    }
    
    // Standard-Hintergrund für alle anderen Container
    return 'white';
  };
  
  const backgroundColor = getBackgroundColor(id, gridType, level);
  
  // Schatten kommt aus nodeShadow(level) — gleiche kanonische Lift-Shadow wie
  // Theme-Circle, Hub und Annex (single source: NODE_SHADOW_FLOW_L1 in
  // levelLayout). Skaliert mit SCALE_FACTORS[level], damit L2/L3-Container
  // beim Reinzoomen optisch dieselbe Schatten-Geometrie zeigen wie L1.
  // selected-State behaelt sein gruenes Highlight als Selection-Affordance.
  const getBoxShadow = (selected) => {
    if (selected) {
      return '0 800px 3200px rgba(48, 184, 155, 0.4)';
    }
    return nodeShadow(level);
  };
  
  // Grid-Zellen — nur die, die innerhalb der actualCols/actualRows liegen.
  // Position deckt sich mit calculateLerneinheitPositionInCell (Padding +
  // col×stride / row×stride). Cells sind invisible Debug-Platzhalter.
  const gridCells = [];
  for (let row = 0; row < gridConfig.rows; row++) {
    for (let col = 0; col < gridConfig.cols; col++) {
      const cellNumber = row * gridConfig.cols + col + 1;
      const cellX = cardPadding + col * cellWidth;
      const cellY = cardPadding + row * cellHeight;
      gridCells.push({
        id: `cell-${row}-${col}`,
        row,
        col,
        cellNumber,
        x: cellX,
        y: cellY,
        width: tileWidth,
        height: tileHeight,
        centerX: cellX + tileWidth / 2,
        centerY: cellY + tileHeight / 2,
        hasLerneinheit: false,
        lerneinheitData: null
      });
    }
  }
  
  const nodeStyle = {
    width: `${containerWidth}px`,
    height: `${containerHeight}px`,
    background: backgroundColor, // Dynamische Hintergrundfarbe
    border: 'none',
    borderRadius: `${borderRadius}px`, // Dynamische Border-Radius
    boxShadow: getBoxShadow(selected),
    transition: 'all 0.3s ease',
    position: 'relative',
    userSelect: 'none',
  };

  // Handle-Styling basierend auf Level anpassen
  const getHandleStyle = () => {
    if (level === 1) {
      // Level 1: Normale sichtbare Handles (wie bisher)
      return {
        background: '#30b89b',
        width: 12,
        height: 12,
        border: '2px solid white',
      };
    } else {
      // Level 2 und höher: Transparente Handles (funktional aber unsichtbar)
      return {
        background: 'transparent',
        width: 12,
        height: 12,
        border: 'none',
        opacity: 0,
      };
    }
  };

  const handleStyle = getHandleStyle();
  // Handle-Offset zur Kante:
  //   L1: -6 → sichtbarer Handle-Punkt sitzt komplett ausserhalb der Card.
  //   L2+: 0 → unsichtbares Handle, Center fluchtet exakt mit der sichtbaren
  //   Kante, sodass Edge-Endpunkte ohne Luecke an die Card andocken
  //   (sonst entsteht bei duennem Stroke ein 6px-Spalt).
  const handleOffset = level === 1 ? -6 : 0;

  return (
    <>
      {/* Handles für Verbindungen - Level-abhängiges Styling */}
      <Handle
        type="target"
        position={Position.Left}
        id="left-target"
        style={{
          ...handleStyle,
          left: handleOffset,
        }}
      />
      <Handle
        type="target"
        position={Position.Right}
        id="right-target"
        style={{
          ...handleStyle,
          right: handleOffset,
        }}
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left-source"
        style={{
          ...handleStyle,
          left: handleOffset,
        }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right-source"
        style={{
          ...handleStyle,
          right: handleOffset,
        }}
      />

      {/* Haupt-Container */}
      <div style={nodeStyle}>
        {/* Grid-Zellen mit Lerneinheiten */}
        {gridCells.map((cell) => (
          <div
            key={cell.id}
            className="grid-cell-content"
            style={{
              position: 'absolute',
              left: cell.x,
              top: cell.y,
              width: cell.width,
              height: cell.height,
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: `${Math.min(cell.width, cell.height) * 0.4}px`, // Responsive font size: 40% der kleineren Zell-Dimension
              color: 'rgba(0,0,0,0.1)',
            }}
          >
            {/* Zellen-Nummer anzeigen */}
            {/* {cell.cellNumber} */}
            
            {/* Lerneinheit in der Zelle rendern, falls vorhanden */}
            {cell.hasLerneinheit && cell.lerneinheitData && (
              <div
                style={{
                  position: 'absolute',
                  left: cell.width * 0.05, // 5% der Zellen-Breite
                  top: cell.height * 0.10,  // 10% der Zellen-Höhe
                  width: cell.width * 0.8,  // 80% der Zellen-Breite
                  height: cell.height * 0.8, // 80% der Zellen-Höhe
                  pointerEvents: 'auto', // Lerneinheiten sind interaktiv
                }}
              >
                <LerneinheitNode
                  data={{
                    ...cell.lerneinheitData,
                    // Größen proportional zur Zelle skalieren
                    width: cell.width * 0.8,
                    height: cell.height * 0.8,
                    // Schriftgröße proportional skalieren
                    fontSize: Math.min(cell.width, cell.height) * 0.1,
                  }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

// Container-Template ohne Position erstellen (für Legacy-Configs)
export const createGridContainerTemplate = (id, gridType, level) => ({
  id,
  type: 'gridContainer',
  data: { 
    gridType, 
    level,
    name: `${gridType} Grid Level ${level}`
  }
});

// Flexible Funktion: Grid-Container mit individueller Position erstellen.
// `tileCount` (optional) loest tight-fit aus: Box rendert nur so viele Zellen
// wie tatsaechlich Tiles drin sind (siehe GridContainerNode).
export const createGridContainer = (id, gridType, level, position = { x: 0, y: 0 }, tileCount) => ({
  id,
  type: 'gridContainer',
  position,
  draggable: true,
  selectable: true,
  data: {
    gridType,
    level,
    name: `${gridType} Grid Level ${level}`,
    ...(typeof tileCount === 'number' && { tileCount }),
  },
});

// LEGACY: Alte Funktion für Rückwärtskompatibilität (DEPRECATED)
export const createGridContainerConfig = (id, gridType, level, position) => 
  createGridContainer(id, gridType, level, position);

// LEGACY: Vordefinierte Container-Templates (DEPRECATED - Verwende createGridContainer() stattdessen)
// Diese Templates enthalten KEINE Positionen - Positionen werden bei createGridContainer() individuell gesetzt
export const gridContainerConfigs = {
  // Level 1 (Basis-Größe) - LEGACY TEMPLATES (ohne Position)
  '3er-level-1': createGridContainerTemplate('3erContainer-level-1', '3er', 1),
  '6er-level-1': createGridContainerTemplate('6erContainer-level-1', '6er', 1),
  '9er-level-1': createGridContainerTemplate('9erContainer-level-1', '9er', 1),
  
  // Level 2 (50% der Basis-Größe) - LEGACY TEMPLATES (ohne Position)
  '3er-level-2': createGridContainerTemplate('3erContainer-level-2', '3er', 2),
  '6er-level-2': createGridContainerTemplate('6erContainer-level-2', '6er', 2),
  '9er-level-2': createGridContainerTemplate('9erContainer-level-2', '9er', 2),
  
  // Level 3 (25% der Basis-Größe) - LEGACY TEMPLATES (ohne Position)
  '3er-level-3': createGridContainerTemplate('3erContainer-level-3', '3er', 3),
  '6er-level-3': createGridContainerTemplate('6erContainer-level-3', '6er', 3),
  '9er-level-3': createGridContainerTemplate('9erContainer-level-3', '9er', 3),
};

// Kompatibilität: Alte Konfigurationen
export const gridContainerNodeConfig = gridContainerConfigs['9er-level-1'];
export const gridContainerNodeConfig6er = gridContainerConfigs['6er-level-1'];