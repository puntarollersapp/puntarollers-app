import { useState } from "react"
import PublicLayout from "../layouts/PublicLayout"
import { getCupos, saveCupos } from "../data/cupos"

export default function Admin() {
  const [cupos, setCupos] = useState(getCupos())

  const update = (day, key, value) => {
    const newData = {
      ...cupos,
      [day]: {
        ...cupos[day],
        [key]: Number(value)
      }
    }

    setCupos(newData)
    saveCupos(newData)
  }

  return (
    <PublicLayout>
      <div className="p-4 space-y-6">

        <h1 className="text-xl font-bold">Admin Cupos</h1>

        <Section
          title="Miércoles"
          data={cupos.miercoles}
          onChange={(key, value) => update("miercoles", key, value)}
        />

        <Section
          title="Sábado"
          data={cupos.sabado}
          onChange={(key, value) => update("sabado", key, value)}
        />

      </div>
    </PublicLayout>
  )
}

function Section({ title, data, onChange }) {
  return (
    <div className="glass p-4 rounded-xl space-y-3">
      <p className="font-semibold">{title}</p>

      {Object.keys(data).map((key) => (
        <div key={key} className="flex justify-between items-center">
          <span className="capitalize">{key}</span>

          <input
            type="number"
            value={data[key]}
            onChange={(e) => onChange(key, e.target.value)}
            className="input-pr w-20 text-center"
          />
        </div>
      ))}
    </div>
  )
}
