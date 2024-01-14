// my-module.js
import { LitElement, html } from 'https://cdn.jsdelivr.net/gh/lit/dist@2/core/lit-core.min.js';
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'
import "https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.8.0/cdn/components/select/select.js";
import "https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.8.0/cdn/components/option/option.js";
import "https://cdn.jsdelivr.net/npm/smart-webcomponents/source/modules/smart.grid.js";


// Define custom element
class MyElement extends LitElement {

    renderGrid() {
        
    }

    async callInsertStockPriceHistory(supabase, stockId, history) {
        const { data, error } = await supabase
            .rpc('insert_stock_price_history', { _stock_id: stockId, _history: history });
    
        if (error) {
            console.error('Error calling insert_stock_price_history:', error);
        } else {
            console.log('Function call successful:', data);
        }
    }
    
      // Example of an async function to get portfolios by owner id
    async getPortfolios(client, owner_id) {
        const schema = 'portfolio_manager';
        const fn_portfolios = 'get_portfolios_by_owner';
        const { data: portfolios, error: portfoliosError } = await client.rpc(fn_portfolios, { p_owner_id: owner_id });
    
        if (portfoliosError) {
            console.error('Error fetching portfolios:', portfoliosError);
            return;
        }
    
        console.log('Portfolios:', portfolios);
    }
    

    //  On first updated
    async firstUpdated() {

        const supabase = createClient("https://xjvhgjupwroavlnkzkze.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhqdmhnanVwd3JvYXZsbmt6a3plIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY3Mjg0MTMzMCwiZXhwIjoxOTg4NDE3MzMwfQ.JupOzJYALLMxcq-066pvRT7cQwo7RUgeOtUWG9ybbpc")

        console.log('Supabase Instance: ', supabase);
        
        const owner_id = '61d52ab0-2994-4d90-be8d-1185fa5060ba';
        
        
      
        // Call the function
        this.getPortfolios(supabase, owner_id);
        

        return;
        /*
        // Initialize client
        const supabase = createClient("https://xjvhgjupwroavlnkzkze.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhqdmhnanVwd3JvYXZsbmt6a3plIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY3Mjg0MTMzMCwiZXhwIjoxOTg4NDE3MzMwfQ.JupOzJYALLMxcq-066pvRT7cQwo7RUgeOtUWG9ybbpc")

        console.log('Supabase Instance: ', supabase)

        const owner_id = '61d52ab0-2994-4d90-be8d-1185fa5060ba'
        const fn_portfolios = 'get_portfolios_by_owner_id'

        // get portfolios by owner id
        const { data: portfolios, error: portfoliosError } = await supabase
            .rpc(fn_portfolios, { _owner_id: owner_id });


        // Get reference to stocks table
        const stockTable = supabase.from('stock')

        // Example query to select stocks
        try {
            let { data: stocks, error: selectError } = await stockTable
                .select()
                .order('ticker');

            // Log stocks
            console.log(stocks)

            if (selectError) {
                throw selectError;
            }

            let { data: positions, error: selectError2 } = await supabase.rpc('get_stock_positions');


            // Add MSFT Stock to table
            const { data, error: insertError } = await stockTable
                .insert([
                    { ticker: 'MSFT', name: 'Microsoft' },
                ]);

            if (insertError) {
                if (insertError.code === "23505") {
                    alert('Conflict error: The data you are trying to insert already exists.');
                } else {
                    console.error('An unexpected error occurred during insert:', insertError);
                }
            } else {
                console.log('Data: ', data);
            }

            // Example usage
            const stockId = 1;
            const history = { price: 100, date: '2023-01-01' };

            this.callInsertStockPriceHistory(supabase, stockId, history);
        } catch (error) {
            console.error('An error occurred:', error);
        }




        this.renderGrid();
        */
    }

    render() {
        return html`
            <div style="display: flex; flex-direction: row;">
                <div style="width:200px; padding: 10px;">
                    <sl-select label="Select one">
                        <sl-option value="option-1">Option 1</sl-option>
                        <sl-option value="option-2">Option 2</sl-option>
                        <sl-option value="option-3">Option 3</sl-option>
                    </sl-select>

                </div>
                <div style="flex:1; padding: 10px;">
                    <h2> AAPL </h2>
                </div>
                <sl-button-group label="Alignment">
                    <sl-button size="large">Right</sl-button>
                </sl-button-group>
            </div>
            <div>
                <sl-details summary="Toggle Me">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna
                aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                </sl-details>
            </div>
            <div>
            <smart-grid id="grid"></smart-grid>
            </div>
            

    `;
    }

}
customElements.define('my-element', MyElement);

export function run() {
    console.log('Hello');
}