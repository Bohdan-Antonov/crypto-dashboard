// ----------------------------------------------------------------------------------------

const chart = LightweightCharts.createChart(document.getElementById('chart'), {
	width: document.getElementById('chart-wrapper').innerWidth,
  height: document.getElementById('chart-wrapper').innerHeight,
	layout: {
		backgroundColor: 'white',
		textColor: 'black',
	},
	grid: {
		vertLines: {
			color: 'rgba(197, 203, 206, 0.5)',
		},
		horzLines: {
			color: 'rgba(197, 203, 206, 0.5)',
		},
	},
	crosshair: {
		mode: LightweightCharts.CrosshairMode.Normal,
	},
	rightPriceScale: {
		borderColor: 'black',
	},
	timeScale: {
		borderColor: 'black',
	},
});


const candleSeries = chart.addCandlestickSeries({
  upColor: 'green',
  downColor: 'red',
  borderDownColor: 'red',
  borderUpColor: 'green',
  wickDownColor: 'red',
  wickUpColor: 'green',
});

window.onresize = () => {
 chart.resize(document.getElementById('chart-wrapper').clientWidth, document.getElementById('chart-wrapper').clientHeight)
}

const activeButton = (tag) => {
  const links = [...document.getElementById('stats-labels').children]
  links.forEach(element => {
    element.style.color = 'rgb(184, 184, 184)'
    element.style.borderBottom = 'none'
  })
  document.getElementById(tag).style.color = 'black'
  document.getElementById(tag).style.borderBottom = 'solid black 2px'
}

// ----------------------------------------------------------------------------------------



