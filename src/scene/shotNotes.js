export const noteLabels = {look:'Intended look',action:'Posing or action',equipment:'Equipment requirements',reminders:'Reminders'};
export function validateShotNotes(value) {
  if(value===undefined)return Object.fromEntries(Object.keys(noteLabels).map(key=>[key,'']));
  if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('Invalid shoot notes.');
  return Object.fromEntries(Object.keys(noteLabels).map(key=>{
    const text=value[key]??'';
    if(typeof text!=='string'||text.length>4000)throw new Error('Invalid shoot notes: '+noteLabels[key]+'.');
    return [key,text];
  }));
}
