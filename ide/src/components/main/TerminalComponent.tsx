import { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

export const TerminalComponent = () => {
  const terminalContainerRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!terminalContainerRef.current) return;

    // Create xterm.js instance
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

    // Open terminal inside container
    term.open(terminalContainerRef.current);
    fitAddon.fit();

    // Determine WS URL dynamically
    const protocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
    // If local dev, use port 5000 directly. In production, proxy through standard host.
    const host = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
      ? 'localhost:5000' 
      : window.location.host;
    
    // Write initial connecting status
    term.write('\x1b[33mConnecting to terminal service...\x1b[0m\n\r');

    // Create a local variable to hold the ws instance for cleanup
    let ws: WebSocket | null = null;

    let dataListener: any = null;

    const connectWebSocket = async () => {
      let accessToken = '';
      try {
        const { fetchAuthSession } = await import('aws-amplify/auth');
        const session = await fetchAuthSession();
        accessToken = session.tokens?.accessToken?.toString() || '';
      } catch (error) {
        console.debug('No auth session available for terminal WebSocket');
      }

      let wsUrl = `${protocol}${host}/ws/terminal`;
      if (accessToken) {
        wsUrl += `?token=${encodeURIComponent(accessToken)}`;
      }
      
      console.log('Connecting to WebSocket:', wsUrl);
      
      ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connection opened');
      };

      ws.onmessage = (event) => {
        const dataStr = event.data;
        if (typeof dataStr !== 'string') return;

        // Handle JSON control/status messages
        try {
          if (dataStr.trim().startsWith('{')) {
            const parsed = JSON.parse(dataStr);
            if (parsed && typeof parsed === 'object' && parsed.type) {
              switch (parsed.type) {
                case 'connected':
                  console.log('Connection established, sending create message');
                  ws!.send(JSON.stringify({ type: 'create' }));
                  return;
                case 'creating':
                  term.write(`\r\x1b[2K\x1b[33m⚙ ${parsed.message || 'Creating workspace...'}\x1b[0m`);
                  return;
                case 'ready':
                  term.write(`\r\x1b[2K\x1b[32m✔ ${parsed.message || 'Workspace is ready!'}\x1b[0m\n\r`);
                  return;
                case 'error':
                  term.write(`\r\x1b[2K\x1b[31m✘ Error: ${parsed.message || 'Unknown backend error'}\x1b[0m\n\r`);
                  return;
                default:
                  // If it is another unrecognized type, fall through and treat as raw output
                  break;
              }
            }
          }
        } catch (e) {
          // Not a JSON message, fall through to raw writing
        }

        // Write raw output directly to terminal
        term.write(dataStr);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        term.write('\n\r\x1b[31m✘ WebSocket error occurred.\x1b[0m\n\r');
      };

      ws.onclose = (event) => {
        console.log('WebSocket connection closed:', event);
        term.write('\n\r\x1b[31m✘ Connection to workspace terminal closed.\x1b[0m\n\r');
      };

      // Forward xterm input to WebSocket
      dataListener = term.onData((data) => {
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'input',
            data
          }));
        }
      });
    };

    connectWebSocket();

    // Resize handling using ResizeObserver
    const resizeObserver = new ResizeObserver(() => {
      try {
        fitAddon.fit();
      } catch (e) {
        console.error('Fit error:', e);
      }
    });
    
    resizeObserver.observe(terminalContainerRef.current);

    return () => {
      console.log('Cleaning up TerminalComponent...');
      resizeObserver.disconnect();
      if (dataListener) dataListener.dispose();
      if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
        ws.close();
      }
      term.dispose();
      wsRef.current = null;
    };
  }, []);

  return (
    <div className="w-full h-full bg-[#0e0e0e] p-2 overflow-hidden">
      <div ref={terminalContainerRef} className="w-full h-full overflow-hidden" />
    </div>
  );
};
