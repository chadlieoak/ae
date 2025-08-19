import { ae, orth } from './ae.js'

orth('Halts', 'Loop') // policy

type Sym = 0 | 1
type Dir = 'L' | 'R'
type State = 'A' | 'B' | 'H'
type Rule = [write: Sym, dir: Dir, next: State]
type Delta = Record<string, Rule>
type TM = { start: State, delta: Delta }

type Tape = { left: Sym[]; head: Sym; right: Sym[] }
type Cfg = { tape: Tape; state: State; steps: number }

function key(state: State, sym: Sym) { return `${state}:${sym}` }
function blankTape(): Tape { return { left: [], head: 0, right: [] } }

function moveL(t: Tape): Tape {
  const left = t.left.slice(0, -1)
  const h: Sym = (t.left.length ? t.left[t.left.length - 1] : 0) as Sym
  const right: Sym[] = [t.head, ...(t.right.length ? t.right : [0])]
  return { left, head: h, right }
}

function moveR(t: Tape): Tape {
  const left = [...t.left, t.head]
  const h: Sym = (t.right.length ? t.right[0] : 0) as Sym
  const right: Sym[] = (t.right.length ? t.right.slice(1) : []) as Sym[]
  return { left, head: h, right }
}

function write(t: Tape, s: Sym): Tape { return { left: t.left, head: s, right: t.right } }

function cfgString(c: Cfg): string {
  return `${c.state}|${c.tape.left.join('')}_(${c.tape.head})_${c.tape.right.join('')}`
}

function step(tm: TM, cfg: Cfg): Cfg {
  if (cfg.state === 'H') return cfg
  const r = tm.delta[key(cfg.state, cfg.tape.head)]
  if (!r) throw new Error(`no rule for ${cfg.state}:${cfg.tape.head}`)
  const [w, d, q] = r
  let t = write(cfg.tape, w)
  t = d === 'L' ? moveL(t) : moveR(t)
  return { tape: t, state: q, steps: cfg.steps + 1 }
}

type RunResult =
  | { kind: 'Halts'; steps: number; tape: Tape }
  | { kind: 'Loop'; steps: number; reason: 'repeat-config' | 'fuel-exhausted' }

function runToFixpoint(tm: TM, fuel = 20000): RunResult {
  let cfg: Cfg = { tape: blankTape(), state: tm.start, steps: 0 }
  const seen = new Set<string>()
  for (let i = 0; i < fuel; i++) {
    const sig = cfgString(cfg)
    if (seen.has(sig)) return { kind: 'Loop', steps: cfg.steps, reason: 'repeat-config' }
    seen.add(sig)
    if (cfg.state === 'H') return { kind: 'Halts', steps: cfg.steps, tape: cfg.tape }
    cfg = step(tm, cfg)
  }
  return { kind: 'Loop', steps: cfg.steps, reason: 'fuel-exhausted' }
}

@ae({ type: 'Halts\\Loop', grade: 'IO' })
async function runTM_IO(tm: TM) {
  const res = runToFixpoint(tm, 20000)
  if (res.kind === 'Loop') {
    throw new Error(`[æ] Type violation: machine loops (${res.reason}) after ${res.steps} steps`)
  }
  return res
}

const TM_HALTS: TM = {
  start: 'A',
  delta: {
    'A:0': [1, 'R', 'B'],
    'A:1': [1, 'R', 'H'],
    'B:0': [1, 'L', 'H'],
    'B:1': [1, 'L', 'A'],
  }
}

const TM_LOOPS: TM = {
  start: 'A',
  delta: {
    'A:0': [0, 'R', 'B'],
    'A:1': [1, 'R', 'B'],
    'B:0': [0, 'L', 'A'],
    'B:1': [1, 'L', 'A'],
  }
}

async function main() {
  console.log('TM that halts…')
  const h = await runTM_IO(TM_HALTS)
  console.log('Result:', h)

  console.log('\nTM that loops… (should be rejected)')
  try {
    const l = await runTM_IO(TM_LOOPS)
    console.log('Unexpected:', l)
  } catch (e: any) {
    console.log('Rejected as expected:', e.message)
  }
  console.log('\nCheck .ae/witnesses.jsonl — only the Halts execution is witnessed.')
}
main().catch(e => { console.error('FAILED:', e); process.exit(1) })
