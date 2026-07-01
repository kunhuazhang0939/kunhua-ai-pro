const APP_VERSION = '8.2.0';
const $ = id => document.getElementById(id);
const val = id => Number($(id)?.value || 0);
const fmt = n => Math.round(Number(n) || 0).toLocaleString('zh-TW');
const storeInfo = { company:'安傢企業社', taxId:'87413274', address:'桃園市中壢區三光路68號', store:'中壢高中加盟店' };
const agents = {
  kunhua:{name:'張坤驊',title:'經理',phone:'0939-902-943',phoneRaw:'0939902943',line:'aj7229',lineUrl:'https://line.me/ti/p/~aj7229',photo:'assets/kunhua.jpg?v=8.2',qr:'assets/qr-kunhua.jpg?v=8.2',reg:'112登字第443999號',slogan:'買賣房屋🏠，來找我👍',theme:'green'},
  shiyun:{name:'王詩芸',title:'經理',phone:'0930-262-215',phoneRaw:'0930262215',line:'0930262215',lineUrl:'https://line.me/ti/p/~0930262215',photo:'assets/shiyun.jpg?v=8.2',qr:'assets/qr-shiyun.jpg?v=8.2',reg:'112登字第444000號',slogan:'詩房領域．陪您找到家🏠',theme:'orange'}
};
let currentRole = localStorage.getItem('khRoleV82') || '';
function activeAgent(){return currentRole==='shiyun'?agents.shiyun:agents.kunhua}
function showRoleScreen(){ $('roleScreen').classList.remove('hidden'); $('appScreen').classList.add('hidden'); }
function showApp(role){ currentRole=role; localStorage.setItem('khRoleV82',role); $('roleScreen').classList.add('hidden'); $('appScreen').classList.remove('hidden'); renderBusinessCard(); calcAll(); window.scrollTo({top:0,behavior:'smooth'}); }
function sloganForRole(){ if(currentRole==='shiyun')return agents.shiyun.slogan; if(currentRole==='joint')return '買賣房屋找我們，讓您放心又安心❤️'; return agents.kunhua.slogan; }
function infoHTML(a){return `<div class="card-logo">中信房屋<small>CHINATRUST REAL ESTATE CO.</small></div><span class="store-badge">${storeInfo.store}</span><h2 class="agent-name ${a.theme==='orange'?'orange':''}">${a.name}</h2><div class="agent-title">${a.title}</div><div class="gold-line"></div><div class="contact"><span class="icon">☎</span><span>${a.phone}</span></div><div class="contact"><span class="icon">L</span><span>${a.line}</span></div><div class="contact"><span class="icon">⌖</span><span>${storeInfo.address}</span></div><div class="company">${storeInfo.company}<br>統一編號：${storeInfo.taxId}<br>${a.reg}</div>`;}
function renderBusinessCard(){ const card=$('businessCard'); $('appTitle').textContent=sloganForRole(); if(currentRole==='joint'){card.className='business-card joint'; card.innerHTML=`<div class="card-info"><div class="card-logo">中信房屋<small>CHINATRUST REAL ESTATE CO.</small></div><span class="store-badge">${storeInfo.store}</span><h2 class="agent-name">張坤驊 × <span class="orange-text">王詩芸</span></h2><div class="agent-title">聯名服務．聯手成交</div><div class="gold-line"></div><div class="contact"><span class="icon">☎</span><span>0939-902-943　張坤驊</span></div><div class="contact"><span class="icon">☎</span><span>0930-262-215　王詩芸</span></div><div class="contact"><span class="icon">L</span><span>aj7229 / 0930262215</span></div><div class="contact"><span class="icon">⌖</span><span>${storeInfo.address}</span></div><div class="company">${storeInfo.company}<br>統一編號：${storeInfo.taxId}<br>112登字第443999號（張）<br>112登字第444000號（王）</div></div><div class="card-photo"><img src="${agents.kunhua.photo}" alt="張坤驊"><img src="${agents.shiyun.photo}" alt="王詩芸"></div>`;} else {const a=activeAgent(); card.className='business-card '+(currentRole==='shiyun'?'shiyun':''); card.innerHTML=`<div class="card-info">${infoHTML(a)}</div><div class="card-photo"><img src="${a.photo}" alt="${a.name}"></div>`;}}
function pmt(rate,nper,pv){const r=rate/12;if(r===0)return pv/nper;return pv*r*Math.pow(1+r,nper)/(Math.pow(1+r,nper)-1)}
function calcAgentFee(prefix,price){const mode=$(prefix+'Mode').value;let fee=0;$(prefix+'CustomRateWrap')?.classList.add('hide');$(prefix+'FixedWrap')?.classList.add('hide');if(mode==='customRate'){$(prefix+'CustomRateWrap').classList.remove('hide');fee=price*(val(prefix+'CustomRate')/100)}else if(mode==='fixed'){$(prefix+'FixedWrap').classList.remove('hide');fee=val(prefix+'Fixed')}else fee=price*Number(mode);$(prefix==='agent'?'agentPreview':'sellerFeePreview').value=fmt(fee)+' 萬';return fee}
function calcBuyer(){const price=val('price'),ltv=val('ltv'),rate=val('rate')/100,years=val('years'),grace=val('grace'),misc=val('misc');const agent=calcAgentFee('agent',price);const loanWan=price*ltv,down=price-loanWan,loan=loanWan*10000;const io=loan*rate/12;let months=(years-grace)*12;if(months<=0)months=years*12;const monthly=grace>0?pmt(rate,months,loan):pmt(rate,years*12,loan);const deed=price*.006,cash=down+deed+agent+misc;$('loanAmt').textContent=fmt(loanWan)+' 萬';$('downPay').textContent=fmt(down)+' 萬';$('ioPay').textContent=grace>0?fmt(io)+' 元':'無';$('mPay').textContent=fmt(monthly)+' 元';$('cashNeed').textContent=fmt(cash)+' 萬';$('needIncome').textContent=fmt(monthly/.35)+' 元';return{price,loanWan,down,io,monthly,cash,agent}}
function calcIncome(){const inc=val('famIncome'),cash=val('cashOnHand'),dti=val('dti'),ltv=val('ltv2'),rate=val('rate')/100||.01775;const maxMonthly=inc*dti;const perWan=pmt(rate,(40-5)*12,10000);const maxLoanWan=maxMonthly/perWan;const priceByLoan=maxLoanWan/ltv;const priceByCash=cash/(1-ltv+.006+.02);const maxPrice=Math.min(priceByLoan,priceByCash);$('maxPrice').textContent=fmt(maxPrice)+' 萬';$('maxMonthly').textContent=fmt(maxMonthly)+' 元';$('maxLoan').textContent=fmt(maxPrice*ltv)+' 萬';$('incomeJudge').textContent=dti<=.3?'輕鬆':dti<=.35?'可評估':'壓力偏高'}
function calcSeller(){const sale=val('salePrice'),mort=val('mortLeft'),tax=val('sellerTax'),misc=val('sellerMisc');const fee=calcAgentFee('sellerFee',sale);const net=sale-fee-tax-mort-misc;$('sellerFee').textContent=fmt(fee)+' 萬';$('sellerTaxShow').textContent=fmt(tax)+' 萬';$('mortShow').textContent=fmt(mort)+' 萬';$('sellerNet').textContent=fmt(net)+' 萬'}
function calcCompare(){const price=val('price'),ltv=val('ltv'),rate=val('rate')/100,loan=price*ltv*10000;let rows=[];[30,35,40].forEach(y=>[0,3,5].forEach(g=>{const io=g>0?loan*rate/12:0;const months=(y-g)*12>0?(y-g)*12:y*12;const monthly=g>0?pmt(rate,months,loan):pmt(rate,y*12,loan);rows.push(`<tr><td>${y}年｜${g===0?'無寬限':'寬限'+g+'年'}</td><td>${g===0?'—':fmt(io)+' 元'}</td><td>${fmt(monthly)} 元</td></tr>`)}));$('compareBody').innerHTML=rows.join('')}
function calcAll(){calcBuyer();calcIncome();calcSeller();calcCompare()}
function roleText(){if(currentRole==='joint')return '張坤驊 × 王詩芸｜0939-902-943 / 0930-262-215｜LINE：aj7229 / 0930262215';const a=activeAgent();return `${a.name}｜${a.phone}｜LINE：${a.line}`}
function copyBuyer(){const r=calcBuyer();const text=`房仲 AI Pro 試算\n房價：${fmt(r.price)}萬\n貸款：約${fmt(r.loanWan)}萬\n自備款：約${fmt(r.down)}萬\n仲介費：約${fmt(r.agent)}萬\n寬限期月付：約${fmt(r.io)}元\n寬限期後月付：約${fmt(r.monthly)}元\n建議準備現金：約${fmt(r.cash)}萬\n\n${roleText()}\n中信房屋 中壢高中加盟店｜安傢企業社`;navigator.clipboard?.writeText(text).then(()=>alert('已複製，可貼到 LINE')).catch(()=>alert(text))}
function openQrModal(kind){let html='';if(kind==='joint'||currentRole==='joint'){html=`<h3>選擇 LINE QR Code</h3><div class="qr-grid"><div><img src="${agents.kunhua.qr}" alt="張坤驊 QR"><b>張坤驊</b><small>LINE：aj7229</small></div><div><img src="${agents.shiyun.qr}" alt="王詩芸 QR"><b>王詩芸</b><small>LINE：0930262215</small></div></div>`}else{const a=activeAgent();html=`<h3>${a.name} LINE QR Code</h3><img class="single-qr" src="${a.qr}" alt="${a.name} QR"><p>LINE：${a.line}</p>`}$('qrBody').innerHTML=html;$('qrModal').classList.remove('hidden')}
function closeQrModal(){$('qrModal').classList.add('hidden')}
function openLine(){if(currentRole==='joint')return openQrModal('joint');window.open(activeAgent().lineUrl,'_blank')}
function callAgent(){const a=currentRole==='shiyun'?agents.shiyun:agents.kunhua;location.href='tel:'+a.phoneRaw}
function shareCard(){
  const text='買賣房屋找我們｜'+roleText()+'\n'+location.href;
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(text).then(()=>alert('已複製名片連結，可直接貼到 LINE 分享。')).catch(()=>fallbackCopy(text));
  }else{
    fallbackCopy(text);
  }
}
function fallbackCopy(text){
  const ta=document.createElement('textarea');
  ta.value=text;
  ta.setAttribute('readonly','');
  ta.style.position='fixed';
  ta.style.left='-9999px';
  document.body.appendChild(ta);
  ta.select();
  try{document.execCommand('copy');alert('已複製名片連結，可直接貼到 LINE 分享。')}catch(e){prompt('請複製名片連結：',text)}
  ta.remove();
}
function init(){document.querySelectorAll('.role-card').forEach(b=>b.addEventListener('click',()=>showApp(b.dataset.role)));$('switchRole').onclick=showRoleScreen;$('backToRoles').onclick=showRoleScreen;$('closeQr').onclick=closeQrModal;$('qrModal').addEventListener('click',e=>{if(e.target.id==='qrModal')closeQrModal()});document.querySelectorAll('.func-btn').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('.func-btn').forEach(b=>b.classList.remove('active'));document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));btn.classList.add('active');$(btn.dataset.page).classList.add('active');calcAll()}));document.querySelectorAll('input,select').forEach(el=>{el.addEventListener('input',calcAll);el.addEventListener('change',calcAll)});$('ratePreset').addEventListener('change',()=>{if($('ratePreset').value!=='custom')$('rate').value=$('ratePreset').value;calcAll()});$('callBtn').onclick=callAgent;$('lineBtn').onclick=openLine;$('shareBtn').onclick=shareCard;$('qrBtn').onclick=()=>openQrModal(currentRole);if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js?v='+APP_VERSION).catch(()=>{});if(currentRole)showApp(currentRole);else showRoleScreen();calcAll()}
document.addEventListener('DOMContentLoaded',init);
