import { getPendingGrants, getTokenAndDuration } from './utils'
import 'dotenv'
import * as ethers from 'ethers'
import { Contract } from '@ethersproject/contracts'
import periodicTokenVestingABI from '../abis/periodicTokenVesting.json'
import factoryABI from '../abis/factory.json'
import BigNumber from 'bignumber.js'
import { log } from 'console'

const provider = new ethers.providers.InfuraProvider('homestead', process.env.INFURA_KEY)

const vestingContract = new Contract('0xb76b389cd04595321d51f575f5d950df1cef3dd7', periodicTokenVestingABI, provider)
const vestingFactory = new Contract('0xe357273545c152f07afe2c38257b7b653fd3f6d0', factoryABI, provider)

async function main() {
  const txHash = process.argv[2]
  if (!txHash) throw new Error('Missing tx hash as parameter')

  const pendingGrants = await getPendingGrants()
  const tx = await provider.getTransaction(txHash)

  console.log(`token_type,token_address,receiver,amount,id`)

  const events = await vestingFactory.queryFilter('VestingCreated', /* tx.blockNumber, tx.blockNumber */ 17721966)
  console.log(events.length)
  const errors = []
  const total = { mana: 0, dai: 0 }
  for (const event of events /* .filter((a) => a.transactionHash == tx.hash) */) {
    const contract = vestingContract.attach(event.args!['_address'])
    //if (contract.address != '0x19076C40e58EDB981b92D49D4733Ee02361c3D35') continue
    const beneficiary = await contract.getBeneficiary()
    log(pendingGrants[0].configuration.beneficiary.toLowerCase(), beneficiary.toLowerCase())
    const pending = pendingGrants.find((grant) => grant.configuration.beneficiary.toLowerCase() == beneficiary.toLowerCase())
    if (pending) {
      console.log(pending)

      const totalToken = await contract.getTotal()

      const [token, duration, startDay] = getTokenAndDuration(pending)

      const getTotal = new BigNumber((await contract.getTotal()).toString()).dividedBy(new BigNumber(10).pow(18)).toNumber()
      const periods: ethers.BigNumber[] = (await contract.getVestedPerPeriod()).map((a: ethers.BigNumber) => a.div(10 ** 9).div(10 ** 9))
      const finishAt = new Date(pending.finish_at)
      const startDate = new Date(finishAt.setUTCMonth(finishAt.getMonth() + 1, startDay)).setUTCHours(0, 0, 0, 0) / 1000
      // check start date is the same and start date is within the next month
      const contractStartDate = (await contract.getStart()).toNumber()
      if (contractStartDate != startDate && contractStartDate < startDate + 86400) {
        errors.push(new Error('Wrong start date'))
        continue
      }
      if ((await contract.getCliff()) != '0') {
        errors.push(new Error('Wrong cliff'))
        continue
      }
      if ((await contract.getIsLinear()) != false) {
        errors.push(new Error('Linear'))
        continue
      }
      if ((await contract.getIsPausable()) != true) {
        errors.push(new Error('Not pausable'))
        continue
      }
      if ((await contract.getIsRevocable()) != true) {
        errors.push(new Error('Not revocable'))
        continue
      }
      if ((await contract.getIsRevoked()) != false) {
        errors.push(new Error('REVOKED!'))
        continue
      }
      if ((await contract.paused()) != false) {
        errors.push(new Error('PAUSED!'))
        continue
      }
      if ((await contract.getPeriod()).toNumber() != 2628000) {
        errors.push(new Error('Wrong period length'))
        continue
      }
      if (periods.length != duration) {
        errors.push(new Error('Wrong periods number'))
        continue
      }
      if ((await contract.getToken()) != token) {
        errors.push(new Error('Wrong token'))
        continue
      }
      if (token == '0x6B175474E89094C44Da98b954EedeAC495271d0F' && getTotal != pending.configuration.size) {
        errors.push(new Error(`Wrong vested amount: total: ${getTotal}, ${pending.configuration.size}`))
        continue
      }
      total[token == '0x6B175474E89094C44Da98b954EedeAC495271d0F' ? 'dai' : 'mana'] += +ethers.utils.formatEther(totalToken)
      console.log(['erc20', token, event.args!['_address'], ethers.utils.formatEther(totalToken), ''].join(','))
    }
  }
  if (total.dai) console.log('Total DAI:', total.dai)
  if (total.mana) console.log('Total MANA:', total.mana)
  if (errors.length) {
    console.error('Errors:')
    console.error(errors)
  }
}
void main()
