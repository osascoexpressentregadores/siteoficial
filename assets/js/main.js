const SHEET_WEBHOOK_URL='https://script.google.com/macros/s/AKfycby1f0lm7VcHIy0TbmNkNWaON1DtPOmXnERP4Nlif5o8JA2IY4_abUnX2BgPMxA5UxNT/exec';
const WA_CLIENTE='5511986661784';
const WA_SUPORTE='5511924782555';
function $(s,root=document){return root.querySelector(s)}
function $all(s,root=document){return [...root.querySelectorAll(s)]}
function toggleMenu(){const m=$('#menu');const b=document.querySelector('[data-menu-toggle]'); if(m){const open=m.classList.toggle('open'); if(b){b.setAttribute('aria-expanded',open?'true':'false');b.setAttribute('aria-label',open?'Fechar menu principal':'Abrir menu principal')}}}
function wa(phone,msg){return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`}
function getUtm(){const p=new URLSearchParams(location.search);return{utm_source:p.get('utm_source')||'',utm_medium:p.get('utm_medium')||'',utm_campaign:p.get('utm_campaign')||'',utm_term:p.get('utm_term')||'',utm_content:p.get('utm_content')||''}}
function leadTemp(volume,problem){const hot=['31 a 60 entregas por dia','61 a 100 entregas por dia','Mais de 100 entregas por dia'];const strong=['Organizar entregas recorrentes','Cobrir horário de pico','Reduzir atrasos e falhas','Ter suporte e acompanhamento','Crescer com mais previsibilidade'];if(hot.includes(volume)&&strong.includes(problem))return'Lead quente';if(hot.includes(volume))return'Lead morno';return'Lead inicial'}
function sendSheet(payload){try{const blob=new Blob([JSON.stringify(payload)],{type:'text/plain;charset=utf-8'});if(navigator.sendBeacon&&navigator.sendBeacon(SHEET_WEBHOOK_URL,blob))return Promise.resolve(true);return fetch(SHEET_WEBHOOK_URL,{method:'POST',mode:'no-cors',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(payload)}).then(()=>true).catch(()=>false)}catch(e){return Promise.resolve(false)}}
function lockButton(btn,text){if(!btn)return;btn.dataset.old=btn.textContent;btn.disabled=true;btn.classList.add('loading');btn.textContent=text||'Enviando...'}
function unlockButton(btn){if(!btn)return;btn.disabled=false;btn.classList.remove('loading');btn.textContent=btn.dataset.old||'Enviar'}
function clearFormMessages(form){form.querySelectorAll('.form-error,.form-success').forEach(el=>el.remove())}
function showFormError(form,msg){clearFormMessages(form);const p=document.createElement('p');p.className='form-error';p.setAttribute('role','alert');p.textContent=msg;const btn=form.querySelector('button[type="submit"]');if(btn)btn.insertAdjacentElement('beforebegin',p);else form.appendChild(p)}
function showFormSuccess(form,msg){clearFormMessages(form);const box=document.createElement('div');box.className='form-success';box.setAttribute('role','status');box.textContent=msg||'Mensagem enviada! O WhatsApp abrirá em instantes com sua solicitação.';form.prepend(box)}
function handleClientForm(e){e.preventDefault();const form=e.currentTarget;const btn=form.querySelector('button[type="submit"]');const nome=form.nome?.value.trim();const whatsapp=form.whatsapp?.value.trim();const bairro=form.bairro_cidade?.value.trim()||'';const empresa=form.empresa?.value.trim()||'';const cargo=form.cargo?.value.trim()||'';const email=form.email?.value.trim()||'';const tamanhoTime=form.tamanho_time?.value||'';const tipo=form.tipo_operacao?.value||'';const volume=form.volume?.value||'';const problema=form.problema?.value||'';if(!nome||!whatsapp||!tipo||!volume||!problema){showFormError(form,'Preencha nome, WhatsApp, tipo de operação, volume e principal necessidade.');return}clearFormMessages(form);lockButton(btn,'Enviando e abrindo WhatsApp...');const msg=`Olá, vim pelo site da Osasco Express e quero uma orientação inicial.

Nome: ${nome}
WhatsApp: ${whatsapp}
Cidade/Bairro: ${bairro || 'não informado'}
Empresa: ${empresa || 'não informado'}
Cargo: ${cargo || 'não informado'}
E-mail corporativo: ${email || 'não informado'}
Tamanho do time/operação: ${tamanhoTime || 'não informado'}
Tipo de operação: ${tipo}
Volume aproximado: ${volume}
Principal necessidade: ${problema}`;const payload={tipo_formulario:'cliente',origem:'site',nome,whatsapp,email,empresa,cargo,tamanho_time:tamanhoTime,tipo_operacao:tipo,nome_negocio:'',volume,periodo_critico:'',modelo_atual:'',problema,bairro_cidade:bairro,frequencia:'',observacoes:'',temperatura:leadTemp(volume,problema),status:'Novo cadastro',pagina:location.href,dispositivo:navigator.userAgent,mensagem_whatsapp:msg,...getUtm()};sendSheet(payload).finally(()=>{if(window.gtag)gtag('event','generate_lead',{event_category:'lead',event_label:'cliente_site'});showFormSuccess(form);const opened=window.open(wa(WA_CLIENTE,msg),'_blank','noopener');if(!opened) location.href=wa(WA_CLIENTE,msg);form.reset();unlockButton(btn)})}
function handleRiderForm(e){e.preventDefault();const form=e.currentTarget;const btn=form.querySelector('button[type="submit"]');const nome=form.nome?.value.trim();const whatsapp=form.whatsapp?.value.trim();const bairro=form.bairro_cidade?.value.trim()||'';const disponibilidade=form.horarios_disponiveis?.value||'';if(!nome||!whatsapp){showFormError(form,'Preencha nome e WhatsApp para falar com o suporte.');return}clearFormMessages(form);lockButton(btn,'Enviando e abrindo suporte...');const msg=`Olá, sou entregador e quero atendimento da Osasco Express.

Nome: ${nome}
WhatsApp: ${whatsapp}
Bairro/Cidade: ${bairro}
Disponibilidade: ${disponibilidade}`;const payload={tipo_formulario:'entregador',origem:'site',nome,whatsapp,email:'',bairro_cidade:bairro,possui_moto:'',possui_cnh:'',possui_bag:'',dias_disponiveis:'',horarios_disponiveis:disponibilidade,experiencia:'',app_baixado:'Link disponível no site',escala_acessada:'Confirmar horários da semana disponível no site',observacoes:'Formulário simplificado do site',status:'Novo cadastro',pagina:location.href,dispositivo:navigator.userAgent,...getUtm()};sendSheet(payload).finally(()=>{if(window.gtag)gtag('event','generate_lead',{event_category:'lead',event_label:'entregador_site'});showFormSuccess(form,'Mensagem enviada! O suporte abrirá no WhatsApp em instantes.');const opened=window.open(wa(WA_SUPORTE,msg),'_blank','noopener');if(!opened) location.href=wa(WA_SUPORTE,msg);form.reset();unlockButton(btn)})}
function setupRevealAnimations(){const items=$all('.card,.step,.faq-item,.form-box,.review-box,.pill');items.forEach(el=>el.classList.add('reveal'));if(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches){items.forEach(el=>el.classList.add('in-view'));return}if(!('IntersectionObserver' in window)){items.forEach(el=>el.classList.add('in-view'));return}const io=new IntersectionObserver((entries)=>{entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('in-view');io.unobserve(entry.target)}})},{threshold:.12});items.forEach(el=>io.observe(el))}
document.addEventListener('DOMContentLoaded',()=>{$all('[data-menu-toggle]').forEach(b=>b.addEventListener('click',toggleMenu));$all('.faq-q').forEach(b=>b.addEventListener('click',()=>b.closest('.faq-item').classList.toggle('open')));$all('form[data-client-form]').forEach(f=>f.addEventListener('submit',handleClientForm));$all('form[data-rider-form]').forEach(f=>f.addEventListener('submit',handleRiderForm));setupRevealAnimations();const path=location.pathname.replace(/\/$/,'')||'/';$all('.menu a,.footer a').forEach(a=>{try{const ap=new URL(a.href).pathname.replace(/\/$/,'')||'/';if(ap===path)a.classList.add('active')}catch(e){}});});

function trackEvent(name,params){try{if(window.gtag)gtag('event',name,params||{})}catch(e){}}
document.addEventListener('click',function(e){const a=e.target.closest('a');if(!a)return;if(a.classList.contains('js-whatsapp')||a.href.includes('wa.me/')){trackEvent('whatsapp_click',{event_category:'conversion',area:a.dataset.area||'',page:a.dataset.page||document.body.dataset.page||'',intent:a.dataset.intent||document.body.dataset.intent||'',section_name:a.dataset.section||'',button_text:(a.textContent||'').trim(),page_path:location.pathname,page_title:document.title});}if(a.href&&a.href.startsWith('tel:')){trackEvent('phone_click',{page_path:location.pathname,page_title:document.title,button_text:(a.textContent||'').trim()});}});


document.addEventListener('keydown',function(e){if(e.key==='Escape'){const m=document.querySelector('#menu');const b=document.querySelector('[data-menu-toggle]');if(m&&m.classList.contains('open')){m.classList.remove('open');if(b){b.setAttribute('aria-expanded','false');b.setAttribute('aria-label','Abrir menu principal')}}}});
document.addEventListener('click',function(e){const m=document.querySelector('#menu');const b=document.querySelector('[data-menu-toggle]');if(!m||!b)return;if(m.classList.contains('open')&&!e.target.closest('#menu')&&!e.target.closest('[data-menu-toggle]')){m.classList.remove('open');b.setAttribute('aria-expanded','false');b.setAttribute('aria-label','Abrir menu principal')}});


/* CRO/Data round: form start, CTA click, source memory */
(function(){
  try{
    var firstTouchKey='oe_first_touch';
    if(!localStorage.getItem(firstTouchKey)){
      localStorage.setItem(firstTouchKey, JSON.stringify({url:location.href, referrer:document.referrer||'', time:new Date().toISOString(), utm:getUtm()}));
    }
  }catch(e){}
  var startedForms=new WeakSet();
  document.addEventListener('focusin', function(e){
    var form=e.target.closest&&e.target.closest('form[data-form-observed]');
    if(!form||startedForms.has(form))return;
    startedForms.add(form);
    trackEvent('form_start',{page_path:location.pathname,page_title:document.title,form_type:form.dataset.form||form.dataset.clientForm!==undefined?'cliente':'geral'});
  });
  document.addEventListener('click', function(e){
    var a=e.target.closest&&e.target.closest('a[data-event="cta_click"],a[data-cro-variant]');
    if(!a||a.classList.contains('js-whatsapp')||(a.href||'').indexOf('wa.me/')>-1)return;
    trackEvent('cta_click',{page_path:location.pathname,page_title:document.title,button_text:(a.textContent||'').trim(),section_name:a.dataset.section||'',cro_variant:a.dataset.croVariant||''});
  });
})();


/* Marketing round: track lead magnets and ABM/LP intent */
document.addEventListener('click', function(e){
  var a=e.target.closest&&e.target.closest('a[href*="/materiais/"],a[href*="/lp/"],a[href*="/abm/"]');
  if(!a)return;
  trackEvent('lead_magnet_click',{page_path:location.pathname,page_title:document.title,button_text:(a.textContent||'').trim(),destination:a.getAttribute('href')||'',intent:document.body.dataset.intent||''});
});


/* Enterprise marketing round: ROI/impact calculator */
function setupRoiCalculator(){
  const form=document.querySelector('[data-roi-calculator]');
  if(!form)return;
  const out=document.querySelector('[data-roi-result]');
  form.addEventListener('submit',function(e){
    e.preventDefault();
    const entregas=Number(form.entregas_dia.value||0);
    const falha=Number(form.percentual_falha.value||0)/100;
    const valor=Number(form.valor_medio.value||0);
    const dias=Number(form.dias_mes.value||26);
    const entregasRisco=Math.round(entregas*falha*dias);
    const impacto=entregasRisco*valor;
    if(out){out.innerHTML='<strong>'+entregasRisco.toLocaleString('pt-BR')+' entregas/mês em risco</strong><span>Impacto estimado: R$ '+impacto.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})+'</span><p>Esse cálculo é apenas uma estimativa inicial. Para operação real, a Osasco Express avalia região, janela de entrega, produtividade e cobertura necessária.</p>';}
    trackEvent('roi_calculator_submit',{page_path:location.pathname,page_title:document.title,entregas_dia:entregas,percentual_falha:falha*100,valor_medio:valor,dias_mes:dias,impacto_estimado:impacto});
  });
}
document.addEventListener('DOMContentLoaded',setupRoiCalculator);
