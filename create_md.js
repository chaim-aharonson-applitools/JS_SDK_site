import { fileURLToPath } from 'url'
import path from 'path'
import walk from 'walk-sync'
import { chain, compact, initial, last, range, map } from 'lodash-es'
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const urlPrefix = 'https://applitools.github.io/demo/TestPages/'
let emptyParents = new Set();
const pagesPath = path.join(__dirname, './client')
//const validExtensions = ['.html']


const list = chain(walk.entries(pagesPath, { directories: true }))
  // .filter(entry => {
  //   return entry.isDirectory() || validExtensions.includes(path.extname(entry.relativePath.toLowerCase()))
  // })
  .orderBy(entry => entry.relativePath.toLowerCase())
  .map(entry => {
    const dir = entry.isDirectory();
    const pathArray = compact(entry.relativePath.split('/'));
    if (dir) {
      emptyParents.add(pathArray.join('/'))
    } else {
      emptyParents.delete(initial(pathArray).join('/'))
    }
    return { relativePath: pathArray.join('/'), dir, display: last(pathArray), level: pathArray.length - 1 }
  })
  .filter(entry => !emptyParents.has(entry.relativePath))
  .value()
const orphans = [];
const output = list.reduce((mem, entry) => {
  const { relativePath, display, level, dir } = entry;
  const link = dir ? '' : `(${urlPrefix + relativePath})`
  const item = `${map(range(level), l => '  ').join('')}- ${dir ? '' : '['}${display}${dir ? '' : ']'}${link}\r\n`
  if (!dir && level === 0) {
    orphans.push(item)
  } else {
    mem.push(item)
  }
  return mem
}, []).concat(orphans).join('')
console.log(output)
