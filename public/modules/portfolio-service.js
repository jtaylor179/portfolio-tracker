import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

export class PortfolioManagerService {

    constructor() {
        const supabaseClient = createClient("https://xjvhgjupwroavlnkzkze.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhqdmhnanVwd3JvYXZsbmt6a3plIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY3Mjg0MTMzMCwiZXhwIjoxOTg4NDE3MzMwfQ.JupOzJYALLMxcq-066pvRT7cQwo7RUgeOtUWG9ybbpc")

        console.log('Supabase Instance: ', supabaseClient);


        this.supabase = supabaseClient;
    }

    async addPortfolio(ownerId, portfolioName, fundsAvailable) {
        const { data, error } = await this.supabase
            .rpc('add_portfolio', { p_owner_id: ownerId, p_portfolio_name: portfolioName, p_funds_available: fundsAvailable });

        if (error) throw error;
        return data;
    }

    async updatePortfolio(portfolioId, fundsAvailable) {
        const { data, error } = await this.supabase
            .rpc('update_portfolio', { p_portfolio_id: portfolioId, p_funds_available: fundsAvailable });

        if (error) throw error;
        return data;
    }

    async addSecurity(_secondary_id, _symbol, _security_name, _security_type = 'stock', _current_price = 0.00) {
        const { data: security_id, error } = await this.supabase
            .rpc('add_security', {
                _secondary_id: _secondary_id,
                _symbol: _symbol,
                _security_name: _security_name,
                _current_price: _current_price,
                _security_type: _security_type
            });

        if (error) throw error;
        return security_id;
    }

    async getPortfoliosByOwner(ownerId) {
        const { data, error } = await this.supabase
            .rpc('get_portfolios_by_owner', { p_owner_id: ownerId });

        if (error) throw error;
        return data;
    }

    async getPositionsByPortfolio(portfolioId) {
        const { data, error } = await this.supabase
            .rpc('get_positions_by_portfolio', { p_portfolio_id: portfolioId });

        if (error) throw error;
        return data;
    }

    async addTransaction(portfolioId, securityId, quantityChange, purchasePrice, targetQuantity = null) {
        const { data, error } = await this.supabase
            .rpc('add_transaction', {
                p_portfolio_id: portfolioId,
                p_security_id: securityId,
                p_quantity_change: quantityChange,
                p_purchase_price: purchasePrice,
                p_target_quantity: targetQuantity
            });

        if (error) throw error;
        return data;
    }

    async removePositionAndTransactions(positionId) {
        const { data, error } = await this.supabase
            .rpc('remove_position_and_transactions', { p_position_id: positionId });

        if (error) throw error;
        return data;
    }

    async clearTransactions(portfolioId, securityId) {
        const { data, error } = await this.supabase
            .rpc('clear_transactions', { p_portfolio_id: portfolioId, p_security_id: securityId });

        if (error) throw error;
        return data;
    }

    async updateSecurityPrice(securityId, newPrice) {
        const { data, error } = await this.supabase
            .rpc('update_security_price', { p_security_id: securityId, p_new_price: newPrice });

        if (error) throw error;
        return data;
    }



    async addPortfolioOwner(ownerName) {
        const { data, error } = await this.supabase
            .rpc('add_portfolio_owner', { p_owner_name: ownerName });

        if (error) throw error;
        return data;
    }

    // new db function to call public.add_security_price_history(p_symbol text, p_timeframe char varying,  p_metrics json)
    // CREATE OR REPLACE FUNCTION public.add_security_price_history(security_id integer, timeframe varchar, _history json)

//     s
// : 
// "Searched for the function public.add_security_price_history with parameters p_metrics, p_symbol, p_timeframe or with a single unnamed json/jsonb parameter, but no matches were found in the schema cache."
// hint
// : 
// "Perhaps you meant to call the function public.add_security_price_history(p_history, p_security_id, p_timeframe)"
// message
// : 
// "Could not find the function public.add_security_price_history(p_metrics, p_symbol, p_timeframe) in the schema cache"


