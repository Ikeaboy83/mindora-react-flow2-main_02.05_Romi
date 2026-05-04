//App.jsx
import React, { useCallback, useEffect } from 'react';
import { ReactFlow, Controls, ReactFlowProvider, useReactFlow, Panel } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import './CourseOverviewFlowCanvas.css';

// Import der Drill-Down-Annex-Komponenten (siehe AnnexNode/AnnexNode.jsx).
import { FirstAnnexNode, SecondAnnexNode } from './AnnexNode/AnnexNode';

// Import der anderen Node-Komponenten
import GridContainerNode, { gridContainerConfigs, createGridContainer } from './GridboxNode/GridContainerNode';
import LerneinheitNode, { nineGridLerneinheiten, nineGridLevel2Lerneinheiten, sixGridLerneinheiten, sixGridLevel2Lerneinheiten } from './Content/LerneinheitNode';
import { createSixGridLerneinheitenWithCorrectDimensions, createSixGridLevel2LerneinheitenWithIcons } from './GridboxNode';
import { calculateSingleIconPosition } from './GridboxNode/positionUtils';
import { TILE, GRID_BASE_SIZES, getContainerDimensions, getGridDimensions, lerneinheitPositionFor, tileDimensionsForLevel } from './GridboxNode/gridUtils';
import {
  LEVEL1_POSITIONS, LEVEL1_LAYOUT, getTileCountFor,
  LEVEL2_POSITIONS, getLevel2TileCountFor,
  LEVEL3_POSITIONS,
  LEVEL1_ANNEX_WIDTH, LEVEL1_ANNEX_HEIGHT,
  LEVEL2_ANNEX_WIDTH, LEVEL2_ANNEX_HEIGHT,
} from './levelLayout';

// L1-Annex-Position kommt aus dem Layout-Modul (annex-Slot des Theme „4.
// Change Management"). L2-Annex sitzt analog im L2-annex-Slot, lokal im
// L1-Annex (parentId-Subflow).
const ONE_LEVEL_ANNEX_POSITION = LEVEL1_POSITIONS.annexes['one-level-annex'];
const TWO_LEVEL_ANNEX_POSITION = LEVEL2_POSITIONS.annexes['two-level-annex'];
// import { debugCellPositions } from './GridboxNode/gridUtils';
import CircularNode, { circularNodes } from './CircularNode/CircularNode';
import { initialEdges } from './Edges/Edges.jsx';
import NotificationBadge from '../home/NotificationBadge';


// Node Types Definition
const nodeTypes = {
  firstAnnex: FirstAnnexNode,
  secondAnnex: SecondAnnexNode,
  circular: CircularNode,
  gridContainer: GridContainerNode,
  lerneinheit: LerneinheitNode,
  notificationBadge: NotificationBadge,
};



