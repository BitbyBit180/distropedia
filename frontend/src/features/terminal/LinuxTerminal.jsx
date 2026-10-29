import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useImperativeHandle,
  forwardRef,
} from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { useV86 } from './useV86.js';
import {
  Play,
  Square,
  RotateCcw,
  RefreshCw,
  Trash2,
  Terminal as TerminalIcon,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Save,
  Download,
  Upload,
  Maximize2,
  Minimize2,
  Package,
  Check,
} from 'lucide-react';
import { THEME, MONO } from '../../theme/designTokens.js';

export const LinuxTerminal = forwardRef(function LinuxTerminal(
  { onTerminalReady, onFullscreenChange, className = '', height = '520px' },
  ref
) {
  const terminalWrapperRef = useRef(null);
  const terminalContainerRef = useRef(null);
  const termRef = useRef(null);
  const fitAddonRef = useRef(null);
  const fileInputRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Write output from emulator to xterm
  const handleEmulatorOutput = useCallback((chunk) => {
    if (termRef.current) {
      termRef.current.write(chunk);
    }
  }, []);

  const handleEmulatorReady = useCallback(() => {
    if (onTerminalReady) onTerminalReady();
    if (termRef.current) {
      try {
        termRef.current.focus();
      } catch {}
    }
  }, [onTerminalReady]);

  const {
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
  } = useV86({
    onOutput: handleEmulatorOutput,
    onReady: handleEmulatorReady,
  });

  // Initialize xterm.js
  useEffect(() => {
    if (!terminalContainerRef.current) return;

    const term = new Terminal({
      cursorBlink: true,
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
      fontSize: 13,
      lineHeight: 1.25,
      theme: {
        background: '#0D1117',
        foreground: '#C9D1D9',
        cursor: '#E05A38',
        cursorAccent: '#0D1117',
        selectionBackground: 'rgba(224, 90, 56, 0.35)',
        black: '#161B22',
        red: '#F85149',
        green: '#7EE787',
        yellow: '#D29922',
        blue: '#58A6FF',
        magenta: '#BC8CFF',
        cyan: '#39C5CF',
        white: '#E6EDF3',
        brightBlack: '#484F58',
        brightRed: '#FFA198',
        brightGreen: '#56D364',
        brightYellow: '#E3B341',
        brightBlue: '#79C0FF',
        brightMagenta: '#D2A8FF',
        brightCyan: '#56D4DD',
        brightWhite: '#FFFFFF',
      },
      convertEol: true,
      scrollback: 2000,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    term.open(terminalContainerRef.current);
    try {
      fitAddon.fit();
    } catch {}

    termRef.current = term;
    fitAddonRef.current = fitAddon;

    // Send user keystrokes into Linux guest
    const onDataDisposable = term.onData((data) => {
      sendInput(data);
    });

    // Handle container resize
    const resizeObserver = new ResizeObserver(() => {
      try {
        fitAddon.fit();
      } catch {}
    });
    resizeObserver.observe(terminalContainerRef.current);

    return () => {
      onDataDisposable.dispose();
      resizeObserver.disconnect();
      term.dispose();
      termRef.current = null;
    };
  }, [sendInput]);

  // Handle Fullscreen ESC listener and resize refit
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
        if (onFullscreenChange) onFullscreenChange(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // Refit after fullscreen transition
    const timeout = setTimeout(() => {
      try {
        fitAddonRef.current?.fit();
      } catch {}
    }, 150);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timeout);
    };
  }, [isFullscreen]);

  // Expose controls to parent components
  useImperativeHandle(ref, () => ({
    sendInput: (text) => sendInput(text),
    clear: () => {
      if (termRef.current) termRef.current.clear();
    },
    start,
    stop,
    restart,
    reset,
    saveSession,
    isReady: status === 'ready',
    status,
  }));

  const handleClear = () => {
    if (termRef.current) {
      termRef.current.clear();
    }
  };

  const handleStart = ({ resume = false } = {}) => {
    if (termRef.current) {
      termRef.current.clear();
    }
    start({ resume });
  };

  const handleSave = async () => {
    try {
      await saveSession();
    } catch (err) {
      alert('Failed to save session: ' + err.message);
    }
  };

  const handleImportFile = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      importSession(file);
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen((prev) => {
      const next = !prev;
      if (onFullscreenChange) onFullscreenChange(next);
      return next;
    });
  };

  return (
    <div
      ref={terminalWrapperRef}
      className={`flex flex-col bg-[#0D1117] transition-all duration-200 ${
        isFullscreen
          ? 'fixed inset-0 z-[1000] w-screen h-screen rounded-none border-none shadow-2xl'
          : `rounded-xl overflow-hidden border border-[#30363D] shadow-2xl ${className}`
      }`}
      style={{ fontFamily: MONO }}
    >
      {/* Hidden File Input for Session Import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".v86state,.bin"
        onChange={handleImportFile}
        className="hidden"
      />

      {/* Terminal Titlebar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#161B22] border-b border-[#30363D] select-none">
        {/* Left: traffic lights + label + status */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 mr-1">
            <span className="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E] opacity-80" />
            <span className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123] opacity-80" />
            <span className="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29] opacity-80" />
          </div>

          <div className="flex items-center gap-1.5">
            <TerminalIcon size={13} className="text-[#E05A38]" />
            <span className="text-xs font-semibold text-[#C9D1D9] tracking-wider">
              Linux Terminal
            </span>
          </div>

          {/* Status Badge */}
          <div
            className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border"
            style={{
              backgroundColor:
                status === 'ready'
                  ? 'rgba(46, 160, 67, 0.15)'
                  : status === 'booting' || status === 'loading'
                  ? 'rgba(210, 153, 34, 0.15)'
                  : status === 'error'
                  ? 'rgba(248, 81, 73, 0.15)'
                  : 'rgba(139, 148, 158, 0.15)',
              borderColor:
                status === 'ready'
                  ? 'rgba(46, 160, 67, 0.4)'
                  : status === 'booting' || status === 'loading'
                  ? 'rgba(210, 153, 34, 0.4)'
                  : status === 'error'
                  ? 'rgba(248, 81, 73, 0.4)'
                  : 'rgba(139, 148, 158, 0.3)',
              color:
                status === 'ready'
                  ? '#7EE787'
                  : status === 'booting' || status === 'loading'
                  ? '#F2CC60'
                  : status === 'error'
                  ? '#FFA198'
                  : '#8B949E',
            }}
          >
            {status === 'ready' && <span className="w-1.5 h-1.5 rounded-full bg-[#7EE787]" />}
            {(status === 'booting' || status === 'loading') && (
              <Loader2 size={11} className="animate-spin text-[#F2CC60]" />
            )}
            {status === 'error' && <AlertCircle size={11} className="text-[#FFA198]" />}
            {status === 'idle' && <span className="w-1.5 h-1.5 rounded-full bg-[#8B949E]" />}
            <span>
              {status === 'ready'
                ? isResumed
                  ? 'RESUMED'
                  : 'ONLINE'
                : status === 'booting'
                ? 'BOOTING...'
                : status === 'loading'
                ? 'LOADING...'
                : status === 'error'
                ? 'ERROR'
                : 'OFFLINE'}
            </span>
          </div>
        </div>

        {/* Right: Toolbar Controls */}
        <div className="flex items-center gap-1">
          {status === 'idle' ? (
            <div className="flex items-center gap-1.5">
              {savedSession && (
                <button
                  type="button"
                  onClick={() => handleStart({ resume: true })}
                  className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg bg-[#238636] hover:bg-[#2ea043] text-white transition-colors shadow-sm"
                >
                  <Play size={12} fill="currentColor" />
                  <span>Resume</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => handleStart({ resume: false })}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg ${
                  savedSession
                    ? 'bg-[#21262D] hover:bg-[#30363D] text-[#C9D1D9] border border-[#30363D]'
                    : 'bg-[#238636] hover:bg-[#2ea043] text-white shadow-sm'
                } transition-colors`}
              >
                <Play size={12} fill="currentColor" />
                <span>{savedSession ? 'Fresh Boot' : 'Start'}</span>
              </button>
            </div>
          ) : (
            <>
              {/* Save */}
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving || status !== 'ready'}
                title="Save session to browser storage"
                className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-all ${
                  saveSuccess
                    ? 'bg-[#238636]/30 text-[#7EE787] border border-[#238636]/60'
                    : 'text-[#8B949E] hover:text-[#7EE787] hover:bg-[#21262D]'
                }`}
              >
                {isSaving ? (
                  <Loader2 size={12} className="animate-spin text-[#7EE787]" />
                ) : saveSuccess ? (
                  <Check size={12} className="text-[#7EE787]" />
                ) : (
                  <Save size={12} />
                )}
                <span className="hidden sm:inline">{isSaving ? 'Saving…' : saveSuccess ? 'Saved!' : 'Save'}</span>
              </button>

              {/* Stop */}
              <button
                type="button"
                onClick={stop}
                title="Stop emulator"
                className="flex items-center gap-1 px-2 py-1 text-xs text-[#8B949E] hover:text-[#FFA198] hover:bg-[#21262D] rounded transition-colors"
              >
                <Square size={12} fill="currentColor" />
                <span className="hidden sm:inline">Stop</span>
              </button>

              {/* Clear */}
              <button
                type="button"
                onClick={handleClear}
                title="Clear terminal screen"
                className="flex items-center gap-1 px-2 py-1 text-xs text-[#8B949E] hover:text-[#F0F4F8] hover:bg-[#21262D] rounded transition-colors"
              >
                <Trash2 size={12} />
                <span className="hidden sm:inline">Clear</span>
              </button>

              {/* Restart */}
              <button
                type="button"
                onClick={restart}
                title="Restart Linux guest"
                className="flex items-center gap-1 px-2 py-1 text-xs text-[#8B949E] hover:text-[#F0F4F8] hover:bg-[#21262D] rounded transition-colors"
              >
                <RefreshCw size={12} />
                <span className="hidden lg:inline">Restart</span>
              </button>

              {/* Reset */}
              <button
                type="button"
                onClick={reset}
                title="Reset to fresh Linux instance"
                className="flex items-center gap-1 px-2 py-1 text-xs text-[#8B949E] hover:text-[#F0F4F8] hover:bg-[#21262D] rounded transition-colors"
              >
                <RotateCcw size={12} />
                <span className="hidden lg:inline">Reset</span>
              </button>
            </>
          )}

          {/* Fullscreen */}
          <button
            type="button"
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen (ESC)' : 'Fullscreen'}
            className="flex items-center gap-1 px-2 py-1 text-xs text-[#8B949E] hover:text-[#F0F4F8] hover:bg-[#21262D] rounded transition-colors ml-0.5"
          >
            {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>
        </div>
      </div>

      {/* Terminal Viewport */}
      <div
        className="relative flex-1 p-3 bg-[#0D1117] overflow-hidden"
        style={{ minHeight: isFullscreen ? 'calc(100vh - 75px)' : height }}
      >
        <div ref={terminalContainerRef} className="w-full h-full" />

        {/* 1. Offline / Idle State with Resume & Start Options */}
        {status === 'idle' && (
          <div className="absolute inset-0 bg-[#0D1117]/95 flex flex-col items-center justify-center p-6 text-center z-10 overflow-y-auto">
            <div className="max-w-md w-full flex flex-col items-center my-auto">
              <div className="w-16 h-16 rounded-2xl bg-[#161B22] border border-[#30363D] flex items-center justify-center mb-4 shadow-xl">
                <TerminalIcon size={32} className="text-[#E05A38]" />
              </div>

              <h3 className="text-base font-extrabold text-white mb-2">
                Linux Terminal is Stopped
              </h3>

              <p className="text-xs text-[#8B949E] leading-relaxed mb-5 max-w-sm">
                Authentic 32-bit Linux virtual machine (Buildroot 5.6 / BusyBox) running client-side
                via WebAssembly.
              </p>

              {/* Saved Session Available Banner */}
              {savedSession ? (
                <div className="w-full p-4 mb-4 rounded-xl bg-[#161B22] border border-[#238636]/40 text-left shadow-lg">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#7EE787]">
                      <Save size={13} />
                      <span>Saved Session Available</span>
                    </div>
                    <button
                      type="button"
                      onClick={clearSession}
                      title="Discard saved session"
                      className="text-[11px] text-[#8B949E] hover:text-[#FFA198] transition-colors flex items-center gap-1"
                    >
                      <Trash2 size={11} />
                      <span>Discard</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-[#8B949E] mb-3 leading-tight">
                    Saved: {new Date(savedSession.savedAt).toLocaleString()} •{' '}
                    {((savedSession.size || 0) / (1024 * 1024)).toFixed(1)} MB state
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleStart({ resume: true })}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold rounded-lg bg-gradient-to-r from-[#238636] to-[#2ea043] hover:from-[#2ea043] hover:to-[#3fb950] text-white shadow-md transition-all cursor-pointer"
                    >
                      <Play size={13} fill="currentColor" />
                      <span>Continue Saved Session</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStart({ resume: false })}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-[#21262D] hover:bg-[#30363D] text-[#C9D1D9] border border-[#30363D] transition-all cursor-pointer"
                      title="Boot clean state without saved session"
                    >
                      <RotateCcw size={12} />
                      <span>Fresh Boot</span>
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => handleStart({ resume: false })}
                  className="flex items-center gap-2.5 px-6 py-3 text-sm font-bold rounded-xl bg-gradient-to-r from-[#E05A38] to-[#b83d25] hover:from-[#c94929] hover:to-[#9c2f1a] text-white shadow-lg hover:shadow-orange-900/30 transition-all cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0 mb-4"
                >
                  <Play size={16} fill="currentColor" />
                  <span>Start Linux Terminal</span>
                </button>
              )}

              {/* Extra Session Utilities: Import & Pre-installed Info */}
              <div className="flex items-center gap-3 text-xs text-[#8B949E] mb-4">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer"
                >
                  <Upload size={12} />
                  <span>Import .v86state</span>
                </button>
                {savedSession && (
                  <>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={exportSession}
                      className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer"
                    >
                      <Download size={12} />
                      <span>Export Snapshot</span>
                    </button>
                  </>
                )}
              </div>

              {/* Features footer */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-3 border-t border-[#30363D]/60 text-[11px] text-[#8B949E]">
                <span className="flex items-center gap-1 text-[#58A6FF]">
                  <Package size={11} />
                  <span>neofetch, tree, calc, cowsay, curl, nano, pkg</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <ShieldCheck size={11} className="text-[#7EE787]" />
                  <span>Sandbox Isolation</span>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 2. Loading / Booting State */}
        {(status === 'loading' || status === 'booting') && (
          <div className="absolute inset-0 bg-[#0D1117]/90 backdrop-blur-[2px] flex flex-col items-center justify-center p-6 text-center z-10">
            <Loader2 size={36} className="animate-spin text-[#E05A38] mb-4" />
            <h4 className="text-sm font-bold text-[#F0F4F8] mb-1">
              {status === 'loading'
                ? 'Loading WebAssembly Core...'
                : isResumed
                ? 'Resuming Saved Session State...'
                : 'Booting Linux Guest & Installing Packages...'}
            </h4>
            <p className="text-xs text-[#8B949E] max-w-xs leading-relaxed">
              {isResumed
                ? 'Restoring CPU registers, memory buffers, and files from IndexedDB.'
                : 'Decompressing Linux kernel and initializing BusyBox userland (~2s).'}
            </p>
          </div>
        )}

        {/* 3. Error State */}
        {status === 'error' && (
          <div className="absolute inset-0 bg-[#0D1117]/95 flex flex-col items-center justify-center p-6 text-center z-10">
            <div className="max-w-md">
              <AlertCircle size={36} className="text-[#F85149] mx-auto mb-3" />
              <h4 className="text-sm font-bold text-[#F0F4F8] mb-1">
                Failed to Launch Linux Guest
              </h4>
              <p className="text-xs text-[#8B949E] mb-4">
                {errorMessage || 'Emulator assets could not be initialized.'}
              </p>
              <button
                type="button"
                onClick={() => handleStart({ resume: false })}
                className="px-5 py-2 text-xs font-semibold rounded-full bg-[#E05A38] text-white hover:bg-[#c94929] transition-colors"
              >
                Retry Launch
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Terminal Footer */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-[#161B22]/70 border-t border-[#30363D]/60 text-[11px] text-[#8B949E]">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <ShieldCheck size={11} className="text-[#7EE787]" />
            <span>WebAssembly sandbox</span>
          </span>
          {savedSession && (
            <span className="hidden sm:inline text-[#7EE787]">
              • Session saved ({((savedSession.size || 0) / (1024 * 1024)).toFixed(1)} MB)
            </span>
          )}
        </div>
        {isFullscreen && <span className="text-[#F2CC60]">Press ESC to exit fullscreen</span>}
      </div>
    </div>
  );
});
