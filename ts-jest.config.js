const fs = require('fs')
const path = require('path')

/**
 * Tries to resolve Jest's environment setting from a package.json found along traversing up the file system.
 */
function tryResolveJestConfig(dir) {
  while (dir.startsWith(__dirname)) {
    const maybePackageJson = path.join(dir, 'package.json')
    if (fs.existsSync(maybePackageJson)) {
      const json = JSON.parse(Buffer.from(fs.readFileSync(maybePackageJson)).toString('utf-8'))

      return {
        setupFilesAfterEnv: json.jest?.setupFilesAfterEnv?.map(f => path.join(dir, f)) ?? [],
        testEnvironment: json.jest?.testEnvironment ?? 'node',
      }
    }

    dir = path.dirname(dir)
  }
}

function resolveTSConfig(dir) {
  while (dir.startsWith(__dirname)) {
    const tsconfig = path.join(dir, 'tsconfig.json')
    if (fs.existsSync(tsconfig)) {
      return tsconfig
    }
    dir = path.dirname(dir)
  }
}

// This code is somehow coupled with launch.json. Assuming 3rd argument is the target test file.

const { testEnvironment, setupFilesAfterEnv } = tryResolveJestConfig(path.dirname(process.argv[2]))
const tsconfig = resolveTSConfig(path.dirname(process.argv[2])) ?? 'tsconfig-base.json'

module.exports = {
  globals: {
    // See reference: https://kulshekhar.github.io/ts-jest/docs/getting-started/options/tsconfig
    'ts-jest': {
      tsconfig: tsconfig,
    },
  },
  setupFilesAfterEnv,
  preset: 'ts-jest',
  testEnvironment,
}
