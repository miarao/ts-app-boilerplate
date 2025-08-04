import * as fs from 'fs'
import { errorPrinter, printer } from 'misc'
import * as path from 'path'

// Define the output paths relative to the current working directory (monorepo root)
const ROOT_DIR = process.cwd()
const OUTPUT_FILE = path.join(ROOT_DIR, 'tree.txt')
const TEMP_FILE = path.join(ROOT_DIR, 'tree.txt.tmp')

/**
 * Recursively generates a tree structure string for the given directory.
 *
 * @param dir - The directory path to traverse.
 * @param prefix - The prefix string used for formatting (used internally).
 * @returns A string representing the tree structure.
 */
function generateTree(dir: string, prefix: string = ''): string {
  let tree = ''
  let items: fs.Dirent[]

  try {
    // Read directory entries with file type information
    items = fs.readdirSync(dir, { withFileTypes: true })
  } catch (error) {
    errorPrinter(`Error reading directory "${dir}":`, error)
    return tree
  }

  // Filter out hidden files/directories and any directory named "dist"
  items = items.filter(item => {
    if (item.name.startsWith('.')) {
      return false
    }
    if (item.isDirectory() && item.name === 'dist') {
      return false
    }
    return true
  })

  // Sort items alphabetically for consistent output
  items.sort((a, b) => a.name.localeCompare(b.name))

  items.forEach((item, index) => {
    const isLast = index === items.length - 1
    const connector = isLast ? '└── ' : '├── '
    tree += `${prefix}${connector}${item.name}\n`

    // If the item is a directory, recursively generate its tree
    if (item.isDirectory()) {
      const newPrefix = prefix + (isLast ? '    ' : '│   ')
      tree += generateTree(path.join(dir, item.name), newPrefix)
    }
  })

  return tree
}

/**
 * Main function to generate the tree structure and safely write it to a file.
 */
function main() {
  try {
    // Get the current working directory (monorepo root)
    const startingDir = process.cwd()
    // Use the base name of the current working directory as the root node
    const rootName = path.basename(startingDir)
    let tree = `${rootName}\n`
    tree += generateTree(startingDir)

    // Write to a temporary file first
    fs.writeFileSync(TEMP_FILE, tree, 'utf8')
    // If writing was successful, replace the target file with the temporary file
    fs.renameSync(TEMP_FILE, OUTPUT_FILE)
    printer(`Tree structure successfully written to ${OUTPUT_FILE}`)
  } catch (error) {
    errorPrinter('An error occurred while generating the tree:', error)
    // Clean up temporary file if it exists
    if (fs.existsSync(TEMP_FILE)) {
      fs.unlinkSync(TEMP_FILE)
    }
    // Instead of process.exit(1), throw the error to let it propagate.
    throw error
  }
}

main()
