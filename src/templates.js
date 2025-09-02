import sharp from "sharp"
import dataApks from '../data/apks.json' with { type: 'json' }

/**
 * Get a list of apkDataEntry for processing
 * @returns {apkDataEntry[]}
 */
export function getDataApks() {
    return dataApks
}

/**
 * @typedef {object} apkDataEntry - An App Entry
 * @property {string} name - the name of the app
 * @property {string} repo - the repo of the app
 * @property {string} license - the license of the app
 * @property {string} apk_file - a link to the apk file
 * @property {string?} donations - a link to donations
 * @property {string} id - the id of the app
 * @property {string} summary - a summary of the app
 * @property {string?} translations - a link to translations
 * @property {string} icon - a link to the icon of the app
 */

export const iconSizes = [16, 24, 32, 48, 64, 128, 192, 256, 512]

/**
 * Get the content of the desktop file.
 * @param {string} name - the display name
 * @param {string} lowerName - the name but lowercase
 * @param {string} summary - a summary of the app
 * @param {string} updatedId - the id to use
 */
export function getDesktopFileContent(name, lowerName, summary, updatedId) {
    return removeExtraWhitespace(`
        [Desktop Entry]
        Type=Application
        Name=${name}
        Exec=${lowerName}.sh --uri %u
        Comment=${summary}
        X-Purism-FormFactor=Workstation;Mobile;
        Icon=${updatedId}
    `)
}

/**
 * Get the content of the sh file
 * @param {string} updatedId - the id to user in the sh file.
 */
export function GetShFileContent(updatedId) {
    return removeExtraWhitespace(`
        #!/bin/sh
        export ATL_UGLY_ENABLE_WEBVIEW=
        exec android-translation-layer --gapplication-app-id=${updatedId} /app/share/${updatedId}.apk $@
        `)
}

/**
 * metainfo.xml
 * @param {apkDataEntry} entry - an app entry that will be translated into the metainfo
 * @param {string} updatedId - the id to use for the app entry
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
            ${entry.donations ? `<url type="donation">${entry.donations}</url>` : ""}
            ${entry.translations ? `<url type="translate">${entry.translations}</url>` : ""}
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
 * @param {ArrayBuffer} buffer - the array buffer to manipulate into different icon sizes
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
 * fetch an array buffer
 * @param {string | URL | globalThis.Request} url - the url to fetch
 */
export async function getArrayBuffer(url) {
    let info = await fetch(url)
    return await info.arrayBuffer()
}


/**
 * create a JSON object that can be serialized into a flatpak yaml file
 * @param {string} lowerName - the lowercase name of the app
 * @param {string} updatedId - the id to use for the app
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
 * remove extra whitespace from formatted strings.
 * @param {string} value - the value to remove whitespace from
 */
function removeExtraWhitespace(value) {
    return value.replaceAll('    ', '').trimStart()
}
