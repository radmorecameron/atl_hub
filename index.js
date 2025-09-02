import dataApks from './data/apks.json' with { type: 'json' }
import { writeFile, mkdir } from 'fs/promises'
import sharp from 'sharp'
import {parse as yamlParse, stringify as yamlStringify} from 'yaml'

dataApks.forEach(e => {
    const updatedId = `${e.id}_unofficial`
    const lowerName = `${e.name.toLocaleLowerCase()}`
    const iconSizes = [16, 24, 32, 48, 64, 128, 192, 256, 512]

    mkdir(`./apps/${updatedId}`, { recursive: true }).then(_ => {
        const metainfo =
            `<?xml version="1.0" encoding="utf-8"?>
        <component type="desktop-application">
            <id>${updatedId}</id>
            <name>${e.name} (unofficial port)</name>
            <summary>${e.summary}</summary>
            <project_license>${e.license}</project_license>
            <metadata_license>CC0-1.0</metadata_license>
            <categories>
                <category>Education</category>
            </categories>
            <url type="bugtracker">https://github.com/radmorecameron/atl_hub/issues</url>
            ${e.donations != null ? `<url type="donation">${e.donations}</url>` : ""}
            ${e.translations != null ? `<url type="translate">${e.translations}</url>` : ""}
            <description>
                <p><em>NOTE:</em> This is an unofficial and experimental Flatpak build based on Android Translation Layer.</p>
                <p>${e.summary}</p>
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

        const desktopFile = `
            [Desktop Entry]
            Type=Application
            Name=${e.name}
            Exec=${lowerName}.sh --uri %u
            Comment=${e.summary}
            X-Purism-FormFactor=Workstation;Mobile;
            Icon=${updatedId}
        `

        const shFile = `
        #!/bin/sh
        export ATL_UGLY_ENABLE_WEBVIEW=
        exec android-translation-layer --gapplication-app-id=${updatedId} /app/share/${updatedId}.apk $@
        `

        const flatpakYamlObj = {
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

        fetch(e.apk_file)
            .then(buff => buff.arrayBuffer())
            .then(apk => {
                var buffer = Buffer.from(apk)
                writeFile(`./apps/${updatedId}/${updatedId}.apk`, buffer)
            })

        fetch(e.icon)
            .then(buff => buff.arrayBuffer())
            .then(apk => {
                for (let iconsize of iconSizes) {
                    let iconFileName = `${updatedId}_icon_${iconsize}x${iconsize}.png`
                    sharp(apk)
                        .resize(iconsize, iconsize)
                        .toFormat(sharp.format.png)
                        .toFile(`./apps/${updatedId}/${iconFileName}`)

                    flatpakYamlObj.modules[0].sources.splice(2, 0, { type: 'file', path: `${iconFileName}` })
                    flatpakYamlObj.modules[0]['build-commands'].splice(2, 0,
                        `install -D ${iconFileName} /app/share/icons/hicolor/${iconsize}x${iconsize}/apps/${updatedId}.png`
                    )
                }
                // var buffer = Buffer.from(apk)
                // writeFile(`./apps/${updatedId}/${updatedId}_icon.png`, buffer)
            }).then(_ => {
                writeFile(`./apps/${updatedId}/${updatedId}.metainfo.xml`, metainfo)
                writeFile(`./apps/${updatedId}/${updatedId}.desktop`, desktopFile.replaceAll('    ', '').trimStart())
                writeFile(`./apps/${updatedId}/${lowerName}.sh`, shFile.replaceAll('    ', '').trimStart())
                writeFile(`./apps/${updatedId}/${updatedId}.yml`, yamlStringify(flatpakYamlObj, { }))
            })
    }).catch(e => {
        console.error(e)
    })
    console.log(e)
})