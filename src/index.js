import { writeFile, mkdir } from 'fs/promises'
import { stringify as yamlStringify } from 'yaml'
import { getArrayBuffer, getDesktopFileContent, getFlatpakYamlObject, GetMetaInfoContent, GetShFileContent, createImage, getDataApks } from './templates.js'


/**
 * @param {import('./templates').apkDataEntry} entry
 */
async function processEntry(entry) {
    const updatedId = `${entry.id}_unofficial`
    const lowerName = `${entry.name.toLocaleLowerCase()}`
    await mkdir(`./apps/${updatedId}`, { recursive: true })

    const desktopFileContent = getDesktopFileContent(entry.name, lowerName, entry.summary, updatedId)
    const metaInfoFileContent = GetMetaInfoContent(entry, updatedId)
    const shFileContent = GetShFileContent(updatedId)
    const flatpakYamlObj = getFlatpakYamlObject(lowerName, updatedId)

    let apkBuffer = Buffer.from(await getArrayBuffer(entry.apk_file))
    let icons = createImage(await getArrayBuffer(entry.icon))

    let promises = []

    promises.push(writeFile(`./apps/${updatedId}/${updatedId}.apk`, apkBuffer))

    icons.forEach(e => {
        const iconFileName = `${updatedId}_icon_${e.size}x${e.size}.png`

        promises.push(
            e.sharp.toFile(`./apps/${updatedId}/${iconFileName}`)
        )

        flatpakYamlObj.modules[0].sources.splice(2, 0, { type: 'file', path: `${iconFileName}` })
        flatpakYamlObj.modules[0]['build-commands'].splice(2, 0,
            `install -D ${iconFileName} /app/share/icons/hicolor/${e.size}x${e.size}/apps/${updatedId}.png`
        )
    })

    await Promise.all(promises)
    promises = [
        writeFile(`./apps/${updatedId}/${updatedId}.metainfo.xml`, metaInfoFileContent),
        writeFile(`./apps/${updatedId}/${updatedId}.desktop`, desktopFileContent),
        writeFile(`./apps/${updatedId}/${lowerName}.sh`, shFileContent),
        writeFile(`./apps/${updatedId}/${updatedId}.yml`, yamlStringify(flatpakYamlObj, {}))
    ]
    await Promise.all(promises)
    console.log(`Files complete for ${updatedId}`)
}

const allPromises = [];
for (const entry of getDataApks()) {
    allPromises.push(processEntry(entry))
}

await Promise.all(allPromises)
