import React from 'react';
import { Handle, Position } from '@xyflow/react';
import {
  LEVEL1_ANNEX_WIDTH, LEVEL1_ANNEX_HEIGHT,
  LEVEL2_ANNEX_WIDTH, LEVEL2_ANNEX_HEIGHT,
  nodeShadow,
} from '../levelLayout';

// Drill-Down-Annex: sitzt im Card-Slot derselben Theme-Seite (siehe
// computeLevelPositions in levelLayout.js → annexes) und beherbergt die
// Sub-Hierarchie eines Drill-Down-Themes (z. B. die L2-Graph-Children unter
// „4. Change Management"). Reiner Subflow-Container.
//
// Edge-Anschluss zum zugehörigen Theme: links/rechts mittig je ein transparentes
// target-Handle (analog CircularNode). Welches verwendet wird, entscheidet die
// Edge-Definition über side-aware targetHandle (rechtsseitiger Annex → 'left-
// target'; linksseitiger Annex → 'right-target'). Hub-Edges hat der Annex
// bewusst KEINE — der zugehörige Theme-Circle in der Theme-Spalte übernimmt
// sämtliche Hub-Anschlüsse.
//
// Dimensionen kommen aus levelLayout (single source of truth) — damit Annex-
// Visual, parented Children und Layout-Slot-Berechnung synchron bleiben.

// Handle-Größe wird BEWUSST nicht skaliert (gleiche Begründung wie bei
// CircularNode): Klick-Trefferfläche soll auf kleineren Levels großzügig
// bleiben. Da der Annex selbst nicht angeklickt werden soll, ist sie hier
// nur Edge-Anker — eine kleine Größe reicht.
const HANDLE_SIZE = 12;

const handleStyleBase = {
  background: 'transparent',
  width: HANDLE_SIZE,
  height: HANDLE_SIZE,
  border: 'none',
  opacity: 0.3,
};

function AnnexHandles() {
  return (
    <>
      <Handle
        type="target"
        position={Position.Left}
        id="left-target"
        style={{ ...handleStyleBase, left: -(HANDLE_SIZE / 2) }}
      />
      <Handle
        type="target"
        position={Position.Right}
        id="right-target"
        style={{ ...handleStyleBase, right: -(HANDLE_SIZE / 2) }}
      />
    </>
  );
}

export function FirstAnnexNode() {
  return (
    <div
      style={{
        boxSizing: 'border-box',
        width: LEVEL1_ANNEX_WIDTH,
        height: LEVEL1_ANNEX_HEIGHT,
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '1200px',
        border: '80px solid #01D2BC',
        boxShadow: nodeShadow(1),
        position: 'relative',
      }}
    >
      <AnnexHandles />
    </div>
  );
}

export function SecondAnnexNode() {
  return (
    <div
      style={{
        boxSizing: 'border-box',
        width: LEVEL2_ANNEX_WIDTH,
        height: LEVEL2_ANNEX_HEIGHT,
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '150px',
        border: '10px solid #01D2BC',
        boxShadow: nodeShadow(2),
        zIndex: 1, // Niedriger als Edges, höher als Background.
        position: 'relative',
      }}
    >
      <AnnexHandles />
    </div>
  );
}
