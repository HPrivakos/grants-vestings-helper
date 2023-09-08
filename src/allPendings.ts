import { getPendingGrants, getTokenAndDuration } from './utils'

async function main() {
  const pendingGrants = await getPendingGrants()

  const total = { mana: 0, dai: 0 }
  for (const pending of pendingGrants) {
    if (pending) {
      const [token] = getTokenAndDuration(pending)
      total[token == '0x6B175474E89094C44Da98b954EedeAC495271d0F' ? 'dai' : 'mana'] += pending.configuration.size
      if (token == '0x6B175474E89094C44Da98b954EedeAC495271d0F')
        console.log(`${pending.configuration.size.toLocaleString('en-us')} USD - ${new Date(pending.finish_at).toISOString()} - ${pending.configuration.title}`)
    }
  }
  if (total.dai) console.log('Total DAI:', total.dai + 180000)
  if (total.mana) console.log('Total MANA:', total.mana)
}
void main()
