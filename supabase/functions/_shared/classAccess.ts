export type ClassAccessItem = { id: string; eyebrow: string; title: string; schedule: string; place: string; whatsappUrl: string; mapsUrl: string };

const PUNTA_MAPS = "https://maps.app.goo.gl/7EfYwxytxeUs2tgE7?g_st=ac";
const MALDONADO_MAPS = "https://maps.app.goo.gl/ydyCKEryrD88sinp6?g_st=ac";
const WEDNESDAY: ClassAccessItem = { id: "adultos-miercoles-punta", eyebrow: "BENEFICIO COMPLEMENTARIO", title: "Miércoles · Extra RollerClass", schedule: "Principiantes 19:30–20:30 · Intermedios/Avanzados 20:30–21:30", place: "Punta del Este · Aire libre", whatsappUrl: "https://chat.whatsapp.com/BRiY1Bii4q9C8oJUwdHsj1?s=cl&p=a&mlu=0&ilr=4", mapsUrl: PUNTA_MAPS };
const SATURDAY_ADVANCED: ClassAccessItem = { id: "adultos-sabado-avanzados-punta", eyebrow: "TU TURNO DEL SÁBADO", title: "Intermedios + Avanzados", schedule: "Sábado · 08:00 a 09:00 hrs", place: "Punta del Este · Aire libre", whatsappUrl: "https://chat.whatsapp.com/Fs1yJr2ATuF1mVtAtOdBVy?s=cl&p=a&mlu=0&ilr=4", mapsUrl: PUNTA_MAPS };
const SATURDAY_BEGINNERS: ClassAccessItem = { id: "adultos-sabado-principiantes-punta", eyebrow: "TU TURNO DEL SÁBADO", title: "Principiantes", schedule: "Sábado · 09:00 a 10:00 hrs", place: "Punta del Este · Aire libre", whatsappUrl: "https://chat.whatsapp.com/En2IfafAeff30DHQYjrp4k?s=cl&p=a&mlu=0&ilr=4", mapsUrl: PUNTA_MAPS };
const SATURDAY_INDOOR: ClassAccessItem = { id: "adultos-sabado-mixto-maldonado", eyebrow: "TU TURNO DEL SÁBADO", title: "Adultos · Grupo mixto", schedule: "Sábado · 20:00 a 21:00 hrs", place: "Maldonado · Pista cerrada", whatsappUrl: "https://chat.whatsapp.com/BRaN0srwALXJ9gEBbI3EJU?s=cl&p=a&mlu=0&ilr=4", mapsUrl: MALDONADO_MAPS };
const KIDS_INDOOR: ClassAccessItem = { id: "kids-sabado-maldonado", eyebrow: "PR KIDS", title: "PR Kids · Pista cerrada", schedule: "Sábado · 19:00 a 20:00 hrs", place: "Maldonado · Pista cerrada", whatsappUrl: "https://chat.whatsapp.com/EofrShPOSpU0lMAU292EIH?s=cl&p=a&mlu=0&ilr=4", mapsUrl: MALDONADO_MAPS };

export function classAccessForRegistration(modality: unknown, saturdayTurn: unknown): ClassAccessItem[] {
  if (modality === "kids") return [KIDS_INDOOR];
  if (modality !== "grupales" || typeof saturdayTurn !== "string") return [];
  let saturday: ClassAccessItem | null = null;
  // Resolve by level first so both old and new saved slots reach the correct existing WhatsApp group.
  if (/20:00\s*[–-]\s*21:00|pista cerrada/i.test(saturdayTurn)) saturday = SATURDAY_INDOOR;
  else if (/principiante/i.test(saturdayTurn)) saturday = SATURDAY_BEGINNERS;
  else if (/intermedio|avanzado/i.test(saturdayTurn)) saturday = SATURDAY_ADVANCED;
  return saturday ? [WEDNESDAY, saturday] : [];
}
