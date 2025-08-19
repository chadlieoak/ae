import { ae, orth } from './ae.js'

orth('Payment', 'Refund')

type Plan = { op: 'charge', amount: number, currency: string, customerId: string }
function planCharge(input: { amount: number, currency: string, customerId: string }): Plan {
  return { op: 'charge', amount: input.amount, currency: input.currency, customerId: input.customerId }
}

type BuildOk = { op: 'charge', amount: number, currency: 'USD'|'EUR', customerId: string }
function buildCharge(p: Plan): BuildOk {
  if (p.amount <= 0) throw new Error('amount must be > 0')
  if (!['USD','EUR'].includes(p.currency)) throw new Error('unsupported currency')
  return { ...p, currency: p.currency as 'USD'|'EUR' }
}

type Preflight = BuildOk & { risk: 'low'|'med'|'high' }
function preflightCharge(b: BuildOk): Preflight {
  const risk: 'low'|'med'|'high' = b.amount < 10000 ? 'low' : b.amount < 100000 ? 'med' : 'high'
  if (risk === 'high') throw new Error('risk too high for this lane')
  return { ...b, risk }
}

class Executor {
  @ae({ type: 'Payment\\Refund', grade: 'IO' })
  async executeCharge(p: Preflight) {
    const providerResp = { provider: 'stub-pay', status: 'succeeded', id: 'pay_abc123' }
    return { kind: 'Payment', id: providerResp.id, evidence: providerResp }
  }
}

export async function chargePipeline(input: { amount: number, currency: string, customerId: string }) {
  const plan = planCharge(input)
  const specialized = buildCharge(plan)
  const preflight = preflightCharge(specialized)
  const exec = new Executor()
  const payment = await exec.executeCharge(preflight)
  return payment
}

async function main() {
  console.log('æ-pipeline demo starting…')
  const payment = await chargePipeline({ amount: 4200, currency: 'USD', customerId: 'cust_42' })
  console.log('Pipeline result:', payment)
  console.log('Witness written to .ae/witnesses.jsonl')
}
main().catch(e => { console.error('FAILED:', e); process.exit(1) })
