import { LitElement,css, unsafeCSS, html } from 'https://cdn.jsdelivr.net/gh/lit/dist@2/core/lit-core.min.js';
import { XHREventDispatcher } from './xhr-intercept.js';
import { PortfolioManagerService } from './portfolio-service.js';
import { MACDAnalysis, macd26129Config } from './macd-analysis-module.js';
import { EMACrossoverAnalysis, ema26129Config } from './ema-analysis-module.js';

import OpenAI from 'https://cdn.jsdelivr.net/npm/openai@4.26.0/+esm';
import Handsontable from 'https://esm.run/handsontable';
import papaparse from 'https://cdn.jsdelivr.net/npm/papaparse@5.4.1/+esm';
import { progressBarRenderer, starRenderer } from "./custom-renderers.js";


// const externalStylesheet = 'https://cdn.jsdelivr.net/npm/handsontable/dist/handsontable.full.min.css';

// const link = document.createElement('link');
// link.rel = 'stylesheet';
// link.href = 'https://cdn.jsdelivr.net/npm/handsontable/dist/handsontable.full.min.css';

function synchronousRequest(url) {
    var xhr = new window.originalXMLHttpRequest(); // Create a new XMLHttpRequest object
    xhr.open('GET', url, false); // Initialize the request, setting async to false for synchronous
    xhr.send(null); // Send the request

    if (xhr.status === 200) { // Check if the request was successful
        return xhr.responseText; // Return the response text if successful
    } else {
        console.error('Request failed with status:', xhr.status);
        return null; // Return null if the request failed
    }
}



// document.head.appendChild(link);

const externalStylesheet = synchronousRequest('https://cdn.jsdelivr.net/npm/handsontable/dist/handsontable.full.min.css');


// const sma = new SMA(3);

// // You can add numbers individually:
// sma.update(40);
// sma.update(30);
// sma.update(20);

// // You can add multiple numbers at once:
// sma.updates([20, 40, 80]);

// // You can add strings:
// sma.update('10');

// // You can add arbitrary-precision decimals:
// sma.update(new Big(30));

// // You can get the result in various formats:
// console.log(sma.getResult().toFixed(2)); // "40.00"

const openai = new OpenAI({
    apiKey: localStorage.getItem('openai_api_key'),
    dangerouslyAllowBrowser: true 
  });

async function main() {
  const completion = await openai.chat.completions.create({
    messages: [{ role: "system", content: "You are a helpful assistant." }],
    model: "gpt-3.5-turbo",
  });

  console.log(completion.choices[0]);
}

// main();


class PortfolioWidget extends LitElement {
    static get properties() {
        return {
            selectedPortfolioId: { type: String },
            // selectedPositionId: { type: String },
            selectedPosition: { type: Object },
            portfolios: { type: Array },
            positions: { type: Array },
            ownerId: { type: String },
            buyOrSell: { type: String },
            dialogOpened: { type: Boolean }
        };
    }
    static styles = css`
        ${unsafeCSS(externalStylesheet)}
        /* other styles */
        dialog {
            border: none;
            padding: 0px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            position: relative;
            width: 800px;
          }
    
          .draggable-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: #f1f1f1;
            // cursor: move;
            padding: 0.5em;
          }
    
          h12 {
            margin: 0;
            font-size: 1.25em;
          }
    
          .resizer {
            width: 10px;
            height: 10px;
            background: #ccc;
            position: absolute;
            right: 0;
            bottom: 0;
            cursor: se-resize;
          }
          .footer {
            padding:10px;
            background: #f1f1f1;
          }

          button2 {
            margin-top: 1em;
          }
    `;


    interceptAndLogSpecificRequests() {
        XMLHttpRequest.configureOverrides([
            {
                mode: "watch",
                name: "stockDataInterceptor",
                watcher: this.analyzeRequest.bind(this),
                urlPattern: /tvc4\.investing\.com\/615bca0a5a51af775ac1b774a5323123\/1635741342\/1\/1\/8\/history\?symbol=\d+&resolution=\w+&from=\d+&to=\d+/,
                method: 'GET'
            }
        ]);
    }
    