(async () => {
  const symbol = 'BTCUSDT'
  const interval = '1d'
  const response = await fetch(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=5000`)
  const data = await response.json()
  console.log(data)
  let historicalData = []
  lastCandlestick = {
    time: dateFormatter(data[data.length - 1][0]),
    open: data[data.length - 1][1],
    high: data[data.length - 1][2],
    low: data[data.length - 1][3],
    close: data[data.length - 1][4],
  }
  data.forEach(element => {
    candleSeries.update({
      time: dateFormatter(element[0]),
      open: element[1],
      high: element[2],
      low: element[3],
      close: element[4]
    })
  //candleSeries.setData(historicalData)
//})
  setTimeout(websocket, 1000)
  })
})()

// ----------------------------------------------------------------------------------------


let lastCandlestick = null
let lastPrice = 0
let lastColor = null

const dateFormatter = (timestamp) => {
  const date = new Date(timestamp);
  time = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate();
  return time;
};

const websocket = () => {
  let binanceSocket = new WebSocket("wss://stream.binance.com:9443/stream?streams=btcusdt@kline_1d/btcusdt@trade/btcusdt@depth10@100ms");
  binanceSocket.onclose = (event) => {
    binanceSocket = null
    setTimeout(websocket, 3000)
  }

  binanceSocket.onmessage = (event) => {
    const message = JSON.parse(event.data)
    console.log(message)
    if (message.stream === "btcusdt@kline_1d") {
      //console.log(message.data.k.x)
      candleSeries.update({
        time: dateFormatter(message.data.k.t),
        open: message.data.k.o,
        high: message.data.k.h,
        low: message.data.k.l,
        close: message.data.k.c,
      })
      lastCandlestick = {
        time: dateFormatter(message.data.k.t),
        open: message.data.k.o,
        high: message.data.k.h,
        low: message.data.k.l,
        close: message.data.k.c,
      }
      //console.log(candleSeries)
      //console.log(lastCandlestick)
    } 
    else if (message.stream === "btcusdt@depth10@100ms") {
      const bids = message.data.bids
      const asks = message.data.asks
      asks.forEach((data) => {
        const askPrice = document.createElement('div')
        const askQuantity = document.createElement('div')
        const askTotal = document.createElement('div')

        askPrice.setAttribute('class', 'ask-price')
        askQuantity.setAttribute('class', 'ask-quantity')
        askTotal.setAttribute('class', 'ask-total')

        askPrice.textContent = parseFloat(data[0]).toLocaleString(undefined, {minimumFractionDigits: 2})
        askQuantity.textContent = data[1]
        askTotal.textContent = parseFloat(data[0] * data[1]).toLocaleString(undefined, {minimumFractionDigits: 2})
      
        if (document.getElementsByClassName('ask-price').length >= 10) {
          document.getElementById('ask').innerHTML = '<div id="ask-trades">Price(USDT)</div><div id="ask-volume">Amount(BTC)</div><div id="ask-sum">Total(USDT)</div>' 
        }
        document.getElementById('ask-trades').firstChild.after(askPrice)
        document.getElementById('ask-volume').firstChild.after(askQuantity)
        document.getElementById('ask-sum').firstChild.after(askTotal)
      })

      bids.forEach((data) => {
        const bidPrice = document.createElement('div')
        const bidQuantity = document.createElement('div')
        const bidTotal = document.createElement('div')

        bidPrice.setAttribute('class', 'bid-price')
        bidQuantity.setAttribute('class', 'bid-quantity')
        bidTotal.setAttribute('class', 'bid-total')

        bidPrice.textContent = parseFloat(data[0]).toLocaleString(undefined, {minimumFractionDigits: 2})
        bidQuantity.textContent = data[1]
        bidTotal.textContent = parseFloat(data[0] * data[1]).toLocaleString(undefined, {minimumFractionDigits: 2})
      
        if (document.getElementsByClassName('bid-price').length >= 10) {
          document.getElementById('bid').innerHTML = '<div id="bid-trades"></div><div id="bid-volume"></div><div id="bid-sum"></div>' 
        }
        document.getElementById('bid-trades').appendChild(bidPrice)
        document.getElementById('bid-volume').appendChild(bidQuantity)
        document.getElementById('bid-sum').appendChild(bidTotal)
      })

    } 
    else if (message.stream === "btcusdt@trade") {
      const candle = {
        time: dateFormatter(message.data.E),
        open: lastCandlestick.open,
        high: lastCandlestick.high,
        low: lastCandlestick.low,
        close: message.data.p,
      }
      //candleSeries.update(candle)
      document.getElementById('price').textContent = '$' + parseFloat(message.data.p).toLocaleString(undefined, {minimumFractionDigits: 2})

      const trades = document.getElementById('tape-trades')
      const amount = document.getElementById('tape-volume')
      const timestamp = document.getElementById('tape-time')

      const price = document.createElement('div')
      const volume = document.createElement('div')
      const time = document.createElement('div')

      price.setAttribute('class', 'price')
      volume.setAttribute('class', 'volume')
      time.setAttribute('class', 'time')

      price.textContent = parseFloat(message.data.p).toLocaleString(undefined, {minimumFractionDigits: 2})
      let textColor 

      if (message.data.p > lastPrice) {textColor = 'rgb(0, 185, 55)'} 
      else if (message.data.p < lastPrice) {textColor = 'rgb(209, 25, 25)'} 
      else if (message.data.p === lastPrice) {textColor = lastColor}
      price.style.color = textColor

      volume.textContent = message.data.q

      const date = new Date(message.data.T)
      time.textContent = ((date.getHours() >= 10) ? date.getHours() : ('0' + date.getHours()))  + ':' + ((date.getMinutes() >= 10) ? date.getMinutes() : ('0' + date.getMinutes())) + ':' + ((date.getSeconds() >= 10) ? date.getSeconds() : ('0' + date.getSeconds()))

      if (document.getElementsByClassName('price').length < 22) {
        trades.firstChild.after(price)
        amount.firstChild.after(volume)
        timestamp.firstChild.after(time)
      }
      else {
        trades.removeChild(trades.lastChild)
        trades.firstChild.after(price)
        amount.removeChild(amount.lastChild)
        amount.firstChild.after(volume)
        timestamp.removeChild(timestamp.lastChild)
        timestamp.firstChild.after(time)
      }
      document.getElementById('book-price').textContent = '$' + parseFloat(message.data.p).toLocaleString(undefined, {minimumFractionDigits: 2})
      document.getElementsByTagName('title')[0].textContent = '$' + parseFloat(message.data.p).toLocaleString(undefined, {minimumFractionDigits: 2}) + ' | BTCUSDT'
      lastPrice = message.data.p
      lastColor = textColor 
  
    }
  }  
}
