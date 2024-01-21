import { LitElement, html } from 'https://cdn.jsdelivr.net/gh/lit/dist@2/core/lit-core.min.js';
import { XHREventDispatcher } from './xhr-intercept.js';
import { PortfolioManagerService } from './portfolio-service.js';

class PortfolioWidget extends LitElement {
    static get properties() {
        return {
            selectedPortfolioId: { type: String },
            selectedPositionId: { type: String },
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
                watcher: this.analyzeRequest,
                urlPattern: /tvc4\.investing\.com\/615bca0a5a51af775ac1b774a5323123\/1635741342\/1\/1\/8\/history\?symbol=\d+&resolution=\w+&from=\d+&to=\d+/,
                method: 'GET'
            }
        ]);
    }
    
    analyzeRequest(config, response) {
        debugger;
        const url = new URL(response.url);
        const symbol = url.searchParams.get('symbol');
        const resolution = url.searchParams.get('resolution');
        const from = url.searchParams.get('from');
        const to = url.searchParams.get('to');
        const responseText = response.responseText;
        const responseJson = JSON.parse(responseText);
    
        if(symbol && resolution && from && to) {
            console.log(`Request detected for symbol ${symbol} with resolution ${resolution}, from ${from} to ${to}`);
        }
    }
    

    constructor() {
        super();
        this.selectedPortfolioId = '';
        this.selectedPositionId = '';
        this.portfolios = [];
        this.positions = [];
        this.ownerId = '59b880ab-0f59-4d7d-a8f7-515c82f2d8f9';
        this.portfolioManager = new PortfolioManagerService();
        this.currentSymbol = '';
        this.stockRotationTimeout = null;
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
        if (this.portfolios.length > 0) {
            this.selectedPortfolioId = this.portfolios[0].portfolio_id;
            await this.updatePositions();
        }
    }

    // cycle through positions in current portfolio - every 30 seconds
    async cyclePositions() {
        this.showNextPosition();
        this.stockRotationTimeout = setTimeout(this.showNextPosition.bind(this), 30000);
    }

    async pauseRotation() {
        clearTimeout(this.stockRotationTimeout);
    }

    async showPreviousPosition() {
        this.pauseRotation();
        if (this.positions.length > 0) {
            const positionIndex = this.positions.findIndex(p => p.position_id === this.selectedPositionId);
            let previousPositionIndex = positionIndex - 1;
            if (previousPositionIndex < 0) {
                previousPositionIndex = this.positions.length - 1;
            }
            const previousPosition = this.positions[previousPositionIndex];
            this.selectedPositionId = previousPosition.position_id;
            await this.setSymbol(previousPosition.symbol);
        }
    }

    async showNextPosition() {
        this.pauseRotation();
        if (this.positions.length > 0) {
            const positionIndex = this.positions.findIndex(p => p.position_id === this.selectedPositionId);
            let nextPositionIndex = positionIndex + 1;
            if (nextPositionIndex >= this.positions.length) {
                nextPositionIndex = 0;
            }
            const nextPosition = this.positions[nextPositionIndex];
            this.selectedPositionId = nextPosition.position_id;
            await this.setSymbol(nextPosition.symbol);
        }
    }




    async _onPortfolioSelect(event) {
        this.selectedPortfolioId = event.target.value || '';
        await this.updatePositions();
    }

    _onPositionSelect(event) {
        this.selectedPositionId = event.target.value;
        const symbol = this.positions.find(p => p.position_id === this.selectedPositionId).symbol;
        this.setSymbol(symbol);
    }

    async updatePositions(currPositionId = null, curSymbol = null) {
        let symbol = curSymbol;
        let positionId = currPositionId;
        this.positions = await this.portfolioManager.getPositionsByPortfolio(this.selectedPortfolioId);
        if (!positionId && this.positions.length > 0) {
            positionId = this.positions[0].position_id;
            symbol = this.positions[0].symbol;
        }

        this.selectedPositionId = positionId;
        await this.setSymbol(symbol);
    }

    isCurrentDomainInvesting() {
        // Extract the protocol and hostname from the current URL
        const currentDomain = window.location.protocol + '//' + window.location.hostname;
    
        // Check if the current domain matches the target domain
        return currentDomain === 'https://tvc-invdn-com.investing.com';
    }

    async setSymbol(symbol) {

        await this.timeoutResolver(2000);

        this.currentSymbol = symbol;

        // get a reference
        var symbolRef = document.body
            .querySelectorAll("iframe")[0]
            .contentWindow.document.querySelector(".symbol-edit");

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
            <div style="width:180px">
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
        return html`
            <div style="width:140px;">
                <label for="position-select">Position:</label>
                <select id="position-select" @change="${this._onPositionSelect}">
                    ${this.positions.map(position => html`
                        <option value="${position.position_id}" ?selected="${this.selectedPositionId === position.position_id}">
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
           <div style="display: flex;position:absolute;left:800px;top:10px;">
                ${this.renderPortfolioSelect()}
                ${this.renderPositionSelect()}
                <div style="width:150px;">
                <!-- button to add a new position to current portfolio -->
                    <button @click="${this.addPosition}">Add Position</button>
                </div>
                <div style="flex:1">
                <!-- back button to naviate to previous position -->
                    <button @click="${this.showPreviousPosition}"><<</button>
                    <button @click="${this.cyclePositions}"s>Play</button>
                    <button @click="${this.showNextPosition}">>></button>
                </div>

            </div>
        `;
    }

}

customElements.define('portfolio-widget', PortfolioWidget);