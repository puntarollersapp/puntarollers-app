// Only verified, approved artwork is published. Do not enable a code until its PNG is reviewed.
export const FIRST_BATCH = Object.freeze(['PR-041','PR-042','PR-043','PR-001','PR-006','PR-010','PR-019','PR-028','PR-035','PR-036'])
export const PUBLISHED_ART = FIRST_BATCH
export const BACK_PUBLISHED = true
export const frontFor = code => PUBLISHED_ART.includes(code) ? '/pr-collectibles/'+code+'.png' : null
export const officialBack = BACK_PUBLISHED ? '/pr-collectibles/PR-BACK.png' : null
export function visualRarity(card){
 if(card.rarity==='legendary')return [36,38].includes(card.number)?'diamond':'ruby'
 return ({common:'plata',holo:'holo',epic:'oro',limited:'navidad'})[card.rarity]||'plata'
}
