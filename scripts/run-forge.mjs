import { spawn } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';

const command = process.argv[2];
if (!['start', 'package', 'make'].includes(command)) throw new Error('Comando Forge inválido.');
const safeEnvironment = Object.fromEntries(
  Object.entries(process.env).filter(([name]) => !/(?:API_KEY|ACCESS_KEY|SECRET|TOKEN|PASSWORD|PRIVATE_KEY|CERT_PASSWORD)/i.test(name)),
);
safeEnvironment.NODE_ENV = command === 'start' ? 'development' : 'production';
const cli = path.resolve('node_modules/@electron-forge/cli/dist/electron-forge.js');
const child = spawn(process.execPath, [cli, command], { cwd: process.cwd(), env: safeEnvironment, stdio: 'inherit', shell: false });
child.on('exit', (code, signal) => { if (signal) process.kill(process.pid, signal); else process.exitCode = code ?? 1; });
