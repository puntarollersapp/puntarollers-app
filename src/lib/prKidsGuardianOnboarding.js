export function guardianFlow({hasAdultAccount=false,hasApprovedChildren=false}={}) {
 if(hasApprovedChildren)return 'family-home'
 return hasAdultAccount?'request-child-link':'request-adult-access'
}

// A declared existing account cannot be linked by entering a document alone.
export function existingGuardianNeedsLogin({claimsExistingAccount=false,authenticatedAdultId=''}={}) {
 return claimsExistingAccount && !authenticatedAdultId
}
