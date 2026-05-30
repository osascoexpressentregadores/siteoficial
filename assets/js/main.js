const SHEET_WEBHOOK_URL='https://script.google.com/macros/s/AKfycby1f0lm7VcHIy0TbmNkNWaON1DtPOmXnERP4Nlif5o8JA2IY4_abUnX2BgPMxA5UxNT/exec';
const WA_CLIENTE='5511986661784';
const WA_SUPORTE='5511924782555';
const REQUEST_TIMEOUT_MS=6500;
const MAX_RETRIES=2;
const RETRY_BASE_MS=450;
const MAX_LOCAL_QUEUE=25;
function $(s,root=document){return root.querySelector(s)}
function $all(s,root=document){return [...root.querySelectorAll(s)]}
function safeText(value){return String(value||'').replace(/[<>]/g,'').trim()}
function normalizePhone(value){return String(value||'').replace(/\D/g,'')}
function isLikelyPhone(value){const phone=normalizePhone(value);return phone.length>=10&&phone.length<=13}
function toggleMenu(){const m=$('#menu');const b=document.querySelector('[data-menu-toggle]');if(m){const open=!m.classList.contains('open')&&!m.classList.contains('is-open');m.classList.toggle('open',open);m.classList.toggle('is-open',open);if(b){b.setAttribute('aria-expanded',open?'true':'false');b.setAttribute('aria-label',open?'Fechar menu principal':'Abrir menu principal')}}}
function wa(phone,msg){return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`}
function getUtm(){const p=new URLSearchParams(location.search);return{utm_source:p.get('utm_source')||'',utm_medium:p.get('utm_medium')||'',utm_campaign:p.get('utm_campaign')||'',utm_term:p.get('utm_term')||'',utm_content:p.get('utm_content')||''}}
function getFirstTouch(){try{return JSON.parse(localStorage.getItem('oe_first_touch')||'{}')}catch(e){return {}}}
function leadTemp(volume,problem){const hot=['31 a 60 entregas por dia','61 a 100 entregas por dia','Mais de 100 entregas por dia'];const strong=['Organizar entregas recorrentes','Cobrir horário de pico','Reduzir atrasos e falhas','Ter suporte e acompanhamento','Crescer com mais previsibilidade'];if(hot.includes(volume)&&strong.includes(problem))return'Lead quente';if(hot.includes(volume))return'Lead morno';return'Lead inicial'}
function sleep(ms){return new Promise(resolve=>setTimeout(resolve,ms))}
function traceContext(extra={}){return{trace_id:crypto.randomUUID?crypto.randomUUID():String(Date.now())+Math.random(),session_id:getOrCreateSessionId(),page_path:location.pathname,page_title:document.title,timestamp:new Date().toISOString(),...extra}}
function getOrCreateSessionId(){try{const key='oe_session_id';let id=sessionStorage.getItem(key);if(!id){id=crypto.randomUUID?crypto.randomUUID():String(Date.now())+Math.random();sessionStorage.setItem(key,id)}return id}catch(e){return 'session_unavailable'}}
function trackEvent(name,params){try{if(window.gtag)gtag('event',name,{...traceContext(),...(params||{})})}catch(error){reportClientError(error,{module:'trackEvent',event:name})}}
function reportClientError(error,context={}){const payload={level:'error',message:String(error?.message||error),context,page_path:location.pathname,timestamp:new Date().toISOString()};try{console.error(JSON.stringify(payload));if(window.gtag)gtag('event','client_error',{error_message:payload.message,page_path:payload.page_path,context:JSON.stringify(context).slice(0,500)})}catch(e){}}
function getDeviceContext(){return{viewport:`${window.innerWidth}x${window.innerHeight}`,language:navigator.language||'pt-BR',device_type:window.innerWidth<=768?'mobile':'desktop'}}
function canSubmitNow(formType){try{const key=`oe_last_submit_${formType}`;const now=Date.now();const last=Number(localStorage.getItem(key)||0);if(now-last<30000)return false;localStorage.setItem(key,String(now));return true}catch(e){return true}}
function queueLeadLocally(payload,idempotencyKey,error){try{const queue=JSON.parse(localStorage.getItem('oe_lead_queue')||'[]');queue.push({payload,idempotencyKey,error:String(error?.message||error),queuedAt:new Date().toISOString()});localStorage.setItem('oe_lead_queue',JSON.stringify(queue.slice(-MAX_LOCAL_QUEUE)));trackEvent('lead_queued_locally',{lead_id:idempotencyKey,reason:String(error?.message||error).slice(0,120)})}catch(e){reportClientError(e,{module:'queueLeadLocally'})}}
async function postLeadWithRetry(payload){const idempotencyKey=crypto.randomUUID?crypto.randomUUID():String(Date.now())+Math.random();const cleanPayload={...payload,lead_id:idempotencyKey,idempotency_key:idempotencyKey,client_timestamp:new Date().toISOString(),first_touch:getFirstTouch(),device:getDeviceContext()};let lastError=null;for(let attempt=0;attempt<=MAX_RETRIES;attempt++){const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),REQUEST_TIMEOUT_MS);try{const response=await fetch(SHEET_WEBHOOK_URL,{method:'POST',mode:'no-cors',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(cleanPayload),signal:controller.signal,keepalive:true});clearTimeout(timeout);trackEvent('lead_webhook_attempt',{attempt,lead_id:idempotencyKey,result:'sent_opaque'});return{ok:true,opaque:true,lead_id:idempotencyKey}}catch(error){clearTimeout(timeout);lastError=error;trackEvent('lead_webhook_attempt',{attempt,lead_id:idempotencyKey,result:'error',error_message:String(error?.message||error).slice(0,120)});if(attempt<MAX_RETRIES){const jitter=Math.floor(Math.random()*250);await sleep(RETRY_BASE_MS*Math.pow(2,attempt)+jitter)}}}queueLeadLocally(cleanPayload,idempotencyKey,lastError);return{ok:false,queued:true,lead_id:idempotencyKey,error:lastError}}
function lockButton(btn,text){if(!btn)return;if(!btn.dataset.old)btn.dataset.old=btn.textContent;btn.disabled=true;btn.classList.add('loading');btn.textContent=text||'Enviando...'}
function unlockButton(btn){if(!btn)return;btn.disabled=false;btn.classList.remove('loading');btn.textContent=btn.dataset.old||'Enviar'}
function clearFormMessages(form){form.querySelectorAll('.form-error,.form-success,.contact-fallback').forEach(el=>el.remove())}
function showFormError(form,msg){clearFormMessages(form);const p=document.createElement('p');p.className='form-error';p.setAttribute('role','alert');p.textContent=msg;const btn=form.querySelector('button[type="submit"]');if(btn)btn.insertAdjacentElement('beforebegin',p);else form.appendChild(p)}
function showFormSuccess(form,msg){clearFormMessages(form);const box=document.createElement('div');box.className='form-success';box.setAttribute('role','status');box.textContent=msg||'Solicitação registrada. O WhatsApp abrirá em instantes.';form.prepend(box)}
function showFallbackContact(form,message,phone){let box=document.createElement('div');box.className='contact-fallback';box.setAttribute('role','status');const title=document.createElement('strong');title.textContent='WhatsApp não abriu?';const p=document.createElement('p');p.textContent=`Ligue para ${phone==='cliente'?'(11) 98666-1784':'o suporte'} ou copie a mensagem abaixo.`;const textarea=document.createElement('textarea');textarea.readOnly=true;textarea.value=message;box.append(title,p,textarea);form.appendChild(box)}
function openWhatsAppWithFallback(form,phone,message,phoneKind){const url=wa(phone,message);const opened=window.open(url,'_blank','noopener');setTimeout(()=>showFallbackContact(form,message,phoneKind),1200);if(!opened) location.href=url}
const submittingForms=new WeakSet();
async function safeSubmit(form,handler){if(submittingForms.has(form))return;submittingForms.add(form);const btn=form.querySelector('button[type="submit"]');try{lockButton(btn,'Enviando...');await handler()}catch(error){reportClientError(error,{module:'safeSubmit',form:form.dataset.form||''});showFormError(form,'Não conseguimos concluir o envio agora. Tente novamente ou fale direto pelo WhatsApp.')}finally{unlockButton(btn);submittingForms.delete(form)}}
function validateConsentAndHoneypot(form){if(form.querySelector('[name="website"]')?.value)return{ok:false,bot:true,message:'Solicitação ignorada.'};const consent=form.querySelector('[name="consentimento"]');if(consent&&!consent.checked)return{ok:false,message:'Confirme a autorização de contato para continuar.'};return{ok:true}}
function buildWhatsAppSummary(payload){return `Olá, vim pelo site da Osasco Express.

Meu nome: ${payload.nome}
Empresa: ${payload.empresa||'não informado'}
Tipo de operação: ${payload.tipo_operacao}
Volume aproximado: ${payload.volume||'não informado'}
Principal necessidade: ${payload.problema}
Cidade/Bairro: ${payload.bairro_cidade||'não informado'}
Melhor horário para retorno: ${payload.melhor_horario||'não informado'}
Observação: ${payload.observacoes||'sem observação'}

Quero falar com o comercial.`}
function collectClientPayload(form){const nome=safeText(form.nome?.value);const whatsapp=safeText(form.whatsapp?.value);const bairro=safeText(form.bairro_cidade?.value);const empresa=safeText(form.empresa?.value);const cargo=safeText(form.cargo?.value);const email=safeText(form.email?.value);const tamanhoTime=form.tamanho_time?.value||'';const tipo=form.tipo_operacao?.value||'';const volume=form.volume?.value||'';const problema=form.problema?.value||'';const urgencia=form.urgencia?.value||'';const melhorHorario=safeText(form.melhor_horario?.value);const canalPreferido=form.canal_preferido?.value||'WhatsApp';const observacoes=safeText(form.observacoes?.value);return{tipo_formulario:'cliente',origem:'site',nome,whatsapp:normalizePhone(whatsapp),email,empresa,cargo,tamanho_time:tamanhoTime,tipo_operacao:tipo,nome_negocio:'',volume,periodo_critico:'',modelo_atual:'',problema,urgencia,melhor_horario:melhorHorario,canal_preferido:canalPreferido,bairro_cidade:bairro,frequencia:'',observacoes,temperatura:leadTemp(volume,problema),status:'Novo cadastro',pagina:location.href,...getUtm()}}
function handleClientForm(e){e.preventDefault();const form=e.currentTarget;safeSubmit(form,async()=>{const gate=validateConsentAndHoneypot(form);if(!gate.ok){if(!gate.bot)showFormError(form,gate.message);return}if(!canSubmitNow('cliente')){showFormError(form,'Aguarde alguns segundos antes de enviar novamente.');return}const payload=collectClientPayload(form);if(!payload.nome||!payload.whatsapp||!payload.tipo_operacao||!payload.volume||!payload.problema){showFormError(form,'Preencha nome, WhatsApp, tipo de operação, volume e principal necessidade.');return}if(!isLikelyPhone(payload.whatsapp)){showFormError(form,'Informe um WhatsApp válido com DDD.');return}clearFormMessages(form);const msg=buildWhatsAppSummary(payload);payload.mensagem_whatsapp_resumida=msg;const result=await postLeadWithRetry(payload);trackEvent('form_submit',{event_category:'lead',event_label:'cliente_site',page_path:location.pathname,page_title:document.title,intent:document.body.dataset.intent||'',service:payload.tipo_operacao,volume:payload.volume,lead_id:result.lead_id,queued:!!result.queued}); if(window.gtag)gtag('event','generate_lead',{event_category:'lead',event_label:'cliente_site'});showFormSuccess(form,result.queued?'Abriremos o WhatsApp. Se a automação estiver instável, confirme sua solicitação na conversa.':'Solicitação registrada. Abriremos o WhatsApp com um resumo seguro.');openWhatsAppWithFallback(form,WA_CLIENTE,msg,'cliente');form.reset()})}
function handleRiderForm(e){e.preventDefault();const form=e.currentTarget;safeSubmit(form,async()=>{const gate=validateConsentAndHoneypot(form);if(!gate.ok){if(!gate.bot)showFormError(form,gate.message);return}if(!canSubmitNow('motoboy')){showFormError(form,'Aguarde alguns segundos antes de enviar novamente.');return}const nome=safeText(form.nome?.value);const whatsapp=safeText(form.whatsapp?.value);const bairro=safeText(form.bairro_cidade?.value);const disponibilidade=form.horarios_disponiveis?.value||'';if(!nome||!whatsapp){showFormError(form,'Preencha nome e WhatsApp para falar com o suporte.');return}if(!isLikelyPhone(whatsapp)){showFormError(form,'Informe um WhatsApp válido com DDD.');return}const msg=`Olá, sou motoboy parceiro e quero atendimento da Osasco Express.\n\nNome: ${nome}\nBairro/Cidade: ${bairro||'não informado'}\nDisponibilidade: ${disponibilidade||'não informado'}`;const payload={tipo_formulario:'motoboy',origem:'site',nome,whatsapp:normalizePhone(whatsapp),email:'',bairro_cidade:bairro,possui_moto:'',possui_cnh:'',possui_bag:'',dias_disponiveis:'',horarios_disponiveis:disponibilidade,experiencia:'',app_baixado:'Link disponível no site',escala_acessada:'Confirmar horários da semana disponível no site',observacoes:'Formulário simplificado do site',status:'Novo cadastro',pagina:location.href,...getUtm()};const result=await postLeadWithRetry(payload);trackEvent('form_submit',{event_category:'lead',event_label:'motoboy_site',page_path:location.pathname,page_title:document.title,intent:'motoboy',lead_id:result.lead_id,queued:!!result.queued}); if(window.gtag)gtag('event','generate_lead',{event_category:'lead',event_label:'motoboy_site'});showFormSuccess(form,'Mensagem registrada. O suporte abrirá no WhatsApp em instantes.');openWhatsAppWithFallback(form,WA_SUPORTE,msg,'suporte');form.reset()})}
function setupRevealAnimations(){const items=$all('.card,.step,.faq-item,.form-box,.review-box,.pill');items.forEach(el=>el.classList.add('reveal'));if(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches){items.forEach(el=>el.classList.add('in-view'));return}if(!('IntersectionObserver' in window)){items.forEach(el=>el.classList.add('in-view'));return}const io=new IntersectionObserver((entries)=>{entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('in-view');io.unobserve(entry.target)}})},{threshold:.12});items.forEach(el=>io.observe(el))}
const ClickRouter={routes:[],register(selector,handler){this.routes.push({selector,handler})},init(){document.addEventListener('click',event=>{for(const route of this.routes){const target=event.target.closest&&event.target.closest(route.selector);if(target)route.handler(event,target)}})}};
ClickRouter.register('a.js-whatsapp, a[href*="wa.me/"]',(event,a)=>{trackEvent('whatsapp_click',{event_category:'conversion',area:a.dataset.area||'',page:a.dataset.page||document.body.dataset.page||'',intent:a.dataset.intent||document.body.dataset.intent||'',section_name:a.dataset.section||'',button_text:(a.textContent||'').trim(),page_path:location.pathname,page_title:document.title})});
ClickRouter.register('a[href^="tel:"]',(event,a)=>{trackEvent('phone_click',{page_path:location.pathname,page_title:document.title,button_text:(a.textContent||'').trim()})});
ClickRouter.register('a[data-event="cta_click"],a[data-cro-variant]',(event,a)=>{if(a.classList.contains('js-whatsapp')||(a.href||'').includes('wa.me/'))return;trackEvent('cta_click',{page_path:location.pathname,page_title:document.title,button_text:(a.textContent||'').trim(),section_name:a.dataset.section||'',cro_variant:a.dataset.croVariant||''})});
ClickRouter.register('a[href*="/materiais/"],a[href*="/lp/"],a[href*="/abm/"]',(event,a)=>{trackEvent('lead_magnet_click',{page_path:location.pathname,page_title:document.title,button_text:(a.textContent||'').trim(),destination:a.getAttribute('href')||'',intent:document.body.dataset.intent||''})});
ClickRouter.register('a[href^="http"]',(event,a)=>{try{const u=new URL(a.href);if(u.hostname!==location.hostname&&!u.hostname.includes('wa.me'))trackEvent('external_link_click',{page_path:location.pathname,page_title:document.title,destination:a.href,button_text:(a.textContent||'').trim()})}catch(err){}});
function setupRoiCalculator(){const form=document.querySelector('[data-roi-calculator]');if(!form)return;const out=document.querySelector('[data-roi-result]');form.addEventListener('submit',function(e){e.preventDefault();const entregas=Number(form.entregas_dia.value||0);const falha=Number(form.percentual_falha.value||0)/100;const valor=Number(form.valor_medio.value||0);const dias=Number(form.dias_mes.value||26);const entregasRisco=Math.round(entregas*falha*dias);const impacto=entregasRisco*valor;if(out)renderRoiResult(out,entregasRisco,impacto);trackEvent('roi_calculator_submit',{page_path:location.pathname,page_title:document.title,entregas_dia:entregas,percentual_falha:falha*100,valor_medio:valor,dias_mes:dias,impacto_estimado:impacto})})}
function renderRoiResult(out,entregasRisco,impacto){out.replaceChildren();const strong=document.createElement('strong');strong.textContent=`${entregasRisco.toLocaleString('pt-BR')} entregas/mês em risco`;const span=document.createElement('span');span.textContent=`Impacto estimado: R$ ${impacto.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})}`;const p=document.createElement('p');p.textContent='Esse cálculo é apenas uma estimativa inicial. Para operação real, a Osasco Express avalia região, janela de entrega, produtividade e cobertura necessária.';out.append(strong,span,p)}
function setupFormsMetadata(){document.querySelectorAll('form[data-client-form],form[data-rider-form]').forEach(form=>{if(!form.querySelector('[name="website"]')){const hp=document.createElement('label');hp.className='hp-field';hp.setAttribute('aria-hidden','true');hp.innerHTML='Não preencha este campo<input type="text" name="website" tabindex="-1" autocomplete="off">';form.prepend(hp)}if(!form.querySelector('[name="consentimento"]')){const btn=form.querySelector('button[type="submit"]');const label=document.createElement('label');label.className='consent-line';label.innerHTML='<input type="checkbox" name="consentimento" required> Autorizo a Osasco Express a usar meus dados para retorno sobre esta solicitação.';if(btn)btn.insertAdjacentElement('beforebegin',label);else form.appendChild(label)}})}


/* FASE 4 - Performance, mensuração e SEO operacional */
function setupScrollDepthTracking(){
  const marks=[25,50,75,90];
  const sent=new Set();
  let ticking=false;
  function check(){
    ticking=false;
    const doc=document.documentElement;
    const max=Math.max(1,doc.scrollHeight-window.innerHeight);
    const pct=Math.min(100,Math.round((window.scrollY/max)*100));
    marks.forEach(mark=>{
      if(pct>=mark&&!sent.has(mark)){
        sent.add(mark);
        trackEvent('scroll_depth',{event_category:'engagement',scroll_percent:mark,page_path:location.pathname,page_title:document.title,intent:document.body.dataset.intent||''});
      }
    });
  }
  window.addEventListener('scroll',()=>{if(!ticking){ticking=true;requestAnimationFrame(check)}},{passive:true});
  check();
}
function setupWebVitalsLite(){
  try{
    const nav=performance.getEntriesByType&&performance.getEntriesByType('navigation')[0];
    if(nav){
      setTimeout(()=>trackEvent('page_performance',{event_category:'performance',page_path:location.pathname,page_title:document.title,dom_content_loaded:Math.round(nav.domContentLoadedEventEnd),load_time:Math.round(nav.loadEventEnd),transfer_size:Math.round(nav.transferSize||0)}),0);
    }
    let cls=0;
    if('PerformanceObserver' in window){
      try{
        new PerformanceObserver((list)=>{for(const entry of list.getEntries()){if(!entry.hadRecentInput)cls+=entry.value||0}}).observe({type:'layout-shift',buffered:true});
        window.addEventListener('pagehide',()=>trackEvent('web_vitals_lite',{event_category:'performance',metric_name:'CLS',metric_value:Number(cls.toFixed(4)),page_path:location.pathname}),{once:true});
      }catch(e){}
      try{
        new PerformanceObserver((list)=>{const entries=list.getEntries();const last=entries[entries.length-1];if(last)trackEvent('web_vitals_lite',{event_category:'performance',metric_name:'LCP',metric_value:Math.round(last.startTime),page_path:location.pathname})}).observe({type:'largest-contentful-paint',buffered:true});
      }catch(e){}
    }
  }catch(error){reportClientError(error,{module:'setupWebVitalsLite'})}
}
function persistUtmsInForms(){
  try{
    const utm=getUtm();
    const hasUtm=Object.values(utm).some(Boolean);
    if(hasUtm)localStorage.setItem('oe_last_utm',JSON.stringify({...utm,time:new Date().toISOString(),landing:location.pathname}));
    const stored=JSON.parse(localStorage.getItem('oe_last_utm')||'{}');
    document.querySelectorAll('form').forEach(form=>{
      ['utm_source','utm_medium','utm_campaign','utm_term','utm_content'].forEach(name=>{
        if(!form.querySelector(`[name="${name}"]`)){
          const input=document.createElement('input');input.type='hidden';input.name=name;input.value=utm[name]||stored[name]||'';form.appendChild(input);
        }
      });
    });
  }catch(error){reportClientError(error,{module:'persistUtmsInForms'})}
}
function setupHighIntentClicks(){
  ClickRouter.register('a[href*="play.google.com"]',(event,a)=>trackEvent('app_download_click',{event_category:'conversion',page_path:location.pathname,page_title:document.title,destination:a.href,button_text:(a.textContent||'').trim()}));
  ClickRouter.register('a[href*="docs.google.com"]',(event,a)=>trackEvent('rider_signup_sheet_click',{event_category:'conversion',page_path:location.pathname,page_title:document.title,destination:a.href,button_text:(a.textContent||'').trim()}));
}

document.addEventListener('DOMContentLoaded',()=>{try{const firstTouchKey='oe_first_touch';if(!localStorage.getItem(firstTouchKey))localStorage.setItem(firstTouchKey,JSON.stringify({url:location.href,referrer:document.referrer||'',time:new Date().toISOString(),utm:getUtm()}))}catch(e){}setupFormsMetadata();$all('[data-menu-toggle]').forEach(b=>b.addEventListener('click',toggleMenu));$all('.faq-q').forEach(b=>b.addEventListener('click',()=>b.closest('.faq-item').classList.toggle('open')));$all('form[data-client-form]').forEach(f=>f.addEventListener('submit',handleClientForm));$all('form[data-rider-form]').forEach(f=>f.addEventListener('submit',handleRiderForm));setupRevealAnimations();setupRoiCalculator();persistUtmsInForms();setupHighIntentClicks();ClickRouter.init();setupScrollDepthTracking();setupWebVitalsLite();const path=location.pathname.replace(/\/$/,'')||'/';$all('.menu a,.footer a').forEach(a=>{try{const ap=new URL(a.href).pathname.replace(/\/$/,'')||'/';if(ap===path)a.classList.add('active')}catch(e){}})});
document.addEventListener('focusin',function(e){const form=e.target.closest&&e.target.closest('form[data-form-observed]');if(!form||form.dataset.started)return;form.dataset.started='true';trackEvent('form_start',{page_path:location.pathname,page_title:document.title,form_type:(form.dataset.form||(form.hasAttribute('data-client-form')?'cliente':'geral'))})});
document.addEventListener('keydown',function(e){if(e.key==='Escape'){const m=document.querySelector('#menu');const b=document.querySelector('[data-menu-toggle]');if(m&&m.classList.contains('open')){m.classList.remove('open');m.classList.remove('is-open');if(b){b.setAttribute('aria-expanded','false');b.setAttribute('aria-label','Abrir menu principal')}}}});
document.addEventListener('click',function(e){const m=document.querySelector('#menu');const b=document.querySelector('[data-menu-toggle]');if(m&&b&&m.classList.contains('open')&&!e.target.closest('#menu')&&!e.target.closest('[data-menu-toggle]')){m.classList.remove('open');m.classList.remove('is-open');b.setAttribute('aria-expanded','false');b.setAttribute('aria-label','Abrir menu principal')}document.querySelectorAll('.nav-dropdown[open]').forEach(function(drop){if(!drop.contains(e.target))drop.removeAttribute('open')})});


/* FASE 7 - UX mobile QA: menu, viewport e sinais leves */
function setupPhase7MobileUX(){
  try{
    const menu=document.querySelector('#menu');
    const toggle=document.querySelector('[data-menu-toggle]');
    if(menu&&toggle){
      toggle.addEventListener('click',()=>trackEvent('phase7_mobile_menu_state',{event_category:'ux',page_path:location.pathname,is_open:menu.classList.contains('open')||menu.classList.contains('is-open')}));
    }
    document.querySelectorAll('a,button,input,select,textarea,summary').forEach(el=>{
      if(!el.getAttribute('aria-label') && (el.textContent||'').trim().length===0 && el.tagName.toLowerCase()==='a'){
        el.setAttribute('aria-label','Ação do site Osasco Express');
      }
    });
  }catch(error){reportClientError(error,{module:'setupPhase7MobileUX'})}
}
document.addEventListener('DOMContentLoaded',setupPhase7MobileUX);
