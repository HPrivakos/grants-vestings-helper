/* eslint-disable @typescript-eslint/no-unused-vars */
import 'dotenv'
import * as fs from 'fs/promises'
import * as ethers from 'ethers'
import { Contract } from '@ethersproject/contracts'
import { randomBytes } from '@ethersproject/random'
import { Grant } from './type'
import periodicTokenVestingABI from '../abis/periodicTokenVesting.json'
import batchVestingABI from '../abis/batchVesting.json'
import { getPendingGrants, getTokenAndDuration } from './utils'

const provider = new ethers.providers.InfuraProvider('homestead', process.env.INFURA_KEY)

const batchVestings = new Contract('0xc57185366bcda81cde363380e2099758712038d0', batchVestingABI, provider)
const vestingContract = new Contract('0xb76b389cd04595321d51f575f5d950df1cef3dd7', periodicTokenVestingABI, provider)

async function main() {
  const wallet = new ethers.Wallet(process.env.ETH_PRIVATE_KEY || '0000000000000000000000000000000000000000000000000000000000000001', provider)
  console.log(wallet.address)

  const pendingGrants = await getPendingGrants()
  const inputData = []
  let csv = 'Owner,Beneficiary,Token,Revocable,Pausable,Linear,Start Date,Period Duration,Cliff Duration,Vested Per Period\n'
  for (const grant of pendingGrants) {
    csv += getCSV(grant) + '\n'
    const hex = await getABI(grant)
    inputData.push(hex)
  }
  /* 
  if (!!process.env.ETH_PRIVATE_KEY) {
    const tx = await batchVestings.populateTransaction.createVestings(
      '0xe357273545c152f07afe2c38257b7b653fd3f6d0',
      '0xb76b389cd04595321d51f575f5d950df1cef3dd7',
      randomBytes(32),
      inputData
    )
    console.log(tx)
  } */

  await fs.writeFile('vestings.csv', csv)
}

void main()

function getCSV(grant: Grant): string {
  console.log(grant)

  const [token, duration] = getTokenAndDuration(grant)

  const params = [
    '0x89214c8Ca9A49E60a3bfa8e00544F384C93719b1', // owner
    grant.configuration.beneficiary, // beneficiary
    token, // token
    'yes', // isRevocable
    'yes', // isPausable
    'no', // isLinear
    Math.floor(+new Date(grant.finish_at) / 1000), // start
    60 * 60 * 24 * 30, // period
    60 * 60 * 24 * 30, // cliff (30 days)
    [grant.configuration.size / 1].join(':') // vestedPerPeriod
  ].join(',')

  return params
}

async function getABI(grant: Grant): Promise<string> {
  const [token, duration] = getTokenAndDuration(grant)

  const params = [
    '0xc31847009DD800379fB49CCd8Da98CDEfd7fBA6e', // owner
    grant.configuration.beneficiary, // beneficiary
    token, // token
    true, // isRevocable
    true, // isPausable
    true, // isLinear
    ethers.BigNumber.from(Math.floor(+new Date(grant.finish_at) / 1000)), // start
    ethers.BigNumber.from(duration), // period
    ethers.BigNumber.from(60 * 60 * 24 * 30), // cliff (30 days)
    [ethers.utils.parseUnits(grant.configuration.size.toString(), 'ether')] // vestedPerPeriod
  ]
  const { data } = await vestingContract.populateTransaction.initialize(...params)

  return data!
}
