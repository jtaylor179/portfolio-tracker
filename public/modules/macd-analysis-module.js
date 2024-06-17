// MACDAnalysisModule.js
// import { MACD, Big, EMA } from './trading-signals.js';

import { MACD, Big, EMA } from 'https://esm.run/trading-signals';


export class MACDAnalysis {
    constructor(macdConfig) {
        // // Define the MACD configuration with EMA indicators
        // const macdConfig = {
        //     indicator: EMA, // Use the EMA class for MACD calculation
        //     longInterval: 26, // Typical value for long interval
        //     shortInterval: 12, // Typical value for short interval
        //     signalInterval: 9 // Typical value for signal line interval
        // };

        // Initialize MACD with typical settings
        this.macdIndicator = new MACD(macdConfig);
        this.signalHistory = [];
        this.lastSignal = { type: null, timestamp: null };
    }
    analyze(data) {
        const timestamps = data.t; // Array of timestamps
        const closingPrices = data.c; // Array of closing prices
        let previousHistogram = null; // Ensure this is correctly compared when used

        closingPrices.forEach((price, index) => {
            this.macdIndicator.update(new Big(price));

            if (this.macdIndicator.isStable) {
                const result = this.macdIndicator.getResult();
                const histogram = result.histogram; // This should already be a Big.js object

                // Determine crossover points for buy/sell signals
                if (previousHistogram !== null) { // Check if previousHistogram has been set
                    if (histogram.gt(new Big(0)) && previousHistogram.lt(new Big(0))) {
                        // Buy signal
                        const timestamp = new Date(timestamps[index] * 1000);
                        const formattedTimestamp = timestamp.toISOString().split('T')[0]; // Format to 'YYYY-MM-DD'

                        this.signalHistory.push({ type: 'Buy', price, timestamp: formattedTimestamp });
                        this.lastSignal = { type: 'Buy', price, timestamp: formattedTimestamp };
                    } else if (histogram.lt(new Big(0)) && previousHistogram.gt(new Big(0))) {
                        // Sell signal
                        const timestamp = new Date(timestamps[index] * 1000);
                        const formattedTimestamp = timestamp.toISOString().split('T')[0]; // Format to 'YYYY-MM-DD'

                        this.signalHistory.push({ type: 'Sell', price, timestamp: formattedTimestamp });
                        this.lastSignal = { type: 'Sell', price, timestamp: formattedTimestamp };
                    }
                }

                // Update previousHistogram for the next iteration
                // Ensure previousHistogram is also a Big.js object for correct comparison
                previousHistogram = new Big(histogram);
            }
        });

        // Return both the last signal and the history of all signals
        return {
            lastSignal: this.lastSignal,
            signalHistory: this.signalHistory,
        };
    }

}

// Export the MACDAnalysis class
export const macd26129Config = {
    indicator: EMA,
    longInterval: 26,
    shortInterval: 12,
    signalInterval: 9,
}