    analyzeRequest(config, response) {
        const url = new URL(response.url);
        const secondaryId = url.searchParams.get('symbol');
        const resolution = url.searchParams.get('resolution');
        const from = url.searchParams.get('from');
        const to = url.searchParams.get('to');
        const responseText = response.responseText;
        const responseJson = JSON.parse(responseText);
        const timeframe = this.currentTimeframe;

        if(!this.positions.find(ref => ref.secondary_id == secondaryId)){
            console.log('Request detected for symbol:', secondaryId);
            this.current_price = responseJson.c[responseJson.c.length - 1];
        }
        if(secondaryId && resolution && from && to) {
            console.log(`Request detected for symbol ${secondaryId} with resolution ${resolution}, timefream ${timeframe} from ${from} to ${to}`);
            this.saveStockData(parseInt(secondaryId), resolution, from, to, responseJson);
        }
    }

    analyzeData(data, adequateTimeframe = false) {

   
        let intervalType = this.currentTimeframe.toUpperCase();
        const intervalMapping = {'1D': 1, '4H': 4, '1H': 1, '2H': 2};
        const interval = intervalMapping[intervalType];
        // const macdAnalysisResults = (new MACDAnalysis(ema26129Config)).analyze(data);
        // console.log("Macd Last Signal:", macdAnalysisResults.lastSignal);
        // console.log("Macd Signal History:", macdAnalysisResults.signalHistory);
        const emaAnalysisResults = (new EMACrossoverAnalysis(ema26129Config)).analyze(data, interval);
        const initialSignal = emaAnalysisResults.lastSignal === null ? 'Buy' : emaAnalysisResults.lastSignal.type;
        const history = emaAnalysisResults.signalHistory;
        this.buyOrSell = initialSignal;
        let priority = 1;
        console.log("Initial EMA Last Signal:", emaAnalysisResults.lastSignal);
        console.log("Initial EMA Signal History:", history);
        if(initialSignal === 'Buy') {
            const secondaryInterval = 1;
            if(secondaryInterval !== interval) {
                const secondaryAnalysisResults = (new EMACrossoverAnalysis(ema26129Config)).analyze(data, secondaryInterval);
                const secondarySignal = secondaryAnalysisResults.lastSignal === null ? 'Buy' : secondaryAnalysisResults.lastSignal.type;
                // if secondary signal is sell, then set initial signal to pending buy
                if(secondarySignal === 'Sell') {
                    this.initialSignal = secondarySignal;
                    // if current position has no shares then set buyOrSell to 'Pending Buy' otherwise set to 'Pending Sell'
                    if(this.selectedPosition.quantity === 0) {
                        this.buyOrSell = 'Pending Buy';
                    } else {
                        this.buyOrSell = 'Pending Sell';
                    }
            
                    priority = 2;
                } 
            } else {
                this.initialSignal = initialSignal;
                this.buyOrSell = 'Buy';
                priority = 2;
            }
        }
        else {
            this.initialSignal = initialSignal;
            this.buyOrSell = 'Sell';
        }

        if(!adequateTimeframe) {
            return;
        }
        let sendNotification = false;
        // if buyOrSell = 'buy' and currentPosition number of shares is less than target quantity then send notification
        if(this.buyOrSell === 'Buy' && this.selectedPosition.quantity < this.selectedPosition.target_quantity) {
            sendNotification = true;
        } 
        // if buyOrSell = 'sell' and currentPosition number of shares is greater than 0 then send notification
        else if(this.buyOrSell === 'Sell' && this.selectedPosition.quantity > 0) {
            sendNotification = true;
        }
        
        if(sendNotification) {
            this.sendPushoverNotification('Stock Alert', `Signal: ${this.buyOrSell} for ${this.selectedPosition.symbol}`, priority);
        }
    }

