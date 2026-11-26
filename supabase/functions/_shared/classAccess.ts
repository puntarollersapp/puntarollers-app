export type ClassAccessItem = { id: string; eyebrow: string; title: string; schedule: string; place: string; whatsappUrl: string; mapsUrl: string };

const PUNTA_MAPS = "https://maps.app.goo.gl/7EfYwxytxeUs2tgE7?g_st=ac";
const MALDONADO_MAPS = "https://maps.app.goo.gl/ydyCKEryrD88sinp6?g_st=ac";
const WEDNESDAY: ClassAccessItem = { id: "adultos-miercoles-punta", eyebrow: "BENEFICIO COMPLEMENTARIO", title: "Miércoles · Extra RollerClass", schedule: "Principiantes 19:00–20:00 · Intermedios/Avanzados 20:00–21:00", place: "Punta del Este · Aire libre", whatsappUrl: "https://chat.whatsapp.com/BRiY1Bii4q9C8oJUwdHsj1?s=cl&p=a&mlu=0&ilr=4", mapsUrl: PUNTA_MAPS };
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


function escapeAccessHtml(value: unknown): string {
 return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}
export function paidClassAccessEmailHtml(modality: unknown, saturdayTurn: unknown): string {
 const items=classAccessForRegistration(modality,saturdayTurn);
 if(!items.length)return "";
 return '<div style="margin:24px 0"><h2 style="font-size:21px;color:#a1f0df">Todo listo para tu primera clase</h2>'+items.map(item=>'<div style="background:#22232b;border:1px solid #40414b;border-radius:14px;padding:16px;margin:12px 0;color:#fff"><h3 style="margin:0 0 8px;font-size:18px">'+escapeAccessHtml(item.title)+'</h3><p style="margin:4px 0;color:#ddd">'+escapeAccessHtml(item.schedule)+'</p><p style="margin:4px 0 14px;color:#ddd">'+escapeAccessHtml(item.place)+'</p><a style="display:inline-block;background:#16846b;color:white;padding:12px 16px;border-radius:9px;text-decoration:none;font-weight:bold;margin:3px 8px 6px 0" href="'+escapeAccessHtml(item.whatsappUrl)+'">Entrar al grupo de WhatsApp</a><a style="display:inline-block;background:#444c61;color:white;padding:12px 16px;border-radius:9px;text-decoration:none;font-weight:bold;margin:3px 0 6px" href="'+escapeAccessHtml(item.mapsUrl)+'">Cómo llegar · Google Maps</a></div>').join('')+'<p style="color:#c8c8d1;font-size:12px">Estos accesos son para familias y alumnos con inscripción confirmada. No compartas los enlaces fuera del grupo.</p></div>';
}
