// Pure UI policy for the PR Kids entry point.
// The server must independently verify every guardian-child relationship.
export function kidsNavigationState({authenticated=false,loading=true,approvedChildren=[]}={}){
 if(!authenticated||loading)return {showKids:false,showRequest:false}
 const valid=Array.isArray(approvedChildren)&&approvedChildren.some(child=>typeof child?.id==='string'&&child.id.length>0)
 return {showKids:valid,showRequest:!valid}
}