    async sendPushoverNotification(title, message, priority = 0, sound = 'cashregister', device = 'all', retry = 30, expire = 10800) {
        // Retrieve the token and user values from local storage
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');
      
        if (!token || !user) {
          console.error('Token or user is missing in local storage');
          return;
        }
      
        // Construct the API endpoint with query parameters
        const url = new URL('https://api.pushover.net/1/messages.json');
        url.searchParams.append('token', token);
        url.searchParams.append('user', user);
        url.searchParams.append('title', title);
        url.searchParams.append('message', message);
        url.searchParams.append('priority', 2);
        url.searchParams.append('sound', sound);
        url.searchParams.append('device', device);
        url.searchParams.append('retry', retry);
        url.searchParams.append('expire', expire);
      
        try {
          // Make an asynchronous HTTP request using fetch
          const response = await fetch(url, {
            method: 'POST', // Pushover API expects a POST request
          });
      
          // Check if the request was successful
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
      
          // Process the response (optional)
          const data = await response.json();
          console.log('Notification sent successfully:', data);
        } catch (error) {
          // Handle any errors that occurred during the request
          console.error('Error sending notification:', error);
        }
    }
      

    async saveStockData(secondaryId, resolution, from, to, responseJson) {
        const currentPosition = this.selectedPosition;
        if(this.selectedPosition) {
            // if(this.selectedPosition.secondary_id !== secondaryId) {
            //     await this.portfolioManager.addSecurity(secondaryId, currentPosition.symbol, currentPosition.symbol, 'stock');
            // }

            // Destructure properties a and b
            const { t, c } = responseJson

            let history = { t, c };

            // Reset data if symbol changes
            if(!this.currentSymbolData || this.currentSymbolData.currentSymbol !== currentPosition.symbol) {
                this.currentSymbolData = { currentSymbol: currentPosition.symbol, data: history};
            } else {
                // print out beginning timestamps for t and ending t 
                // console.log('from:', new Date(t[0] * 1000).toISOString());
                // console.log('to:', new Date(t[t.length - 1] * 1000).toISOString());

            
                // Otherwise append data if beginning timestamp is greater than current data's last timestamp
                if(t[0] > this.currentSymbolData.data.t[this.currentSymbolData.data.t.length - 1]) {
                    this.currentSymbolData.data = { t: [...this.currentSymbolData.data.t, ...t], c: [...this.currentSymbolData.data.c, ...c] };
                }
                // Otherwise prepend data if beginning timestamp is less than current data's first timestamp
                else if(t[0] < this.currentSymbolData.data.t[0]) { 
                    this.currentSymbolData.data = { t: [...t, ...this.currentSymbolData.data.t], c: [...c, ...this.currentSymbolData.data.c] };
                }
                // // print out beginning timestamps for t and ending t from currentSymbolData
                // console.log('from:', new Date(this.currentSymbolData.data.t[0] * 1000).toISOString());
                // console.log('to:', new Date(this.currentSymbolData.data.t[this.currentSymbolData.data.t.length - 1] * 1000).toISOString());

            }

            history = this.currentSymbolData.data;
            const timeSeries = history.t;
            const priceSeries = history.c;
            const finalTimestamp = timeSeries[timeSeries.length - 1];
            const currentTime = Math.floor(Date.now() / 1000);
            const diff = currentTime - finalTimestamp;

            //  print out beginning timestamps for t and ending t from currentSymbolData
            console.log('from:', new Date(timeSeries[0] * 1000).toISOString());
            console.log('to:', new Date(timeSeries[timeSeries.length - 1] * 1000).toISOString());
            console.log('price:', priceSeries[priceSeries.length - 1]);
            // await this.portfolioManager.addSecurityPriceHistory(currentPosition.security_id, resolution, history);
            // this.portfolioManager.addStockPriceHistory(securityId, history);
                        
            console.log('saved symbol: ' + this.currentSymbol + ' data: ', 'itemcount:'  + t.length, resolution)
            // analyze data if final timestamp is no more than 4 days old

            // only proceed if recent data is available
            if(diff < 345600) {  // in days - 4 days

                // only send notifications if more than 5 months of data
                const adequateTimeframe = currentTime - timeSeries[0] > 15552000;
                console.log('adequateTimeframe:', adequateTimeframe);
                if(adequateTimeframe) {
                    // get last price
                    const priceSeries = history.c;
                    const lastPrice = priceSeries[priceSeries.length - 1];
                    // show last price with two decimal places
                    currentPosition.current_price = lastPrice.toFixed(2);
                    // await this.portfolioManager.updatePosition(currentPosition.position_id, currentPosition.quantity, lastPrice, currentPosition.target_quantity);
                    this.analyzeData(history, adequateTimeframe);
                    this.selectedPosition = {...currentPosition};
                }
                if(this.selectedPosition.secondary_id !== secondaryId) {
                    await this.portfolioManager.addSecurity(secondaryId, currentPosition.symbol, currentPosition.symbol, 'stock', currentPosition.current_price);
                }
            }
        }
    }
    
