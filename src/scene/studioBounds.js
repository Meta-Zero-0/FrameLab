export const defaultStudio={width:12,depth:12,height:3.6,floorColour:'#ffffff',wallColour:'#edf2f8'};
export function validStudio(s){return !!s && ['width','depth'].every(k=>Number.isFinite(s[k])&&s[k]>=2&&s[k]<=30)&&Number.isFinite(s.height)&&s.height>=2&&s.height<=10&&['floorColour','wallColour'].every(k=>s[k]===undefined||(typeof s[k]==='string'&&/^#[0-9a-f]{6}$/i.test(s[k])));}
export function outsideStudio(min,max,s){const e=.001;return min.x < -s.width/2-e || max.x > s.width/2+e || min.z < -s.depth/2-e || max.z > s.depth/2+e || min.y < -e || max.y > s.height+e;}
