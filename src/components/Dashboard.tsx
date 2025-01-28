import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts';
import { CryptoData, NewsArticle, User } from '../types';
import { Search, TrendingUp, Newspaper, AlertTriangle, Activity, TrendingDown } from 'lucide-react';
import axios from 'axios';

interface DashboardProps {
  user: User;
}

// Mapping for proper news search terms
const cryptoNewsMapping: { [key: string]: string } = {
  'bitcoin': 'Bitcoin BTC',
  'ethereum': 'Ethereum ETH',
  'cardano': 'Cardano ADA',
  'solana': 'Solana SOL',
  'dogecoin': 'Dogecoin DOGE',
  'ripple': 'Ripple XRP',
  'polkadot': 'Polkadot DOT',
  'avalanche': 'Avalanche AVAX',
  'chainlink': 'Chainlink LINK',
  'polygon': 'Polygon MATIC',
  'uniswap': 'Uniswap UNI',
  'litecoin': 'Litecoin LTC',
  'stellar': 'Stellar XLM',
  'cosmos': 'Cosmos ATOM',
  'monero': 'Monero XMR',
  'algorand': 'Algorand ALGO',
  'tezos': 'Tezos XTZ',
  'vechain': 'VeChain VET',
  'filecoin': 'Filecoin FIL',
  'aave': 'Aave AAVE'
};

