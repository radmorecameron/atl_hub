import { spawnSync } from 'child_process'
import { readdir, mkdir } from 'fs/promises'
import { join } from 'path'

const baseDir = join(import.meta.dirname, '..')
const buildPath = join(baseDir, 'build')
console.log(baseDir)
mkdir(buildPath, { recursive: true })

const dir = await readdir('./apps')


for (let m of dir) {
    let path = join(baseDir, 'apps', m)
    spawnSync('flatpak-builder', 
        [
            `--repo=${join(baseDir, 'FlatpakRepo', 'repo')}`,
            join(buildPath, m),
            join(path, `${m}.yml`)
        ],
        { stdio: 'inherit'}
    )
}
