import { useState } from 'react'

/**
 * Pilot-only UI. No persistent consent or authorization is granted here.
 * Mount only after server-side guardian and child authorization checks.
 */
export default function PRKidsImageConsentPilot({ children = [], onClose }) {
  const [choices, setChoices] = useState({})
  return (
    <section aria-label="Prueba de autorizaciones de imagen" style={{ padding: 20, border: '1px solid #aaa', borderRadius: 16 }}>
      <h2>PR KIDS · ¡Nuestros momentos sobre ruedas! 🛼</h2>
      <p><strong>Versión de prueba:</strong> las respuestas no se guardan ni autorizan publicaciones.</p>
      <p>En Punta Rollers sacamos fotos y grabamos videos de nuestras clases para compartir lo que hacemos en nuestras redes sociales, principalmente Instagram y Facebook.</p>
      <p>Como adulto responsable, vos decidís si tu hijo o hija puede aparecer en esas publicaciones.</p>
      {children.map(child => (
        <fieldset key={child.id} style={{ marginBottom: 16, padding: 16 }}>
          <legend>{child.nombre || child.nombre_confirmado || 'Perfil infantil'}</legend>
          <label style={{ display: 'block', marginBottom: 10 }}>
            <input type="radio" name={`image-consent-${child.id}`} checked={choices[child.id] === 'yes'} onChange={() => setChoices(prev => ({ ...prev, [child.id]: 'yes' }))} />
            {' '}Sí, autorizo fotografías y videos de mi hijo/a.
          </label>
          <label style={{ display: 'block' }}>
            <input type="radio" name={`image-consent-${child.id}`} checked={choices[child.id] === 'no'} onChange={() => setChoices(prev => ({ ...prev, [child.id]: 'no' }))} />
            {' '}No autorizo publicaciones de mi hijo/a.
          </label>
        </fieldset>
      ))}
      <p>Tu decisión no afecta su participación en PR Kids. Podés cambiarla más adelante.</p>
      <p aria-live="polite">{children.length && children.every(child => choices[child.id]) ? 'Prueba completada. Ninguna autorización fue registrada.' : 'Seleccioná una opción para cada niño para completar la simulación.'}</p>
      {onClose && <button type="button" onClick={onClose}>Cerrar prueba</button>}
    </section>
  )
}
