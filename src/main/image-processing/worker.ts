import { parentPort, workerData } from 'node:worker_threads';
import { processImageFile, type SharpOperationInput } from './operations';

processImageFile(workerData as SharpOperationInput)
  .then(() => parentPort?.postMessage({ ok: true }))
  .catch((error: unknown) => parentPort?.postMessage({ ok: false, error: error instanceof Error ? error.message : 'Falha de processamento' }));
