import { writeFile, mkdir } from 'node:fs/promises'
import { stringify as yamlStringify } from 'yaml'
import { getArrayBuffer, getDesktopFileContent, getFlatpakYamlObject, GetMetaInfoContent, GetShFileContent, createImage, getDataApks, pathExists } from './templates.js'

/**
 * Process an entry, download and create the necessary files.
 * @param {import('./templates').apkDataEntry} entry - the entry to create
 */
async function processEntry(entry) {
    const updatedId = `${entry.id}_unofficial`
    const lowerName = `${entry.name.toLocaleLowerCase()}`
    await mkdir(`./apps/${updatedId}`, { recursive: true })

    let appAlreadyExists = await pathExists(`./apps/${updatedId}/${updatedId}.apk`)
    if (entry.shouldUpdate !== true && appAlreadyExists) {
        console.log(`app already exists. Skipping ${updatedId}`)
        return;
    }

    const desktopFileContent = getDesktopFileContent(entry.name, lowerName, entry.summary, updatedId)
    // todo: if app already exists, update metainfo and add a 'release' instead
    const metaInfoFileContent = GetMetaInfoContent(entry, updatedId)
    const shFileContent = GetShFileContent(updatedId)
    const flatpakYamlObject = getFlatpakYamlObject(lowerName, updatedId)

    let apkBuffer = Buffer.from(await getArrayBuffer(entry.apk_file))
    let icons = createImage(await getArrayBuffer(entry.icon))

    let promises = []

    promises.push(writeFile(`./apps/${updatedId}/${updatedId}.apk`, apkBuffer))

    for (const icon of icons) {
        const iconFileName = `${updatedId}_icon_${icon.size}x${icon.size}.png`

        promises.push(
            icon.sharp.toFile(`./apps/${updatedId}/${iconFileName}`)
        )

        flatpakYamlObject.modules[0].sources.splice(2, 0, { type: 'file', path: `${iconFileName}` })
        flatpakYamlObject.modules[0]['build-commands'].splice(2, 0,
            `install -D ${iconFileName} /app/share/icons/hicolor/${icon.size}x${icon.size}/apps/${updatedId}.png`
        )
    }

    await Promise.all(promises)
    promises = [
        writeFile(`./apps/${updatedId}/${updatedId}.metainfo.xml`, metaInfoFileContent),
        writeFile(`./apps/${updatedId}/${updatedId}.desktop`, desktopFileContent),
        writeFile(`./apps/${updatedId}/${lowerName}.sh`, shFileContent),
        writeFile(`./apps/${updatedId}/${updatedId}.yml`, yamlStringify(flatpakYamlObject, {}))
    ]
    await Promise.all(promises)
    console.log(`Files complete for ${updatedId}`)
}

const allPromises = [];
for (const entry of getDataApks()) {
    // eslint-disable-next-line unicorn/prefer-top-level-await
    allPromises.push(processEntry(entry))
}

await Promise.all(allPromises)
