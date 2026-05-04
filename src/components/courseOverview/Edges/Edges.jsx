// Edge-strokeWidth pro Level via Helper aus levelLayout — pro Edge-Typ eine
// L1-Konstante × scaleFactor. Damit ist die Liniendicke bei Zoom-Äquivalenz
// über alle Levels visuell identisch (NICHT mehr hartkodiert).
import { edgeStrokeHubTheme, edgeStrokeThemeCard } from '../levelLayout';

export const initialEdges = [
  {
    id: 'edge-1',
    source: 'three-level-central-node',
    sourceHandle: 'left-source',
    target: 'three-level-category-top-left',
    targetHandle: 'right-target',
    type: 'step',
    style: { stroke: '#C4C4C4', strokeWidth: edgeStrokeHubTheme(3) },
  },
  {
    id: 'edge-2',
    source: 'three-level-central-node',
    sourceHandle: 'left-source',
    target: 'three-level-category-middle-left',
    targetHandle: 'right-target',
    type: 'step',
    style: { stroke: '#C4C4C4', strokeWidth: edgeStrokeHubTheme(3) },
  },
  {
    id: 'edge-3',
    source: 'three-level-central-node',
    sourceHandle: 'left-source',
    target: 'three-level-category-bottom-left',
    targetHandle: 'right-target',
    type: 'step',
    style: { stroke: '#C4C4C4', strokeWidth: edgeStrokeHubTheme(3) },
  },
  {
    id: 'edge-4',
    source: 'three-level-central-node',
    sourceHandle: 'right-source',
    target: 'three-level-category-top-right',
    targetHandle: 'left-target',
    type: 'step',
    style: { stroke: '#C4C4C4', strokeWidth: edgeStrokeHubTheme(3) },
  },
  {
    id: 'edge-5',
    source: 'three-level-central-node',
    sourceHandle: 'right-source',
    target: 'three-level-category-middle-right',
    targetHandle: 'left-target',
    type: 'step',
    style: { stroke: '#C4C4C4', strokeWidth: edgeStrokeHubTheme(3) },
  },
  {
    id: 'edge-6',
    source: 'three-level-central-node',
    sourceHandle: 'right-source',
    target: 'three-level-category-bottom-right',
    targetHandle: 'left-target',
    type: 'step',
    style: { stroke: '#C4C4C4', strokeWidth: edgeStrokeHubTheme(3) },
  },
  // Edge zwischen 1LevelHierarchyStructureNodeCentral und 2LevelHierarchyStructureNodebottomright
  {
    id: 'edge-hierarchy-connection',
    source: 'one-level-central-node',
    sourceHandle: 'right-source',
    target: 'one-level-category-node-bottom-right',
    targetHandle: 'left-target',
    type: 'step',
    style: { stroke: '#C4C4C4', strokeWidth: edgeStrokeHubTheme(1) },
  },
  // Edge zwischen 1LevelHierarchyStructureNodeCentral und 2LevelHierarchyStructureNodemiddleright
  {
    id: 'edge-hierarchy-connection-middleright',
    source: 'one-level-central-node',
    sourceHandle: 'right-source',
    target: 'one-level-category-node-middle-right',
    targetHandle: 'left-target',
    type: 'step',
    style: { stroke: '#C4C4C4', strokeWidth: edgeStrokeHubTheme(1) },
  },
  // Edge zwischen 1LevelHierarchyStructureNodeCentral und Theme „4. Change
  // Management" — strukturell identisch zu allen anderen Hub↔Theme-Edges.
  // Der zugehörige Drill-Down-Annex ist ein eigenständiger Subflow-Container
  // im Card-Slot des Themes und hat KEINE eigene Hub-Edge.
  {
    id: 'edge-hierarchy-connection-top-right',
    source: 'one-level-central-node',
    sourceHandle: 'right-source',
    target: 'one-level-category-node-top-right',
    targetHandle: 'left-target',
    type: 'step',
    style: { stroke: '#C4C4C4', strokeWidth: edgeStrokeHubTheme(1) },
  },
  // Edge zwischen 1LevelHierarchyStructureNodeCentral und Top Left
  {
    id: 'edge-hierarchy-connection-top-left',
    source: 'one-level-central-node',
    sourceHandle: 'left-source',
    target: 'one-level-category-node-top-left',
    targetHandle: 'right-target',
    type: 'step',
    style: { stroke: '#C4C4C4', strokeWidth: edgeStrokeHubTheme(1) },
  },
  // Edge zwischen 1LevelHierarchyStructureNodeCentral und Middle Left
  {
    id: 'edge-hierarchy-connection-middle-left',
    source: 'one-level-central-node',
    sourceHandle: 'left-source',
    target: 'one-level-category-node-middle-left-l1',
    targetHandle: 'right-target',
    type: 'step',
    style: { stroke: '#C4C4C4', strokeWidth: edgeStrokeHubTheme(1) },
  },
  // Edge zwischen 1LevelHierarchyStructureNodeCentral und Bottom Left
  {
    id: 'edge-hierarchy-connection-bottom-left',
    source: 'one-level-central-node',
    sourceHandle: 'left-source',
    target: 'one-level-category-node-bottom-left',
    targetHandle: 'right-target',
    type: 'step',
    style: { stroke: '#C4C4C4', strokeWidth: edgeStrokeHubTheme(1) },
  },
  // Edge zwischen 2LLARGE und 2LRIGHTBOTTOM
  {
    id: 'edge-2l-large-to-2l-right-bottom',
    source: 'two-level-central-node',
    sourceHandle: 'right-source',
    target: 'two-level-category-node-bottom-right',
    targetHandle: 'left-target',
    type: 'step',
    style: { stroke: '#C1C1C1', strokeWidth: edgeStrokeHubTheme(2) },
  },
  // Edge zwischen 2LLARGE und Theme „3. Change Leadership Rollen"
  // (analog zur L1-Hub→Theme-4-Edge: normaler Hub↔Theme-Anschluss; der L2-
  // Annex hängt im Card-Slot und hat keine eigene Hub-Edge).
  {
    id: 'edge-2l-large-to-2l-top-right',
    source: 'two-level-central-node',
    sourceHandle: 'right-source',
    target: 'two-level-category-node-top-right',
    targetHandle: 'left-target',
    type: 'step',
    style: { stroke: '#C1C1C1', strokeWidth: edgeStrokeHubTheme(2) },
  },
  // Edge zwischen 2LLARGE und 2LLEFTTOP
  {
    id: 'edge-2l-large-to-2l-left-top',
    source: 'two-level-central-node',
    sourceHandle: 'left-source',
    target: 'two-level-category-node-left-top',
    targetHandle: 'right-target',
    type: 'step',
    style: { stroke: '#C1C1C1', strokeWidth: edgeStrokeHubTheme(2) },
  },
  // Edge zwischen 2LLARGE und 2LLEFTBOTTOM
  {
    id: 'edge-2l-large-to-2l-left-bottom',
    source: 'two-level-central-node',
    sourceHandle: 'left-source',
    target: 'two-level-category-node-bottom-left',
    targetHandle: 'right-target',
    type: 'step',
    style: { stroke: '#C1C1C1', strokeWidth: edgeStrokeHubTheme(2) },
  },
  // Edge zwischen 4. TOOLS & TECH und modernem Grid-Container
  {
    id: 'edge-tools-tech-to-modern-grid',
    source: 'three-level-category-top-right',
    sourceHandle: 'right-source',
    target: 'third-level-threer-gridbox1-container',
    targetHandle: 'left-target',
    type: 'step',
    style: { stroke: '#D1D1D1', strokeWidth: edgeStrokeThemeCard(3) },
  },
  // Edge zwischen BOTTOM LEFT L1 und 6er-Container
  {
    id: 'edge-bottom-left-l1-to-6er-container',
    source: 'one-level-category-node-bottom-left',
    sourceHandle: 'left-source',
    target: '6erContainer-level-1',
    targetHandle: 'right-target',
    type: 'straight',
    style: { stroke: '#C4C4C4', strokeWidth: edgeStrokeThemeCard(1) },
  },
  // Theme ↔ Card Edges (Level 3) — straight, weil Source-Y und Target-Y
  // durch LEVEL_3_POSITIONS exakt aligned sind (Card-Mitte == Theme-Mitte).
  {
    id: 'edge-methode-frameworks-to-9er-level3',
    source: 'three-level-category-middle-left',
    sourceHandle: 'left-source',
    target: '9erContainer-level-3',
    targetHandle: 'right-target',
    type: 'straight',
    style: { stroke: '#C4C4C4', strokeWidth: edgeStrokeThemeCard(3) },
  },
  {
    id: 'edge-einfuehrung-to-3er-level3-second',
    source: 'three-level-category-top-left',
    sourceHandle: 'left-source',
    target: '3erContainer-level-3-second',
    targetHandle: 'right-target',
    type: 'straight',
    style: { stroke: '#C4C4C4', strokeWidth: edgeStrokeThemeCard(3) },
  },
  {
    id: 'edge-prozess-to-3er-level3-third',
    source: 'three-level-category-bottom-left',
    sourceHandle: 'left-source',
    target: '3erContainer-level-3-third',
    targetHandle: 'right-target',
    type: 'straight',
    style: { stroke: '#C4C4C4', strokeWidth: edgeStrokeThemeCard(3) },
  },
  {
    id: 'edge-tools-tech-to-3er-level3-first',
    source: 'three-level-category-top-right',
    sourceHandle: 'right-source',
    target: '3erContainer-level-3',
    targetHandle: 'left-target',
    type: 'straight',
    style: { stroke: '#C4C4C4', strokeWidth: edgeStrokeThemeCard(3) },
  },
  // Theme ↔ Card Edges (Level 2) — straight, weil Source-Y und Target-Y
  // durch LEVEL_2_POSITIONS exakt aligned sind (Card-Mitte == Theme-Mitte).
  {
    id: 'edge-2llefttop-to-9er-level2',
    source: 'two-level-category-node-left-top',
    sourceHandle: 'left-source',
    target: '9erContainer-level-2',
    targetHandle: 'right-target',
    type: 'straight',
    style: { stroke: '#C4C4C4', strokeWidth: edgeStrokeThemeCard(2) },
  },
  {
    id: 'edge-2lleftbottom-to-6er-level2',
    source: 'two-level-category-node-bottom-left',
    sourceHandle: 'left-source',
    target: '6erContainer-level-2',
    targetHandle: 'right-target',
    type: 'straight',
    style: { stroke: '#C4C4C4', strokeWidth: edgeStrokeThemeCard(2) },
  },
  {
    id: 'edge-2lrightbottom-to-3er-level2',
    source: 'two-level-category-node-bottom-right',
    sourceHandle: 'right-source',
    target: '3erContainer-level-2',
    targetHandle: 'left-target',
    type: 'straight',
    style: { stroke: '#C4C4C4', strokeWidth: edgeStrokeThemeCard(2) },
  },
  // Theme ↔ Card Edges (Level 1) — straight, weil Source-Y und Target-Y
  // durch levelLayout exakt aligned sind. Damit gerade horizontale Linien.
  {
    id: 'edge-topleft-l1-circular-to-9er-level1',
    source: 'one-level-category-node-top-left',
    sourceHandle: 'left-source',
    target: '9erContainer-level-1',
    targetHandle: 'right-target',
    type: 'straight',
    style: { stroke: '#C4C4C4', strokeWidth: edgeStrokeThemeCard(1) },
  },
  {
    id: 'edge-middleright-l1-circular-to-6er-level1-main',
    source: 'one-level-category-node-middle-right',
    sourceHandle: 'right-source',
    target: '6erContainer-level-1-main',
    targetHandle: 'left-target',
    type: 'straight',
    style: { stroke: '#C4C4C4', strokeWidth: edgeStrokeThemeCard(1) },
  },
  {
    id: 'edge-bottomright-l1-circular-to-3er-level1-main',
    source: 'one-level-category-node-bottom-right',
    sourceHandle: 'right-source',
    target: '3erContainer-level-1-main',
    targetHandle: 'left-target',
    type: 'straight',
    style: { stroke: '#C4C4C4', strokeWidth: edgeStrokeThemeCard(1) },
  },
  {
    id: 'edge-middleleft-l1-circular-to-3er-level1',
    source: 'one-level-category-node-middle-left-l1',
    sourceHandle: 'left-source',
    target: '3erContainer-level-1',
    targetHandle: 'right-target',
    type: 'straight',
    style: { stroke: '#C4C4C4', strokeWidth: edgeStrokeThemeCard(1) },
  },
  {
    id: 'edge-rollen-to-6er-level3',
    source: 'three-level-category-middle-right',
    sourceHandle: 'right-source',
    target: '6erContainer-level-3',
    targetHandle: 'left-target',
    type: 'straight',
    style: { stroke: '#C4C4C4', strokeWidth: edgeStrokeThemeCard(3) },
  },
  // Drill-Down-Theme ↔ Annex Edges. Annex sitzt im Card-Slot des Themes, Y-Mitte
  // == Theme-Y-Mitte (computeLevelPositions garantiert) → straight. Stroke-Width
  // via edgeStrokeThemeCard(level), weil der Annex strukturell die Card-Position
  // einnimmt; visuell konsistent zu allen Theme↔Card-Edges. Source-/Target-
  // Handle side-aware: rechtsseitiger Annex → right-source/left-target.
  {
    id: 'edge-l1-theme-to-annex',
    source: 'one-level-category-node-top-right',
    sourceHandle: 'right-source',
    target: 'one-level-annex',
    targetHandle: 'left-target',
    type: 'straight',
    style: { stroke: '#C4C4C4', strokeWidth: edgeStrokeThemeCard(1) },
  },
  {
    id: 'edge-l2-theme-to-annex',
    source: 'two-level-category-node-top-right',
    sourceHandle: 'right-source',
    target: 'two-level-annex',
    targetHandle: 'left-target',
    type: 'straight',
    style: { stroke: '#C4C4C4', strokeWidth: edgeStrokeThemeCard(2) },
  },
];
