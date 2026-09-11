import { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

interface TerminalComponentProps {
  sandboxId: string | null;
  onPreviewReady?: (url: string) => void;
  activeTab?: string;
}

export const TerminalComponent = ({ sandboxId, onPreviewReady, activeTab }: TerminalComponentProps) => {
  const terminalContainerRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const termRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);

  // ── Initialise xterm once ───────────────────────────────────────────────
  useEffect(() => {
    if (!terminalContainerRef.current) return;

    const term = new Terminal({
      cursorBlink: true,
      convertEol: true,
      fontFamily: 'JetBrains Mono, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
      fontSize: 13,
      theme: {
        background: '#0e0e0e',
        foreground: '#d4d4d8',
        cursor: '#adc6ff',
      },
      scrollback: 1000,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalContainerRef.current);
    fitAddon.fit();
    termRef.current = term;
    fitAddonRef.current = fitAddon;

    term.write('\x1b[33mWaiting for project sandbox to be ready...\x1b[0m\r\n');

    const resizeObserver = new ResizeObserver(() => {
      try { fitAddon.fit(); } catch (_) {}
    });
    resizeObserver.observe(terminalContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      term.dispose();
      termRef.current = null;
      fitAddonRef.current = null;
    };
  }, []);

  // ── Re-fit when tab changes to 'shell' ───────────────────────────────────
  useEffect(() => {
    if (activeTab === 'shell' && fitAddonRef.current) {
      // Use a small timeout to ensure the div is actually displayed (block)
      // before calculating the fit.
      setTimeout(() => {
        try {
          fitAddonRef.current?.fit();
        } catch (e) {
          console.error('Fit failed:', e);
        }
      }, 10);
    }
  }, [activeTab]);

  // ── Connect to WS once sandboxId is available ───────────────────────────
  useEffect(() => {
    if (!sandboxId) return;

    const term = termRef.current;
    if (!term) return;

    // Close any existing connection
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
    const host =
      window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'localhost:5000'
        : window.location.host;

    term.write('\x1b[33mConnecting to terminal service...\x1b[0m\r\n');

    const connect = async () => {
      let accessToken = '';
      try {
        const { fetchAuthSession } = await import('aws-amplify/auth');
        const session = await fetchAuthSession();
        accessToken = session.tokens?.accessToken?.toString() || '';
      } catch (_) {
        console.debug('No auth session for terminal WebSocket');
      }

      let wsUrl = `${protocol}${host}/ws/terminal`;
      if (accessToken) wsUrl += `?token=${encodeURIComponent(accessToken)}`;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket opened, connecting to sandbox:', sandboxId);
      };

      ws.onmessage = (event) => {
        const dataStr = event.data;
        if (typeof dataStr !== 'string') return;

        try {
          if (dataStr.trim().startsWith('{')) {
            const parsed = JSON.parse(dataStr);
            if (parsed?.type) {
              switch (parsed.type) {
                case 'connected':
                  // Server confirmed WS connection — now request shell for the sandbox
                  ws.send(JSON.stringify({ type: 'connect', projectId: sandboxId }));
                  return;
                case 'connecting':
                  term.write(`\r\x1b[2K\x1b[33m⚙ ${parsed.message || 'Connecting to workspace...'}\\x1b[0m`);
                  return;
                case 'ready':
                  term.write(`\r\x1b[2K\x1b[32m✔ ${parsed.message || 'Workspace ready!'}\\x1b[0m\r\n`);
                  return;
                case 'error':
                  term.write(`\r\x1b[2K\x1b[31m✘ Error: ${parsed.message || 'Unknown error'}\\x1b[0m\r\n`);
                  return;
                case 'preview_ready':
                  onPreviewReady?.(parsed.url);
                  return;
                default:
                  break;
              }
            }
          }
        } catch (_) {
          // Not JSON — raw shell output
        }

        term.write(dataStr);
      };

      ws.onerror = () => {
        term.write('\r\n\x1b[31m✘ WebSocket error occurred.\x1b[0m\r\n');
      };

      ws.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason);
        term.write('\r\n\x1b[31m✘ Connection to workspace terminal closed.\x1b[0m\r\n');
      };

      // Forward keystrokes to the shell
      term.onData((data) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'input', data }));
        }
      });
    };

    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [sandboxId]);

  return (
    <div className="w-full h-full bg-[#0e0e0e] overflow-hidden">
      <div ref={terminalContainerRef} className="w-full h-full overflow-hidden" />
    </div>
  );
};
