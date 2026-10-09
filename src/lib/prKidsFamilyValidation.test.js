import {describe,it} from 'node:test'
import assert from 'node:assert/strict'
import {normalizeFamilyName,normalizeGuardianDocument,validateFamilyApplication} from './prKidsFamilyValidation.js'
const adult={nombre_tutor:'María González',documento_tutor:'1.234.567-8',email_tutor:'maria@example.com',telefono_tutor:'099 123 456',vinculo:'madre'}
const valid={adult,children:[{nombre:'Sofía González'}]}
describe('PR Kids family validation',()=>{
 it('normalizes names',()=>assert.equal(normalizeFamilyName(' SOFÍA   González '),'sofia gonzalez'))
 it('normalizes identity document',()=>assert.equal(normalizeGuardianDocument('1.234.567-8'),'12345678'))
 it('accepts one child',()=>assert.deepEqual(validateFamilyApplication(valid),[]))
 it('accepts two siblings',()=>assert.deepEqual(validateFamilyApplication({...valid,children:[{nombre:'Sofía González'},{nombre:'Juan González'}]}),[]))
 it('rejects duplicate child with accent variation',()=>assert.ok(validateFamilyApplication({...valid,children:[{nombre:'Sofía González'},{nombre:'SOFIA GONZALEZ'}]}).includes('No repitas el mismo niño en la solicitud.')))
 it('requires surname',()=>assert.ok(validateFamilyApplication({...valid,children:[{nombre:'Sofía'}]}).includes('Ingresá nombre y apellido de cada niño.')))
 it('rejects mismatched authenticated document',()=>assert.ok(validateFamilyApplication({...valid,authenticatedDocument:'99999999'}).includes('La cédula debe coincidir con tu cuenta de Punta Rollers.')))
 it('accepts matching authenticated document',()=>assert.deepEqual(validateFamilyApplication({...valid,authenticatedDocument:'12345678'}),[]))
 it('rejects invalid email',()=>assert.ok(validateFamilyApplication({...valid,adult:{...adult,email_tutor:'invalid'}}).length>0))
 it('rejects more than six children',()=>assert.ok(validateFamilyApplication({...valid,children:Array.from({length:7},(_,i)=>({nombre:'Niño '+i}))}).length>0))
 it('rejects empty child list',()=>assert.ok(validateFamilyApplication({...valid,children:[]}).length>0))
 it('rejects missing adult details',()=>assert.ok(validateFamilyApplication({adult:null,children:[{nombre:'Juan Pérez'}]}).length>0))
 it('rejects repeated child with normalized whitespace',()=>assert.ok(validateFamilyApplication({...valid,children:[{nombre:'Juan   Pérez'},{nombre:' juan pérez '}]}).length>0))
 it('rejects invalid relationship',()=>assert.ok(validateFamilyApplication({...valid,adult:{...adult,vinculo:'otro'}}).length>0))
 it('rejects short document',()=>assert.ok(validateFamilyApplication({...valid,adult:{...adult,documento_tutor:'123'}}).length>0))
 it('rejects short phone',()=>assert.ok(validateFamilyApplication({...valid,adult:{...adult,telefono_tutor:'123'}}).length>0))
})
