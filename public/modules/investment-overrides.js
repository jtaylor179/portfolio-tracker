// import { XHREventDispatcher } from './xhr-intercept.js';
// import { PortfolioManagerService } from './portfolio-service.js';

// import web component called portfolio-widget
import './portfolio-widget.js'


export function setup(){
    // append the portfolio-widget to the body
    document.body.appendChild(document.createElement('portfolio-widget'));
}

/*
function testHttp(url) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url);
    
    xhr.addEventListener('readystatechange', function() {
        if (xhr.readyState === 4) {
            console.log('readystatechange (addEventListener): ', (xhr.responseText + '').substring(0, 100) + '...');
        }
    });

    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            console.log('onreadystatechange: ', (xhr.responseText + '').substring(0, 100) + '...');
        }
    };

    xhr.onload = function() {
        if (xhr.status === 200) {
            console.log('onload: ', (xhr.responseText + '').substring(0, 100) + '...');
        } 
        // else {
        //     console.log('Request failed');
        // }
    };

    xhr.onerror = function() {
        console.log('Network error');
    };

    xhr.send();
}

function isCurrentDomainInvesting() {
    // Extract the protocol and hostname from the current URL
    const currentDomain = window.location.protocol + '//' + window.location.hostname;

    // Check if the current domain matches the target domain
    return currentDomain === 'https://tvc-invdn-com.investing.com';
}

console.log(isCurrentDomainInvesting()); // This will log 'true' if the current domain matches, otherwise 'false'


export function setup(){
    XMLHttpRequest.configureOverrides([
        { mode:"replace", name:"call1", watcher:watchFn, url: 'https://30279bbbe4f345b3a36f33f4e29c0643.api.mockbin.io/', method: 'GET', replaceUrl: 'https://2ca72b131c5c445ea544d023c30d2942.api.mockbin.io/', replaceMethod: 'GET' },
        { mode:"replace", name:"call2", watcher:watchFn2, url: 'https://2ca72b131c5c445ea544d023c30d2942.api.mockbin.io/', method: 'GET', replaceUrl: 'https://30279bbbe4f345b3a36f33f4e29c0643.api.mockbin.io/', replaceMethod: 'GET' }
    ]);
    

    testHttp('https://30279bbbe4f345b3a36f33f4e29c0643.api.mockbin.io/');
    testHttp('https://2ca72b131c5c445ea544d023c30d2942.api.mockbin.io/');

    if(isCurrentDomainInvesting()){
        testHttp('https://tvc4.investing.com/615bca0a5a51af775ac1b774a5323123/1635741342/1/1/8/history?symbol=252&resolution=D&from=1669434017&to=1670643616')
        testHttp('https://tvc4.investing.com/615bca0a5a51af775ac1b774a5323123/1635741342/1/1/8/history?symbol=6408&resolution=D&from=1673843022&to=1704947082')
    }

}

// Subscribe to the custom log event
XHREventDispatcher.addEventListener('xhrLogEvent', function(logDetail) {
    console.log('Logged Request:', logDetail);
});


function watchFn(config, response ) {
    console.log('watchFn1');
    debugger;
}

function watchFn2(config, response) {
    return new Promise((resolve, reject) => {
        console.log('watchFn1');
        debugger;
        // If everything went well, resolve the Promise
        resolve('Promise resolved');
        // If something went wrong, reject the Promise
        // reject('Promise rejected');
    });

}

export function sayHello(){
    console.log('hello');
}

*/