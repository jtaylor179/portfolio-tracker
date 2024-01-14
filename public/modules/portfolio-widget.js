import { LitElement, html } from 'https://cdn.jsdelivr.net/gh/lit/dist@2/core/lit-core.min.js';
import { XHREventDispatcher } from './xhr-intercept.js';
import { PortfolioManagerService } from './portfolio-service.js';

class PortfolioWidget extends LitElement {
    static get properties() {
        return {
            selectedPortfolioId: { type: String }
        };
    }

    constructor() {
        super();
        this.selectedPortfolioId = '';
        this.portfolios = [];
        this.ownerId = '59b880ab-0f59-4d7d-a8f7-515c82f2d8f9';
    }

    async connectedCallback() {
        super.connectedCallback();
        const portfolioManager = new PortfolioManagerService();
        this.portfolios = await portfolioManager.getPortfoliosByOwner(this.ownerId);
        if (this.portfolios.length > 0) {
            this.selectedPortfolioId = this.portfolios[0].portfolio_id;
        }
    }

    render() {
        return html`
            <label for="portfolio-select">Select Portfolio:</label>
            <select id="portfolio-select" @change="${this._onPortfolioSelect}">
                ${this.portfolios.map(portfolio => html`
                    <option value="${portfolio.portfolio_id}" ?selected="${this.selectedPortfolioId === portfolio.portfolio_id}">
                        ${portfolio.portfolio_name}
                    </option>
                `)}
            </select>
        `;
    }

    _onPortfolioSelect(event) {
        this.selectedPortfolioId = event.target.value;
    }
}

customElements.define('portfolio-widget', PortfolioWidget);