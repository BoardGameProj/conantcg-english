import { parse, HTMLElement } from 'node-html-parser';

export function fetchHtmlDom(url: string, method = 'GET', payload: any = null, headers: any = null) {
    const parseOptions = {
        voidTag: {closingSlash: true},
        blockTextElements: {
            script: true, // JSON schema may be done with script tags
            noscript: false,
            style: false
        }
    }
    return new Promise<HTMLElement>(async (resolve, reject) => {
        const cacheName = `${url.replace(/[\/.:]+/g, '_')}`;
        const cacheFile = `cache/${cacheName}.html`;

        console.log('fetchHtmlDom ' + url)
        const body = new URLSearchParams();
        if (typeof payload === 'object') {
            for (let payloadKey in payload) {
                body.append(payloadKey, payload[payloadKey])
            }
        }
        const actualHeaders = new Headers();
        if (typeof headers === 'object') {
            for (let headerKey in headers) {
                actualHeaders.append(headerKey, headers[headerKey])
            }
        }
        let init = {method: method, body: body, headers: actualHeaders};
        fetch(url, {...init, redirect: 'follow'})
            .then(async function (r) {
                if (r.status !== 200) {
                    console.error(await r.text())
                    console.error(r.statusText)
                    reject('Did not get a 200 status code.')
                    return
                }
                const html = await r.text()
                resolve(parse(html))
            })
            .catch((error) => {
                console.error(error);
                reject(error);
            });
    })
}