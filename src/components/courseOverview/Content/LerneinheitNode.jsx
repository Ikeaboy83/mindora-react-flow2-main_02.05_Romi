// components/Content/LerneinheitNode.jsx
import React from 'react';
import FavoritIconNode from '../../status/FavoritIconNode';
import DoneIconNode from '../../status/DoneIconNode';
import DeadlineIconNode from '../../status/DeadlineIconNode';
import StartedIconNode from '../../status/StartedIconNode';
import LockedIconNode from '../../status/LockedIconNode';
import pic1 from '../../../assets/Pictures/pic1.jpg';
import pic2 from '../../../assets/Pictures/pic2.jpg';
import pic3 from '../../../assets/Pictures/pic3.jpg';
import pic4 from '../../../assets/Pictures/pic4.jpg';
import pic5 from '../../../assets/Pictures/pic5.jpg';
import pic6 from '../../../assets/Pictures/pic6.jpg';
import pic7 from '../../../assets/Pictures/pic7.jpg';
import pic8 from '../../../assets/Pictures/pic8.jpg';
import pic9 from '../../../assets/Pictures/pic9.jpg';
import pic10 from '../../../assets/Pictures/pic10.jpg';
import pic11 from '../../../assets/Pictures/pic11.jpg';
import pic12 from '../../../assets/Pictures/pic12.jpg';
import pic13 from '../../../assets/Pictures/pic13.jpg';
import { calculateLerneinheitPositionInCell, getContainerDimensions, TILE } from '../GridboxNode/gridUtils';
import { calculateSingleIconPosition } from '../GridboxNode/positionUtils';
import {
  STATUS,
  getStatusFromIcons,
  getBorderColorForStatus,
} from '../../../constants/statusConfig';

// Hauptstatus -> Icon-Komponente. DEFAULT zeigt kein Icon im Bildbereich.
const STATUS_ICON_BY_STATUS = {
  [STATUS.DONE]:        DoneIconNode,
  [STATUS.IN_PROGRESS]: StartedIconNode,
  [STATUS.SCHEDULED]:   DeadlineIconNode,
  [STATUS.LOCKED]:      LockedIconNode,
  [STATUS.DEFAULT]:     null,
};

const imageMap = {
  pic1, pic2, pic3, pic4, pic5, pic6, pic7,
  pic8, pic9, pic10, pic11, pic12, pic13,
};