// Initial Nodes
// REIHENFOLGE-INVARIANTE: ReactFlow v12 verlangt, dass jeder Knoten mit
// parentId NACH seinem Parent im Array steht. Verletzungen koennen
// dazu fuehren, dass parentId-Resolutions fuer Geschwister desselben
// Parents brechen. Daher: zuerst Top-Level-Wrappers, dann Children.
const initialNodes = [
  // Drill-Down-Annex-Nodes (Top-Level + 1. Subflow) — MUESSEN vor allen Children
  // stehen, weil ReactFlow v12 parentId-Resolution sequenziell macht.
  // Position kommt aus levelLayout (Card-Slot des zugehörigen Drill-Down-Themes,
  // Y zentriert auf Theme-Mitte). style.width/height EXPLIZIT — sonst greift
  // Default-Sizing und parentId-Resolution kollabiert für die Enkel-Schicht.
  {
    id: 'one-level-annex',
    type: 'firstAnnex',
    position: ONE_LEVEL_ANNEX_POSITION,
    draggable: true,
    selectable: true,
    style: { width: LEVEL1_ANNEX_WIDTH, height: LEVEL1_ANNEX_HEIGHT },
    data: {},
  },
  {
    id: 'two-level-annex',
    type: 'secondAnnex',
    position: TWO_LEVEL_ANNEX_POSITION,
    parentId: 'one-level-annex',
    draggable: true,
    selectable: true,
    style: { width: LEVEL2_ANNEX_WIDTH, height: LEVEL2_ANNEX_HEIGHT },
    data: {},
  },

  // Circular Nodes aus CircularNode.jsx importiert
  // (Drill-Down-Marker hängen jetzt am jeweiligen Theme-Circle — siehe CircularNode.jsx)
  ...circularNodes,
  
  // 5 Level-1-Grid-Container (Cards) — Positionen + tileCount aus levelLayout
  // (single source of truth). Tight-fit aus tileCount, X-Anker spiegelsymmetrisch.
  createGridContainer('6erContainer-level-1-main', '6er', 1, LEVEL1_POSITIONS.cards['6erContainer-level-1-main'], getTileCountFor('6erContainer-level-1-main')),
  createGridContainer('3erContainer-level-1-main', '3er', 1, LEVEL1_POSITIONS.cards['3erContainer-level-1-main'], getTileCountFor('3erContainer-level-1-main')),
  createGridContainer('3erContainer-level-1', '3er', 1, LEVEL1_POSITIONS.cards['3erContainer-level-1'], getTileCountFor('3erContainer-level-1')),
  createGridContainer('9erContainer-level-1', '9er', 1, LEVEL1_POSITIONS.cards['9erContainer-level-1'], getTileCountFor('9erContainer-level-1')),
  createGridContainer('6erContainer-level-1', '6er', 1, LEVEL1_POSITIONS.cards['6erContainer-level-1'], getTileCountFor('6erContainer-level-1')),
  // 3 Level-2-Grid-Container — parentId='one-level-annex', lokale Koords aus
  // LEVEL2_POSITIONS.cards (single source of truth analog Level 1).
  // style.width/height explizit gesetzt — ReactFlow v12 braucht das fuer
  // parentId-Children, sonst greift Default-Sizing (Render-Bug).
  { ...createGridContainer('9erContainer-level-2', '9er', 2, LEVEL2_POSITIONS.cards['9erContainer-level-2'], getLevel2TileCountFor('9erContainer-level-2')), parentId: 'one-level-annex', style: getGridDimensions('9erContainer-level-2') },
  { ...createGridContainer('6erContainer-level-2', '6er', 2, LEVEL2_POSITIONS.cards['6erContainer-level-2'], getLevel2TileCountFor('6erContainer-level-2')), parentId: 'one-level-annex', style: getGridDimensions('6erContainer-level-2') },
  { ...createGridContainer('3erContainer-level-2', '3er', 2, LEVEL2_POSITIONS.cards['3erContainer-level-2'], getLevel2TileCountFor('3erContainer-level-2')), parentId: 'one-level-annex', style: getGridDimensions('3erContainer-level-2') },
  
  // BEISPIEL: Weitere 9er-Grid Container mit verschiedenen Positionen
  // createGridContainer('another-9er-grid', '9er', 1, { x: 100000, y: 64000 }),
  // createGridContainer('third-9er-grid', '9er', 1, { x: 200000, y: 64000 }),
  
  // Lerneinheiten für das 9er Grid
  ...nineGridLerneinheiten,
  // Lerneinheiten für das 9er Grid Level 2
  ...nineGridLevel2Lerneinheiten,
  // Lerneinheiten für das 6er Grid Level 2
  ...sixGridLevel2Lerneinheiten,
  // 5 Lerneinheiten für das 6er Grid OHNE Icons
  ...createSixGridLerneinheitenWithCorrectDimensions(),
  
  // Lerneinheit für das 3er Grid Level 2 - Zelle 1
  {
    id: 'three-grid-level2-lerneinheit-1',
    type: 'lerneinheit',
    position: lerneinheitPositionFor(1, '3erContainer-level-2'),
    parentId: '3erContainer-level-2',
    data: {
      title: '3er L2 Lerneinheit 1',
      // SKALIERTE Größen für Level 2 (12.5% der Basis-Größe)
      width: TILE.width * 0.125, // 2250
      height: TILE.height * 0.125, // 1500
      backgroundColor: '#e6fefc',
      borderColor: '#30b89b',
      // SKALIERTE Schriftgröße für Level 2
      fontSize: 960 * 0.125, // 120
      imageSource: 'pic1',
      statusIcons: [],
    },
  },
  
  // Lerneinheit für das 3er Grid Level 1 - Zelle 1 (ohne Icons)
  {
    id: 'three-grid-level1-lerneinheit-1',
    type: 'lerneinheit',
    position: lerneinheitPositionFor(1, '3erContainer-level-1'),
    parentId: '3erContainer-level-1',
    data: {
      title: '3er L1 Lerneinheit 1',
      // Standard Level 1 Größen
      width: TILE.width,
      height: TILE.height,
      backgroundColor: '#e6fefc',
      borderColor: '#30b89b',
      fontSize: 960,
      imageSource: 'pic1',
      // Keine statusIcons - komplett ohne Icons
    },
  },
  
  // Lerneinheit 1 für das 3er Grid Level 1 Main Container - Zelle 1 (ohne Icons)
  {
    id: 'three-grid-main-lerneinheit-1',
    type: 'lerneinheit',
    position: lerneinheitPositionFor(1, '3erContainer-level-1-main'),
    parentId: '3erContainer-level-1-main',
    data: {
      title: '3er Main Lerneinheit 1',
      width: TILE.width,
      height: TILE.height,
      backgroundColor: '#e6fefc',
      borderColor: '#30b89b',
      fontSize: 960,
      imageSource: 'pic1',
      statusIcons: [
        {
          type: 'lockedIcon',
          ...(() => {
            // Berechne die korrekte Single-Icon Position mit calculateSingleIconPosition
            const lerneinheitWidth = TILE.width;
            const lerneinheitHeight = TILE.height;
            const iconWidth = 6000;
            const iconHeight = 6000;
            
            const iconPosition = calculateSingleIconPosition(
              { x: 0.5, y: 0.3 }, // Mittig horizontal, 30% vertikal
              lerneinheitWidth,
              lerneinheitHeight,
              iconWidth,
              iconHeight
            );
            
            return {
              x: iconPosition.centerIcon.x,
              y: iconPosition.centerIcon.y
            };
          })()
        }
      ]
    },
  },
  
  // Lerneinheit 2 für das 3er Grid Level 1 Main Container - Zelle 2 (ohne Icons)
  {
    id: 'three-grid-main-lerneinheit-2',
    type: 'lerneinheit',
    position: lerneinheitPositionFor(2, '3erContainer-level-1-main'),
    parentId: '3erContainer-level-1-main',
    data: {
      title: '3er Main Lerneinheit 2',
      width: TILE.width,
      height: TILE.height,
      backgroundColor: '#e6fefc',
      borderColor: '#30b89b',
      fontSize: 960,
      imageSource: 'pic2',
      statusIcons: [
        {
          type: 'lockedIcon',
          ...(() => {
            // Berechne die korrekte Single-Icon Position mit calculateSingleIconPosition
            const lerneinheitWidth = TILE.width;
            const lerneinheitHeight = TILE.height;
            const iconWidth = 6000;
            const iconHeight = 6000;
            
            const iconPosition = calculateSingleIconPosition(
              { x: 0.5, y: 0.3 }, // Mittig horizontal, 30% vertikal
              lerneinheitWidth,
              lerneinheitHeight,
              iconWidth,
              iconHeight
            );
            
            return {
              x: iconPosition.centerIcon.x,
              y: iconPosition.centerIcon.y
            };
          })()
        }
      ]
    },
  },
  
  // Lerneinheit 1 für das 6er Grid Level 1 Main Container - Zelle 1 (ohne Icons)
  {
    id: 'six-grid-main-lerneinheit-1',
    type: 'lerneinheit',
    position: lerneinheitPositionFor(1, '6erContainer-level-1-main'),
    parentId: '6erContainer-level-1-main',
    data: {
      title: '6er Main Lerneinheit 1',
      width: TILE.width,
      height: TILE.height,
      backgroundColor: '#e6fefc',
      borderColor: '#30b89b',
      fontSize: 960,
      imageSource: 'pic1',
      // Keine statusIcons - komplett ohne Icons
    },
  },
  
  // Lerneinheit 2 für das 6er Grid Level 1 Main Container - Zelle 2 (ohne Icons)
  {
    id: 'six-grid-main-lerneinheit-2',
    type: 'lerneinheit',
    position: lerneinheitPositionFor(2, '6erContainer-level-1-main'),
    parentId: '6erContainer-level-1-main',
    data: {
      title: '6er Main Lerneinheit 2',
      width: TILE.width,
      height: TILE.height,
      backgroundColor: '#e6fefc',
      borderColor: '#30b89b',
      fontSize: 960,
      imageSource: 'pic2',
      statusIcons: [
        {
          type: 'doneIcon',
          ...(() => {
            // Berechne die korrekte Single-Icon Position mit calculateSingleIconPosition
            const lerneinheitWidth = TILE.width;
            const lerneinheitHeight = TILE.height;
            const iconWidth = 6000;
            const iconHeight = 6000;
            
            const iconPosition = calculateSingleIconPosition(
              { x: 0.5, y: 0.3 }, // Gewünschte relative Position: 50% Breite, 30% Höhe
              lerneinheitWidth,   // Lerneinheit-Breite
              lerneinheitHeight,  // Lerneinheit-Höhe
              iconWidth,          // Icon-Breite
              iconHeight          // Icon-Höhe
            );
            
            return {
              x: iconPosition.centerIcon.x, // Bereits zentrierte relative Position
              y: iconPosition.centerIcon.y, // Bereits zentrierte relative Position
            };
          })()
        }
      ],
    },
  },
  
  // Lerneinheit 3 für das 6er Grid Level 1 Main Container - Zelle 3 (ohne Icons)
  {
    id: 'six-grid-main-lerneinheit-3',
    type: 'lerneinheit',
    position: lerneinheitPositionFor(3, '6erContainer-level-1-main'),
    parentId: '6erContainer-level-1-main',
    data: {
      title: '6er Main Lerneinheit 3',
      width: TILE.width,
      height: TILE.height,
      backgroundColor: '#e6fefc',
      borderColor: '#30b89b',
      fontSize: 960,
      imageSource: 'pic3',
      // Keine statusIcons - komplett ohne Icons
    },
  },
  
  // Lerneinheit 4 für das 6er Grid Level 1 Main Container - Zelle 4 (ohne Icons)
  {
    id: 'six-grid-main-lerneinheit-4',
    type: 'lerneinheit',
    position: lerneinheitPositionFor(4, '6erContainer-level-1-main'),
    parentId: '6erContainer-level-1-main',
    data: {
      title: '6er Main Lerneinheit 4',
      width: TILE.width,
      height: TILE.height,
      backgroundColor: '#e6fefc',
      borderColor: '#30b89b',
      fontSize: 960,
      imageSource: 'pic1',
      statusIcons: [
        {
          type: 'doneIcon',
          ...(() => {
            // Berechne die korrekte Single-Icon Position mit calculateSingleIconPosition
            const lerneinheitWidth = TILE.width;
            const lerneinheitHeight = TILE.height;
            const iconWidth = 6000;
            const iconHeight = 6000;
            
            const iconPosition = calculateSingleIconPosition(
              { x: 0.5, y: 0.3 }, // Gewünschte relative Position: 50% Breite, 30% Höhe
              lerneinheitWidth,   // Lerneinheit-Breite
              lerneinheitHeight,  // Lerneinheit-Höhe
              iconWidth,          // Icon-Breite
              iconHeight          // Icon-Höhe
            );
            
            return {
              x: iconPosition.centerIcon.x, // Bereits zentrierte relative Position
              y: iconPosition.centerIcon.y, // Bereits zentrierte relative Position
            };
          })()
        }
      ],
    },
  },
  
  // 8 Lerneinheiten für das 9er-Grid Level 3 (ohne Icons) - Zellen 1-8
  // Lerneinheit 1 - Zelle 1
  {
    id: 'nine-grid-level3-lerneinheit-1',
    type: 'lerneinheit',
    position: lerneinheitPositionFor(1, '9erContainer-level-3'),
    parentId: '9erContainer-level-3',
    data: {
      title: '9er L3 Lerneinheit 1',
      width: TILE.width * 0.01215, // 218.7
      height: TILE.height * 0.01215, // 145.8
      backgroundColor: '#e6fefc',
      borderColor: '#30b89b',
      fontSize: 960 * 0.01215, // 11.66
      imageSource: 'pic1',
      statusIcons: [
        {
          type: 'doneIcon',
          ...(() => {
            const lerneinheitWidth = TILE.width * 0.01215;
            const lerneinheitHeight = TILE.height * 0.01215;
            const scaleRatio = Math.min(lerneinheitWidth / 18000, lerneinheitHeight / 12000);
            const actualIconSize = 20 * 300 * scaleRatio;
            
            const iconPosition = calculateSingleIconPosition(
              { x: 0.5, y: 0.3 },
              lerneinheitWidth,
              lerneinheitHeight,
              actualIconSize,
              actualIconSize
            );
            return {
              x: iconPosition.centerIcon.x,
              y: iconPosition.centerIcon.y,
              offsetX: iconPosition.calculations.offsetX,
              offsetY: iconPosition.calculations.offsetY
            };
          })()
        }
      ],
    },
  },
  
  // Lerneinheit 2 - Zelle 2
  {
    id: 'nine-grid-level3-lerneinheit-2',
    type: 'lerneinheit',
    position: lerneinheitPositionFor(2, '9erContainer-level-3'),
    parentId: '9erContainer-level-3',
    data: {
      title: '9er L3 Lerneinheit 2',
      width: TILE.width * 0.01215,
      height: TILE.height * 0.01215,
      backgroundColor: '#e6fefc',
      borderColor: '#30b89b',
      fontSize: 960 * 0.01215,
      imageSource: 'pic2',
    },
  },
  
  // Lerneinheit 3 - Zelle 3
  {
    id: 'nine-grid-level3-lerneinheit-3',
    type: 'lerneinheit',
    position: lerneinheitPositionFor(3, '9erContainer-level-3'),
    parentId: '9erContainer-level-3',
    data: {
      title: '9er L3 Lerneinheit 3',
      width: TILE.width * 0.01215,
      height: TILE.height * 0.01215,
      backgroundColor: '#e6fefc',
      borderColor: '#30b89b',
      fontSize: 960 * 0.01215,
      imageSource: 'pic3',
    },
  },
  
  // Lerneinheit 4 - Zelle 4
  {
    id: 'nine-grid-level3-lerneinheit-4',
    type: 'lerneinheit',
    position: lerneinheitPositionFor(4, '9erContainer-level-3'),
    parentId: '9erContainer-level-3',
    data: {
      title: '9er L3 Lerneinheit 4',
      width: TILE.width * 0.01215,
      height: TILE.height * 0.01215,
      backgroundColor: '#e6fefc',
      borderColor: '#30b89b',
      fontSize: 960 * 0.01215,
      imageSource: 'pic4',
    },
  },
  
  // Lerneinheit 5 - Zelle 5
  {
    id: 'nine-grid-level3-lerneinheit-5',
    type: 'lerneinheit',
    position: lerneinheitPositionFor(5, '9erContainer-level-3'),
    parentId: '9erContainer-level-3',
    data: {
      title: '9er L3 Lerneinheit 5',
      width: TILE.width * 0.01215,
      height: TILE.height * 0.01215,
      backgroundColor: '#e6fefc',
      borderColor: '#30b89b',
      fontSize: 960 * 0.01215,
      imageSource: 'pic5',
      statusIcons: [
        {
          type: 'doneIcon',
          ...(() => {
            const lerneinheitWidth = TILE.width * 0.01215;
            const lerneinheitHeight = TILE.height * 0.01215;
            const scaleRatio = Math.min(lerneinheitWidth / 18000, lerneinheitHeight / 12000);
            const actualIconSize = 20 * 300 * scaleRatio;
            
            const iconPosition = calculateSingleIconPosition(
              { x: 0.5, y: 0.3 },
              lerneinheitWidth,
              lerneinheitHeight,
              actualIconSize,
              actualIconSize
            );
            return {
              x: iconPosition.centerIcon.x,
              y: iconPosition.centerIcon.y,
              offsetX: iconPosition.calculations.offsetX,
              offsetY: iconPosition.calculations.offsetY
            };
          })()
        }
      ],
    },
  },
  
  // Lerneinheit 6 - Zelle 6
  {
    id: 'nine-grid-level3-lerneinheit-6',
    type: 'lerneinheit',
    position: lerneinheitPositionFor(6, '9erContainer-level-3'),
    parentId: '9erContainer-level-3',
    data: {
      title: '9er L3 Lerneinheit 6',
      width: TILE.width * 0.01215,
      height: TILE.height * 0.01215,
      backgroundColor: '#e6fefc',
      borderColor: '#30b89b',
      fontSize: 960 * 0.01215,
      imageSource: 'pic6',
    },
  },
  
  // Lerneinheit 7 - Zelle 7
  {
    id: 'nine-grid-level3-lerneinheit-7',
    type: 'lerneinheit',
    position: lerneinheitPositionFor(7, '9erContainer-level-3'),
    parentId: '9erContainer-level-3',
    data: {
      title: '9er L3 Lerneinheit 7',
      width: TILE.width * 0.01215,
      height: TILE.height * 0.01215,
      backgroundColor: '#e6fefc',
      borderColor: '#30b89b',
      fontSize: 960 * 0.01215,
      imageSource: 'pic7',
    },
  },
  
  // Lerneinheit 8 - Zelle 8
  {
    id: 'nine-grid-level3-lerneinheit-8',
    type: 'lerneinheit',
    position: lerneinheitPositionFor(8, '9erContainer-level-3'),
    parentId: '9erContainer-level-3',
    data: {
      title: '9er L3 Lerneinheit 8',
      width: TILE.width * 0.01215,
      height: TILE.height * 0.01215,
      backgroundColor: '#e6fefc',
      borderColor: '#30b89b',
      fontSize: 960 * 0.01215,
      imageSource: 'pic8',
      statusIcons: [
        {
          type: 'doneIcon',
          ...(() => {
            const lerneinheitWidth = TILE.width * 0.01215;
            const lerneinheitHeight = TILE.height * 0.01215;
            const scaleRatio = Math.min(lerneinheitWidth / 18000, lerneinheitHeight / 12000);
            const actualIconSize = 20 * 300 * scaleRatio;
            
            const iconPosition = calculateSingleIconPosition(
              { x: 0.5, y: 0.3 },
              lerneinheitWidth,
              lerneinheitHeight,
              actualIconSize,
              actualIconSize
            );
            return {
              x: iconPosition.centerIcon.x,
              y: iconPosition.centerIcon.y,
              offsetX: iconPosition.calculations.offsetX,
              offsetY: iconPosition.calculations.offsetY
            };
          })()
        }
      ],
    },
  },
  
  // Zelle 9 bleibt leer (keine Lerneinheit)
  
  // 4 Lerneinheiten für das 6er-Grid Level 3 (ohne Icons) - Zellen 1-4
  // Lerneinheit 1 - Zelle 1
  {
    id: 'six-grid-level3-lerneinheit-1',
    type: 'lerneinheit',
    position: lerneinheitPositionFor(1, '6erContainer-level-3'),
    parentId: '6erContainer-level-3',
    data: {
      title: '6er L3 Lerneinheit 1',
      width: TILE.width * 0.01215, // 218.7
      height: TILE.height * 0.01215, // 145.8
      backgroundColor: '#e6fefc',
      borderColor: '#30b89b',
      fontSize: 960 * 0.01215, // 11.66
      imageSource: 'pic1',
    },
  },
  
  // Lerneinheit 2 - Zelle 2
  {
    id: 'six-grid-level3-lerneinheit-2',
    type: 'lerneinheit',
    position: lerneinheitPositionFor(2, '6erContainer-level-3'),
    parentId: '6erContainer-level-3',
    data: {
      title: '6er L3 Lerneinheit 2',
      width: TILE.width * 0.01215,
      height: TILE.height * 0.01215,
      backgroundColor: '#e6fefc',
      borderColor: '#30b89b',
      fontSize: 960 * 0.01215,
      imageSource: 'pic2',
    },
  },
  
  // Lerneinheit 3 - Zelle 3
  {
    id: 'six-grid-level3-lerneinheit-3',
    type: 'lerneinheit',
    position: lerneinheitPositionFor(3, '6erContainer-level-3'),
    parentId: '6erContainer-level-3',
    data: {
      title: '6er L3 Lerneinheit 3',
      width: TILE.width * 0.01215,
      height: TILE.height * 0.01215,
      backgroundColor: '#e6fefc',
      borderColor: '#30b89b',
      fontSize: 960 * 0.01215,
      imageSource: 'pic3',
    },
  },
  
  // Lerneinheit 4 - Zelle 4
  {
    id: 'six-grid-level3-lerneinheit-4',
    type: 'lerneinheit',
    position: lerneinheitPositionFor(4, '6erContainer-level-3'),
    parentId: '6erContainer-level-3',
    data: {
      title: '6er L3 Lerneinheit 4',
      width: TILE.width * 0.01215,
      height: TILE.height * 0.01215,
      backgroundColor: '#e6fefc',
      borderColor: '#30b89b',
      fontSize: 960 * 0.01215,
      imageSource: 'pic4',
    },
  },
  
  // Zellen 5 und 6 bleiben leer
  
  // Lerneinheit für das zweite 3er Grid Level 3 - Zelle 1
  {
    id: 'three-grid-level3-second-lerneinheit-1',
    type: 'lerneinheit',
    position: lerneinheitPositionFor(1, '3erContainer-level-3-second'),
    parentId: '3erContainer-level-3-second',
    data: {
      title: '3er L3 Second Lerneinheit 1',
      // SKALIERTE Größen für Level 3 (1.215% der Basis-Größe)
      width: TILE.width * 0.01215, // 218.7
      height: TILE.height * 0.01215, // 145.8
      backgroundColor: '#e6fefc',
      borderColor: '#30b89b',
      // SKALIERTE Schriftgröße für Level 3
      fontSize: 960 * 0.01215, // 11.66
      imageSource: 'pic9',
      // Keine statusIcons
    },
  },
  
  // Lerneinheit für das dritte 3er Grid Level 3 - Zelle 1
  {
    id: 'three-grid-level3-third-lerneinheit-1',
    type: 'lerneinheit',
    position: lerneinheitPositionFor(1, '3erContainer-level-3-third'),
    parentId: '3erContainer-level-3-third',
    data: {
      title: '3er L3 Third Lerneinheit 1',
      // SKALIERTE Größen für Level 3 (1.215% der Basis-Größe)
      width: TILE.width * 0.01215, // 218.7
      height: TILE.height * 0.01215, // 145.8
      backgroundColor: '#e6fefc',
      borderColor: '#30b89b',
      // SKALIERTE Schriftgröße für Level 3
      fontSize: 960 * 0.01215, // 11.66
      imageSource: 'pic10',
      // Keine statusIcons
    },
  },
  
  // Lerneinheit für das dritte 3er Grid Level 3 - Zelle 2
  {
    id: 'three-grid-level3-third-lerneinheit-2',
    type: 'lerneinheit',
    position: lerneinheitPositionFor(2, '3erContainer-level-3-third'),
    parentId: '3erContainer-level-3-third',
    data: {
      title: '3er L3 Third Lerneinheit 2',
      // SKALIERTE Größen für Level 3 (1.215% der Basis-Größe)
      width: TILE.width * 0.01215, // 218.7
      height: TILE.height * 0.01215, // 145.8
      backgroundColor: '#e6fefc',
      borderColor: '#30b89b',
      // SKALIERTE Schriftgröße für Level 3
      fontSize: 960 * 0.01215, // 11.66
      imageSource: 'pic11',
      // Keine statusIcons
    },
  },

  // Fortschritts-Badges werden jetzt direkt im GridContainerNode gerendert.
  // Position (oben links / oben rechts) wird aus der Layout-Seite des Grids
  // abgeleitet (LEVEL_X_CONFIG.themes[].side via getSideFor(cardId)) — keine
  // hartkodierten Pixel-Koordinaten mehr.
];

