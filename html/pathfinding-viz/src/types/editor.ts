export type EditorTool =
  | 'solid_wall'
  | 'prob_wall'
  | 'teleport_wall'
  | 'eraser'
  | 'start_point'
  | 'end_point';

export interface EditorState {
  tool: EditorTool;
  brushSize: number;
  teleportDir: 'one_way' | 'two_way';
  pendingTeleportIn: { x: number; y: number } | null;
}
