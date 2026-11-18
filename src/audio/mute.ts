import { storage } from '../platform/storage';
import { audio } from './index';

/** Flips sound on/off, applies it now and remembers it in the save. */
export function toggleMute(): boolean {
  const s = storage.load();
  const muted = !s.muted;
  storage.save({ ...s, muted });
  audio.setMuted(muted);
  return muted;
}
