import {LitElement, html} from 'https://cdn.jsdelivr.net/gh/lit/dist@2/core/lit-core.min.js';
import { XHREventDispatcher } from './xhr-intercept.js';
import { PortfolioManagerService } from './portfolio-service.js';


// Define custom element
class PortfolioWidget extends LitElement {

    // Define properties
    static get properties() {
        return {
            name: { type: String }
        };
    }

    // Initialize properties
    constructor() {
        super();
        this.name = 'World';
    }

    // Define a template
    render() {
        return html`<p>Hello, ${this.name}!</p>`;
    }
}

// Register the element with the browser
customElements.define('portfolio-widget', PortfolioWidget);



// // Create an instance of the element
// const myElement = new MyElement();
// // set name property to 'Everyone'
// myElement.name = 'Everyone';

// // Add the element to the DOM
// document.body.appendChild(myElement);