import { spawnSync } from 'child_process'
import { readdir, mkdir } from 'fs/promises'
import { join } from 'path'

const curDir = import.meta.dirname
const buildPath = join(curDir, 'build')

mkdir(buildPath, { recursive: true })

const dir = await readdir('./apps')


for (let m of dir) {
    let path = join(curDir, 'apps', m)
    spawnSync('flatpak-builder', 
        [
            `--repo=${join(curDir, 'atlhhub.repo')}`,
            join(buildPath, m),
            join(path, `${m}.yml`)
        ],
        { stdio: 'inherit'}
    )
}