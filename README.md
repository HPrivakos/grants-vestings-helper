# Helper to create vestings contracts for grants


## Create CSV for batch builder:
Run `npx ts-node src/index.ts`, it will create a vesting.csv file that you can import in [https://vestings-deployer.vercel.app/batch](https://vestings-deployer.vercel.app/batch)

## Verify vesting contract and create payment CSV
Run `npx ts-node src/fundGrants.ts {TXHASH}`

It will compare the contracts created in that txhash with the non enacted grants, verify their settings and print a csv in the console to copy paste into the CSV Airdrop app of [Gnosis Safe](https://gnosis-safe.io/app/eth:0x89214c8Ca9A49E60a3bfa8e00544F384C93719b1/apps?appUrl=https://cloudflare-ipfs.com/ipfs/QmUFKPZSn73LiwznQ3PVWQXpcaWVdYrSM6c5DES2y24EYd)