// LEVEL 3 CONTAINER ALS CHILDREN DES L2-ANNEX (parentId='two-level-annex').
// Positionen aus LEVEL3_POSITIONS.cards (single source of truth analog L1/L2).
// Card-Mitte == Theme-Mitte fuer jeden Eintrag → straight Theme-Card-Edges.
// style.width/height explizit (ReactFlow v12 parentId-Children Default-Sizing-Bug).
const makeLevel3Container = (id, gridType) => ({
  ...createGridContainer(id, gridType, 3, LEVEL3_POSITIONS.cards[id]),
  parentId: 'two-level-annex',
  style: getGridDimensions(id),
});

const level3Containers = [
  makeLevel3Container('9erContainer-level-3', '9er'),
  makeLevel3Container('3erContainer-level-3-third', '3er'),
  makeLevel3Container('3erContainer-level-3-second', '3er'),
  makeLevel3Container('3erContainer-level-3', '3er'),
  makeLevel3Container('6erContainer-level-3', '6er'),
];

// Lerneinheit für das 3er Grid Level 3 - Zelle 1
// Muss NACH '3erContainer-level-3' im Node-Array stehen, damit sie über dem Parent-Container
// gerendert wird und Klicks (linkUrl) nicht vom Container abgefangen werden.
const threeGridLevel3Lerneinheit1 = {
  id: 'three-grid-level3-lerneinheit-1',
  type: 'lerneinheit',
  className: 'lerneinheit-clickable',
  zIndex: 9999,
  position: lerneinheitPositionFor(1, '3erContainer-level-3'),
  parentId: '3erContainer-level-3',
  data: {
    title: 'Veränderungen strukturiert planen und umsetzen',
    width: TILE.width * 0.01215,
    height: TILE.height * 0.01215,
    backgroundColor: '#e6fefc',
    borderColor: '#30b89b',
    fontSize: 960 * 0.01215,
    imageSource: 'pic1',
    linkUrl: 'https://www.youtube.com/watch?v=5locf7gsEU4',
    statusIcons: [{ type: 'deadlineIcon' }],
  },
};