export default function LerneinheitNode({ data }) {
  const minDim = Math.min(data.width, data.height);

  // Hauptstatus + Favorit getrennt ableiten — orthogonale Achsen.
  const status = getStatusFromIcons(data.statusIcons);
  const borderColor = getBorderColorForStatus(status);
  const isFavorite = Array.isArray(data.statusIcons)
    && data.statusIcons.some(icon => icon?.type === 'favoritIcon');
  const StatusIconComp = STATUS_ICON_BY_STATUS[status];
  // Border pulsiert synchron zum Kalender-Icon (DeadlineIconNode, calendar-pulse
  // 1.8s) — nur im scheduled-Status, damit die Deadline-Markierung visuell als
  // zusammengehörige Einheit aus Icon + Rahmen wahrgenommen wird.
  const isScheduled = status === STATUS.SCHEDULED;

  // Proportional skalierte Stilwerte (alles in logischen ReactFlow-Einheiten).
  const borderWidth = minDim * 0.064;
  const borderRadius = minDim * 0.05;
  const shadowOffsetX = minDim * -0.015;
  const shadowOffsetY = minDim * 0.025;
  const shadowBlur = minDim * 0.04;

  // Header-Höhe: ~22% der Tile-Höhe, abgesichert mit Min/Max gegen extreme Aspect-Ratios.
  // (CSS clamp() greift hier nicht sinnvoll, weil wir in logischen Koordinaten rendern,
  //  die ReactFlow erst im Viewport-Transform skaliert.)
  const titleBarHeight = Math.min(
    Math.max(data.height * 0.22, data.height * 0.15),
    data.height * 0.30
  );
  const titleFontSize = data.fontSize ? data.fontSize * 0.90 : minDim * 0.090;
  const titlePaddingY = minDim * 0.02;
  const titlePaddingX = minDim * 0.04;

  // Status-/Favorit-Badges: gleiche Größe, zentriert im Bildbereich nebeneinander.
  const iconBaseSize = 20; // SVG-Originalgröße in components/status/*.
  const iconBadgeSize = minDim * 0.36;
  const iconScale = iconBadgeSize / iconBaseSize;
  const iconGap = minDim * 0.156;

  const currentImage = imageMap[data.imageSource] || pic1;

  return (
    <>
      {isScheduled && (
        <style>{`
          @keyframes lerneinheit-scheduled-border-pulse {
            0%, 100% { border-color: #60a5fa; }
            50%      { border-color: ${borderColor}; }
          }
        `}</style>
      )}
    <div
      style={{
        width: data.width,
        height: data.height,
        border: `${borderWidth}px solid ${isScheduled ? '#60a5fa' : borderColor}`,
        borderRadius,
        overflow: 'hidden',
        position: 'relative',
        boxSizing: 'border-box',
        background: '#1f2937',
        fontFamily: 'var(--font-overview), sans-serif',
        boxShadow: `${shadowOffsetX}px ${shadowOffsetY}px ${shadowBlur}px rgba(0, 0, 0, 0.6)`,
        display: 'flex',
        flexDirection: 'column',
        animation: isScheduled ? 'lerneinheit-scheduled-border-pulse 1.8s ease-in-out infinite' : undefined,
      }}
    >
      {/* Header-Balken: Status-Farbe, Titel weiß bold uppercase linksbündig */}
      <div
        style={{
          minHeight: titleBarHeight,
          background: '#ffffff',
          padding: `${titlePaddingY}px ${titlePaddingX}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          color: '#000000',
          fontSize: titleFontSize,
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          textAlign: 'left',
          lineHeight: 1.1,
          whiteSpace: 'pre-line',
          boxSizing: 'border-box',
          flexShrink: 0,
        }}
      >
        {data.title}
      </div>

      {/* Bildbereich: Thumbnail mit object-fit cover, Icons darüber */}
      <div
        style={{
          position: 'relative',
          flex: 1,
          overflow: 'hidden',
        }}
      >
        <img
          src={currentImage}
          alt=""
          loading="lazy"
          decoding="async"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
          }}
        />

        {/* Status- + Favorit-Icons: zentriert im Bildbereich nebeneinander */}
        {(StatusIconComp || isFavorite) && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: iconGap,
              zIndex: 2,
              pointerEvents: 'none',
            }}
          >
            {StatusIconComp && (
              <div style={{ width: iconBadgeSize, height: iconBadgeSize, pointerEvents: 'auto' }}>
                <div style={{ transform: `scale(${iconScale})`, transformOrigin: 'top left' }}>
                  <StatusIconComp />
                </div>
              </div>
            )}
            {isFavorite && (
              <div style={{ width: iconBadgeSize, height: iconBadgeSize, pointerEvents: 'auto' }}>
                <div style={{ transform: `scale(${iconScale})`, transformOrigin: 'top left' }}>
                  <FavoritIconNode />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
    </>
  );
}

// Lerneinheiten für das 9er Grid (Level 1) - wird von CourseOverviewFlowCanvas verwendet
export const nineGridLerneinheiten = [
  {
    id: 'nine-grid-lerneinheit-1',
    type: 'lerneinheit',
    // Position relativ zu Zelle 1: 5% X, 10% Y der Zelle
    position: (() => {
      const containerId = '9erContainer-level-1';
      const { width, height } = getContainerDimensions(containerId);
      return calculateLerneinheitPositionInCell(1, width, height);
    })(),
    parentId: '9erContainer-level-1',
    data: {
      title: 'Ziele klar formulieren und Orientierung geben',
      // SKALIERTE Größen basierend auf Container-ID
      width: TILE.width * 1, // getLerneinheitScaleFactor('9erContainer-level-1'),
      height: TILE.height * 1, // getLerneinheitScaleFactor('9erContainer-level-1'),
      backgroundColor: '#e6fefc',
      borderColor: '#30b89b',
      // SKALIERTE Schriftgröße basierend auf Container-ID
      fontSize: 960 * 1, // getLerneinheitScaleFactor('9erContainer-level-1'),
      imageSource: 'pic1', // Bild-Quelle für diese Lerneinheit
      statusIcons: [
        {
          type: 'doneIcon',
          ...(() => {
            const lerneinheitWidth = TILE.width * 1;
            const lerneinheitHeight = TILE.height * 1;
            const scaleRatio = Math.min(lerneinheitWidth / TILE.width, lerneinheitHeight / TILE.height);
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
              offsetY: iconPosition.calculations.offsetY,
            };
          })(),
        },
      ],
    },
  },
  {
    id: 'nine-grid-lerneinheit-2',
    type: 'lerneinheit',
    // Position relativ zu Zelle 2: 5% X, 10% Y der Zelle
    position: (() => {
      const containerId = '9erContainer-level-1';
      const { width, height } = getContainerDimensions(containerId);
      return calculateLerneinheitPositionInCell(2, width, height);
    })(),
    parentId: '9erContainer-level-1',
    data: {
             title: 'Entscheidungen treffen unter Unsicherheit',
       // SKALIERTE Größen basierend auf Container-ID
       width: TILE.width * 1, // getLerneinheitScaleFactor('9erContainer-1-level-1'),
       height: TILE.height * 1, // getLerneinheitScaleFactor('9erContainer-1-level-1'),
       backgroundColor: '#e6fefc',
       borderColor: '#30b89b',
       // SKALIERTE Schriftgröße basierend auf Container-ID
       fontSize: 960 * 1, // getLerneinheitScaleFactor('9erContainer-1-level-1'),
       imageSource: 'pic2', // Bild-Quelle für diese Lerneinheit
              statusIcons: [
         {
           type: 'startedIcon',
           ...(() => {
             // Berechne die tatsächliche gerenderte Icon-Größe
             const lerneinheitWidth = TILE.width * 1; // getLerneinheitScaleFactor('9erContainer-level-1');
             const lerneinheitHeight = TILE.height * 1; // getLerneinheitScaleFactor('9erContainer-level-1');
             const scaleRatio = Math.min(lerneinheitWidth / TILE.width, lerneinheitHeight / TILE.height);
             const actualIconSize = 20 * 300 * scaleRatio; // 20px × 300 × scaleRatio

             const iconPosition = calculateSingleIconPosition(
               { x: 0.5, y: 0.3 }, // Relative Position: 50% Breite, 30% Höhe der Lerneinheit
               lerneinheitWidth, // Lerneinheit-Breite
               lerneinheitHeight, // Lerneinheit-Höhe
               actualIconSize, // Icon-Breite (echte gerenderte Größe)
               actualIconSize  // Icon-Höhe (echte gerenderte Größe)
             );
             return {
               x: iconPosition.centerIcon.x,
               y: iconPosition.centerIcon.y,
               offsetX: iconPosition.calculations.offsetX, // 750px X-Offset
               offsetY: iconPosition.calculations.offsetY  // 750px Y-Offset
             };
           })()
         }
       ],
    },
  },
  {
    id: 'nine-grid-lerneinheit-3',
    type: 'lerneinheit',
    // Position relativ zu Zelle 3: 5% X, 10% Y der Zelle
    position: (() => {
      const containerId = '9erContainer-level-1';
      const { width, height } = getContainerDimensions(containerId);
      return calculateLerneinheitPositionInCell(3, width, height);
    })(),
    parentId: '9erContainer-level-1',
    data: {
             title: 'Mitarbeitende motivieren und entwickeln',
       // SKALIERTE Größen basierend auf Container-ID
       width: TILE.width * 1, // getLerneinheitScaleFactor('9erContainer-1-level-1'),
       height: TILE.height * 1, // getLerneinheitScaleFactor('9erContainer-1-level-1'),
       backgroundColor: '#e6fefc',
       borderColor: '#30b89b',
       // SKALIERTE Schriftgröße basierend auf Container-ID
       fontSize: 960 * 1, // getLerneinheitScaleFactor('9erContainer-1-level-1'),
       imageSource: 'pic3', // Bild-Quelle für diese Lerneinheit - pic3
       //        statusIcons: [
       //   {
       //     type: 'favoritIcon',
       //     ...(() => {
       //       // Berechne die tatsächliche gerenderte Icon-Größe
       //       const lerneinheitWidth = TILE.width * 1; // getLerneinheitScaleFactor('9erContainer-level-1');
       //       const lerneinheitHeight = TILE.height * 1; // getLerneinheitScaleFactor('9erContainer-level-1');
       //       const scaleRatio = Math.min(lerneinheitWidth / TILE.width, lerneinheitHeight / TILE.height);
       //       const actualIconSize = 20 * 300 * scaleRatio; // 20px × 300 × scaleRatio
       //
       //       const iconPosition = calculateSingleIconPosition(
       //         { x: 0.5, y: 0.3 }, // Relative Position: 50% Breite, 30% Höhe der Lerneinheit
       //         lerneinheitWidth, // Lerneinheit-Breite
       //         lerneinheitHeight, // Lerneinheit-Höhe
       //         actualIconSize, // Icon-Breite (echte gerenderte Größe)
       //         actualIconSize  // Icon-Höhe (echte gerenderte Größe)
       //       );
       //       return {
       //         x: iconPosition.centerIcon.x,
       //         y: iconPosition.centerIcon.y,
       //         offsetX: iconPosition.calculations.offsetX, // 750px X-Offset
       //         offsetY: iconPosition.calculations.offsetY  // 750px Y-Offset
       //       };
       //     })()
       //   }
       // ],
    },
  },
  {
    id: 'nine-grid-lerneinheit-4',
    type: 'lerneinheit',
    // Position relativ zu Zelle 4: 5% X, 10% Y der Zelle
    position: (() => {
      const containerId = '9erContainer-level-1';
      const { width, height } = getContainerDimensions(containerId);
      return calculateLerneinheitPositionInCell(4, width, height);
    })(),
    parentId: '9erContainer-level-1',
    data: {
             title: 'Feedback wirksam geben und annehmen',
       // SKALIERTE Größen basierend auf Container-ID
       width: TILE.width * 1, // getLerneinheitScaleFactor('9erContainer-1-level-1'),
       height: TILE.height * 1, // getLerneinheitScaleFactor('9erContainer-1-level-1'),
       backgroundColor: '#e6fefc',
       borderColor: '#30b89b',
       // SKALIERTE Schriftgröße basierend auf Container-ID
       fontSize: 960 * 1, // getLerneinheitScaleFactor('9erContainer-1-level-1'),
       imageSource: 'pic4', // Bild-Quelle für diese Lerneinheit
               statusIcons: [],
    },
  },
  {
    id: 'nine-grid-lerneinheit-5',
    type: 'lerneinheit',
    // Position relativ zu Zelle 5: 5% X, 10% Y der Zelle
    position: (() => {
      const containerId = '9erContainer-level-1';
      const { width, height } = getContainerDimensions(containerId);
      return calculateLerneinheitPositionInCell(5, width, height);
    })(),
    parentId: '9erContainer-level-1',
    data: {
             title: 'Verantwortung delegieren und Kontrolle behalten ',
       // SKALIERTE Größen basierend auf Container-ID
       width: TILE.width * 1, // getLerneinheitScaleFactor('9erContainer-1-level-1'),
       height: TILE.height * 1, // getLerneinheitScaleFactor('9erContainer-1-level-1'),
       backgroundColor: '#e6fefc',
       borderColor: '#30b89b',
       // SKALIERTE Schriftgröße basierend auf Container-ID
       fontSize: 960 * 1, // getLerneinheitScaleFactor('9erContainer-1-level-1'),
       imageSource: 'pic5', // Bild-Quelle für diese Lerneinheit
       statusIcons: [],
    },
  },
  {
    id: 'nine-grid-lerneinheit-6',
    type: 'lerneinheit',
    // Position relativ zu Zelle 6: 5% X, 10% Y der Zelle
    position: (() => {
      const containerId = '9erContainer-level-1';
      const { width, height } = getContainerDimensions(containerId);
      return calculateLerneinheitPositionInCell(6, width, height);
    })(),
    parentId: '9erContainer-level-1',
    data: {
                           title: 'Kommunikation im Team steuern',
         // SKALIERTE Größen basierend auf Container-ID
         width: TILE.width * 1, // getLerneinheitScaleFactor('9erContainer-1-level-1'),
         height: TILE.height * 1, // getLerneinheitScaleFactor('9erContainer-1-level-1'),
         backgroundColor: '#e6fefc',
         borderColor: '#30b89b',
         // SKALIERTE Schriftgröße basierend auf Container-ID
         fontSize: 960 * 1, // getLerneinheitScaleFactor('9erContainer-1-level-1'),
         imageSource: 'pic6', // Bild-Quelle für diese Lerneinheit
         statusIcons: [],
    },
  },
  {
    id: 'nine-grid-lerneinheit-7',
    type: 'lerneinheit',
    // Position relativ zu Zelle 7: 5% X, 10% Y der Zelle
    position: (() => {
      const containerId = '9erContainer-level-1';
      const { width, height } = getContainerDimensions(containerId);
      return calculateLerneinheitPositionInCell(7, width, height);
    })(),
    parentId: '9erContainer-level-1',
    data: {
             title: 'Vertrauen aufbauen und Beziehungen stärken',
       // SKALIERTE Größen basierend auf Container-ID
       width: TILE.width * 1, // getLerneinheitScaleFactor('9erContainer-1-level-1'),
       height: TILE.height * 1, // getLerneinheitScaleFactor('9erContainer-1-level-1'),
       backgroundColor: '#e6fefc',
       borderColor: '#30b89b',
       // SKALIERTE Schriftgröße basierend auf Container-ID
       fontSize: 960 * 1, // getLerneinheitScaleFactor('9erContainer-1-level-1'),
       imageSource: 'pic7', // Bild-Quelle für diese Lerneinheit
       statusIcons: [],
    },
  },
  {
    id: 'nine-grid-lerneinheit-8',
    type: 'lerneinheit',
    // Position relativ zu Zelle 8: 5% X, 10% Y der Zelle
    position: (() => {
      const containerId = '9erContainer-level-1';
      const { width, height } = getContainerDimensions(containerId);
      return calculateLerneinheitPositionInCell(8, width, height);
    })(),
    parentId: '9erContainer-level-1',
    data: {
      title: 'Prioritäten setzen und Zeit managen',
      // SKALIERTE Größen basierend auf Container-ID
      width: TILE.width * 1, // getLerneinheitScaleFactor('9erContainer-level-1'),
      height: TILE.height * 1, // getLerneinheitScaleFactor('9erContainer-level-1'),
      backgroundColor: '#e6fefc',
      borderColor: '#30b89b',
      // SKALIERTE Schriftgröße basierend auf Container-ID
      fontSize: 960 * 1, // getLerneinheitScaleFactor('9erContainer-level-1'),
      imageSource: 'pic8', // Bild-Quelle für diese Lerneinheit
      statusIcons: [],
    },
  },
  {
    id: 'nine-grid-lerneinheit-9',
    type: 'lerneinheit',
    // Position relativ zu Zelle 9: 5% X, 10% Y der Zelle
    position: (() => {
      const containerId = '9erContainer-level-1';
      const { width, height } = getContainerDimensions(containerId);
      return calculateLerneinheitPositionInCell(9, width, height);
    })(),
    parentId: '9erContainer-level-1',
    data: {
      title: 'Führung in Veränderungsprozessen gestalten',
      // SKALIERTE Größen basierend auf Container-ID
      width: TILE.width * 1, // getLerneinheitScaleFactor('9erContainer-level-1'),
      height: TILE.height * 1, // getLerneinheitScaleFactor('9erContainer-level-1'),
      backgroundColor: '#e6fefc',
      borderColor: '#30b89b',
      // SKALIERTE Schriftgröße basierend auf Container-ID
      fontSize: 960 * 1, // getLerneinheitScaleFactor('9erContainer-level-1'),
      imageSource: 'pic9', // Bild-Quelle für diese Lerneinheit
      statusIcons: [],
    },
  },

];

// Lerneinheiten für das 6er Grid werden jetzt über gridUtilsIcons.js erstellt
// Das ursprüngliche Array wurde entfernt, um doppelte Lerneinheiten zu vermeiden
export const sixGridLerneinheiten = [];

// Lerneinheiten für das 6er Grid (Level 2) - 12.5% der Basis-Größe
export const sixGridLevel2Lerneinheiten = [
  {
    id: 'six-grid-level2-lerneinheit-1',
    type: 'lerneinheit',
    // Position relativ zu Zelle 1: 5% X, 10% Y der Zelle
    position: (() => {
      const containerId = '6erContainer-level-2';
      const { width, height } = getContainerDimensions(containerId);
      const lerneinheitWidth = TILE.width * 0.125; // Level 2 Größe
      const lerneinheitHeight = TILE.height * 0.125; // Level 2 Größe
      return calculateLerneinheitPositionInCell(1, width, height, '6er', lerneinheitWidth, lerneinheitHeight);
    })(),
    parentId: '6erContainer-level-2',
    data: {
      title: 'Veränderungen klar und verständlich kommunizieren',
      // SKALIERTE Größen für Level 2 (12.5% der Basis-Größe)
      width: TILE.width * 0.125,
      height: TILE.height * 0.125,
      backgroundColor: '#e6fefc',
      borderColor: '#30b89b',
      // SKALIERTE Schriftgröße für Level 2
      fontSize: 960 * 0.125,
      imageSource: 'pic1',
      statusIcons: [],
    },
  },
  {
    id: 'six-grid-level2-lerneinheit-2',
    type: 'lerneinheit',
    // Position relativ zu Zelle 2: 5% X, 10% Y der Zelle
    position: (() => {
      const containerId = '6erContainer-level-2';
      const { width, height } = getContainerDimensions(containerId);
      const lerneinheitWidth = TILE.width * 0.125; // Level 2 Größe
      const lerneinheitHeight = TILE.height * 0.125; // Level 2 Größe
      return calculateLerneinheitPositionInCell(2, width, height, '6er', lerneinheitWidth, lerneinheitHeight);
    })(),
    parentId: '6erContainer-level-2',
    data: {
      title: 'Transparenz schaffen und Vertrauen aufbauen',
      width: TILE.width * 0.125,
      height: TILE.height * 0.125,
      backgroundColor: '#e6fefc',
      borderColor: '#30b89b',
      fontSize: 960 * 0.125,
      imageSource: 'pic2',
      statusIcons: [],
    },
  },
  {
    id: 'six-grid-level2-lerneinheit-3',
    type: 'lerneinheit',
    // Position relativ zu Zelle 3: 5% X, 10% Y der Zelle
    position: (() => {
      const containerId = '6erContainer-level-2';
      const { width, height } = getContainerDimensions(containerId);
      const lerneinheitWidth = TILE.width * 0.125; // Level 2 Größe
      const lerneinheitHeight = TILE.height * 0.125; // Level 2 Größe
      return calculateLerneinheitPositionInCell(3, width, height, '6er', lerneinheitWidth, lerneinheitHeight);
    })(),
    parentId: '6erContainer-level-2',
    data: {
      title: 'Unterschiedliche Zielgruppen gezielt ansprechen',
      width: TILE.width * 0.125,
      height: TILE.height * 0.125,
      backgroundColor: '#e6fefc',
      borderColor: '#30b89b',
      fontSize: 960 * 0.125,
      imageSource: 'pic11', // Level 2, Lerneinheit 3
      statusIcons: [],
    },
  },
  {
    id: 'six-grid-level2-lerneinheit-4',
    type: 'lerneinheit',
    // Position relativ zu Zelle 4: 5% X, 10% Y der Zelle
    position: (() => {
      const containerId = '6erContainer-level-2';
      const { width, height } = getContainerDimensions(containerId);
      const lerneinheitWidth = TILE.width * 0.125; // Level 2 Größe
      const lerneinheitHeight = TILE.height * 0.125; // Level 2 Größe
      return calculateLerneinheitPositionInCell(4, width, height, '6er', lerneinheitWidth, lerneinheitHeight);
    })(),
    parentId: '6erContainer-level-2',
    data: {
      title: 'Feedback im Veränderungsprozess nutzen',
      width: TILE.width * 0.125,
      height: TILE.height * 0.125,
      backgroundColor: '#e6fefc',
      borderColor: '#30b89b',
      fontSize: 960 * 0.125,
      imageSource: 'pic12', // Level 2, Lerneinheit 4
      statusIcons: [],
    },
  },
];

// Lerneinheiten für das 9er Grid (Level 2) - 50% der Basis-Größe
export const nineGridLevel2Lerneinheiten = [
  {
    id: 'nine-grid-level2-lerneinheit-1',
    type: 'lerneinheit',
    // Position relativ zu Zelle 1: 5% X, 10% Y der Zelle
    position: (() => {
      const containerId = '9erContainer-level-2';
      const { width, height } = getContainerDimensions(containerId);
      const lerneinheitWidth = TILE.width * 0.125; // Level 2 Größe
      const lerneinheitHeight = TILE.height * 0.125; // Level 2 Größe
      return calculateLerneinheitPositionInCell(1, width, height, null, lerneinheitWidth, lerneinheitHeight);
    })(),
    parentId: '9erContainer-level-2',
    data: {
      title: 'Veränderungen verstehen und einordnen',
      // SKALIERTE Größen für Level 2 (12.5% der Basis-Größe)
      width: TILE.width * 0.125,
      height: TILE.height * 0.125,
      backgroundColor: '#e6fefc',
      borderColor: '#30b89b',
      // SKALIERTE Schriftgröße für Level 2
      fontSize: 960 * 0.125,
      imageSource: 'pic1',
      statusIcons: [
        {
          type: 'doneIcon',
          ...(() => {
            const lerneinheitWidth = TILE.width * 0.125;
            const lerneinheitHeight = TILE.height * 0.125;
            const scaleRatio = Math.min(lerneinheitWidth / TILE.width, lerneinheitHeight / TILE.height);
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
  {
    id: 'nine-grid-level2-lerneinheit-2',
    type: 'lerneinheit',
    // Position relativ zu Zelle 2: 5% X, 10% Y der Zelle
    position: (() => {
      const containerId = '9erContainer-level-2';
      const { width, height } = getContainerDimensions(containerId);
      const lerneinheitWidth = TILE.width * 0.125; // Level 2 Größe
      const lerneinheitHeight = TILE.height * 0.125; // Level 2 Größe
      return calculateLerneinheitPositionInCell(2, width, height, null, lerneinheitWidth, lerneinheitHeight);
    })(),
    parentId: '9erContainer-level-2',
    data: {
      title: 'Ziele und Nutzen von Veränderungen klären',
      width: TILE.width * 0.125,
      height: TILE.height * 0.125,
      backgroundColor: '#e6fefc',
      borderColor: '#30b89b',
      fontSize: 960 * 0.125,
      imageSource: 'pic10', // Level 2, Lerneinheit 2
      statusIcons: [
        {
          type: 'doneIcon',
          x: 0.083,
          y: 0.05,
        },
        {
          type: 'favoritIcon',
          x: 0.583,
          y: 0.05,
        }
      ],
    },
  },
  {
    id: 'nine-grid-level2-lerneinheit-3',
    type: 'lerneinheit',
    // Position relativ zu Zelle 3: 5% X, 10% Y der Zelle
    position: (() => {
      const containerId = '9erContainer-level-2';
      const { width, height } = getContainerDimensions(containerId);
      const lerneinheitWidth = TILE.width * 0.125; // Level 2 Größe
      const lerneinheitHeight = TILE.height * 0.125; // Level 2 Größe
      return calculateLerneinheitPositionInCell(3, width, height, null, lerneinheitWidth, lerneinheitHeight);
    })(),
    parentId: '9erContainer-level-2',
    data: {
      title: 'Phasen eines Veränderungsprozesses erkennen',
      width: TILE.width * 0.125,
      height: TILE.height * 0.125,
      backgroundColor: '#e6fefc',
      borderColor: '#30b89b',
      fontSize: 960 * 0.125,
      imageSource: 'pic3',
      statusIcons: [
        {
          type: 'doneIcon',
          ...(() => {
            const lerneinheitWidth = TILE.width * 0.125;
            const lerneinheitHeight = TILE.height * 0.125;
            const scaleRatio = Math.min(lerneinheitWidth / TILE.width, lerneinheitHeight / TILE.height);
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
  {
    id: 'nine-grid-level2-lerneinheit-4',
    type: 'lerneinheit',
    // Position relativ zu Zelle 4: 5% X, 10% Y der Zelle
    position: (() => {
      const containerId = '9erContainer-level-2';
      const { width, height } = getContainerDimensions(containerId);
      const lerneinheitWidth = TILE.width * 0.125; // Level 2 Größe
      const lerneinheitHeight = TILE.height * 0.125; // Level 2 Größe
      return calculateLerneinheitPositionInCell(4, width, height, null, lerneinheitWidth, lerneinheitHeight);
    })(),
    parentId: '9erContainer-level-2',
    data: {
      title: 'Stakeholder analysieren und einbinden',
      width: TILE.width * 0.125,
      height: TILE.height * 0.125,
      backgroundColor: '#e6fefc',
      borderColor: '#30b89b',
      fontSize: 960 * 0.125,
      imageSource: 'pic1',
      statusIcons: [],
    },
  },
  {
    id: 'nine-grid-level2-lerneinheit-5',
    type: 'lerneinheit',
    // Position relativ zu Zelle 5: 5% X, 10% Y der Zelle
    position: (() => {
      const containerId = '9erContainer-level-2';
      const { width, height } = getContainerDimensions(containerId);
      const lerneinheitWidth = TILE.width * 0.125; // Level 2 Größe
      const lerneinheitHeight = TILE.height * 0.125; // Level 2 Größe
      return calculateLerneinheitPositionInCell(5, width, height, null, lerneinheitWidth, lerneinheitHeight);
    })(),
    parentId: '9erContainer-level-2',
    data: {
      title: 'Rollen im Change-Prozess definieren',
      width: TILE.width * 0.125,
      height: TILE.height * 0.125,
      backgroundColor: '#e6fefc',
      borderColor: '#30b89b',
      fontSize: 960 * 0.125,
      imageSource: 'pic13', // Level 2, Lerneinheit 5
      statusIcons: [],
    },
  },
  {
    id: 'nine-grid-level2-lerneinheit-6',
    type: 'lerneinheit',
    // Position relativ zu Zelle 6: 5% X, 10% Y der Zelle
    position: (() => {
      const containerId = '9erContainer-level-2';
      const { width, height } = getContainerDimensions(containerId);
      const lerneinheitWidth = TILE.width * 0.125; // Level 2 Größe
      const lerneinheitHeight = TILE.height * 0.125; // Level 2 Größe
      return calculateLerneinheitPositionInCell(6, width, height, null, lerneinheitWidth, lerneinheitHeight);
    })(),
    parentId: '9erContainer-level-2',
    data: {
      title: 'Maßnahmen im Change Management planen',
      width: TILE.width * 0.125,
      height: TILE.height * 0.125,
      backgroundColor: '#e6fefc',
      borderColor: '#30b89b',
      fontSize: 960 * 0.125,
      imageSource: 'pic1', // Level 2, Lerneinheit 6 (Wiederholung)
      statusIcons: [],
    },
  },
  {
    id: 'nine-grid-level2-lerneinheit-7',
    type: 'lerneinheit',
    // Position relativ zu Zelle 7: 5% X, 10% Y der Zelle
    position: (() => {
      const containerId = '9erContainer-level-2';
      const { width, height } = getContainerDimensions(containerId);
      const lerneinheitWidth = TILE.width * 0.125; // Level 2 Größe
      const lerneinheitHeight = TILE.height * 0.125; // Level 2 Größe
      return calculateLerneinheitPositionInCell(7, width, height, null, lerneinheitWidth, lerneinheitHeight);
    })(),
    parentId: '9erContainer-level-2',
    data: {
      title: 'Veränderungen nachhaltig verankern',
      width: TILE.width * 0.125,
      height: TILE.height * 0.125,
      backgroundColor: '#e6fefc',
      borderColor: '#30b89b',
      fontSize: 960 * 0.125,
      imageSource: 'pic2', // Level 2, Lerneinheit 7 (Wiederholung)
      statusIcons: [],
    },
  },
];
