/** Shared, side-effect-free checks for the PR Kids family application. */
export function normalizeFamilyName(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().replace(/\s+/g, ' ').toLocaleLowerCase('es-UY')
}
export function normalizeGuardianDocument(value) {
  return String(value || '').replace(/\D/g, '')
}
export function validateFamilyApplication({adult,children,authenticatedDocument}) {
  const errors = []
  const doc = normalizeGuardianDocument(adult?.documento_tutor)
  const name = String(adult?.nombre_tutor || '').trim()
  const email = String(adult?.email_tutor || '').trim()
  const phone = String(adult?.telefono_tutor || '').replace(/\D/g, '')
  if (name.length < 5) errors.push('Ingresá el nombre y apellido del adulto.')
  if (!/^[0-9]{6,12}$/.test(doc)) errors.push('Revisá la cédula del adulto.')
  if (authenticatedDocument && doc !== normalizeGuardianDocument(authenticatedDocument)) errors.push('La cédula debe coincidir con tu cuenta de Punta Rollers.')
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Ingresá un correo válido.')
  if (phone.length < 6) errors.push('Ingresá un teléfono de contacto válido.')
  if (!['madre','padre','tutor'].includes(adult?.vinculo)) errors.push('Seleccioná tu vínculo con el niño.')
  if (!Array.isArray(children) || children.length < 1 || children.length > 6) errors.push('Podés registrar entre 1 y 6 niños.')
  else {
    const normalized = children.map(child => normalizeFamilyName(child?.nombre))
    if (normalized.some(n => n.length < 3 || n.split(' ').length < 2)) errors.push('Ingresá nombre y apellido de cada niño.')
    if (new Set(normalized).size !== normalized.length) errors.push('No repitas el mismo niño en la solicitud.')
  }
  return errors
}
