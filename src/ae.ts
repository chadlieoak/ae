// Enhanced æ adapter: orthogonality + difference checks + witness echo

export type Grade = 'Syn' | 'Build' | 'Run' | 'IO'
export type Ty = string

// ---- Policy registry ----
const orthogonals = new Set<string>() // stored as "A|B" sorted
function keyAB(A: Ty, B: Ty) { return [A, B].sort().join('|') }
export function orth(A: Ty, B: Ty) { orthogonals.add(keyAB(A, B)) }
export function isOrtho(A: Ty, B: Ty) { return orthogonals.has(keyAB(A, B)) }

// ---- Witness writer ----
import fs from 'fs'
fs.mkdirSync('.ae', { recursive: true })
const witnessFile = '.ae/witnesses.jsonl'

type Witness = {
  type: `W<${string}>`,
  termType: Ty,
  grade: Grade,
  timestamp: string,
  actor: string,
  inputsHash: string,
  outputsHash: string,
  caps: string[],
  evidence: any
}

function shaStub(x: unknown): string {
  const s = JSON.stringify(x)
  let h = 0
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h) + s.charCodeAt(i) | 0
  return 'stub:' + (h >>> 0).toString(16)
}

function appendWitness(w: Witness) {
  fs.appendFileSync(witnessFile, JSON.stringify(w) + '\n', 'utf8')
  console.log('WITNESS:', w) // echo to console for visibility
}

// ---- Difference type parser "A\B" ----
function parseDiff(ty: Ty): {A: Ty, B: Ty} | null {
  const i = ty.indexOf('\\')
  if (i < 0) return null
  return { A: ty.slice(0, i), B: ty.slice(i + 2) }
}

// ---- Decorator ----
export function ae(meta: { type: Ty, grade: Grade }) {
  return function (_target: any, key: string, desc: PropertyDescriptor) {
    const fn = desc.value
    // On define: check that "A\B" only used when A ⟂ B declared
    const d = parseDiff(meta.type)
    if (d && !isOrtho(d.A, d.B)) {
      console.warn(`[æ] Warning: ${meta.type} claims A\\B but orthogonality ${d.A} ⟂ ${d.B} not declared.`)
    }
    desc.value = async (...args: any[]) => {
      const out = await fn(...args)
      if (meta.grade === 'IO') {
        appendWitness({
          type: `W<${meta.type}>` as const,
          termType: meta.type,
          grade: meta.grade,
          timestamp: new Date().toISOString(),
          actor: key,
          inputsHash: shaStub(args),
          outputsHash: shaStub(out),
          caps: [`cap:${key}`],
          evidence: out?.evidence ?? { status: 'ok' }
        })
      }
      if (d && out && typeof out === 'object' && 'kind' in out) {
        const k = String((out as any).kind)
        if (k === d.B) {
          throw new Error(`[æ] Type violation: function advertised ${meta.type} but returned kind='${k}'`)
        }
      }
      return out
    }
  }
}
