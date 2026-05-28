import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const sharedSandbox = {
  console,
  Math,
  Date,
  URL,
  Blob,
  crypto: {
    randomUUID: () => 'test-uuid',
  },
};

sharedSandbox.globalThis = sharedSandbox;
sharedSandbox.window = sharedSandbox;
sharedSandbox.self = sharedSandbox;
sharedSandbox.global = sharedSandbox;
sharedSandbox.Echoes = sharedSandbox.Echoes || {};

const sharedContext = vm.createContext(sharedSandbox);

export function loadGameScript(filePath, extraSandbox = {}) {
  Object.assign(sharedSandbox, extraSandbox);

  const code = readFileSync(filePath, 'utf8');
  const script = new vm.Script(code, { filename: filePath });
  script.runInContext(sharedContext);

  return sharedSandbox.Echoes;
}