    firstUpdated() {
        // add span with content 'hi' to div with class 'pane-legend-line pane-legend-wrap main'
        const container = this.shadowRoot.querySelector('#thegrid');
    
        this.portfolioGrid = new Handsontable(container, {
            data: [
                ['AAPL', 'Apple Computer', 180, 180, 1, '{}']
            ],
            colHeaders: ['Symbol', 'Name', 'Price', 'Value', 'Qty', 'Stats', 'Mute'],
            rowHeaders: true,
            height: 300,
            autoWrapRow: true,
            autoWrapCol: true,
            columns: [
                { data: 0, type: 'text' }, // Symbol
                { data: 1, type: 'text' }, // Name
                { data: 2, type: 'numeric', numericFormat: { pattern: '$0,0.00' } }, // Price
                { data: 3, type: 'numeric', numericFormat: { pattern: '$0,0.00' } }, // Value
                { data: 4, type: 'numeric' }, // Qty
                { data: 5, type: 'text' }, // Stats, assuming JSON data or similar, customize as needed
                {
                    data: 6,
                    type: "checkbox",
                    className: "htCenter"
                  },
            ],
            licenseKey: 'non-commercial-and-evaluation' // for non-commercial use only
        });

        this.openDialog();
    }
    

    updatePortfolioGrid() {
        const data = this.positions.map(p => {
            //  if current_price not set then set top purchase_price
            p.current_price = p.current_price || p.purchase_price;
            return [p.symbol, p.security_name, p.current_price, p.current_price * p.quantity, p.quantity, JSON.stringify(
                {}
            )];
        });
        this.portfolioGrid.updateData(data);
    }

    constructor() {

        super();
        this.portfolioGrid = null; // will contain reference to handsontable instance
        this.selectedPortfolioId = '';
        this.selectedPosition = {};
        this.portfolios = [];
        this.positions = [];
        this.ownerId = '59b880ab-0f59-4d7d-a8f7-515c82f2d8f9';
        this.portfolioManager = new PortfolioManagerService();
        this.currentSymbol = '';
        this.stockRotationTimeout = null;
        this.currentSymbolData = { data: { t: [], c: [] }, currentSymbol: ''};
        this.isCycling = false;
        this.currentTimeframe = '4h';
        this.availableTimeframes = [{timeframe: '4h', selector:'4 hour'},{ timeframe: '1D', selector: '1 day'}];
        this.dialogOpened = false;
  
        // Subscribe to the custom log event
        // XHREventDispatcher.addEventListener('xhrLogEvent', function(logDetail) {
        //     console.log('Logged Request:', logDetail);
        //     console.log('Url:', logDetail.url);
        // });

        this.interceptAndLogSpecificRequests();

        const parentWindow = window.parent;
        window.detectAngular = function() {
            console.log('detectAngular');
        }

        parentWindow.postMessage = function(message, targetOrigin, transfer) {
            // console.log('message:', message);
            // console.log('targetOrigin:', targetOrigin);
            // console.log('transfer:', transfer);
            // console.log('secondary_id:', message.addcurrentpairid);
        }

    }

