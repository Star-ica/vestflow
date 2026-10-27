# VestFlow

Lock tokens with a cliff and release them linearly.

Create a schedule for any address. Nothing unlocks before the cliff, then tokens vest evenly until the end. The creator can revoke what has not vested yet.

## Run
1. Serve this folder: `python3 -m http.server 8080` and open http://localhost:8080
2. Click **Connect wallet**. The app adds/switches to BOT Chain Testnet (Chain ID 968, RPC https://rpc.bohr.life, explorer https://scan.botchain.ai).
3. Click **Deploy new copy** (deploys the test token(s) and VestFlow), or paste an existing address and click **Use this address**. To pin an address for everyone, set `address` in config.js.
4. Use **Get test tokens** and **Approve**, then the action cards.

## Manual deploy (Remix)
Open contracts/VestFlow.sol, compile with 0.8.20+ (EVM version paris), deploy TestToken first, then VestFlow with the constructor arguments listed in config.js under deploy.args.

## Notes
Testnet demo code, not audited. TestToken has a public faucet and mint.
# vestflow
