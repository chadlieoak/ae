import { ae, orth } from './ae.js'

orth('Payment', 'Refund') // declare policy

class Payments {
  @ae({ type: 'Payment\\Refund', grade: 'IO' })
  async chargeCustomer(order: any) {
    return { kind: 'Payment', id: 'pay_123', evidence: { provider: 'stub', status: 'succeeded' } }
  }
}

async function main() {
  console.log('Running minimal demo...')
  const svc = new Payments()
  const out = await svc.chargeCustomer({ orderId: 'o-1', amount: 4200 })
  console.log('Result:', out)
  console.log('Witness written to .ae/witnesses.jsonl')
}
main().catch(e => { console.error('FAILED:', e.message); process.exit(1) })
