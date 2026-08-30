import fs from 'node:fs/promises';
import path from 'node:path';

const port = Number(process.argv[2]);
const output = path.resolve(process.argv[3] ?? 'out/smoke-render.png');
if (!port) throw new Error('Porta CDP obrigatória.');
const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
const target = targets.find((item) => item.type === 'page');
console.log(`TARGET_URL=${target?.url ?? 'indisponível'}`);
if (!target?.webSocketDebuggerUrl) throw new Error('Renderer não encontrado.');
const socket = new WebSocket(target.webSocketDebuggerUrl);
const screenshot = await new Promise((resolve, reject) => {
  const timer = setTimeout(() => reject(new Error('Tempo limite da captura excedido.')), 20_000);
  socket.addEventListener('open', () => {
    socket.send(JSON.stringify({ id: 10, method: 'Runtime.enable' }));
    socket.send(JSON.stringify({ id: 11, method: 'Log.enable' }));
    setTimeout(() => socket.send(JSON.stringify({ id: 1, method: 'Runtime.evaluate', params: { expression: 'JSON.stringify({text:document.body.innerText,html:document.documentElement.outerHTML.slice(0,1200),resources:performance.getEntriesByType("resource").map(r=>r.name)})', returnByValue: true } })), 5_000);
  });
  socket.addEventListener('message', (event) => {
    const message = JSON.parse(String(event.data));
    if (message.id === 1) {
      console.log(`DOM_STATE=${message.result?.result?.value ?? ''}`);
      socket.send(JSON.stringify({ id: 2, method: 'Page.captureScreenshot', params: { format: 'png', captureBeyondViewport: false } }));
    }
    if (message.id === 2) { clearTimeout(timer); message.result?.data ? resolve(message.result.data) : reject(new Error(message.error?.message ?? 'Captura falhou.')); }
    if (message.method === 'Runtime.exceptionThrown') console.error(`RUNTIME_EXCEPTION=${JSON.stringify(message.params?.exceptionDetails)}`);
    if (message.method === 'Log.entryAdded') console.error(`LOG_ENTRY=${JSON.stringify(message.params?.entry)}`);
    if (message.method === 'Runtime.consoleAPICalled') console.error(`CONSOLE=${JSON.stringify(message.params)}`);
  });
  socket.addEventListener('error', () => { clearTimeout(timer); reject(new Error('Falha no WebSocket CDP.')); });
});
socket.close();
await fs.mkdir(path.dirname(output), { recursive: true });
await fs.writeFile(output, Buffer.from(screenshot, 'base64'));
console.log(output);
