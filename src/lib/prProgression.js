export const PR_LEVELS=[
 {n:1,name:'Punto de partida',min:0},
 {n:2,name:'En movimiento',min:50},
 {n:3,name:'Constancia',min:150},
 {n:4,name:'Rodaje',min:300},
 {n:5,name:'Impulso',min:500},
 {n:6,name:'Dominio',min:800},
 {n:7,name:'Referente PR',min:1200},
]

export function calculatePRProgression({km=0,sessions=0,completedGoals=0,milestones=0,takes=0}={}){
 const score=Math.round(Math.min(1500,Number(km||0)*.7+Number(sessions||0)*4+Number(completedGoals||0)*25+Number(milestones||0)*20+Number(takes||0)*5))
 const level=[...PR_LEVELS].reverse().find(x=>score>=x.min)||PR_LEVELS[0]
 const next=PR_LEVELS.find(x=>x.n===level.n+1)||null
 const progress=next?Math.max(0,Math.min(100,((score-level.min)/(next.min-level.min))*100)):100
 return{score,level,next,progress}
}

export const PR_PROGRESSION_IS_BETA=true
