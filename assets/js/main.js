const SHEET_WEBHOOK_URL='https://script.google.com/macros/s/AKfycby1f0lm7VcHIy0TbmNkNWaON1DtPOmXnERP4Nlif5o8JA2IY4_abUnX2BgPMxA5UxNT/exec';
const WA_CLIENTE='5511970334125';
const WA_SUPORTE='5511924782555';
function $(s,root=document){return root.querySelector(s)}
function $all(s,root=document){return [...root.querySelectorAll(s)]}
function toggleMenu(){const m=$('#menu'); if(m)m.classList.toggle('open')}
function wa(phone,msg){return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`}
function getUtm(){const p=new URLSearchParams(location.search);return{utm_source:p.get('utm_source')||'',utm_medium:p.get('utm_medium')||'',utm_campaign:p.get('utm_campaign')||'',utm_term:p.get('utm_term')||'',utm_content:p.get('utm_content')||''}}
function leadTemp(volume,problem){const hot=['31 a 60 entregas por dia','61 a 100 entregas por dia','Mais de 100 entregas por dia'];const strong=['Organizar escala e cobertura','Reduzir atrasos e falhas','Ter apoio em horários de pico','Atender demanda recorrente','Crescer com mais previsibilidade'];if(hot.includes(volume)&&strong.includes(problem))return'Lead quente';if(hot.includes(volume))return'Lead morno';return'Lead inicial'}
function sendSheet(payload){try{const blob=new Blob([JSON.stringify(payload)],{type:'text/plain;charset=utf-8'});if(navigator.sendBeacon&&navigator.sendBeacon(SHEET_WEBHOOK_URL,blob))return Promise.resolve(true);return fetch(SHEET_WEBHOOK_URL,{method:'POST',mode:'no-cors',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(payload)}).then(()=>true).catch(()=>false)}catch(e){return Promise.resolve(false)}}
function lockButton(btn,text){if(!btn)return;btn.dataset.old=btn.textContent;btn.disabled=true;btn.textContent=text||'Enviando...'}
function unlockButton(btn){if(!btn)return;btn.disabled=false;btn.textContent=btn.dataset.old||'Enviar'}
function handleClientForm(e){e.preventDefault();const form=e.currentTarget;const btn=form.querySelector('button[type="submit"]');const nome=form.nome?.value.trim();const whatsapp=form.whatsapp?.value.trim();const tipo=form.tipo_operacao?.value||'';const volume=form.volume?.value||'';const problema=form.problema?.value||'';if(!nome||!whatsapp||!tipo||!volume||!problema){alert('Preencha os campos obrigatórios.');return}lockButton(btn,'Enviando e abrindo WhatsApp...');const msg=`Olá, vim pelo site da Osasco Express e quero uma orientação inicial.

Nome: ${nome}
WhatsApp: ${whatsapp}
Tipo de operação: ${tipo}
Volume aproximado: ${volume}
Principal necessidade: ${problema}`;const payload={tipo_formulario:'cliente',origem:'site',nome,whatsapp,email:'',tipo_operacao:tipo,nome_negocio:'',volume,periodo_critico:'',modelo_atual:'',problema,bairro_cidade:'',frequencia:'',observacoes:'',temperatura:leadTemp(volume,problema),status:'Novo cadastro',pagina:location.href,dispositivo:navigator.userAgent,mensagem_whatsapp:msg,...getUtm()};sendSheet(payload).finally(()=>{if(window.gtag)gtag('event','generate_lead',{event_category:'lead',event_label:'cliente_site'});const opened=window.open(wa(WA_CLIENTE,msg),'_blank','noopener');if(!opened) location.href=wa(WA_CLIENTE,msg);form.reset();unlockButton(btn)})}
function handleRiderForm(e){e.preventDefault();const form=e.currentTarget;const btn=form.querySelector('button[type="submit"]');const nome=form.nome?.value.trim();const whatsapp=form.whatsapp?.value.trim();if(!nome||!whatsapp){alert('Preencha nome e WhatsApp.');return}lockButton(btn,'Enviando e abrindo suporte...');const msg=`Olá, sou entregador e preenchi o cadastro no site da Osasco Express.

Nome: ${nome}
WhatsApp: ${whatsapp}
Cidade/Bairro: ${form.bairro_cidade?.value||''}
Moto: ${form.possui_moto?.value||''}
CNH: ${form.possui_cnh?.value||''}
Bag: ${form.possui_bag?.value||''}
Disponibilidade: ${form.horarios_disponiveis?.value||''}`;const payload={tipo_formulario:'entregador',origem:'site',nome,whatsapp,email:form.email?.value.trim()||'',bairro_cidade:form.bairro_cidade?.value.trim()||'',possui_moto:form.possui_moto?.value||'',possui_cnh:form.possui_cnh?.value||'',possui_bag:form.possui_bag?.value||'',dias_disponiveis:form.dias_disponiveis?.value||'',horarios_disponiveis:form.horarios_disponiveis?.value||'',experiencia:form.experiencia?.value||'',app_baixado:'Solicitado pelo site',escala_acessada:'Solicitado pelo site',observacoes:form.observacoes?.value.trim()||'',status:'Novo cadastro',pagina:location.href,dispositivo:navigator.userAgent,...getUtm()};sendSheet(payload).finally(()=>{if(window.gtag)gtag('event','generate_lead',{event_category:'lead',event_label:'entregador_site'});const opened=window.open(wa(WA_SUPORTE,msg),'_blank','noopener');if(!opened) location.href=wa(WA_SUPORTE,msg);form.reset();unlockButton(btn)})}
document.addEventListener('DOMContentLoaded',()=>{$all('[data-menu-toggle]').forEach(b=>b.addEventListener('click',toggleMenu));$all('.faq-q').forEach(b=>b.addEventListener('click',()=>b.closest('.faq-item').classList.toggle('open')));$all('form[data-client-form]').forEach(f=>f.addEventListener('submit',handleClientForm));$all('form[data-rider-form]').forEach(f=>f.addEventListener('submit',handleRiderForm));const path=location.pathname.replace(/\/$/,'')||'/';$all('.menu a,.footer a').forEach(a=>{try{const ap=new URL(a.href).pathname.replace(/\/$/,'')||'/';if(ap===path)a.classList.add('active')}catch(e){}});});