    async connectedCallback() {
        super.connectedCallback();
        await this.getPortfolios();
    }

    // refactor portfolio list load logic into a method
    async getPortfolios() {
        this.portfolios = await this.portfolioManager.getPortfoliosByOwner(this.ownerId);
        // set timeframe
        await this.setTimeframe('4h');
        if (this.portfolios.length > 0) {
            this.selectedPortfolioId = this.portfolios[0].portfolio_id;
            await this.updatePositions();
        }
    }


    // cycle through positions in current portfolio - every 30 seconds
    async cyclePositions() {
        if(this.isCycling) {
            this.pauseRotation();
            this.isCycling = false;
        } else {
            this.isCycling = true;
            this.showNextPosition();
           // this.stockRotationTimeout = setTimeout(this.showNextPosition.bind(this), 15000);

        }
    }


    async pauseRotation() {
        clearInterval(this.stockRotationTimeout);
    }

    async handlePreviousClick() {
        this.pauseRotation();
        await this.showPreviousPosition();
    }

    async handleNextClick() {
        this.pauseRotation();   
        await this.showNextPosition();
    }

    async showPreviousPosition() {
        if (this.positions.length > 0) {
            const selectedPositionId = this.selectedPosition.position_id;
            const positionIndex = this.positions.findIndex(p => p.position_id === selectedPositionId);
            let previousPositionIndex = positionIndex - 1;
            if (previousPositionIndex < 0) {
                previousPositionIndex = this.positions.length - 1;
            }
            this.selectedPosition = this.positions[previousPositionIndex];
            // this.selectedPositionId = previousPosition.position_id;
            await this.setSymbol(this.selectedPosition.symbol);
        }
  
    }

    async showNextPosition() {
        if (this.positions.length > 0) {
            const selectedPositionId = this.selectedPosition.position_id;
            const positionIndex = this.positions.findIndex(p => p.position_id === selectedPositionId);
            let nextPositionIndex = positionIndex + 1;
            if (nextPositionIndex >= this.positions.length) {
                nextPositionIndex = 0;
                // await this.toggleTimeframe();
            }
            this.selectedPosition = this.positions[nextPositionIndex];
            // this.selectedPositionId = nextPosition.position_id;
            await this.setSymbol(this.selectedPosition.symbol);
        }
        if(this.isCycling) {
            this.stockRotationTimeout = setTimeout(this.showNextPosition.bind(this), 15000);
        } 
    }

    async _onPortfolioSelect(event) {
        this.selectedPortfolioId = event.target.value || '';
        await this.updatePositions();
    }

    _onPositionSelect(event) {
        this.pauseRotation();
        const selectedPositionId = event.target.value;
        this.selectedPosition = this.positions.find(p => p.position_id === selectedPositionId);
        // const symbol = this.positions.find(p => p.position_id === this.selectedPositionId).symbol;
        this.setSymbol(this.selectedPosition.symbol);
    }

    async buyShares() {
        const currentPosition = this.selectedPosition;
        const targetValue = prompt('Enter amount to buy:', 2500);
        // caculate target quantity = target amount / current price
        const targetQuantity =  Math.floor(targetValue / currentPosition.current_price);
        // update position with new target quantity
        await this.portfolioManager.updatePosition(currentPosition.position_id, targetQuantity, currentPosition.current_price, targetQuantity);
        // update selected position with new target quantity
        this.selectedPosition = {...currentPosition, quantity: targetQuantity, target_quantity: targetQuantity};
    }

