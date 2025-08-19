import { ae, orth } from './ae.js'

orth('Payment', 'Refund')

class Risky {
  @ae({ type: 'Payment\\Refund', grade: 'IO' })
  async sometimesRefund(order: any) {
    // Intentionally violates the advertised type by returning kind='Refund'
    return { kind: 'Refund', id: 'rf_999', evidence: { provider: 'stub', status: 'refund' } }
  }
}

async function main() {
  console.log('Running failing demo (should throw)…')
  const r = new Risky()
  await r.sometimesRefund({ orderId: 'o-bad', amount: 10 })
}

main().catch(e => { console.error('EXPECTED FAILURE:', e.message); process.exit(1) })
