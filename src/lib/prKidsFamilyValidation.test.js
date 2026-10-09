import {describe,it,expect} from 'vitest'
import {normalizeFamilyName,normalizeGuardianDocument,validateFamilyApplication} from './prKidsFamilyValidation'

const adult={nombre_tutor:'María González',documento_tutor:'1.234.567-8',email_tutor:'maria@example.com',telefono_tutor:'099 123 456',vinculo:'madre'}
const valid={adult,children:[{nombre:'Sofía González'}]}

describe('PR Kids family validation',()=>{
 it('normalizes accents and repeated spaces',()=>expect(normalizeFamilyName('  SOFÍA   González ')).toBe('sofia gonzalez'))
 it('normalizes guardian identity document',()=>expect(normalizeGuardianDocument('1.234.567-8')).toBe('12345678'))
 it('accepts one child',()=>expect(validateFamilyApplication(valid)).toEqual([]))
 it('accepts siblings with distinct names',()=>expect(validateFamilyApplication({...valid,children:[{nombre:'Sofía González'},{nombre:'Juan González'}]})).toEqual([]))
 it('rejects duplicate child with different accent and capitalization',()=>expect(validateFamilyApplication({...valid,children:[{nombre:'Sofía González'},{nombre:'SOFIA   GONZALEZ'}]})).toContain('No repitas el mismo niño en la solicitud.'))
 it('requires complete child name',()=>expect(validateFamilyApplication({...valid,children:[{nombre:'Sofía'}]})).toContain('Ingresá nombre y apellido de cada niño.'))
 it('rejects mismatched authenticated document',()=>expect(validateFamilyApplication({...valid,authenticatedDocument:'99999999'})).toContain('La cédula debe coincidir con tu cuenta de Punta Rollers.'))
 it('accepts matching authenticated document',()=>expect(validateFamilyApplication({...valid,authenticatedDocument:'12345678'})).toEqual([]))
 it('rejects invalid email',()=>expect(validateFamilyApplication({...valid,adult:{...adult,email_tutor:'invalid'}}).length).toBeGreaterThan(0))
 it('rejects more than six children',()=>expect(validateFamilyApplication({...valid,children:Array.from({length:7},(_,i)=>({nombre:'Niño '+i}))}).length).toBeGreaterThan(0))
})