    async sellShares() {
        const currentPosition = this.selectedPosition;
        const targetValue = 0;  // sell all shares
        const quantity =  0;
        const targetQuantity = Math.floor(currentPosition.target_amount / currentPosition.current_price);
        // update position with new target quantity
        await this.portfolioManager.updatePosition(currentPosition.position_id, quantity, currentPosition.current_price, targetQuantity);
        // update selected position with new target quantity
        this.selectedPosition = {...currentPosition, quantity: quantity , target_quantity: targetQuantity};
    }

    async updatePositions(currPositionId = null, curSymbol = null) {
        /* example position object
            {
            "position_id": "b5ec6c73-6762-422b-b05c-b20f1bdce21f",
            "security_id": "d023dd77-e484-41d7-87da-abb02c0a2c9d",
            "quantity": 60,
            "target_quantity": 60,
            "target_amount": 2500.00,
            "purchase_price": 20.68,
            "calculated_market_value": 0.00,
            "symbol": "CORN",
            "security_name": "CORN",
            "secondary_id": 44788
        }
        */
        let symbol = curSymbol || this.selectedPosition.symbol;
        let positionId = currPositionId || this.selectedPosition.position_id;
        // store current prices for each symbol in a dictionary
        const currentPrices = {};
        // get current prices for all symbols
        for (const position of this.positions) {
            currentPrices[position.symbol] = position.current_price;
        }

        this.positions = await this.portfolioManager.getPositionsByPortfolio(this.selectedPortfolioId);

        // update current prices for each symbol
        for (const position of this.positions) {
            position.current_price = currentPrices[position.symbol] || 0;
        }

        if (!positionId && this.positions.length > 0) {
            positionId = this.positions[0].position_id;
            symbol = this.positions[0].symbol;
        }
        this.selectedPosition = this.positions.find(p => p.position_id === positionId) || {};

        this.updatePortfolioGrid();

        //this.selectedPositionId = positionId;
        await this.setSymbol(symbol);
  
    }

    isCurrentDomainInvesting() {
        // Extract the protocol and hostname from the current URL
        const currentDomain = window.location.protocol + '//' + window.location.hostname;
    
        // Check if the current domain matches the target domain
        return currentDomain === 'https://tvc-invdn-com.investing.com';
    }

    getContentDocument() {
        const iframe = document.body.querySelectorAll("iframe")[0];
        if (iframe) {
            return iframe.contentWindow.document;
        }
        return null;
    }

    async toggleTimeframe() {
        // get index of current timeframe
        const currentIndex = this.availableTimeframes.findIndex(tf => tf.timeframe === this.currentTimeframe);
        // get next timeframe
        let nextIndex = currentIndex + 1;
        if(nextIndex >= this.availableTimeframes.length) {
            nextIndex = 0;
        }
        const nextTimeframe = this.availableTimeframes[nextIndex];
        // set timeframe
        await this.setTimeframe(nextTimeframe.timeframe);
        Promise.resolve();
    }

    async setTimeframe(timeframe){
        // get reference to timeframe selector
        const timeframeDef = this.availableTimeframes.find(tf => tf.timeframe === timeframe);


        // get a reference <span class="apply-common-tooltip selected">4h</span> inside <div class="intervals-container"> ensure text content matches timeframe
        var timeframeSelectedElement = this.getContentDocument().querySelector(`div.intervals-container span.apply-common-tooltip.selected`);
        if(!timeframeSelectedElement || timeframeSelectedElement.textContent !== timeframeDef.timeframe) {
            // pop open the timeframe selector
            this.getContentDocument().querySelector("div.intervals-container div.tv-caret").click();
            // wait for the timeframe selector to open
            await this.timeoutResolver(2000);
            // get a reference to the select option with matching timeframe display 
            // select item looks like <span class="item active">4 hour</span> inside div with class charts-popup-list
            let timeframeRef;
            this.getContentDocument().querySelectorAll('div.charts-popup-list span.item').forEach((item) => {
                if (item.textContent.includes(timeframeDef.selector)) {
                    timeframeRef = item;
                }
            });
            if(timeframeRef) {
                timeframeRef.click();
            }
            // wait 2 seconds
            await this.timeoutResolver(2000);
        }
        this.currentTimeframe = timeframe;
        Promise.resolve();
    
    }

