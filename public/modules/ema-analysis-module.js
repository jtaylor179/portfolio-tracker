import { FasterEMA, Big } from './trading-signals.js';

export class EMACrossoverAnalysis {
  constructor(config) {
    this.shortEMA = new FasterEMA(config.shortPeriod);
    this.longEMA = new FasterEMA(config.longPeriod);
    this.signalHistory = [];
    this.lastSignal = { type: null, timestamp: null };
    this.intervalType = config.intervalType;
  }

  analyze(data, interval = 1) {
    const timestamps = data.t;
    let closingPrices = data.c;
    let previousCrossoverType = null;
    // lookup table for interval to number of candles
    //const intervalMapping = {'1D': 1, '4H': 4, '1H': 1, '2H': 2};
    //const interval = intervalMapping[intervalType];
  
    // No need to truncate closingPrices, but adjust the loop to ensure the last candle is always processed

    // write out the first and last dates in timestamps
    // console.log('from:', new Date(timestamps[0] * 1000).toISOString());
    // console.log('to:', new Date(timestamps[timestamps.length - 1] * 1000).toISOString());
  
    closingPrices.forEach((price, index) => {
      // Adjusted condition to ensure the last candle is processed regardless of the interval
      if (index % interval === 0 || index === closingPrices.length - 1) {
        // start debugger for last item
        // if(index === closingPrices.length - 1){
        //   debugger;
        // }
  
        const bigPrice = new Big(price);
        this.shortEMA.update(bigPrice);
        this.longEMA.update(bigPrice);
  
        if (this.shortEMA.isStable && this.longEMA.isStable) {
          const shortResult = this.shortEMA.getResult();
          const longResult = this.longEMA.getResult();
          if (!Number.isNaN(shortResult) && !Number.isNaN(longResult)) {
            try {
              const crossoverType = shortResult > longResult ? 'Buy' : 'Sell';
  
              if (previousCrossoverType && crossoverType !== previousCrossoverType) {
                const timestamp = new Date(timestamps[index] * 1000).toISOString().split('T')[0]; // YYYY-MM-DD format
                this.signalHistory.push({ type: crossoverType, timestamp, shortResult, longResult });
                this.lastSignal = { type: crossoverType, timestamp, shortResult, longResult };
              }
  
              previousCrossoverType = crossoverType;
            } catch (e) {
              console.error('Error:', e);
            }
          }
        }
      }
    });
  
    return {
      lastSignal: this.lastSignal,
      signalHistory: this.signalHistory,
    };
  }  
}

export const ema26129Config = {
  intervalType: '4H',
  shortPeriod: 6,
  longPeriod: 26,
};



// Assume MACDAnalysis class is defined and imported correctly

// Initialize MACDAnalysis with appropriate config
// const emaAnalysis = new EMACrossoverAnalysis({
//   shortPeriod: 12,
//   longPeriod: 26,
//   intervalType: '4H',
// });

// Analyze the sample data
// const analysisResult = emaAnalysis.analyze(sampleData);

// // Log the analysis result
// console.log('EMA Analysis Result:', analysisResult);