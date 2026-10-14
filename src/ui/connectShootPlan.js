import {makeShootPlan} from './shootPlan.js';
import {makeShootPack} from './shootPack.js';

export function connectShootPlan(snapshot,collection) {
  const button=document.createElement('button');button.type='button';button.textContent='Shoot plan';
  document.querySelector('.setup-actions').insertBefore(button,document.querySelector('#reset-all'));
  const dialog=document.createElement('dialog');dialog.className='shoot-plan-preview';
  dialog.innerHTML='<div class="shoot-plan-actions"><strong>Shoot plan preview</strong><label>Include <select data-scope><option value="current">Current shot</option><option value="all">All saved shots</option></select></label><button type="button" data-download>Download plan</button><button type="button" data-close>Close</button></div><iframe title="Shoot plan" sandbox="allow-scripts allow-modals"></iframe>';
  document.body.append(dialog);let html='',title='';
  const frame=dialog.querySelector('iframe');
  const scope=dialog.querySelector('[data-scope]');
  function generate(){
    const data=snapshot();
    if(scope.value==='all'){const {shots,activeId}=collection();html=makeShootPack(shots,data,activeId);title='FrameLab shoot pack';}
    else {title=data.title;html=makeShootPlan(data);}
    frame.srcdoc=html;dialog.querySelector('strong').textContent=scope.value==='all'?'Shoot pack preview':'Shoot plan preview';
    dialog.querySelector('[data-download]').textContent=scope.value==='all'?'Download pack':'Download plan';
  }
  scope.addEventListener('change',()=>{try{generate();}catch(error){scope.value='current';generate();document.querySelector('#setup-status').textContent=error.message;}});
  dialog.querySelector('[data-close]').onclick=()=>dialog.close();
  dialog.addEventListener('close',()=>{frame.srcdoc='';html='';});
  dialog.querySelector('[data-download]').onclick=()=>{
    const url=URL.createObjectURL(new Blob([html],{type:'text/html;charset=utf-8'})),link=document.createElement('a');
    link.href=url;link.download=scope.value==='all'?'FrameLab-shoot-pack.html':(title.replace(/[^a-z0-9 _-]/gi,'').trim().slice(0,70)||'FrameLab')+'-shoot-plan.html';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  button.onclick=()=>{
    const status=document.querySelector('#setup-status');
    try{
      if(document.querySelector('#subject-type').disabled)throw new Error('Wait for the model to finish loading.');
      if(document.querySelector('.workspace').inert)throw new Error('Wait for the current project operation to finish.');
      const invalid=[...document.querySelectorAll('.photo-panel input[type=number]')].find(el=>!el.disabled&&(el.value===''||!el.checkValidity()));
      if(invalid)throw new Error('Correct the invalid number before exporting.');
      scope.value='current';scope.querySelector('[value="all"]').disabled=!collection().shots.length;
      generate();dialog.showModal();status.textContent='';
    }catch(error){status.textContent='Could not create shoot plan: '+error.message;}
  };
}
