import { useState, useEffect, useCallback } from 'react';
import { copyToClipboard } from '../../utils/clipboard';

// Comprehensive list of currencies organized by region
const currencies = [
  // Major World Currencies
  { code: 'USD', name: 'US Dollar', symbol: '$', region: 'Americas' },
  { code: 'EUR', name: 'Euro', symbol: '€', region: 'Europe' },
  { code: 'GBP', name: 'British Pound', symbol: '£', region: 'Europe' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', region: 'Asia' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', region: 'Asia' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', region: 'Europe' },
  
  // Americas
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', region: 'Americas' },
  { code: 'MXN', name: 'Mexican Peso', symbol: '$', region: 'Americas' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', region: 'Americas' },
  { code: 'ARS', name: 'Argentine Peso', symbol: '$', region: 'Americas' },
  { code: 'CLP', name: 'Chilean Peso', symbol: '$', region: 'Americas' },
  { code: 'COP', name: 'Colombian Peso', symbol: '$', region: 'Americas' },
  { code: 'PEN', name: 'Peruvian Sol', symbol: 'S/', region: 'Americas' },
  
  // Asia Pacific
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', region: 'Asia Pacific' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$', region: 'Asia Pacific' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', region: 'Asia Pacific' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', region: 'Asia Pacific' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', region: 'Asia Pacific' },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩', region: 'Asia Pacific' },
  { code: 'TWD', name: 'Taiwan Dollar', symbol: 'NT$', region: 'Asia Pacific' },
  { code: 'THB', name: 'Thai Baht', symbol: '฿', region: 'Asia Pacific' },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', region: 'Asia Pacific' },
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp', region: 'Asia Pacific' },
  { code: 'PHP', name: 'Philippine Peso', symbol: '₱', region: 'Asia Pacific' },
  { code: 'VND', name: 'Vietnamese Dong', symbol: '₫', region: 'Asia Pacific' },
  { code: 'PKR', name: 'Pakistani Rupee', symbol: '₨', region: 'Asia Pacific' },
  { code: 'BDT', name: 'Bangladeshi Taka', symbol: '৳', region: 'Asia Pacific' },
  
  // Middle East
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', region: 'Middle East' },
  { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼', region: 'Middle East' },
  { code: 'QAR', name: 'Qatari Riyal', symbol: '﷼', region: 'Middle East' },
  { code: 'KWD', name: 'Kuwaiti Dinar', symbol: 'د.ك', region: 'Middle East' },
  { code: 'OMR', name: 'Omani Rial', symbol: '﷼', region: 'Middle East' },
  { code: 'BHD', name: 'Bahraini Dinar', symbol: '.د.ب', region: 'Middle East' },
  { code: 'ILS', name: 'Israeli Shekel', symbol: '₪', region: 'Middle East' },
  { code: 'JOD', name: 'Jordanian Dinar', symbol: 'د.ا', region: 'Middle East' },
  { code: 'EGP', name: 'Egyptian Pound', symbol: '£', region: 'Middle East' },
  { code: 'TRY', name: 'Turkish Lira', symbol: '₺', region: 'Middle East' },
  
  // Europe
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr', region: 'Europe' },
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr', region: 'Europe' },
  { code: 'DKK', name: 'Danish Krone', symbol: 'kr', region: 'Europe' },
  { code: 'PLN', name: 'Polish Zloty', symbol: 'zł', region: 'Europe' },
  { code: 'CZK', name: 'Czech Koruna', symbol: 'Kč', region: 'Europe' },
  { code: 'HUF', name: 'Hungarian Forint', symbol: 'Ft', region: 'Europe' },
  { code: 'RON', name: 'Romanian Leu', symbol: 'lei', region: 'Europe' },
  { code: 'BGN', name: 'Bulgarian Lev', symbol: 'лв', region: 'Europe' },
  { code: 'HRK', name: 'Croatian Kuna', symbol: 'kn', region: 'Europe' },
  { code: 'RUB', name: 'Russian Ruble', symbol: '₽', region: 'Europe' },
  { code: 'UAH', name: 'Ukrainian Hryvnia', symbol: '₴', region: 'Europe' },
  
  // Africa
  { code: 'ZAR', name: 'South African Rand', symbol: 'R', region: 'Africa' },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', region: 'Africa' },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh', region: 'Africa' },
  { code: 'GHS', name: 'Ghanaian Cedi', symbol: '₵', region: 'Africa' },
  { code: 'ETB', name: 'Ethiopian Birr', symbol: 'Br', region: 'Africa' },
  
  // Others
  { code: 'XAU', name: 'Gold (oz)', symbol: 'oz', region: 'Commodities' },
  { code: 'XAG', name: 'Silver (oz)', symbol: 'oz', region: 'Commodities' },
].sort((a, b) => {
  // Sort by region first, then by code
  if (a.region !== b.region) {
    return a.region.localeCompare(b.region);
  }
  return a.code.localeCompare(b.code);
});

export default function CurrencyConverter() {
  const [fromValue, setFromValue] = useState<string>('1');
  const [fromCurrency, setFromCurrency] = useState<string>('USD');
  const [toCurrency, setToCurrency] = useState<string>('EUR');
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Fetch exchange rate function
  const fetchExchangeRate = useCallback(async (showLoading = true) => {
    if (fromCurrency === toCurrency) {
      setExchangeRate(1);
      setLastUpdated(new Date());
      return;
    }

    if (showLoading) {
      setLoading(true);
    } else {
      setIsRefreshing(true);
    }
    setError(null);

    try {
      // Skip API call for commodities (XAU, XAG) as they're not supported by standard exchange rate APIs
      if (fromCurrency === 'XAU' || fromCurrency === 'XAG' || toCurrency === 'XAU' || toCurrency === 'XAG') {
        throw new Error('Commodities require special pricing APIs');
      }

      // Using exchangerate-api.com free tier (no API key needed for basic conversion)
      // This API updates rates daily and is free for non-commercial use
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${fromCurrency}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data || !data.rates) {
        throw new Error('Invalid API response format');
      }

      const rate = data.rates[toCurrency];
      
      if (rate === undefined || rate === null) {
        throw new Error(`Currency ${toCurrency} not found in API response`);
      }

      if (isNaN(rate) || rate <= 0) {
        throw new Error('Invalid exchange rate received');
      }

      setExchangeRate(rate);
      setLastUpdated(new Date());
      setError(null); // Clear any previous errors
    } catch (err: any) {
      console.error('Currency conversion error:', err);
      
      // Handle specific error types
      let errorMessage = 'Unable to fetch exchange rates. Using approximate rates.';
      if (err.name === 'AbortError') {
        errorMessage = 'Request timeout. Please check your internet connection and try again.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      // Fallback: Use approximate rates (these are rough estimates)
      const fallbackRates: Record<string, Record<string, number>> = {
        // Fallback rates for major currencies (approximate values)
        USD: { 
          EUR: 0.92, GBP: 0.79, JPY: 150, INR: 83, AED: 3.67, CAD: 1.35, AUD: 1.52, CHF: 0.88, CNY: 7.24, 
          SGD: 1.34, HKD: 7.82, NZD: 1.65, ZAR: 18.5, BRL: 4.95, MXN: 17.0, KRW: 1320, TRY: 32.0, RUB: 92.0, 
          SEK: 10.5, SAR: 3.75, QAR: 3.64, THB: 35.5, MYR: 4.70, IDR: 15700, PHP: 56.0, VND: 24500, 
          NOK: 10.8, DKK: 6.90, PLN: 4.05, CZK: 23.0, HUF: 360, NGN: 1500, EGP: 31.0, ARS: 850, CLP: 950, COP: 4100,
          TWD: 31.5, PKR: 278, BDT: 110, KWD: 0.31, OMR: 0.38, BHD: 0.38, ILS: 3.65, JOD: 0.71, PEN: 3.70,
          RON: 4.55, BGN: 1.80, HRK: 7.00, UAH: 37.0, KES: 130, GHS: 12.5, ETB: 56.0
        },
        EUR: { 
          USD: 1.09, GBP: 0.86, JPY: 163, INR: 90, AED: 4.00, CAD: 1.47, AUD: 1.65, CHF: 0.96, CNY: 7.89, 
          SGD: 1.46, HKD: 8.52, NZD: 1.80, ZAR: 20.2, BRL: 5.40, MXN: 18.5, KRW: 1440, TRY: 34.9, RUB: 100, 
          SEK: 11.4, SAR: 4.09, QAR: 3.97, THB: 38.7, MYR: 5.12, IDR: 17100, PHP: 61.0, VND: 26700,
          NOK: 11.8, DKK: 7.52, PLN: 4.41, CZK: 25.1, HUF: 392, NGN: 1635, EGP: 33.8, ARS: 926, CLP: 1035, COP: 4470
        },
        GBP: { 
          USD: 1.27, EUR: 1.16, JPY: 190, INR: 105, AED: 4.66, CAD: 1.71, AUD: 1.92, CHF: 1.12, CNY: 9.18, 
          SGD: 1.70, HKD: 9.93, NZD: 2.10, ZAR: 23.5, BRL: 6.28, MXN: 21.6, KRW: 1676, TRY: 40.6, RUB: 116, 
          SEK: 13.3, SAR: 4.76, QAR: 4.62, THB: 45.1, MYR: 5.97, IDR: 19900, PHP: 71.1, VND: 31100,
          NOK: 13.7, DKK: 8.75, PLN: 5.14, CZK: 29.2, HUF: 457, NGN: 1905, EGP: 39.4, ARS: 1080, CLP: 1206, COP: 5205
        },
      };
      
      // Try to use fallback rates
      const fallback = fallbackRates[fromCurrency]?.[toCurrency];
      if (fallback && !isNaN(fallback) && fallback > 0) {
        setExchangeRate(fallback);
        setLastUpdated(new Date());
        setError(null); // Clear error if we have a valid fallback
      } else {
        // Try reverse conversion if direct fallback not available
        const reverseFallback = fallbackRates[toCurrency]?.[fromCurrency];
        if (reverseFallback && !isNaN(reverseFallback) && reverseFallback > 0) {
          setExchangeRate(1 / reverseFallback);
          setLastUpdated(new Date());
          setError(null);
        } else {
          // Last resort: try to calculate via USD as intermediate currency
          const fromToUSD = fallbackRates['USD']?.[fromCurrency];
          const usdToTo = fallbackRates['USD']?.[toCurrency];
          
          if (fromToUSD && usdToTo && !isNaN(fromToUSD) && !isNaN(usdToTo) && fromToUSD > 0 && usdToTo > 0) {
            // Convert: fromCurrency -> USD -> toCurrency
            const viaUSD = (1 / fromToUSD) * usdToTo;
            setExchangeRate(viaUSD);
            setLastUpdated(new Date());
            setError(null);
          } else {
            setExchangeRate(null);
            setError(`Unable to fetch rates for ${fromCurrency} to ${toCurrency}. Please try refreshing or use a different currency pair.`);
          }
        }
      }
    } finally {
      if (showLoading) {
        setLoading(false);
      } else {
        setIsRefreshing(false);
      }
    }
  }, [fromCurrency, toCurrency]);

  // Fetch exchange rate on mount and when currencies change
  useEffect(() => {
    fetchExchangeRate();
  }, [fetchExchangeRate]);

  // Auto-refresh rates every 5 minutes (300000 ms)
  useEffect(() => {
    const interval = setInterval(() => {
      if (fromCurrency !== toCurrency) {
        fetchExchangeRate(false); // Silent refresh
      }
    }, 300000); // 5 minutes

    return () => clearInterval(interval);
  }, [fromCurrency, toCurrency, fetchExchangeRate]);

  // Manual refresh handler
  const handleRefresh = () => {
    fetchExchangeRate(true);
  };

  // Calculate result - handle null exchangeRate and invalid values
  const inputValue = parseFloat(fromValue) || 0;
  const result = exchangeRate !== null && !isNaN(exchangeRate) && exchangeRate > 0
    ? inputValue * exchangeRate 
    : 0;

  const swapCurrencies = () => {
    const tempCurrency = fromCurrency;
    setFromCurrency(toCurrency);
    setToCurrency(tempCurrency);
    setFromValue(result.toFixed(2));
  };

  const fromCurrencyInfo = currencies.find(c => c.code === fromCurrency);
  const toCurrencyInfo = currencies.find(c => c.code === toCurrency);

  // Group currencies by region for better organization in dropdown
  const groupedCurrencies = currencies.reduce((acc, currency) => {
    if (!acc[currency.region]) {
      acc[currency.region] = [];
    }
    acc[currency.region].push(currency);
    return acc;
  }, {} as Record<string, typeof currencies>);

  const handleClear = () => {
    setFromValue('');
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">From</label>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <div className="flex-1 relative min-w-0">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-base sm:text-lg">
                {fromCurrencyInfo?.symbol}
              </span>
              <input
                type="number"
                value={fromValue}
                onChange={(e) => setFromValue(e.target.value)}
                className="w-full pl-8 sm:pl-10 pr-8 sm:pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base sm:text-lg"
                placeholder="Enter amount"
                inputMode="decimal"
              />
              {fromValue && (
                <button
                  onClick={handleClear}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 sm:hidden"
                  aria-label="Clear"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            <div className="relative sm:w-64">
              <select
                value={fromCurrency}
                onChange={(e) => setFromCurrency(e.target.value)}
                className="w-full px-3 sm:px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm sm:text-base touch-manipulation"
              >
                {Object.entries(groupedCurrencies).map(([region, regionCurrencies]) => (
                  <optgroup key={region} label={region}>
                    {regionCurrencies.map(currency => (
                      <option key={currency.code} value={currency.code}>
                        {currency.code} - {currency.name} {currency.symbol && `(${currency.symbol})`}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">To</label>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <div className="flex-1 relative min-w-0">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-base sm:text-lg">
                {toCurrencyInfo?.symbol}
              </span>
              <input
                type="text"
                value={exchangeRate !== null && !isNaN(result) && result !== 0 ? result.toFixed(2) : ''}
                readOnly
                className={`w-full pl-8 sm:pl-10 pr-10 sm:pr-4 py-3 border rounded-lg text-base sm:text-lg font-semibold ${
                  exchangeRate === null && !loading 
                    ? 'border-red-300 bg-red-50' 
                    : 'border-gray-300 bg-gray-50'
                }`}
                placeholder={loading ? 'Loading...' : exchangeRate === null ? 'Unable to fetch rate' : '0.00'}
              />
              {result && !isNaN(result) && result !== 0 && exchangeRate !== null && (
                <button
                  onClick={() => copyToClipboard(result.toFixed(2))}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-blue-600 transition-colors"
                  aria-label="Copy to clipboard"
                  title="Copy result"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              )}
            </div>
            <div className="relative sm:w-64">
              <select
                value={toCurrency}
                onChange={(e) => setToCurrency(e.target.value)}
                className="w-full px-3 sm:px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm sm:text-base touch-manipulation"
              >
                {Object.entries(groupedCurrencies).map(([region, regionCurrencies]) => (
                  <optgroup key={region} label={region}>
                    {regionCurrencies.map(currency => (
                      <option key={currency.code} value={currency.code}>
                        {currency.code} - {currency.name} {currency.symbol && `(${currency.symbol})`}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {loading && (
        <div className="text-center text-blue-600 py-2">
          <div className="inline-flex items-center space-x-2">
            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-sm sm:text-base">Loading exchange rates...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div className="flex-1">
              <p className="text-xs sm:text-sm text-yellow-800 font-medium mb-1">Warning</p>
              <p className="text-xs sm:text-sm text-yellow-700">{error}</p>
              {exchangeRate === null && (
                <p className="text-xs text-yellow-600 mt-2">
                  Tip: Try using major currencies (USD, EUR, GBP) or click "Refresh Rates" to retry.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          onClick={swapCurrencies}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors font-medium touch-manipulation shadow-sm"
        >
          ↕ Swap Currencies
        </button>
        <button
          onClick={handleRefresh}
          disabled={loading || isRefreshing}
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 active:bg-green-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium touch-manipulation shadow-sm flex items-center justify-center gap-2"
          title="Refresh exchange rates"
        >
          {isRefreshing ? (
            <>
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Refreshing...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh Rates
            </>
          )}
        </button>
        {fromValue && (
          <button
            onClick={handleClear}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 active:bg-gray-400 transition-colors font-medium touch-manipulation"
          >
            Clear
          </button>
        )}
      </div>

      {/* Conversion Result */}
      {fromValue && !isNaN(parseFloat(fromValue)) && inputValue > 0 && (
        <div className={`rounded-lg p-3 sm:p-4 ${
          exchangeRate !== null && result !== 0 
            ? 'bg-blue-50 border border-blue-200' 
            : 'bg-red-50 border border-red-200'
        }`}>
          {exchangeRate !== null && result !== 0 ? (
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs sm:text-sm text-blue-800 mb-1">
                  <strong>Conversion:</strong> {fromValue} {fromCurrency} = {result.toFixed(2)} {toCurrency}
                </p>
                {exchangeRate !== null && !isNaN(exchangeRate) && (
                  <div className="text-xs text-blue-700 space-y-1">
                    <p>
                      Exchange Rate: 1 {fromCurrency} = {exchangeRate.toFixed(4)} {toCurrency}
                    </p>
                    {lastUpdated && (
                      <p className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Last updated: {lastUpdated.toLocaleTimeString()} ({lastUpdated.toLocaleDateString()})
                      </p>
                    )}
                    <p className="text-blue-600 italic">
                      Rates auto-refresh every 5 minutes
                    </p>
                  </div>
                )}
              </div>
              <button
                onClick={() => copyToClipboard(`${fromValue} ${fromCurrency} = ${result.toFixed(2)} ${toCurrency}`)}
                className="ml-2 p-1 text-blue-600 hover:text-blue-800 transition-colors flex-shrink-0"
                aria-label="Copy conversion"
                title="Copy conversion"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          ) : (
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <p className="text-xs sm:text-sm text-red-800 font-medium mb-1">
                  Unable to convert {fromCurrency} to {toCurrency}
                </p>
                <p className="text-xs text-red-700">
                  Please try refreshing the rates or select a different currency pair. Some currencies may not be available from the exchange rate API.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
        <div className="flex items-start gap-2">
          <svg className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-xs text-gray-600">
            <p className="font-semibold mb-1">About Exchange Rates:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Rates are fetched from exchangerate-api.com and update automatically every 5 minutes</li>
              <li>Rates shown are mid-market rates (average of buy/sell rates)</li>
              <li>Actual bank/exchange rates may differ due to fees and margins</li>
              <li>For large transactions, always verify rates with your financial institution</li>
              <li>Click "Refresh Rates" button to manually update rates</li>
            </ul>
          </div>
        </div>
      </div>

      {/* SEO & AI-Friendly Content */}
      <div className="mt-8 space-y-6">
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">About Currency Conversion</h3>
          <p className="text-gray-700 mb-4">
            Currency conversion is essential for international travel, online shopping, business transactions, and financial planning. 
            Our currency converter provides real-time exchange rates for <strong>60+ currencies</strong> from around the world, organized by regions:
          </p>
          <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
            <li><strong>Major World Currencies:</strong> USD, EUR, GBP, JPY, CNY, CHF</li>
            <li><strong>Americas:</strong> CAD, MXN, BRL, ARS, CLP, COP, PEN</li>
            <li><strong>Asia Pacific:</strong> AUD, NZD, SGD, HKD, INR, KRW, TWD, THB, MYR, IDR, PHP, VND, PKR, BDT</li>
            <li><strong>Middle East:</strong> AED, SAR, QAR, KWD, OMR, BHD, ILS, JOD, EGP, TRY</li>
            <li><strong>Europe:</strong> NOK, SEK, DKK, PLN, CZK, HUF, RON, BGN, HRK, RUB, UAH</li>
            <li><strong>Africa:</strong> ZAR, NGN, KES, GHS, ETB</li>
            <li><strong>Commodities:</strong> Gold (XAU), Silver (XAG)</li>
          </ul>
          <p className="text-gray-700 mb-4">
            <strong>How It Works:</strong> Exchange rates are fetched from reliable financial data sources and updated automatically. 
            The converter uses the latest mid-market rates, which represent the average between buy and sell rates. 
            Actual rates may vary slightly when exchanging currency at banks or exchange services due to fees and margins.
          </p>
          <p className="text-gray-700">
            <strong>Use Cases:</strong> Travel planning, international shopping, business transactions, investment analysis, 
            expense tracking, and understanding global market values.
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Frequently Asked Questions</h3>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-1">How often are exchange rates updated?</h4>
              <p className="text-sm text-gray-600">
                Exchange rates are updated in real-time from reliable financial data sources. Rates typically update every few minutes 
                during market hours. For the most accurate rates, always check with your bank or financial institution before making large transactions.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Are the rates the same as bank rates?</h4>
              <p className="text-sm text-gray-600">
                The rates shown are mid-market rates (the average between buy and sell rates). Banks and exchange services typically 
                add a margin or fee, so the actual rate you receive may differ. Always check with your financial institution for exact rates.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Can I use this for large transactions?</h4>
              <p className="text-sm text-gray-600">
                This converter is suitable for estimates and general reference. For large transactions, always consult with your bank 
                or a licensed currency exchange service to get exact rates and understand any fees or restrictions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

