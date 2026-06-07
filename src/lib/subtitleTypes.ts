import { SubRow, StyleSettings } from '../utils/subtitleCore';

export type BackdropSlot =
  | { type: 'solid'; color: string }
  | { type: 'preset'; name: string }
  | { type: 'image'; url: string }
  | { type: 'tmdb'; backdropUrl: string };

export type SubtitleDataSlot =
  | { status: 'idle' }
  | { status: 'loading'; progress?: number }
  | { status: 'error'; message: string }
  | { status: 'ready'; data: SubRow[] };

export type { SubRow, StyleSettings };
