import * as fs from 'node:fs'
import * as path from 'node:path'

import { ROOT_PACKAGE_NAME } from './app-root'

export type Marker = {
  type: 'package.json'
  name: string
}

export interface PackageJson {
  name: string
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
}

/**
 * Gets the absolute path based on marker type
 * by looking for specific marker files (i.e. package.json, turbo.json)
 * defaults to 'import-ant' root
 */
export function pathByMark(marker: Marker = { type: 'package.json', name: ROOT_PACKAGE_NAME }): string {
  // Start from the current directory
  let currentDir = process.cwd()

  // Define marker files that indicate the root directory

  // Look for marker files, traversing up the directory tree
  while (currentDir !== path.parse(currentDir).root) {
    let markerPath: string
    if (fs.existsSync(path.join(currentDir, marker.type))) {
      markerPath = path.join(currentDir, marker.type)
      if (marker.type === 'package.json') {
        const packageJson: PackageJson = JSON.parse(fs.readFileSync(markerPath, 'utf-8')) satisfies PackageJson
        if (packageJson.name === marker.name) {
          return currentDir
        }
      }
    }
    // Move up one directory
    currentDir = path.dirname(currentDir)
  }

  // If no marker file found, fall back to current working directory
  throw new Error(`marker of ${marker.type} with name: ${marker.name} not found`)
}
