import type { IllustratorAPI } from '../preload/api';

declare global { interface Window { illustrator: IllustratorAPI } }
export {};
