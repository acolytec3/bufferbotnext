import { NextApiRequest, NextApiResponse } from "next";
import {
  MainnetAbi__factory,
  TestnetAbi__factory,
} from "../../../types/ethers-contracts";
import { ethers } from "ethers";
import { MAINNET_ADDRESS, TESTNET_ADDRESS } from "./util/constants";
type Data = {
  name: string;
};

const inDevEnvironment = process.env.DEV === 'true'
const provider = new ethers.providers.EtherscanProvider(
  421613,
 inDevEnvironment ? process.env.ALCHEMYGOERLIKEY : process.env.ALCHEMYKEY
);
const signer = new ethers.Wallet(process.env.WALLETKEY!, provider);
const accessToken = process.env.ACCESSTOKEN
type Order = {
  pair: string;
  price: string;
  direction: string;
  accessToken?: string;
  size?: string;
  duration?: string
};

const pairs = {
  ETHUSD: inDevEnvironment ? "0xd7c4448e2Ac721e77360d86e413Ae66620034b8A" : "0x89dd9ba4d290045211a6ce597a98181c7f9d899d",
  BTCUSD: "0x532321e6a2d8a54cf87e34850a7d55466b1ec197",
  ETHBTC: "0x5d6f1d376e5ea088532ae03dbe8f46177c42b814",
  LINKUSD: "0xd384131b8697f28e8505cc24e1e405962b88b21f",
  EURUSD: "0xbcd52d37f41da2277af92617d70931a787f66fd5",
  GBPUSD: "0x5d61fe708c9d41acf59009013f14496d559aad09",
  AUDUSD: "0x63e0af4ec5af8d103c1fb2ab606bd938d3dd27da",
  USDJPY: "0xa51696a6b909314ce0fb66d180d3f05c21804234",
  EURGBP: "0x7b5e6b8ae5840f5e78f79689b29c441b90803cb0",
  EURJPY: "0x6c42ce8098ef47a9e2171d931e89f0fb9ff0465d",
};

const wlIPs = ["52.89.214.238", "34.212.75.30", "54.218.53.128", "52.32.178.7"];
let cooledOff = true;
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  return new Promise(async (resolve) => {
  if (req.method === "POST") {
    if (
      wlIPs.findIndex((el) => el === req.headers["x-forwarded-for"]) &&
      cooledOff === true
    ) {
      const num = await makeTrade(req)
      cooledOff = false; 
      setTimeout(() => cooledOff = true, 1) // Starts a cooldown period before the next trade can be submitted
      res.status(200);
    } else {
      res.status(400).json({ name: "Unauthorized"})
    } 
  } else {
    res.status(400).json({ name: "Unauthorized"})
  }
  resolve(undefined)
})
}


export const makeTrade = async (req: NextApiRequest): Promise<number> => {
  const trade = (await req.body) as Order;
  if (accessToken && trade.accessToken !== accessToken) {
    // If an accessToken is provided, verify access token before processing trade
    return 401;
  }

  const buffer = inDevEnvironment ? TestnetAbi__factory.connect(TESTNET_ADDRESS, signer) : MainnetAbi__factory.connect(MAINNET_ADDRESS, signer)
  
  let contract = "";

  switch (trade.pair) {
    case "ETHUSD":
      contract = pairs.ETHUSD;
      break;
    case "BTCUSD":
      contract = pairs.BTCUSD;
      break;
    case "ETHBTC":
      contract = pairs.ETHBTC;
      break;
    case "LINKUSD":
      contract = pairs.LINKUSD;
      break;
    case "EURUSD":
      contract = pairs.EURUSD;
      break;
    case "EURBGP":
      contract = pairs.EURGBP;
      break;
    case "EURJPY":
      contract = pairs.EURJPY;
      break;
    case "GBPUSD":
      contract = pairs.GBPUSD;
      break;
    case "AUDUSD":
      contract = pairs.AUDUSD;
      break;
    case "USDJPY":
      contract = pairs.USDJPY;
      break;
    default:
      "";
  }

  const price = ethers.BigNumber.from(parseFloat(trade.price) * 10 ** 8)
  console.log(price)
  try {
    const gas = await buffer.estimateGas.initiateTrade(
       trade.size ? (1000000 * parseInt(trade.size)).toString() : "5000000",
     trade.duration ? (60 * parseInt(trade.duration)).toString() : "300",
      trade.direction === "above",
      contract,
      price,
      "50",
      true,
      "",
      0
    );

    
    const gasPrice = await provider.getGasPrice();
    const nonce = await provider.getTransactionCount(signer.address);
    const tradeRes = await buffer.initiateTrade(
      trade.size ? (1000000 * parseInt(trade.size)).toString() : "6000000", // Trade value is trade.size or 1 USDC
      trade.duration ? (60 * parseInt(trade.duration)).toString() : "300", // Timelimit is trade.duration (in minutes) or 5 minutes (5 * 60 seconds)
      trade.direction === "above", // Trade is "long" if trade.direction is "above", otherwise "short"
      contract, // Matched to the pair from TV alert
      parseFloat(trade.price) * 10 ** 8, // Current price times 10^8 - Contract uses 8 decimal places
      "50", // Slippage (defaults to 50 bips like web ui)
      true, // Allow partial fill
      "", // Referral code -- defaults to blank
      0, // Optopi token ID -- we default to 0 but you could check in the contract
      {
        gasLimit: gas.add(100000),
        maxFeePerGas: gasPrice,
        maxPriorityFeePerGas: ethers.BigNumber.from(1),
        nonce: nonce,
      }
    );
    console.log(tradeRes);
  } catch (err) {
    console.log(err);
  }
  
  return 200;
};
