export function guardianFlow({hasAdultAccount=false,hasApprovedChildren=false}={}) {
 if(hasApprovedChildren)return 'family-home'
 return hasAdultAccount?'request-child-link':'request-adult-access'
}
