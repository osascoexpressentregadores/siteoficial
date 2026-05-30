(function(){
  const btn=document.querySelector('[data-menu-toggle]');
  const nav=document.querySelector('[data-nav-links]');
  if(btn&&nav){btn.addEventListener('click',()=>{const open=nav.classList.toggle('open');btn.setAttribute('aria-expanded',open?'true':'false');btn.textContent=open?'Fechar':'Menu';});nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('open');btn.setAttribute('aria-expanded','false');btn.textContent='Menu';}));}
  const form=document.querySelector('[data-lead-form]');
  if(form){form.addEventListener('submit',e=>{e.preventDefault();const data=Object.fromEntries(new FormData(form).entries());let msg=`Olá, Osasco Express. Quero uma análise da operação.\n\nNome: ${data.nome||''}\nWhatsApp: ${data.whatsapp||''}\nEmpresa: ${data.empresa||''}\nBairro/Cidade: ${data.local||''}\nTipo de operação: ${data.tipo||''}\nVolume aproximado: ${data.volume||''}\nNecessidade: ${data.necessidade||''}\nMelhor horário: ${data.horario||''}\nObservação: ${data.obs||''}`;window.open('https://wa.me/5511986661784?text='+encodeURIComponent(msg),'_blank','noopener');});}
})();