    async addSecurityPriceHistory(securityId, timeframe, history) {
        const { data, error } = await this.supabase
            .rpc('add_security_price_history', {
                p_security_id: securityId,
                p_timeframe: timeframe,
                p_history: history
            });

        if (error) {
            console.error('Error calling function:', error);
            return null;
        }

        return data;
    }



    /* 


let { data, error } = await supabase
  .rpc('add_security_price_history', {
    p_metrics, 
    p_symbol, 
    p_timeframe
  })
if (error) console.error(error)
else console.log(data)


CREATE OR REPLACE FUNCTION public.add_position(p_portfolio_id uuid, p_security_id uuid, p_initial_quantity integer, p_purchase_price numeric, p_target_quantity integer)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- Insert a new position into the position table
    INSERT INTO portfolio_manager.position (portfolio_id, security_id, quantity, purchase_price, target_quantity)
    VALUES (p_portfolio_id, p_security_id, p_initial_quantity, p_purchase_price, p_target_quantity);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.add_position(
    p_portfolio_id uuid,
    p_security_id uuid,
    p_initial_quantity int,
    p_purchase_price numeric,
    p_target_quantity int
)   
RETURNS uuid
LANGUAGE plpgsql
AS $function$
DECLARE
    v_new_position_id uuid;
BEGIN
    INSERT INTO portfolio_manager.position (portfolio_id, security_id, quantity, purchase_price, target_quantity)
    VALUES (p_portfolio_id, p_security_id, p_initial_quantity, p_purchase_price, p_target_quantity)
    RETURNING position_id INTO v_new_position_id;

    RETURN v_new_position_id;
END;
$function$;
*/

    async addPosition(portfolioId, securityId, initialQuantity, purchasePrice, targetQuantity = 0, targetAmount = 0) {
        const { data, error } = await this.supabase
            .rpc('add_position', {
                p_portfolio_id: portfolioId,
                p_security_id: securityId,
                p_initial_quantity: initialQuantity,
                p_purchase_price: purchasePrice,
                p_target_quantity: targetQuantity,
                p_target_amount: targetAmount
            });

        if (error) throw error;
        return data;
    }

    async updatePosition(positionId, newQuantity, newPurchasePrice, newTargetQuantity, newTargetAmount) {
        const { data, error } = await this.supabase
            .rpc('update_position', {
                p_position_id: positionId,
                p_new_quantity: newQuantity,
                p_new_purchase_price: newPurchasePrice,
                p_new_target_quantity: newTargetQuantity,
                p_new_target_amount: newTargetAmount
            });

        if (error) throw error;
        return data;
    }

    /* the following http call returns a json object with the following structure:
    {"name":"MELI","exchange-traded":"NASDAQ","exchange-listed":"NASDAQ ","timezone":"America\/New_York","minmov":1,"minmov2":0,"pricescale":100,"pointvalue":1,"has_intraday":true,"has_no_volume":false,"volume_precision":3,"ticker":"16599","description":"MercadoLibre Inc, United States","type":"Stock","has_daily":true,"has_weekly_and_monthly":true,"supported_resolutions":["1","5","15","30","60","300","D","W","M","45","120","240"],"intraday_multipliers":["1","5","15","30","60","300"],"session":"2;0930-1600:23456","data_status":"streaming"}
    The url format is: https://tvc4.investing.com/615bca0a5a51af775ac1b774a5323123/1635741342/1/1/8/symbols?symbol=NASDAQ%20%3AMELI

    */
    async getSecondarySecurityId(symbol) {

    }
}

// // Usage Example
// const supabaseUrl = 'https://your-supabase-url.supabase.co';
// const supabaseKey = 'your-supabase-key';
// const supabase = createClient(supabaseUrl, supabaseKey);

// const pmService = new PortfolioManagerService(supabase);

// // Example call
// pmService.addPortfolio('owner-uuid', 'My New Portfolio', 1000)
//     .then(portfolio => console.log('New Portfolio:', portfolio))
//     .catch(error => console.error('Error:', error));
