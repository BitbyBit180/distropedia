import { useEffect, useRef, useState, useCallback } from 'react';
import { GUEST_PACKAGES } from './guestPackages.js';
import {
  saveSessionToDB,
  getSavedSessionFromDB,
  clearSavedSessionFromDB,
  exportSessionToFile,
  importSessionFromFile,
} from './sessionStorage.js';

/**
 * Custom hook to manage the v86 Linux emulator lifecycle.
 * Supports:
 * - Booting fresh Buildroot Linux guest with pre-installed utilities (neofetch, tree, calc, curl, pkg, cowsay, nano)
 * - Saving active session snapshots (RAM + CPU state) to IndexedDB
 * - Resuming saved sessions instantly
 * - Exporting and importing .v86state files
 */
export function useV86({ onOutput, onReady, onError } = {}) {
  const emulatorRef = useRef(null);
  const [status, setStatus] = useState('idle'); // idle | loading | booting | ready | error
  const [errorMessage, setErrorMessage] = useState(null);
  const [savedSession, setSavedSession] = useState(null); // { savedAt, size }
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isResumed, setIsResumed] = useState(false);
  const isMountedRef = useRef(true);
  const packagesInjectedRef = useRef(false);

  // Keep latest callbacks in refs so event listeners never have stale closures
  const onOutputRef = useRef(onOutput);
  onOutputRef.current = onOutput;
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  // Check IndexedDB for existing saved session on mount
  useEffect(() => {
    isMountedRef.current = true;
    getSavedSessionFromDB()
      .then((data) => {
        if (data && isMountedRef.current) {
          setSavedSession({
            savedAt: data.savedAt,
            size: data.size,
          });
        }
      })
      .catch(() => {});

    return () => {
      isMountedRef.current = false;
      destroyEmulator();
    };
  }, []);

  // Clean up emulator instance
  const destroyEmulator = useCallback(() => {
    if (emulatorRef.current) {
      try {
        if (typeof emulatorRef.current.stop === 'function') {
          emulatorRef.current.stop();
        }
        if (typeof emulatorRef.current.destroy === 'function') {
          emulatorRef.current.destroy();
        }
      } catch (err) {
        console.warn('Error while destroying v86 instance:', err);
      }
      emulatorRef.current = null;
    }
    packagesInjectedRef.current = false;
  }, []);

  const stop = useCallback(() => {
    destroyEmulator();
    if (isMountedRef.current) {
      setStatus('idle');
      setErrorMessage(null);
    }
  }, [destroyEmulator]);

  // Start emulator (either fresh boot or resuming saved state)
  const start = useCallback(
    async ({ resume = false, customBuffer = null } = {}) => {
      destroyEmulator();
      if (!isMountedRef.current) return;

      setStatus('loading');
      setErrorMessage(null);

      try {
        const v86Module = await import('v86');
        const V86Constructor = v86Module.V86 || v86Module.default;

        if (!V86Constructor) {
          throw new Error('V86 emulator engine failed to load');
        }

        if (!isMountedRef.current) return;
        setStatus('booting');

        // Check if restoring a saved session
        let stateBufferToLoad = customBuffer;
        if (resume && !stateBufferToLoad) {
          const stored = await getSavedSessionFromDB();
          if (stored?.buffer) {
            stateBufferToLoad = stored.buffer;
          }
        }

        const isRestoring = !!stateBufferToLoad;
        setIsResumed(isRestoring);

        const config = {
          wasm_path: '/v86/v86.wasm',
          bios: {
            url: '/v86/seabios.bin',
          },
          vga_bios: {
            url: '/v86/vgabios.bin',
          },
          autostart: true,
          disable_keyboard: true,
          disable_speaker: true,
          disable_mouse: true,
        };

        if (isRestoring) {
          // Restore exact VM RAM & CPU state from saved buffer
          config.initial_state = { buffer: stateBufferToLoad };
          packagesInjectedRef.current = true; // Already installed in saved state
        } else {
          // Fresh Linux boot using Buildroot kernel
          config.bzimage = {
            url: '/v86/buildroot-bzimage.bin',
            async: false,
          };
          config.cmdline = 'tsc=reliable mitigations=off random.trust_cpu=on console=ttyS0 quiet';
        }

        const emulator = new V86Constructor(config);

        if (!isMountedRef.current) {
          try {
            if (typeof emulator.stop === 'function') emulator.stop();
            if (typeof emulator.destroy === 'function') emulator.destroy();
          } catch {}
          return;
        }

        let detectedShell = false;
        let tailBuffer = '';
        let byteBuffer = [];
        let flushScheduled = false;

        // Pipe guest serial output to xterm in batched animation frames
        emulator.add_listener('serial0-output-byte', (byte) => {
          byteBuffer.push(byte);
          const char = String.fromCharCode(byte);
          tailBuffer = (tailBuffer + char).slice(-120);

          if (!flushScheduled) {
            flushScheduled = true;
            requestAnimationFrame(() => {
              flushScheduled = false;
              if (byteBuffer.length > 0) {
                const bytes = new Uint8Array(byteBuffer);
                byteBuffer = [];
                if (onOutputRef.current) {
                  onOutputRef.current(bytes);
                }
              }
            });
          }

          // Detect real interactive shell prompt
          if (
            !detectedShell &&
            (tailBuffer.includes('~% ') ||
              tailBuffer.includes('/ # ') ||
              tailBuffer.includes('~ # ') ||
              tailBuffer.includes('login:'))
          ) {
            detectedShell = true;
            if (isMountedRef.current) {
              setStatus('ready');
              if (onReadyRef.current) onReadyRef.current();

              // Clear screen cleanly after boot
              if (!isRestoring) {
                setTimeout(() => {
                  if (emulatorRef.current) {
                    emulatorRef.current.serial0_send('clear\n');
                  }
                }, 150);
              }
            }
          }
        });

        emulator.add_listener('emulator-ready', () => {
          if (isMountedRef.current) {
            setStatus((prev) => (prev === 'ready' ? 'ready' : 'booting'));
            // Safety timeout
            setTimeout(() => {
              if (isMountedRef.current && !detectedShell) {
                detectedShell = true;
                setStatus('ready');
                if (onReadyRef.current) onReadyRef.current();
              }
            }, isRestoring ? 1500 : 4500);
          }
        });

        emulatorRef.current = emulator;
      } catch (err) {
        console.error('Failed to initialize Linux v86 emulator:', err);
        if (isMountedRef.current) {
          setStatus('error');
          const msg = err.message || 'Failed to start browser Linux environment';
          setErrorMessage(msg);
          if (onErrorRef.current) onErrorRef.current(msg);
        }
      }
    },
    [destroyEmulator]
  );

  // Send input string into Linux guest serial port
  const sendInput = useCallback((data) => {
    if (emulatorRef.current && typeof emulatorRef.current.serial0_send === 'function') {
      emulatorRef.current.serial0_send(data);
    }
  }, []);

  // Save running session state to IndexedDB
  const saveSession = useCallback(async () => {
    if (!emulatorRef.current || status !== 'ready') {
      throw new Error('Terminal must be running and ready to save session');
    }

    setIsSaving(true);
    try {
      const stateBuffer = await emulatorRef.current.save_state();
      const saved = await saveSessionToDB(stateBuffer);
      if (isMountedRef.current) {
        setSavedSession({
          savedAt: saved.savedAt,
          size: saved.size,
        });
        setSaveSuccess(true);
        setTimeout(() => {
          if (isMountedRef.current) setSaveSuccess(false);
        }, 3000);
      }
      return saved;
    } catch (err) {
      console.error('Failed to save terminal session:', err);
      throw err;
    } finally {
      if (isMountedRef.current) {
        setIsSaving(false);
      }
    }
  }, [status]);

  // Clear saved session from IndexedDB
  const clearSession = useCallback(async () => {
    await clearSavedSessionFromDB();
    if (isMountedRef.current) {
      setSavedSession(null);
    }
  }, []);

  // Export current or saved session to file
  const exportSession = useCallback(async () => {
    if (emulatorRef.current && status === 'ready') {
      const stateBuffer = await emulatorRef.current.save_state();
      exportSessionToFile(stateBuffer);
      return;
    }
    const stored = await getSavedSessionFromDB();
    if (stored?.buffer) {
      exportSessionToFile(stored.buffer);
    }
  }, [status]);

  // Import session from user file
  const importSession = useCallback(
    async (file) => {
      const buffer = await importSessionFromFile(file);
      await saveSessionToDB(buffer);
      if (isMountedRef.current) {
        setSavedSession({
          savedAt: new Date().toISOString(),
          size: buffer.byteLength,
        });
      }
      await start({ customBuffer: buffer });
    },
    [start]
  );

  // Restart emulator
  const restart = useCallback(() => {
    if (emulatorRef.current && typeof emulatorRef.current.restart === 'function') {
      try {
        emulatorRef.current.restart();
        setStatus('booting');
      } catch {
        start({ resume: isResumed });
      }
    } else {
      start({ resume: isResumed });
    }
  }, [start, isResumed]);

  // Reset emulator (fresh state)
  const reset = useCallback(() => {
    start({ resume: false });
  }, [start]);

  return {
    status,
    errorMessage,
    savedSession,
    isSaving,
    saveSuccess,
    isResumed,
    start,
    stop,
    sendInput,
    restart,
    reset,
    saveSession,
    clearSession,
    exportSession,
    importSession,
    emulator: emulatorRef.current,
  };
}
