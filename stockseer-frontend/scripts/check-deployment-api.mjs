import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEnv } from 'vite';

export const DEVELOPMENT_API_BASE_URL = 'https://stockseer--ai-dev.onrender.com';
const frontendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function assertDevelopmentApiTarget(branch, apiBaseUrl, isVercelBuild = false) {
  if (isVercelBuild && !branch) {
    throw new Error('Vercel system environment variables must be enabled so the build can validate its Git branch.');
  }
  if (branch !== 'master') return;

  const normalizedUrl = apiBaseUrl?.trim().replace(/\/+$/, '');
  if (normalizedUrl !== DEVELOPMENT_API_BASE_URL) {
    throw new Error(
      `Vercel master builds must set VITE_API_BASE_URL to ${DEVELOPMENT_API_BASE_URL}; received ${normalizedUrl || '(missing)'}.`,
    );
  }
}

function checkDeploymentApiTarget() {
  const apiEnv = loadEnv('production', frontendRoot, 'VITE_');
  const apiBaseUrl = process.env.VITE_API_BASE_URL?.trim() || apiEnv.VITE_API_BASE_URL;
  assertDevelopmentApiTarget(
    process.env.VERCEL_GIT_COMMIT_REF,
    apiBaseUrl,
    process.env.VERCEL === '1',
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  checkDeploymentApiTarget();
}