export function Dashboard({ user }: DashboardProps) {
  const [selectedCrypto, setSelectedCrypto] = useState<string>('bitcoin');
  const [cryptoData, setCryptoData] = useState<CryptoData | null>(null);
  const [newsArticles, setNewsArticles] = useState<NewsArticle[]>([]);
  const [historicalData, setHistoricalData] = useState<any[]>([]);
  const [volatilityData, setVolatilityData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCryptoData = async () => {
    setLoading(true);
    try {
      // Fetch current price data
      const priceResponse = await axios.get(
        `https://api.coingecko.com/api/v3/simple/price?ids=${selectedCrypto}&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true`
      );

      if (priceResponse.data[selectedCrypto]) {
        setCryptoData({
          id: selectedCrypto,
          name: selectedCrypto.charAt(0).toUpperCase() + selectedCrypto.slice(1),
          current_price: priceResponse.data[selectedCrypto].usd,
          market_cap: priceResponse.data[selectedCrypto].usd_market_cap,
          total_volume: priceResponse.data[selectedCrypto].usd_24h_vol,
          price_change_percentage_24h: priceResponse.data[selectedCrypto].usd_24h_change
        });
      }

      // Fetch historical data
      const historyResponse = await axios.get(
        `https://api.coingecko.com/api/v3/coins/${selectedCrypto}/market_chart?vs_currency=usd&days=30&interval=daily`
      );

      const formattedHistoricalData = historyResponse.data.prices.map((item: [number, number]) => ({
        date: new Date(item[0]).toLocaleDateString(),
        price: item[1]
      }));

      setHistoricalData(formattedHistoricalData);

      // Calculate volatility data
      const volatility = calculateVolatility(formattedHistoricalData);
      setVolatilityData(volatility);

      // Fetch news using the proper search term
      const searchTerm = cryptoNewsMapping[selectedCrypto] || selectedCrypto;
      const newsResponse = await axios.get(
        `https://newsapi.org/v2/everything?q=${encodeURIComponent(searchTerm)}&apiKey=3340e225471146a4b9c374624bff329c&sortBy=publishedAt&pageSize=5&language=en`
      );

      const newsWithSentiment = newsResponse.data.articles.map((article: any) => ({
        ...article,
        sentiment: calculateSentiment(article.title + ' ' + (article.description || ''))
      }));

      setNewsArticles(newsWithSentiment);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCryptoData();
  }, [selectedCrypto]);

  const calculateVolatility = (data: any[]) => {
    const returns = data.map((item, index) => {
      if (index === 0) return 0;
      return ((item.price - data[index - 1].price) / data[index - 1].price) * 100;
    });

    return data.map((item, index) => ({
      date: item.date,
      volatility: Math.abs(returns[index])
    }));
  };

  const calculateSentiment = (text: string) => {
    const positiveWords = [
      'bullish', 'surge', 'gain', 'rise', 'positive', 'up', 'high', 'growth',
      'rally', 'boost', 'soar', 'jump', 'breakthrough', 'success', 'strong',
      'opportunity', 'optimistic', 'promising', 'recover', 'support'
    ];
    
    const negativeWords = [
      'bearish', 'drop', 'fall', 'negative', 'down', 'low', 'crash', 'decline',
      'plunge', 'tumble', 'sink', 'weak', 'loss', 'risk', 'concern',
      'volatile', 'uncertainty', 'fear', 'sell-off', 'correction'
    ];

    const words = text.toLowerCase().split(/\W+/);
    let score = 0;
    let relevantWords = 0;

    words.forEach(word => {
      if (positiveWords.includes(word)) {
        score += 1;
        relevantWords += 1;
      }
      if (negativeWords.includes(word)) {
        score -= 1;
        relevantWords += 1;
      }
    });

    return relevantWords > 0 ? score / relevantWords : 0;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">Market Overview</h3>
            <TrendingUp className="h-5 w-5 text-blue-400" />
          </div>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
            </div>
          ) : cryptoData && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-400">Current Price</p>
                <p className="text-2xl font-bold">${cryptoData.current_price.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">24h Change</p>
                <p className={`text-lg font-semibold flex items-center gap-1 ${cryptoData.price_change_percentage_24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {cryptoData.price_change_percentage_24h >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  {cryptoData.price_change_percentage_24h.toFixed(2)}%
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Market Cap</p>
                <p className="text-lg font-semibold">${(cryptoData.market_cap / 1e9).toFixed(2)}B</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">24h Volume</p>
                <p className="text-lg font-semibold">${(cryptoData.total_volume / 1e6).toFixed(2)}M</p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 md:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">Price History</h3>
            <div className="flex items-center space-x-2">
              <select
                value={selectedCrypto}
                onChange={(e) => setSelectedCrypto(e.target.value)}
                className="px-3 py-1 rounded bg-gray-700 border border-gray-600 text-sm text-white"
              >
                <option value="bitcoin">Bitcoin (BTC)</option>
                <option value="ethereum">Ethereum (ETH)</option>
                <option value="cardano">Cardano (ADA)</option>
                <option value="solana">Solana (SOL)</option>
                <option value="dogecoin">Dogecoin (DOGE)</option>
                <option value="ripple">Ripple (XRP)</option>
                <option value="polkadot">Polkadot (DOT)</option>
                <option value="avalanche">Avalanche (AVAX)</option>
                <option value="chainlink">Chainlink (LINK)</option>
                <option value="polygon">Polygon (MATIC)</option>
                <option value="uniswap">Uniswap (UNI)</option>
                <option value="litecoin">Litecoin (LTC)</option>
                <option value="stellar">Stellar (XLM)</option>
                <option value="cosmos">Cosmos (ATOM)</option>
                <option value="monero">Monero (XMR)</option>
                <option value="algorand">Algorand (ALGO)</option>
                <option value="tezos">Tezos (XTZ)</option>
                <option value="vechain">VeChain (VET)</option>
                <option value="filecoin">Filecoin (FIL)</option>
                <option value="aave">Aave (AAVE)</option>
              </select>
              <Activity className="h-5 w-5 text-gray-400" />
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historicalData}>
                <defs>
                  <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#60A5FA" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#60A5FA" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none' }} />
                <Area type="monotone" dataKey="price" stroke="#60A5FA" fillOpacity={1} fill="url(#colorPrice)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">Volatility Analysis</h3>
            <Activity className="h-5 w-5 text-yellow-400" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={volatilityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none' }} />
                <Bar dataKey="volatility" fill="#FCD34D" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">News Sentiment</h3>
            <Newspaper className="h-5 w-5 text-blue-400" />
          </div>
          <div className="space-y-4 max-h-[400px] overflow-y-auto">
            {newsArticles.length > 0 ? (
              newsArticles.map((article, index) => (
                <div key={index} className="border-b border-gray-700 pb-4">
                  <h4 className="font-medium mb-2">{article.title}</h4>
                  <p className="text-sm text-gray-400 mb-2">{article.description}</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">
                      {new Date(article.publishedAt).toLocaleString()}
                    </span>
                    <span className={`px-2 py-1 rounded ${
                      article.sentiment > 0 
                        ? 'bg-green-900 text-green-200' 
                        : article.sentiment < 0 
                          ? 'bg-red-900 text-red-200'
                          : 'bg-gray-700 text-gray-200'
                    }`}>
                      {article.sentiment > 0 ? 'Positive' : article.sentiment < 0 ? 'Negative' : 'Neutral'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-400">
                No recent news articles found for {cryptoData?.name}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">AI Insights</h3>
          <AlertTriangle className="h-5 w-5 text-yellow-400" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-700 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Market Analysis</h4>
            <p className="text-sm text-gray-300">
              {cryptoData && `Based on the current data, ${cryptoData.name} shows a ${
                cryptoData.price_change_percentage_24h >= 0 ? 'positive' : 'negative'
              } trend with ${Math.abs(cryptoData.price_change_percentage_24h).toFixed(2)}% change in the last 24 hours. 
              The trading volume suggests ${
                cryptoData.total_volume > cryptoData.market_cap * 0.1 
                  ? 'high market activity' 
                  : 'moderate market activity'
              }.`}
            </p>
          </div>
          <div className="bg-gray-700 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Risk Assessment</h4>
            <ul className="text-sm text-gray-300 list-disc list-inside space-y-2">
              <li>Volatility: {
                volatilityData.length > 0 && 
                (Math.max(...volatilityData.map(d => d.volatility)) > 5 
                  ? 'High - Consider using stop-loss orders'
                  : 'Moderate - Standard precautions advised')
              }</li>
              <li>News Sentiment: {
                newsArticles.length > 0 &&
                (newsArticles.reduce((acc, curr) => acc + (curr.sentiment || 0), 0) / newsArticles.length > 0
                  ? 'Predominantly positive'
                  : 'Mixed or negative')
              }</li>
              <li>Market Maturity: {
                cryptoData && 
                (cryptoData.market_cap > 10e9 
                  ? 'Well-established market'
                  : 'Emerging market - Higher risk')
              }</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}