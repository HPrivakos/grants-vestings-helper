import { getPendingGrants, getTokenAndDuration } from './utils'
import 'dotenv'
import * as ethers from 'ethers'
import { Contract } from '@ethersproject/contracts'
import periodicTokenVestingABI from '../abis/periodicTokenVesting.json'
import factoryABI from '../abis/factory.json'

const provider = new ethers.providers.InfuraProvider('homestead', process.env.INFURA_KEY)

const vestingContract = new Contract('0xb76b389cd04595321d51f575f5d950df1cef3dd7', periodicTokenVestingABI, provider)
const vestingFactory = new Contract('0xe357273545c152f07afe2c38257b7b653fd3f6d0', factoryABI, provider)

async function main() {
  const txHash = process.argv[2]
  if (!txHash) throw new Error('Missing tx hash as parameter')

  const pendingGrants = await getPendingGrants()
  const tx = await provider.getTransaction(txHash)

  console.log(`token_type,token_address,receiver,amount,id`)

  const events = await vestingFactory.queryFilter('VestingCreated', tx.blockNumber, tx.blockNumber)
  for (const event of events.filter((a) => a.transactionHash == tx.hash)) {
    const contract = vestingContract.attach(event.args!['_address'])
    const beneficiary = await contract.getBeneficiary()
    const pending = pendingGrants.find((grant) => grant.configuration.beneficiary == beneficiary)
    if (pending) {
      const [token, duration] = getTokenAndDuration(pending)
      if ((await contract.getCliff()) != '2592000') throw new Error('Wrong cliff')
      if ((await contract.getIsLinear()) != true) throw new Error('Not linear')
      if ((await contract.getIsPausable()) != true) throw new Error('Not pausable')
      if ((await contract.getIsRevocable()) != true) throw new Error('Not revocable')
      if ((await contract.getIsRevoked()) != false) throw new Error('REVOKED!')
      if ((await contract.paused()) != false) throw new Error('PAUSED!')
      if ((await contract.getPeriod()) != duration) throw new Error('Wrong period length')
      if ((await contract.getToken()) != token) throw new Error('Wrong token')
      if ((await contract.getStart()) != Math.floor(+new Date(pending.finish_at) / 1000)) throw new Error('Wrong start date')

      console.log(['erc20', token, event.args!['_address'], pending.configuration.size, pending.configuration.title.replace(/,/g, '')].join(','))
    }
  }
}
void main()