// FINALES NODES ARRAY - LEVEL 3 CONTAINER GANZ AM ENDE
const finalNodes = [
  ...initialNodes,
  ...level3Containers,
  threeGridLevel3Lerneinheit1,
];

  // FlowApp Komponente
function FlowApp({ onSwitchToHome }) {
  const { getViewport, setViewport } = useReactFlow();

  // [RenderPixelDiag] Vergleicht gerenderte Pixel-Y-Positionen der 6 L1-Theme-
  // Circles mit der mathematischen Erwartung aus levelLayout. Läuft 1500 ms
  // nach Mount, damit fitView() durch ist (sonst variiert vp.zoom noch).
  // Methode: Theme 1 ist der Anker, alle anderen werden gegen seinen
  // gemessenen Center-Y getestet:
  //   predicted_px(B) = measured_px(A) + (flowY_B - flowY_A) × vp.zoom
  // Drift > 1 px == echtes Render-Mismatch; <= 1 px = Sub-Pixel-Rasterung.
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const themes = [
        { id: 'one-level-category-node-top-left',       label: '1. FÜHRUNGS-',  flowY: 91603.2  },
        { id: 'one-level-category-node-middle-left-l1', label: '2. DIVERSITY',  flowY: 175420.4 },
        { id: 'one-level-category-node-bottom-left',    label: '3. KONFLIKT-',  flowY: 259237.6 },
        { id: 'one-level-category-node-top-right',      label: '4. CHANGE',     flowY: 91603.2  },
        { id: 'one-level-category-node-middle-right',   label: '5. AGILES',     flowY: 175420.4 },
        { id: 'one-level-category-node-bottom-right',   label: '6. TEAM-',      flowY: 259237.6 },
      ];

      const measured = themes.map((t) => {
        const el = document.querySelector(`.react-flow__node[data-id="${t.id}"]`);
        if (!el) return { ...t, error: 'DOM element not found' };
        const r = el.getBoundingClientRect();
        return {
          ...t,
          rectTop: r.top,
          rectHeight: r.height,
          measuredCenterY_px: r.top + r.height / 2,
          rectLeft: r.left,
          rectWidth: r.width,
          measuredCenterX_px: r.left + r.width / 2,
        };
      });

      const missing = measured.filter((m) => m.error);
      if (missing.length > 0) {
        // eslint-disable-next-line no-console
        console.warn('[RenderPixelDiag] FAIL — DOM-Elemente nicht gefunden:', missing);
        return;
      }

      const vp = getViewport();
      const anchor = measured[0];
      const TOLERANCE_PX = 1.0;

      const rows = measured.map((m) => {
        const flowDeltaY = m.flowY - anchor.flowY;
        const predictedCenterY_px = anchor.measuredCenterY_px + flowDeltaY * vp.zoom;
        const driftY_px = m.measuredCenterY_px - predictedCenterY_px;
        return {
          theme: m.label,
          id: m.id,
          flowY: m.flowY,
          measuredCenterY_px: Math.round(m.measuredCenterY_px * 100) / 100,
          predictedCenterY_px: Math.round(predictedCenterY_px * 100) / 100,
          driftY_px: Math.round(driftY_px * 1000) / 1000,
          renderedHeight_px: Math.round(m.rectHeight * 100) / 100,
          withinTolerance: Math.abs(driftY_px) <= TOLERANCE_PX,
        };
      });

      // Pair-Symmetry-Check L↔R im Pixel-Raum
      const pairs = [0, 1, 2].map((row) => {
        const left = measured[row];
        const right = measured[row + 3];
        return {
          row,
          left: left.id,
          right: right.id,
          leftCenterY_px:  Math.round(left.measuredCenterY_px * 100) / 100,
          rightCenterY_px: Math.round(right.measuredCenterY_px * 100) / 100,
          ΔY_px: Math.round((left.measuredCenterY_px - right.measuredCenterY_px) * 1000) / 1000,
          identical: Math.abs(left.measuredCenterY_px - right.measuredCenterY_px) <= TOLERANCE_PX,
        };
      });

      const adjacentGapsPx = {
        left: [
          { between: '1→2', gap: Math.round((measured[1].measuredCenterY_px - measured[0].measuredCenterY_px) * 100) / 100 },
          { between: '2→3', gap: Math.round((measured[2].measuredCenterY_px - measured[1].measuredCenterY_px) * 100) / 100 },
        ],
        right: [
          { between: '4→5', gap: Math.round((measured[4].measuredCenterY_px - measured[3].measuredCenterY_px) * 100) / 100 },
          { between: '5→6', gap: Math.round((measured[5].measuredCenterY_px - measured[4].measuredCenterY_px) * 100) / 100 },
        ],
      };

      const allWithinTolerance = rows.every((r) => r.withinTolerance);
      const allPairsIdentical  = pairs.every((p) => p.identical);

      // eslint-disable-next-line no-console
      console.log('[RenderPixelDiag]', {
        viewport: { x: vp.x, y: vp.y, zoom: vp.zoom },
        anchor: { id: anchor.id, measuredCenterY_px: Math.round(anchor.measuredCenterY_px * 100) / 100 },
        themes: rows,
        'L↔R pixel pairs': pairs,
        'adjacent gaps (px)': adjacentGapsPx,
        verdict: {
          allDriftWithin1px: allWithinTolerance,
          allPairsLRIdenticalPx: allPairsIdentical,
          conclusion: allWithinTolerance && allPairsIdentical
            ? '✅ Render == Math (Sub-Pixel-Drift). Asymmetrie-Wahrnehmung ist optisch (Massen-Verteilung), kein Layout-Bug.'
            : '⚠️ Render weicht von Math ab — siehe driftY_px / ΔY_px > 1.',
        },
      });

      // === [LerneinheitSymmetryDiag] — Cell-1-Tile-Symmetrie zwischen Cards ===
      // Misst Cell-1-Tile-Center jedes L1-Card und prüft, ob Cards desselben
      // gridType (3er ↔ 3er, 6er ↔ 6er) identische Tile-Positionen RELATIV zum
      // jeweiligen Container haben. Vor dem Methode-A-Refactor differierten
      // 3er- bzw. 6er-Pair-Cards um ~2000 Flow-Units (≈ 7 px), weil Methode B
      // (cellWidth/cols) und Methode A (padding+col×stride) unterschiedliche
      // Cell-1-Positionen produzieren. Nach dem Refactor sollte Drift = 0.
      const cards = [
        { theme: '1. (9er)',     containerId: '9erContainer-level-1',      tileId: 'nine-grid-lerneinheit-1',         gridType: '9er' },
        { theme: '2. (3er L)',   containerId: '3erContainer-level-1',      tileId: 'three-grid-level1-lerneinheit-1', gridType: '3er' },
        { theme: '3. (6er L)',   containerId: '6erContainer-level-1',      tileId: 'six-grid-lerneinheit-1',          gridType: '6er' },
        { theme: '5. (6er R)',   containerId: '6erContainer-level-1-main', tileId: 'six-grid-main-lerneinheit-1',     gridType: '6er' },
        { theme: '6. (3er R)',   containerId: '3erContainer-level-1-main', tileId: 'three-grid-main-lerneinheit-1',   gridType: '3er' },
      ];

      const cardRows = cards.map((c) => {
        const containerEl = document.querySelector(`.react-flow__node[data-id="${c.containerId}"]`);
        const tileEl = document.querySelector(`.react-flow__node[data-id="${c.tileId}"]`);
        if (!containerEl || !tileEl) return { ...c, error: `missing DOM: container=${!!containerEl}, tile=${!!tileEl}` };
        const cr = containerEl.getBoundingClientRect();
        const tr = tileEl.getBoundingClientRect();
        return {
          theme: c.theme,
          gridType: c.gridType,
          containerId: c.containerId,
          tileWidth_px:  Math.round(tr.width * 100) / 100,
          tileHeight_px: Math.round(tr.height * 100) / 100,
          // Tile-Center RELATIV zum Container-Top-Left (dann sind beide Cards
          // im selben gridType direkt vergleichbar, unabhängig vom Layout-Slot)
          relCenterX_px: Math.round((tr.left + tr.width  / 2 - cr.left) * 100) / 100,
          relCenterY_px: Math.round((tr.top  + tr.height / 2 - cr.top)  * 100) / 100,
        };
      });

      const cardMissing = cardRows.filter((r) => r.error);
      if (cardMissing.length > 0) {
        // eslint-disable-next-line no-console
        console.warn('[LerneinheitSymmetryDiag] FAIL — DOM nicht gefunden:', cardMissing);
      } else {
        const TILE_TOL = 1.0;
        const byGrid = {};
        for (const r of cardRows) (byGrid[r.gridType] ||= []).push(r);

        const pairs6er = byGrid['6er'] && byGrid['6er'].length === 2 ? {
          left: byGrid['6er'][0].theme,
          right: byGrid['6er'][1].theme,
          ΔX_px: Math.round((byGrid['6er'][0].relCenterX_px - byGrid['6er'][1].relCenterX_px) * 100) / 100,
          ΔY_px: Math.round((byGrid['6er'][0].relCenterY_px - byGrid['6er'][1].relCenterY_px) * 100) / 100,
          ΔTileWidth_px:  Math.round((byGrid['6er'][0].tileWidth_px  - byGrid['6er'][1].tileWidth_px)  * 100) / 100,
          ΔTileHeight_px: Math.round((byGrid['6er'][0].tileHeight_px - byGrid['6er'][1].tileHeight_px) * 100) / 100,
        } : null;

        const pairs3er = byGrid['3er'] && byGrid['3er'].length === 2 ? {
          left: byGrid['3er'][0].theme,
          right: byGrid['3er'][1].theme,
          ΔX_px: Math.round((byGrid['3er'][0].relCenterX_px - byGrid['3er'][1].relCenterX_px) * 100) / 100,
          ΔY_px: Math.round((byGrid['3er'][0].relCenterY_px - byGrid['3er'][1].relCenterY_px) * 100) / 100,
          ΔTileWidth_px:  Math.round((byGrid['3er'][0].tileWidth_px  - byGrid['3er'][1].tileWidth_px)  * 100) / 100,
          ΔTileHeight_px: Math.round((byGrid['3er'][0].tileHeight_px - byGrid['3er'][1].tileHeight_px) * 100) / 100,
        } : null;

        const pair6erOk = pairs6er && Math.abs(pairs6er.ΔX_px) < TILE_TOL && Math.abs(pairs6er.ΔY_px) < TILE_TOL && Math.abs(pairs6er.ΔTileWidth_px) < TILE_TOL && Math.abs(pairs6er.ΔTileHeight_px) < TILE_TOL;
        const pair3erOk = pairs3er && Math.abs(pairs3er.ΔX_px) < TILE_TOL && Math.abs(pairs3er.ΔY_px) < TILE_TOL && Math.abs(pairs3er.ΔTileWidth_px) < TILE_TOL && Math.abs(pairs3er.ΔTileHeight_px) < TILE_TOL;

        // eslint-disable-next-line no-console
        console.log('[LerneinheitSymmetryDiag]', {
          cards: cardRows,
          'pair 6er (Theme 3 ↔ Theme 5)': pairs6er,
          'pair 3er (Theme 2 ↔ Theme 6)': pairs3er,
          verdict: {
            pair6erWithin1px: pair6erOk,
            pair3erWithin1px: pair3erOk,
            conclusion: pair6erOk && pair3erOk
              ? '✅ Tile-Symmetrie erreicht — gleicher gridType ⇒ identische Cell-1-Position relativ zum Container.'
              : '⚠️ Tile-Asymmetrie — siehe ΔX/ΔY/ΔTile* > 1.',
          },
        });
      }
    }, 1500);
    return () => clearTimeout(timeoutId);
  }, [getViewport]);

  // smoothZoomToNode anpassen, damit nodeSize übergeben werden kann
  const smoothZoomToNode = useCallback((node, targetZoom = 1.2, duration = 1200, nodeSize = 880) => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const nodeCenterX = node.position.x + nodeSize / 2;
    const nodeCenterY = node.position.y + nodeSize / 2;
    const targetX = -(nodeCenterX * targetZoom) + viewportWidth / 2;
    const targetY = -(nodeCenterY * targetZoom) + viewportHeight / 2;

    const start = getViewport();
    const startTime = performance.now();

    function animate(now) {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      const zoom = start.zoom + (targetZoom - start.zoom) * ease;
      const x = start.x + (targetX - start.x) * ease;
      const y = start.y + (targetY - start.y) * ease;
      setViewport({ x, y, zoom, duration: 0 });
      if (t < 1) {
        requestAnimationFrame(animate);
      }
    }
    requestAnimationFrame(animate);
  }, [getViewport, setViewport]);

  // fitContainerView anpassen, damit nodeSize übergeben werden kann
  const fitContainerView = useCallback((containerId) => {
    const node = finalNodes.find(node => node.id === containerId);
    if (node) {
      const nodeSize = 880; // Standard-Node-Größe für Container
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const nodeCenterX = node.position.x + nodeSize / 2;
      const nodeCenterY = node.position.y + nodeSize / 2;
      const targetX = -(nodeCenterX * 1.2) + viewportWidth / 2; // Zoom auf 1.2
      const targetY = -(nodeCenterY * 1.2) + viewportHeight / 2; // Zoom auf 1.2

      const start = getViewport();
      const startTime = performance.now();

      function animate(now) {
        const elapsed = now - startTime;
        const t = Math.min(elapsed / 1200, 1); // Dauer für Zoom
        const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        const zoom = start.zoom + (1.2 - start.zoom) * ease;
        const x = start.x + (targetX - start.x) * ease;
        const y = start.y + (targetY - start.y) * ease;
        setViewport({ x, y, zoom, duration: 0 });
        if (t < 1) {
          requestAnimationFrame(animate);
        }
      }
      requestAnimationFrame(animate);
    }
  }, [getViewport, setViewport, finalNodes]);


  // onNodeClick erweitern
  const onNodeClick = useCallback((event, node) => {
    if (node.data?.linkUrl) {
      window.open(node.data.linkUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    if (node.id === 'three-level-central-node') {
      smoothZoomToNode(node, 1.2, 1200, 880); // zentrale Node
    } else if (node.type === 'category' || node.type === 'threeLevelCategory') {
      smoothZoomToNode(node, 1.2, 1200, 640); // Kategorie-Nodes
    } else if (node.type === 'gridContainer') {
      fitContainerView(node.id);
    }
  }, [smoothZoomToNode, fitContainerView]);

  return (
    <div className="course-overview-canvas" style={{ height: '100vh', width: '100vw', background: 'radial-gradient(circle, #ffffff 45%, #c1c1c1 100%)' }}>
      <ReactFlow
        nodes={finalNodes}
        edges={initialEdges}
        nodeTypes={nodeTypes}
        fitView={true}
        minZoom={0.0001}
        maxZoom={20}
        defaultViewport={{ x: -10000, y: 64000, zoom: 0.3 }}
        onlyRenderVisibleElements={true}
        onNodeClick={onNodeClick}
        onNodeDoubleClick={(event, node) => {
          if (node.type === 'gridContainer') {
            fitContainerView(node.id);
          }
        }}
        zoomOnPinch={true}
        panOnDrag={true}
        zoomOnScroll={true}
        panOnScroll={false}
        zoomOnDoubleClick={false}
        selectionOnDrag={false}
        multiSelectionKeyCode="Shift"
        deleteKeyCode="Delete"
      >
        <Panel position="top-left">
          <button onClick={onSwitchToHome}>Home Flow</button>
          <button style={{ marginLeft: 8 }} disabled>Kursübersicht</button>
        </Panel>
        <Controls
          style={{
            transform: 'scale(0.5)',
            transformOrigin: 'top left',
            margin: '8px',
          }}
        />
      </ReactFlow>
    </div>
  );
}

  // CourseOverviewFlowCanvas Komponente
export default function CourseOverviewFlowCanvas({ onSwitchToHome }) {
  console.log('CourseOverviewFlowCanvas wird geladen');
  console.log('initialNodes:', initialNodes);
  console.log('level3Containers:', level3Containers);
  console.log('finalNodes:', finalNodes);
  console.log('nodeTypes:', nodeTypes);
  console.log('nineGridLerneinheiten:', nineGridLerneinheiten);
  console.log('gridContainerConfigs:', gridContainerConfigs);
  
  // Debug: Grid-Positionen testen
  // useEffect(() => {
  //   console.log('=== DEBUG: Grid-Positionen ===');
  //   debugCellPositions();
  // }, []);
  
  return (
    <ReactFlowProvider>
      <FlowApp onSwitchToHome={onSwitchToHome} />
    </ReactFlowProvider>
  );
}
