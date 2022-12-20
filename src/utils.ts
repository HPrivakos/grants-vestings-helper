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

export function getTokenAndDuration(grant: Grant): [string, number] {
  const tier = +grant.configuration.tier.split(':')[0].replace('Tier', '').trim()
  const token = tier > 3 ? '0x6B175474E89094C44Da98b954EedeAC495271d0F' : '0x0f5d2fb29fb7d3cfee444a200298f468908cc942'
  const duration = tier > 3 ? 60 * 60 * 24 * 30 * 6 : 60 * 60 * 24 * 30 * 3
  return [token, duration]
}