/*
const sampleData = {
    "t": [
        1697565600,
        1697569200,
        1697634000,
        1697637600,
        1697641200,
        1697644800,
        1697648400,
        1697652000,
        1697655600,
        1697720400,
        1697724000,
        1697727600,
        1697731200,
        1697734800,
        1697738400,
        1697742000,
        1697806800,
        1697810400,
        1697814000,
        1697817600,
        1697821200,
        1697824800,
        1697828400,
        1698066000,
        1698069600,
        1698073200,
        1698076800,
        1698080400,
        1698084000,
        1698087600,
        1698152400,
        1698156000,
        1698159600,
        1698163200,
        1698166800,
        1698170400,
        1698174000,
        1698238800,
        1698242400,
        1698246000,
        1698249600,
        1698253200,
        1698256800,
        1698260400,
        1698325200,
        1698328800,
        1698332400,
        1698336000,
        1698339600,
        1698343200,
        1698346800,
        1698411600,
        1698415200,
        1698418800,
        1698422400,
        1698426000,
        1698429600,
        1698433200,
        1698670800,
        1698674400,
        1698678000,
        1698681600,
        1698685200,
        1698688800,
        1698692400,
        1698757200,
        1698760800,
        1698764400,
        1698768000,
        1698771600,
        1698775200,
        1698778800,
        1698843600,
        1698847200,
        1698850800,
        1698854400,
        1698858000,
        1698861600,
        1698865200,
        1698930000,
        1698933600,
        1698937200,
        1698940800,
        1698944400,
        1698948000,
        1698951600,
        1699016400,
        1699020000,
        1699023600,
        1699027200,
        1699030800,
        1699034400,
        1699038000,
        1699279200,
        1699282800,
        1699286400,
        1699290000,
        1699293600,
        1699297200,
        1699300800,
        1699365600,
        1699369200,
        1699372800,
        1699376400,
        1699380000,
        1699383600,
        1699387200,
        1699452000,
        1699455600,
        1699459200,
        1699462800,
        1699466400,
        1699470000,
        1699473600,
        1699538400,
        1699542000,
        1699545600,
        1699549200,
        1699552800,
        1699556400,
        1699560000,
        1699624800,
        1699628400,
        1699632000,
        1699635600,
        1699639200,
        1699642800,
        1699646400
    ],
    "c": [
        176.660003662109375,
        177.149993896484375,
        176.600006103515625,
        176.160003662109375,
        177.029998779296875,
        176.410003662109375,
        176.7700042724609375,
        176.410003662109375,
        175.839996337890625,
        176.839996337890625,
        176.470001220703125,
        176.4600067138671875,
        177.05999755859375,
        176.7899932861328125,
        175.6399993896484375,
        175.4600067138671875,
        175.1300048828125,
        173.3600006103515625,
        173.6199951171875,
        174.3000030517578125,
        174.279998779296875,
        173.5099945068359375,
        172.8800048828125,
        171.3699951171875,
        172.1999969482421875,
        172.5800018310546875,
        173.5399932861328125,
        173.5099945068359375,
        173.4799957275390625,
        173,
        172.7599945068359375,
        172.529998779296875,
        172.7400054931640625,
        171.7599945068359375,
        172.100006103515625,
        173.1100006103515625,
        173.44000244140625,
        171.2400054931640625,
        172.149993896484375,
        171.720001220703125,
        171.910003662109375,
        171.1199951171875,
        171.089996337890625,
        171.1699981689453125,
        169.80999755859375,
        168.3000030517578125,
        167.2700042724609375,
        166.07000732421875,
        166.7599945068359375,
        167.660003662109375,
        166.899993896484375,
        167.8300018310546875,
        168.410003662109375,
        168.339996337890625,
        167.42999267578125,
        167.6199951171875,
        167.6100006103515625,
        168.220001220703125,
        170.6199951171875,
        169.410003662109375,
        169.94000244140625,
        169.3800048828125,
        170.279998779296875,
        170.4799957275390625,
        170.2899932861328125,
        168.57000732421875,
        169.660003662109375,
        169.7599945068359375,
        170.0099945068359375,
        170.6300048828125,
        170.5399932861328125,
        170.7700042724609375,
        171.07000732421875,
        171.4499969482421875,
        171.94000244140625,
        172.029998779296875,
        172.19000244140625,
        173.160003662109375,
        173.970001220703125,
        176.350006103515625,
        177.42999267578125,
        176.8000030517578125,
        176.9900054931640625,
        177.2899932861328125,
        177.4499969482421875,
        177.57000732421875,
        175.3699951171875,
        175.720001220703125,
        175.4199981689453125,
        176.1999969482421875,
        175.57000732421875,
        176.100006103515625,
        176.649993896484375,
        178.5800018310546875,
        178.7599945068359375,
        179.2700042724609375,
        178.899993896484375,
        178.3600006103515625,
        179.220001220703125,
        179.2299957275390625,
        180.160003662109375,
        181.220001220703125,
        181.470001220703125,
        181.5399932861328125,
        182.3699951171875,
        182.0399932861328125,
        181.82000732421875,
        182.9799957275390625,
        182.589996337890625,
        182.0099945068359375,
        182.160003662109375,
        182.57000732421875,
        182.42999267578125,
        182.8899993896484375,
        183.2899932861328125,
        183.3600006103515625,
        183.970001220703125,
        183.92999267578125,
        183.1199951171875,
        182.3800048828125,
        182.410003662109375,
        184.149993896484375,
        184.2899932861328125,
        184.7299957275390625,
        185.279998779296875,
        185.75,
        185.57000732421875,
        186.399993896484375
    ]
}



// Assume MACDAnalysis class is defined and imported correctly

// Initialize MACDAnalysis with appropriate config
const macdAnalysis = new MACDAnalysis({
    indicator: EMA,
    longInterval: 26,
    shortInterval: 12,
    signalInterval: 9,
});

// Analyze the sample data
const analysisResult = macdAnalysis.analyze(sampleData);

// Log the analysis result
console.log('Analysis Result:', analysisResult);

*/