    async setSymbol(symbol) {

        await this.timeoutResolver(2000);

        this.currentSymbol = symbol;

        // get a reference
        var symbolRef = this.getContentDocument().querySelector(".symbol-edit");

        if (symbolRef) {


            let fevent = new MouseEvent("focus", {
                view: window,
                bubbles: true,
                cancelable: true,
            });

            symbolRef.dispatchEvent(fevent);
            await this.timeoutResolver(2000);

            symbolRef.value = "";
            let nEvent = new Event("input", {
                bubbles: true,
                cancelable: true,
            });

            symbolRef.dispatchEvent(nEvent);

            await this.timeoutResolver(2000);
            symbolRef.value = symbol;
            symbolRef.dispatchEvent(nEvent);

            await this.timeoutResolver(2000);

            let body = symbolRef.closest("body");
            // pick random object to click
            body.querySelector(".header-group-undo-redo").click();

            await this.timeoutResolver(2000);
            if (body.querySelector("[data-item-ticker]")) {
                body.querySelector("[data-item-ticker]").click();

            }
            symbolRef.value = "";
            let bEvent = new MouseEvent("blur", {
                view: window,
                bubbles: true,
                cancelable: true,
            });
            symbolRef.dispatchEvent(bEvent);
        }
    }

    async timeoutResolver(ms) {
        return new Promise((resolve, reject) => {
            setTimeout(function () {
                resolve(true);
            }, ms);
        });
    }

    async addPosition() {

        // prompt for symbol
        const symbol = prompt('Enter symbol:');
        if (!symbol) {
            return;
        }

        let default_secondaryId = '';
        let default_targetAmount = 2500.00;
        let default_currentShares = 0;
        let current_price = 1;

        // see if an existing position already exists
        const existingPosition = this.positions.find(p => p.symbol === symbol);
        if (existingPosition) {
            default_secondaryId = existingPosition.secondary_id;
            default_targetAmount = Math.floor(existingPosition.target_quantity * existingPosition.purchase_price);
            default_currentShares = existingPosition.quantity;
            current_price = existingPosition.current_price;
        } else {
            // prompt for current price
            current_price = prompt('Enter current price:', 1);
        }

        // p_portfolio_id uuid, 
        // p_security_id uuid, 
        // p_initial_quantity integer, 
        // p_purchase_price numeric, 
        // p_target_quantity integer)

        // prompt for secondary id
        const secondaryId = prompt('Enter secondary id:', default_secondaryId);
        if (!secondaryId) {
            return;
        }

        // prompt for amount
        const targetAmount = prompt('Enter Target Amount$:', default_targetAmount);
        if (!targetAmount) {
            return;
        }

        let currentAmount = prompt('Enter Current Amount$:', default_targetAmount);
        if (!currentAmount) {
            currentAmount = 0;
        }

        // // prompt for current price
        // const currentPrice = prompt('Enter current price:', default_currentPrice);
        // if (!currentPrice) {
        //     alert('must enter current price');
        //     return;
        // }

  

        // //  prompt for current owned shared
        // const currentShares = prompt('Enter current shares:', default_currentShares);
        // if (!currentShares) {
        //     alert('must enter current shares');
        //     return;
        // }    

        // calculate target quantity - use floor to round down to nearest whole number
        const targetQuantity = Math.floor(targetAmount / current_price);

        const currentQuantity = Math.floor(currentAmount / current_price);

        // 

        const securityId = await this.portfolioManager.addSecurity(secondaryId, symbol, symbol, 'stock');


        // add position async addPosition(portfolioId, securityId, initialQuantity, purchasePrice, targetQuantity = 0) 
        const newPositionId = await this.portfolioManager.addPosition(this.selectedPortfolioId, securityId, currentQuantity, current_price, targetQuantity, targetAmount);
        await this.updatePositions(newPositionId, symbol);
        // this.selectedPositionId = newPositionId;
        // // set symbol
        // await this.setSymbol(symbol);
    }

