import { spawnSync } from 'node:child_process'
import { readdir, mkdir } from 'node:fs/promises'
import path from 'node:path'

const baseDirectory = path.join(import.meta.dirname, '..')
const buildPath = path.join(baseDirectory, 'build')

await mkdir(buildPath, { recursive: true })

const appsDirectory = await readdir('./apps')


for (let appId of appsDirectory) {
    let appPath = path.join(baseDirectory, 'apps', appId)
    spawnSync('flatpak-builder', 
        [
            `--repo=${path.join(baseDirectory, 'FlatpakRepo', 'repo')}`,
            path.join(buildPath, appId),
            path.join(appPath, `${appId}.yml`)
        ],
        { stdio: 'inherit'}
    )
}
