import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

export class PortfolioManagerService {
    constructor(supabaseClient) {
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


    async updatePosition(positionId, newQuantity, newPurchasePrice, newTargetQuantity) {
        const { data, error } = await this.supabase
            .rpc('update_position', {
                p_position_id: positionId,
                p_new_quantity: newQuantity,
                p_new_purchase_price: newPurchasePrice,
                p_new_target_quantity: newTargetQuantity
            });
    
        if (error) throw error;
        return data;
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
