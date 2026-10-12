// Pure UI policy for the PR Kids entry point.
// The server must independently verify every guardian-child relationship.
export function kidsNavigationState({authenticated=false,loading=true,approvedChildren=[]}={}){
 if(!authenticated||loading)return {showKids:false,showRequest:false}
 const valid=Array.isArray(approvedChildren)&&approvedChildren.some(child=>typeof child?.id==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(child.id))
 return {showKids:valid,showRequest:!valid}
}
