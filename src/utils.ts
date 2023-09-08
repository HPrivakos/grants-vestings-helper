import undici from 'undici'
import { Grant } from './type'

export async function getPendingGrants(): Promise<Grant[]> {
  const { statusCode, body } = await undici.request('https://governance.decentraland.org/api/proposals?limit=25&offset=0&status=passed&type=grant')
  if (statusCode !== 200) return []
  let data = ''
  for await (const d of body) {
    data += d.toString()
  }
  const json: { ok: true; total: number; data: Grant[] } = JSON.parse(data)
  return json.data
}

export function getTokenAndDuration(grant: Grant): [string, number, number] {
  const token = grant.configuration.paymentToken == 'DAI' ? '0x6B175474E89094C44Da98b954EedeAC495271d0F' : '0x0F5D2fB29fb7d3CFeE444a200298f468908cC942'
  const duration = grant.configuration.projectDuration
  const start = grant.configuration.vestingStartDate == '1st' ? 1 : 15
  return [token, duration, start]
}
