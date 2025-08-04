import { pathByMark } from 'misc-fs'
import path from 'path'

export function logPath() {
  const root = pathByMark()
  return path.join(root, '/logs/app.log')
}
