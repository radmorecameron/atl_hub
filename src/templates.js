import sharp from "sharp"
import dataApks from '../data/apks.json' with { type: 'json' }

/**
 * @returns {apkDataEntry[]}
 */
export function getDataApks() {
    return dataApks
}

/**
 * @typedef {Object} apkDataEntry
 * @property {String} name
 * @property {string} repo
 * @property {string} license
 * @property {string} apk_file
 * @property {string?} donations
 * @property {string} id
 * @property {string} summary
 * @property {string?} translations
 * @property {string} icon
 */

export const iconSizes = [16, 24, 32, 48, 64, 128, 192, 256, 512]

/**
 * @param {string} name 
 * @param {string} lowerName 
 * @param {string} summary 
 * @param {string} updatedId 
 * @returns 
 */
export function getDesktopFileContent(name, lowerName, summary, updatedId) {
    return formatStr(`
        [Desktop Entry]
        Type=Application
        Name=${name}
        Exec=${lowerName}.sh --uri %u
        Comment=${summary}
        X-Purism-FormFactor=Workstation;Mobile;
        Icon=${updatedId}
    `)
}

export function GetShFileContent(updatedId) {
    return formatStr(`
        #!/bin/sh
        export ATL_UGLY_ENABLE_WEBVIEW=
        exec android-translation-layer --gapplication-app-id=${updatedId} /app/share/${updatedId}.apk $@
        `)
}

/**
 * @param {apkDataEntry} entry 
 * @param {string} updatedId 
 */
export function GetMetaInfoContent(entry, updatedId) {
    return `<?xml version="1.0" encoding="utf-8"?>
        <component type="desktop-application">
            <id>${updatedId}</id>
            <name>${entry.name} (unofficial port)</name>
            <summary>${entry.summary}</summary>
            <project_license>${entry.license}</project_license>
            <metadata_license>CC0-1.0</metadata_license>
            <categories>
                <category>Education</category>
            </categories>
            <url type="bugtracker">https://github.com/radmorecameron/atl_hub/issues</url>
            ${entry.donations != null ? `<url type="donation">${entry.donations}</url>` : ""}
            ${entry.translations != null ? `<url type="translate">${entry.translations}</url>` : ""}
            <description>
                <p><em>NOTE:</em> This is an unofficial and experimental Flatpak build based on Android Translation Layer.</p>
                <p>${entry.summary}</p>
            </description>
            <launchable type="desktop-id">${updatedId}.desktop</launchable>
            <supports>
                <control>pointing</control>
                <control>keyboard</control>
                <control>touch</control>
            </supports>
            <requires>
                <display_length compare="ge">360</display_length>
            </requires>
            <developer id="${updatedId}">
                <name>Packaged by ATLHub</name>
            </developer>
        </component>
        `
}

/**
 * Get an array of different icons.
 * @param {ArrayBuffer} buffer 
 */
export function createImage(buffer) {
    /** @type {{ sharp: sharp.Sharp, size: number }[]} */
    let sharpImages = []

    for (const iconSize of iconSizes) {
        sharpImages.push({ sharp: sharp(buffer)
            .resize(iconSize, iconSize)
            .toFormat(sharp.format.png), size: iconSize})
    }
    
    return sharpImages
}

/**
 * @param {string | URL | globalThis.Request} url 
 */
export async function getArrayBuffer(url) {
    let info = await fetch(url)
    return await info.arrayBuffer()
}


/**
 * @param {string} lowerName 
 * @param {string} updatedId 
 */
export function getFlatpakYamlObject(lowerName, updatedId) {
    return {
        'app-id': updatedId,
        'runtime': 'org.gnome.Platform',
        'runtime-version': '48',
        'sdk': 'org.gnome.Platform',
        'base': 'io.gitlab.android_translation_layer.BaseApp',
        'base-version': 'stable',
        'command': `${lowerName}.sh`,
        'finish-args': [
            '--share=network',
            '--share=ipc',
            '--socket=wayland',
            '--socket=fallback-x11',
            '--device=dri',
            '--socket=pulseaudio'
        ],
        'add-extensions': {
            'org.freedesktop.Platform.ffmpeg-full': {
                'version': '24.08',
                'directory': 'lib/ffmpeg',
                'add-ld-path': '.',
                'no-autodownload': false,
                'autodelete': false
            }
        },
        'cleanup-commands': ['mkdir -p ${FLATPAK_DEST}/lib/ffmpeg'],
        'modules': [
            {
                'name': lowerName,
                'buildsystem': 'simple',
                'build-commands': [
                    `install -D ${updatedId}.apk /app/share/${updatedId}.apk`,
                    `install -D ${lowerName}.sh /app/bin/${lowerName}.sh`,
                    `install -D ${updatedId}.desktop /app/share/applications/${updatedId}.desktop`,
                    `install -D ${updatedId}.metainfo.xml /app/share/metainfo/${updatedId}.metainfo.xml`
                ],
                'sources': [
                    {
                        type: 'file',
                        path: `${updatedId}.apk`
                    },
                    {
                        type: 'file',
                        path: `${updatedId}.metainfo.xml`
                    },
                    {
                        type: 'file',
                        path: `${updatedId}.desktop`
                    },
                    {
                        type: 'file',
                        path: `${lowerName}.sh`
                    }
                ]
            }
        ]
    }
}

/**
 * @param {string} val 
 */
function formatStr(val) {
    return val.replaceAll('    ', '').trimStart()
}
