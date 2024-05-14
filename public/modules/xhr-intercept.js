// xhrOverride.js
class XHREventDispatcher {
    constructor() {
        this.listeners = {};
    }

    addEventListener(eventName, callback) {
        if (!this.listeners[eventName]) {
            this.listeners[eventName] = [];
        }
        this.listeners[eventName].push(callback);
    }

    dispatchEvent(eventName, detail) {
        if (this.listeners[eventName]) {
            this.listeners[eventName].forEach(callback => {
                callback(detail);
            });
        }
    }
}

const xhrEventDispatcher = new XHREventDispatcher();

const originalXMLHttpRequest = window.XMLHttpRequest;

window.originalXMLHttpRequest = originalXMLHttpRequest;

window.XMLHttpRequest = class {
    constructor() {
        const xhr = new originalXMLHttpRequest();
        xhr._headers = {};
        xhr._responseTimeStart = 0;

        const originalOpen = xhr.open;
        xhr.open = function (method, url) {
            this._method = method;
            this._url = url;
            originalOpen.apply(this, arguments);
        };

        const originalSetRequestHeader = xhr.setRequestHeader;
        xhr.setRequestHeader = function (header, value) {
            this._headers[header] = value;
            originalSetRequestHeader.apply(this, arguments);
        };

        const originalSend = xhr.send;
        xhr.send = async function (payload) {
            this._payload = payload;
            this._responseTimeStart = new Date().getTime();

            const override = XMLHttpRequest.overrides.find(o => {
                const pattern = new RegExp(o.url);
                return pattern.test(this._url) && o.method === this._method;
            });

            if (override && override.mode === 'replace') {
                try {
                    if (override.preprocessor) {
                        override = await override.preprocessor({ method: this._method, url: this._url, headers: this._headers, payload: this._payload });
                    }
                    const response = await fetch(override.replaceUrl, { method: override.replaceMethod });
                    if (!response.ok) {
                        throw new Error(`Fetch failed with status ${response.status}`);
                    }
                    let jsonResponse = await response.json();
                    if (override.postprocessor) {
                        jsonResponse = await override.postprocessor({ method: this._method, url: this._url, headers: this._headers, responseJson: jsonResponse });
                    }
                    const textResponse = JSON.stringify(jsonResponse);

                    Object.defineProperty(this, 'status', { value: response.status });
                    Object.defineProperty(this, 'statusText', { value: response.statusText });
                    Object.defineProperty(this, 'responseText', { value: textResponse });
                    Object.defineProperty(this, 'readyState', { value: 4 });

                    this.dispatchEvent(new Event('readystatechange'));
                    this.dispatchEvent(new Event('load'));
                    this.dispatchEvent(new Event('loadend'));

                    // if (typeof (override.watcher) === 'function') {
                    //     await override.watcher(override, { status: response.status, responseJson: jsonResponse, responseText: textResponse });
                    // }
                } catch (error) {
                    console.error('Fetch error:', error);
                    this.dispatchEvent(new Event('error'));
                }
            } else {
                originalOpen.apply(this, [this._method, this._url]);
                for (let header in this._headers) {
                    originalSetRequestHeader.apply(this, [header, this._headers[header]]);
                }
                originalSend.apply(this, [this._payload]);
            }
        };

        xhr.addEventListener('loadend', function () {
            const responseTime = new Date().getTime() - xhr._responseTimeStart;
            const logDetail = {
                method: xhr._method,
                url: xhr._url,
                headers: xhr._headers,
                payload: xhr._payload,
                responseText: xhr.responseText.substring(0, 100) + "...",
                status: xhr.status,
                responseTime: responseTime
            };
            xhrEventDispatcher.dispatchEvent('xhrLogEvent', logDetail);
            // See if any watch overrides exist for this request
            const override = XMLHttpRequest.overrides.find(o => {
                const pattern = new RegExp(o.urlPattern);
                return pattern.test(xhr._url) && o.method === xhr._method;
            });
            if (override && override.mode === 'watch') {
                // add full payload to logDetail
                logDetail.responseText = xhr.responseText;
                override.watcher(override, logDetail);
            }
        });

        return xhr;
    }
    static configureOverrides(newOverrides) {
        XMLHttpRequest.overrides = newOverrides.map(o => ({
            ...o,
            url: o.url // Consider converting o.url to a RegEx pattern here if it's not already
        }));
    }
};

window.XMLHttpRequest.overrides = [];


export { xhrEventDispatcher as XHREventDispatcher };
