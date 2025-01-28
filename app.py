import streamlit as st
import requests
import pandas as pd
import matplotlib.pyplot as plt
from textblob import TextBlob
import numpy as np

# Free APIs
COINGECKO_API_URL = "https://api.coingecko.com/api/v3"
NEWS_API_KEY = '3340e225471146a4b9c374624bff329c'  # NewsAPI key

# Function to fetch cryptocurrency list
@st.cache_data(ttl=3600)
def fetch_crypto_list():
    url = f"{COINGECKO_API_URL}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1"
    response = requests.get(url)
    if response.status_code == 200:
        data = response.json()
        return {crypto['id']: crypto['name'] for crypto in data}
    return {}

# Function to fetch cryptocurrency data
def fetch_crypto_data(crypto_id):
    url = f"{COINGECKO_API_URL}/coins/markets?vs_currency=usd&ids={crypto_id}"
    response = requests.get(url)
    if response.status_code != 200:
        st.error(f"Failed to fetch data for {crypto_id}. Please try again later.")
        return None
    return response.json()

# Function to fetch historical data
def fetch_historical_data(crypto_id, days):
    url = f"{COINGECKO_API_URL}/coins/{crypto_id}/market_chart?vs_currency=usd&days={days}"
    response = requests.get(url)
    if response.status_code != 200:
        st.error(f"Failed to fetch historical data for {crypto_id}.")
        return None

    data = response.json()
    prices = data.get("prices", [])
    historical_df = pd.DataFrame(prices, columns=["Date", "Price"])
    historical_df["Date"] = pd.to_datetime(historical_df["Date"], unit="ms")
    return historical_df

# Function to fetch crypto-related news
def fetch_news_data(crypto_name):
    url = f"https://newsapi.org/v2/everything?q={crypto_name}&apiKey={NEWS_API_KEY}"
    response = requests.get(url)
    data = response.json()

    if "articles" not in data or not data["articles"]:
        st.warning(f"No news articles found for {crypto_name}.")
        return []

    return data["articles"][:5]  # Return top 5 articles

# Function to analyze sentiment
def analyze_sentiment(text):
    analysis = TextBlob(text)
    return analysis.sentiment.polarity

# Function to calculate RSI
def calculate_rsi(prices, window=14):
    deltas = np.diff(prices)
    seed = deltas[:window+1]
    up = seed[seed >= 0].sum() / window
    down = -seed[seed < 0].sum() / window
    rs = up / down
    rsi = np.zeros_like(prices)
    rsi[:window] = 100.0 - (100.0 / (1.0 + rs))

    for i in range(window, len(prices)):
        delta = deltas[i - 1]
        if delta > 0:
            upval = delta
            downval = 0.0
        else:
            upval = 0.0
            downval = -delta

        up = (up * (window - 1) + upval) / window
        down = (down * (window - 1) + downval) / window
        rs = up / down
        rsi[i] = 100.0 - (100.0 / (1.0 + rs))

    return rsi

# Function to calculate volatility
def calculate_volatility(prices):
    returns = np.log(prices / prices.shift(1))
    return returns.std() * np.sqrt(365) * 100

# Streamlit app UI
st.title("CryptoPulse: Cryptocurrency Analysis and News")

# Fetch crypto list
crypto_dict = fetch_crypto_list()

# Tabs for analysis and news
tab1, tab2 = st.tabs(["Analysis", "News"])

with tab1:
    st.header("Cryptocurrency Analysis")
    
    # Manual input for cryptocurrency
    crypto_input = st.text_input("Enter Cryptocurrency Name or ID:").strip().lower()
    
    if crypto_input:
        crypto_id = crypto_input if crypto_input in crypto_dict else next((k for k, v in crypto_dict.items() if v.lower() == crypto_input), None)
        
        if crypto_id:
            crypto_name = crypto_dict.get(crypto_id, crypto_id.capitalize())
            days = st.slider("Historical data (days):", 1, 30, 10)

            market_data = fetch_crypto_data(crypto_id)
            if market_data:
                st.subheader(f"{crypto_name} Overview")
                col1, col2, col3 = st.columns(3)
                col1.metric("Current Price (USD)", f"${market_data[0]['current_price']:,.2f}")
                col2.metric("Market Cap (USD)", f"${market_data[0]['market_cap']:,.0f}")
                col3.metric("24h Trading Volume (USD)", f"${market_data[0]['total_volume']:,.0f}")

                historical_data = fetch_historical_data(crypto_id, days)
                if historical_data is not None:
                    st.subheader(f"{crypto_name} Price Trend (Last {days} Days)")
                    historical_data.set_index("Date", inplace=True)
                    st.line_chart(historical_data["Price"])

                    # Calculate volatility
                    volatility = calculate_volatility(historical_data["Price"])
                    st.metric("Volatility", f"{volatility:.2f}%")

                    # Calculate and display moving averages
                    historical_data["MA"] = historical_data["Price"].rolling(window=5).mean()
                    st.line_chart(historical_data[["Price", "MA"]])

                    # Add RSI analysis
                    try:
                        historical_data["RSI"] = calculate_rsi(historical_data["Price"].values)
                        st.line_chart(historical_data["RSI"])
                    except Exception as e:
                        st.error(f"RSI calculation error: {e}")
        else:
            st.error("Invalid cryptocurrency name or ID. Please try again.")

with tab2:
    st.header("Cryptocurrency News")
    crypto_news_input = st.text_input("Enter Cryptocurrency Name for News:").strip()

    if crypto_news_input:
        st.subheader(f"Latest News for {crypto_news_input}")
        news_articles = fetch_news_data(crypto_news_input)

        if news_articles:
            sentiment_scores = []
            headlines = []

            for article in news_articles:
                sentiment_score = analyze_sentiment(article["title"])
                sentiment_scores.append(sentiment_score)
                headlines.append(article["title"])

                st.write(f"**{article['title']}**")
                st.write(f"Published: {article['publishedAt']}")
                st.write(f"Source: {article['source']['name']}")
                st.write(f"Description: {article.get('description', 'No description available')}")
                sentiment = "Positive" if sentiment_score > 0 else "Negative"
                st.write(f"Sentiment: {sentiment} (Score: {sentiment_score:.2f})")
                st.write(f"[Read More]({article['url']})")
                st.write("---")

            # Overall sentiment
            overall_sentiment = "Positive" if np.mean(sentiment_scores) > 0 else "Negative"
            st.subheader(f"Overall Sentiment: {overall_sentiment}")

            # Sentiment score visualization
            st.subheader("Sentiment Scores for Recent News")
            fig, ax = plt.subplots()
            ax.barh(headlines, sentiment_scores, color=["green" if s > 0 else "red" for s in sentiment_scores])
            ax.set_xlabel("Sentiment Score")
            ax.set_title("Sentiment Analysis of News Headlines")
            st.pyplot(fig)

st.sidebar.info("Enter a cryptocurrency name or ID in the input box to start your analysis.")
