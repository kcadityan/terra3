const Module = require('module');
const path = require('path');

const rootDir = __dirname;
const aliasMap = new Map([
  ['@engine/', path.join(rootDir, 'engine') + path.sep],
  ['@shared/', path.join(rootDir, 'engine', 'shared') + path.sep],
  ['@mods/', path.join(rootDir, 'mods') + path.sep]
]);

const originalResolveFilename = Module._resolveFilename;

Module._resolveFilename = function patchedResolve(request, parent, isMain, options) {
  for (const [alias, target] of aliasMap) {
    if (request.startsWith(alias)) {
      const mappedRequest = path.join(target, request.slice(alias.length));
      return originalResolveFilename.call(this, mappedRequest, parent, isMain, options);
    }
  }
  return originalResolveFilename.call(this, request, parent, isMain, options);
};