    openDialog() {
        const dialog = this.shadowRoot.querySelector('dialog');
        dialog.showModal();
        this.dialogOpened = true;
    }

    closeDialog() {
        const dialog = this.shadowRoot.querySelector('dialog');
        dialog.close();
        this.dialogOpened = false;
    }

    renderDialog() {
        return html`
            <dialog>
                <div class="draggable-header">
                    <div style="flex:1">Current Portfolio</div>
                    <button style="width:60px;" @click="${this.updatePositions}">Refresh</button>
                    <button style="width:60px;" @click="${this.closeDialog}">Close</button>
                </div>
                <div>    
                    <div id="thegrid" style=" width:100%;height:400px;"></div>
                </div>
                <div class="footer"><button>Save</button></div>
            </dialog>
        `;
    }
    

    renderPortfolioSelect() {
        return html`
            <div style="width:160px">
                <label for="portfolio-select">Portfolio:</label>
                <select id="portfolio-select" @change="${this._onPortfolioSelect}">
                    ${this.portfolios.map(portfolio => html`
                        <option value="${portfolio.portfolio_id}" ?selected="${this.selectedPortfolioId === portfolio.portfolio_id}">
                            ${portfolio.portfolio_name}
                        </option>
                    `)}
                </select>
            </div>
        `;
    }

    renderPositionSelect() {
        console.log('renderPositionSelect');
        return html`
            <div style="width:140px;">
                <label for="position-select">Position:</label>
                <select id="position-select" @change="${this._onPositionSelect}">
                    ${this.positions.map(position => html`
                        <option value="${position.position_id}" ?selected="${this.selectedPosition && this.selectedPosition.position_id === position.position_id}">
                            ${position.symbol}
                        </option>
                    `)}
                </select>
            </div>
        `;
    }

    render() {
        return html`
           <!-- display horizontal row of portfolio and position selectors -->
           <div style="display: flex;position:absolute;left:750px;top:10px;">
                ${this.renderPortfolioSelect()}
                ${this.renderPositionSelect()}
                <div style="width:60px; white-space: nowrap;">
                <!-- button to add a new position to current portfolio -->
                    <button @click="${this.addPosition}">+</button>
                    <!-- button to show portfolio dialog -->
                    <button @click="${this.openDialog}">P</button>
                </div>
                ${this.selectedPosition ? html`
                    <div style="width:150px;">
                        <span>Shares: ${this.selectedPosition.quantity}/${this.selectedPosition.target_quantity}</span>
                        <span></span>
                    </div>
                ` : ''}
                <div style="flex:1">
                <!-- back button to naviate to previous position -->
                    <button @click="${this.handlePreviousClick}"><<</button>
                    <button @click="${this.cyclePositions}"s>Play</button>
                    <button @click="${this.handleNextClick}">>></button>
                </div>
            </div>
            <div style="position:absolute;left:950px;top:45px;">
              <!-- If buy then color green, if sell then color red -->
              <span style="font-size:20px;font-weight:bold;color:${this.buyOrSell === 'Buy' ? 'green' : 'red'}">${this.buyOrSell}: ${this.selectedPosition.current_price}</span>
              <span>Shares: ${this.selectedPosition.quantity}/${this.selectedPosition.target_quantity}</span>
              <span style="margin-left:20px;">Value: ${(this.selectedPosition.quantity * (this.selectedPosition.current_price || 0)).toFixed(0)}/ ${(this.selectedPosition.target_quantity * (this.selectedPosition.current_price || 0)).toFixed(0)}</span>
              <span style="margin-left:20px;"><button  @click="${this.buyShares}">Buy</button><button  @click="${this.sellShares}">Sell</button></span>
            </div>



            ${this.renderDialog()}
            
        `;
    }

}

customElements.define('portfolio-widget', PortfolioWidget);