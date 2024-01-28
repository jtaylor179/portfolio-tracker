import { LitElement, html } from 'https://cdn.jsdelivr.net/gh/lit/dist@2/core/lit-core.min.js';
import { XHREventDispatcher } from './xhr-intercept.js';
import { PortfolioManagerService } from './portfolio-service.js';

class PortfolioWidget extends LitElement {
    static get properties() {
        return {
            selectedPortfolioId: { type: String },
            // selectedPositionId: { type: String },
            selectedPosition: { type: Object },
            portfolios: { type: Array },
            positions: { type: Array },
            ownerId: { type: String }
        };
    }

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
    
        if(secondaryId && resolution && from && to) {
            console.log(`Request detected for symbol ${secondaryId} with resolution ${resolution}, from ${from} to ${to}`);
            this.saveStockData(parseInt(secondaryId), resolution, from, to, responseJson);
        }
    }

    async saveStockData(secondaryId, resolution, from, to, responseJson) {
        const currentPosition = this.selectedPosition;
        if(this.selectedPosition) {
            if(this.selectedPosition.secondary_id !== secondaryId) {
                await this.portfolioManager.addSecurity(secondaryId, currentPosition.symbol, currentPosition.symbol, 'stock');
            }

            // Destructure properties a and b
            const { t, c } = responseJson

            // Create a new object with just a and b
            const history = { t, c };
            await this.portfolioManager.addSecurityPriceHistory(currentPosition.security_id, resolution, history);
            // this.portfolioManager.addStockPriceHistory(securityId, history);
        }
    }
    

    constructor() {
        super();
        
        this.selectedPortfolioId = '';
        this.selectedPosition = null;
        this.portfolios = [];
        this.positions = [];
        this.ownerId = '59b880ab-0f59-4d7d-a8f7-515c82f2d8f9';
        this.portfolioManager = new PortfolioManagerService();
        this.currentSymbol = '';
        this.stockRotationTimeout = null;
        this.isCycling = false;
        this.currentTimeframe = '4h';
        this.availableTimeframes = [{timeframe: '4h', selector:'4 hour'}, {timeframe:'2h', selector:'2 hour'}, { timeframe: '1D', selector: '1 day'}];
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
                await this.toggleTimeframe();
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

    async updatePositions(currPositionId = null, curSymbol = null) {
        let symbol = curSymbol;
        let positionId = currPositionId;
        this.positions = await this.portfolioManager.getPositionsByPortfolio(this.selectedPortfolioId);
        if (!positionId && this.positions.length > 0) {
            positionId = this.positions[0].position_id;
            symbol = this.positions[0].symbol;
        }
        this.selectedPosition = this.positions.find(p => p.position_id === positionId);

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

        // prompt for secondary id
        const secondaryId = prompt('Enter secondary id:');
        if (!secondaryId) {
            return;
        }

        const securityId = await this.portfolioManager.addSecurity(secondaryId, symbol, symbol, 'stock');


        // add position async addPosition(portfolioId, securityId, initialQuantity, purchasePrice, targetQuantity = 0) 
        const newPositionId = await this.portfolioManager.addPosition(this.selectedPortfolioId, securityId, 0, 0, 0);
        await this.updatePositions(newPositionId, symbol);
        // this.selectedPositionId = newPositionId;
        // // set symbol
        // await this.setSymbol(symbol);
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
                <div style="width:30px;">
                <!-- button to add a new position to current portfolio -->
                    <button @click="${this.addPosition}">+</button>
                </div>
                <div style="width:150px;">
                    <span>Shares: 0</span>
                    ${this.selectedPosition && this.selectedPosition.weekly_flag === 1 ? html`<span style="color:blue;font-weight:bold;">W</span>` : ''}
                    ${this.selectedPosition && this.selectedPosition.daily_flag === 1 ? html`<span style="color:blue;font-weight:bold;">D</span>` : ''}
                    ${this.selectedPosition && this.selectedPosition.four_hour_flag === 1 ? html`<span style="color:blue;font-weight:bold;">4H</span>` : ''}
                    <span></span>
                </div>
                <div style="flex:1">
                <!-- back button to naviate to previous position -->
                    <button @click="${this.handlePreviousClick}"><<</button>
                    <button @click="${this.cyclePositions}"s>Play</button>
                    <button @click="${this.handleNextClick}">>></button>
                </div>

            </div>
        `;
    }

}

customElements.define('portfolio-widget', PortfolioWidget);