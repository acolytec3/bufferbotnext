# Buffer Trading Bot

This a proof of concept trading bot/interface for the Buffer Finance protocol that takes Trading View alerts and submits 5 minute option trades on the price of ETH provided by the alert in the direction included in the alert.

## Setting up the bot

- Clone this repo
- Install dependencies using `npm i`
- Create a `.env` in the directory root following [.env.example](./.env.example)
- Set the `DEV` value to true to trade on the [Buffer testnet](./testnet.buffer.finance)
- Install [ngrok](https://ngrok.com/)


## Running the bot

- Run `npm run dev` to start the bot
- Run `path/to/ngrok http 3000`

You should see something like:
```
Session Status                online                                            
Account                       yourSecretNgrokUserName (Plan: Free)                            
Version                       3.1.1                                             
Region                        United States (us)                                
Latency                       47ms                                              
Web Interface                 http://127.0.0.1:4040                             
Forwarding                    https://b0cf-71-69-227-154.ngrok.io -> http://localhost:3000
```

Copy the forwarding address that ends in `.ngrok.io`

## Set up your Trading View Alert

- Create a new TradingView alert on an ETHUSD chart.
- Click on the `Notifications` tab
- Paste the `ngrok` address into the `Webhook URL` field, append `/api/trade` to the end of it, and make sure it has a checkmark next to it
- Select `Settings`
- Paste `{"pair":"{{ticker}}", "price": "{{close}}", "direction": "above", "accessToken": "mySuperSecretAccessToken"}` in the alert message box.  This will trigger a "long" option trade.  
  - Change direction to "below" to do "short" options.  
  - Replace the access token string with the one from your `config.json` above
- Set your trigger condition and start the alert.

## See results

If all goes well, you should see a transction logged to the console indicating a trade was submitted.

## Notes

- This bot assumes you have alread approved the Buffer contract to use USDC on the wallet you provide to it.  Make sure you go to [Buffer Finance](https://app.buffer.finance) and approve USDC before trying to use this bot.
- The access token is not required but will help secure your bot from random griefers testing out their trading strategies
- There is a hardcoded 5 second cool down period between trades.  So, if your TradingView alert gets triggered more than once per 5 seconds, every alert after the first will be ignored until the cooldown period passes


[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Facolytec3%2Fbufferbotnext&env=DEV,KEY,ALCHEMYKEY,ACCESSTOKEN,ALCHEMYGOERLIKEY&envDescription=The%20two%20real%20API%20keys%20you%20need%20(and%20you%20really%20only%20need%20one)%20is%20an%20Alchemy%20API%20Key.%20%20&envLink=https%3A%2F%2Fgithub.com%2Facolytec3%2Fbufferbotnext%2FREADME.md&project-name=my-bufferbotnext&repository-name=my-bufferbotnext)