import { spawnSync } from 'node:child_process'
import { readdir, mkdir } from 'node:fs/promises'
import path from 'node:path'

const baseDirectory = path.join(import.meta.dirname, '..')
const buildPath = path.join(baseDirectory, 'build')

await mkdir(buildPath, { recursive: true })

const appsDirectory = await readdir('./apps')

const repo = `${path.join(baseDirectory, 'FlatpakRepo', 'repo')}`
console.log(repo)

for (let appId of appsDirectory) {
    const appPath = path.join(baseDirectory, 'apps', appId)

    spawnSync('flatpak-builder', 
        [
            '--user',
            '--disable-rofiles-fuse',
            '--disable-updates',
            '--force-clean',
            `--repo=${repo}`,
            path.join(buildPath, appId),
            path.join(appPath, `${appId}.yml`)
        ],
        { stdio: 'inherit'}
    )

    spawnSync('flatpak',
        [
            'build-bundle',
            repo,
            `${appId}.flatpak`,
            '--runtime-repo=https://flathub.org/repo/flathub.flatpakrepo',
            appId
        ]
    )
}

spawnSync('flatpak',
    [
        'build-update-repo',
        '--generate-static-deltas',
        '--prune',
        repo + '/'
    ]
)