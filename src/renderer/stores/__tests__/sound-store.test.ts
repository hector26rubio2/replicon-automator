import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useSoundStore } from '../sound-store';

// Mock Audio API
global.Audio = vi.fn().mockImplementation(() => ({
  play: vi.fn().mockResolvedValue(undefined),
  volume: 0,
}));

describe('Sound Store', () => {
  beforeEach(() => {
    useSoundStore.setState({ enabled: true, volume: 0.5 });
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize enabled', () => {
      const { enabled } = useSoundStore.getState();
      expect(typeof enabled).toBe('boolean');
    });

    it('should have volume between 0 and 1', () => {
      const { volume } = useSoundStore.getState();
      expect(volume).toBeGreaterThanOrEqual(0);
      expect(volume).toBeLessThanOrEqual(1);
    });
  });

  describe('setEnabled', () => {
    it('should enable sounds', () => {
      const { setEnabled } = useSoundStore.getState();
      
      setEnabled(true);
      
      expect(useSoundStore.getState().enabled).toBe(true);
    });

    it('should disable sounds', () => {
      const { setEnabled } = useSoundStore.getState();
      
      setEnabled(false);
      
      expect(useSoundStore.getState().enabled).toBe(false);
    });
  });

  describe('toggleEnabled', () => {
    it('should toggle from true to false', () => {
      const { setEnabled, toggleEnabled } = useSoundStore.getState();
      
      setEnabled(true);
      toggleEnabled();
      
      expect(useSoundStore.getState().enabled).toBe(false);
    });

    it('should toggle from false to true', () => {
      const { setEnabled, toggleEnabled } = useSoundStore.getState();
      
      setEnabled(false);
      toggleEnabled();
      
      expect(useSoundStore.getState().enabled).toBe(true);
    });
  });

  describe('setVolume', () => {
    it('should set volume to valid value', () => {
      const { setVolume } = useSoundStore.getState();
      
      setVolume(0.7);
      
      expect(useSoundStore.getState().volume).toBe(0.7);
    });

    it('should clamp volume to max 1', () => {
      const { setVolume } = useSoundStore.getState();
      
      setVolume(1.5);
      
      expect(useSoundStore.getState().volume).toBe(1);
    });

    it('should clamp volume to min 0', () => {
      const { setVolume } = useSoundStore.getState();
      
      setVolume(-0.5);
      
      expect(useSoundStore.getState().volume).toBe(0);
    });
  });

  describe('play', () => {
    it('should play sound when enabled', async () => {
      const { setEnabled, play } = useSoundStore.getState();
      
      setEnabled(true);
      await play('success');
      
      expect(global.Audio).toHaveBeenCalled();
    });

    it('should not play sound when disabled', async () => {
      const { setEnabled, play } = useSoundStore.getState();
      
      setEnabled(false);
      await play('success');
      
      expect(global.Audio).not.toHaveBeenCalled();
    });

    it('should set audio volume', async () => {
      const mockAudio = { play: vi.fn().mockResolvedValue(undefined), volume: 0 };
      global.Audio = vi.fn(() => mockAudio) as any;
      
      const { setVolume, play } = useSoundStore.getState();
      setVolume(0.8);
      
      await play('success');
      
      expect(mockAudio.volume).toBe(0.8);
    });
  });

  describe('convenience methods', () => {
    it('should play success sound', async () => {
      const { playSuccess } = useSoundStore.getState();
      
      await playSuccess();
      
      expect(global.Audio).toHaveBeenCalled();
    });

    it('should play error sound', async () => {
      const { playError } = useSoundStore.getState();
      
      await playError();
      
      expect(global.Audio).toHaveBeenCalled();
    });

    it('should play notification sound', async () => {
      const { playNotification } = useSoundStore.getState();
      
      await playNotification();
      
      expect(global.Audio).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle audio play failure gracefully', async () => {
      const mockAudio = {
        play: vi.fn().mockRejectedValue(new Error('Audio not supported')),
        volume: 0,
      };
      global.Audio = vi.fn(() => mockAudio) as any;
      
      const { play } = useSoundStore.getState();
      
      await expect(play('success')).resolves.not.toThrow();
    });
  });
});
