const APP_VERSION = '11.5.0';
const $ = id => document.getElementById(id);
const val = id => Number($(id)?.value || 0);
const fmt = n => Math.round(Number(n) || 0).toLocaleString('zh-TW');
const storeInfo = { company:'安傢企業社', taxId:'87413274', address:'桃園市中壢區三光路68號', store:'中壢高中加盟店' };
const agents = {
  kunhua:{name:'張坤驊',title:'經理',phone:'0939-902-943',phoneRaw:'0939902943',line:'aj7229',lineUrl:'https://line.me/ti/p/~aj7229',photo:'assets/kunhua.jpg?v=9',card:'assets/card-kunhua.jpg?v=9',cardPage:'card/kunhua.html',qr:'assets/qr-kunhua.jpg?v=9',reg:'112登字第443999號',slogan:'買賣房屋🏠，來找我👍',theme:'green'},
  shiyun:{name:'王詩芸',title:'經理',phone:'0930-262-215',phoneRaw:'0930262215',line:'0930262215',lineUrl:'https://line.me/ti/p/~0930262215',photo:'assets/shiyun.jpg?v=9',card:'assets/card-shiyun.jpg?v=9',cardPage:'card/shiyun.html',qr:'assets/qr-shiyun.jpg?v=9',reg:'112登字第444000號',slogan:'詩房領域．陪您找到家🏠',theme:'orange'}
};
let currentRole = localStorage.getItem('khRoleV9') || '';
function activeAgent(){return currentRole==='shiyun'?agents.shiyun:agents.kunhua}
function showRoleScreen(){ $('roleScreen').classList.remove('hidden'); $('appScreen').classList.add('hidden'); }
function showApp(role){ currentRole=role; localStorage.setItem('khRoleV9',role); $('roleScreen').classList.add('hidden'); $('appScreen').classList.remove('hidden'); renderBusinessCard(); calcAll(); window.scrollTo({top:0,behavior:'smooth'}); }
function sloganForRole(){ if(currentRole==='shiyun')return agents.shiyun.slogan; if(currentRole==='joint')return '買賣房屋找我們 讓您放心又安心❤️'; return agents.kunhua.slogan; }

function infoHTML(a){return `<div class="card-logo">中信房屋<small>CHINATRUST REAL ESTATE CO.</small></div><span class="store-badge">${storeInfo.store}</span><h2 class="agent-name ${a.theme==='orange'?'orange':''}">${a.name}</h2><div class="agent-title">${a.title}</div><div class="gold-line"></div><div class="contact"><span class="icon">☎</span><span>${a.phone}</span></div><div class="contact"><span class="icon">L</span><span>${a.line}</span></div><div class="contact"><span class="icon">⌖</span><span>${storeInfo.address}</span></div><div class="company">${storeInfo.company}<br>統一編號：${storeInfo.taxId}<br>${a.reg}</div>`;}
function getCardImage(role=currentRole){
  if(role==='joint') return 'assets/card-team.jpg?v=9';
  if(role==='shiyun') return agents.shiyun.card;
  return agents.kunhua.card;
}
function getCardPage(role=currentRole){
  if(role==='joint') return 'card/team.html';
  if(role==='shiyun') return agents.shiyun.cardPage;
  return agents.kunhua.cardPage;
}
function renderBusinessCard(){
  const card=$('businessCard');
  $('appTitle').textContent=sloganForRole();
  const alt = currentRole==='joint' ? '張坤驊與王詩芸聯名精品名片' : `${activeAgent().name}精品名片`;
  card.className='business-card-image '+(currentRole==='shiyun'?'shiyun':currentRole==='joint'?'joint':'');
  card.innerHTML=`<img src="${getCardImage()}" alt="${alt}">`;
}

let buyerLoanMode = localStorage.getItem('buyerLoanModeV112') || 'price';
function getBuyerLoanInputs(){
  const price=val('price'),ltv=val('ltv');
  const directPrincipal=Math.max(0,val('directPrincipal'));
  const loanWan=buyerLoanMode==='principal'?directPrincipal:price*ltv;
  const effectiveLtv=price>0?loanWan/price:0;
  return{price,ltv,directPrincipal,loanWan,effectiveLtv};
}
function syncBuyerLoanMode(){
  const byPrincipal=buyerLoanMode==='principal';
  $('modeByPrice')?.classList.toggle('active',!byPrincipal);
  $('modeByPrincipal')?.classList.toggle('active',byPrincipal);
  $('ltvWrap')?.classList.toggle('hide',byPrincipal);
  $('principalWrap')?.classList.toggle('hide',!byPrincipal);
  if($('loanModeHint'))$('loanModeHint').textContent=byPrincipal
    ? '直接以貸款本金試算；房價仍用來估算自備款、仲介費與其他購屋現金。'
    : '先輸入房價，再依貸款成數自動算出貸款本金。';
}
function setBuyerLoanMode(mode){
  buyerLoanMode=mode==='principal'?'principal':'price';
  localStorage.setItem('buyerLoanModeV112',buyerLoanMode);
  syncBuyerLoanMode();
  calcAll();
}

function pmt(rate,nper,pv){const r=rate/12;if(r===0)return pv/nper;return pv*r*Math.pow(1+r,nper)/(Math.pow(1+r,nper)-1)}
const QINGAN3_SCHEDULE=[
  {start:1,end:36,rate:.01775,label:'第1～3年'},
  {start:37,end:48,rate:.01900,label:'第4年'},
  {start:49,end:60,rate:.02025,label:'第5年'},
  {start:61,end:72,rate:.02150,label:'第6年'},
  {start:73,end:Infinity,rate:.02275,label:'第7年起'}
];
function isQingan3(){return $('ratePreset')?.value==='qingan3'}
function rateAtMonth(month,fixedRate){if(!isQingan3())return fixedRate;return QINGAN3_SCHEDULE.find(x=>month>=x.start&&month<=x.end)?.rate||QINGAN3_SCHEDULE.at(-1).rate}
function loanTimeline(principal,years,graceYears,fixedRate){
  const totalMonths=Math.max(1,Math.round(years*12)),graceMonths=Math.max(0,Math.min(totalMonths-1,Math.round(graceYears*12)));
  let balance=principal,payment=0,lastRate=null,lastMode=null;const months=[];
  for(let m=1;m<=totalMonths;m++){
    const rate=rateAtMonth(m,fixedRate),monthlyRate=rate/12,inGrace=m<=graceMonths,mode=inGrace?'grace':'amortizing';
    if(rate!==lastRate||mode!==lastMode){payment=inGrace?balance*monthlyRate:pmt(rate,totalMonths-m+1,balance);lastRate=rate;lastMode=mode;}
    const interest=balance*monthlyRate;let principalPaid=inGrace?0:Math.max(0,payment-interest);
    if(principalPaid>balance){principalPaid=balance;payment=interest+principalPaid;}
    balance=Math.max(0,balance-principalPaid);
    months.push({month:m,rate,payment,interest,principalPaid,balance,inGrace});
  }
  const stages=[];
  months.forEach(x=>{const prev=stages.at(-1);if(!prev||prev.rate!==x.rate||prev.inGrace!==x.inGrace){stages.push({start:x.month,end:x.month,rate:x.rate,payment:x.payment,inGrace:x.inGrace,balanceAfter:x.balance});}else{prev.end=x.month;prev.balanceAfter=x.balance;}});
  return{months,stages,firstGrace:months.find(x=>x.inGrace),firstAmortizing:months.find(x=>!x.inGrace),maxPayment:Math.max(...months.map(x=>x.payment))};
}
function monthRangeLabel(start,end){const y1=Math.floor((start-1)/12)+1,y2=Math.floor((end-1)/12)+1;if(y1===y2)return `第${y1}年`;return `第${y1}～${y2}年`}
function timelineHTML(result){return result.stages.map(s=>`<div class="loan-stage ${s.inGrace?'grace-stage':'amort-stage'}"><b>${monthRangeLabel(s.start,s.end)}</b><span>${(s.rate*100).toFixed(3)}%</span><strong>${fmt(s.payment)} 元／月</strong><small>${s.inGrace?'只繳利息':'本息攤還'}</small></div>`).join('')}

function calcAgentFee(prefix,price){const mode=$(prefix+'Mode').value;let fee=0;$(prefix+'CustomRateWrap')?.classList.add('hide');$(prefix+'FixedWrap')?.classList.add('hide');if(mode==='customRate'){$(prefix+'CustomRateWrap').classList.remove('hide');fee=price*(val(prefix+'CustomRate')/100)}else if(mode==='fixed'){$(prefix+'FixedWrap').classList.remove('hide');fee=val(prefix+'Fixed')}else fee=price*Number(mode);$(prefix==='agent'?'agentPreview':'sellerFeePreview').value=fmt(fee)+' 萬';return fee}
function calcBuyer(){const {price,ltv,loanWan,effectiveLtv}=getBuyerLoanInputs(),rate=val('rate')/100,years=val('years'),grace=val('grace'),misc=val('misc');const agent=calcAgentFee('agent',price);const down=Math.max(0,price-loanWan),loan=loanWan*10000;const timeline=loanTimeline(loan,years,grace,rate);const io=timeline.firstGrace?.payment||0;const monthly=timeline.firstAmortizing?.payment||timeline.months[0]?.payment||0;const deed=price*.006,cash=down+deed+agent+misc;$('loanAmt').textContent=fmt(loanWan)+' 萬'+(buyerLoanMode==='principal'&&price>0?'（約'+(effectiveLtv*10).toFixed(2)+'成）':'');$('downPay').textContent=fmt(down)+' 萬';$('ioPay').textContent=grace>0?(isQingan3()?'依年度變動，見下方':fmt(io)+' 元'):'無';$('mPay').textContent=fmt(monthly)+' 元起';$('cashNeed').textContent=fmt(cash)+' 萬';$('needIncome').textContent=fmt(timeline.maxPayment/.35)+' 元';if($('buyerLoanTimeline'))$('buyerLoanTimeline').innerHTML=timelineHTML(timeline);return{price,loanWan,down,io,monthly,cash,agent,timeline}}
function calcIncomeAgentFee(price){const mode=$('incomeAgentMode').value;let fee=0;$('incomeAgentCustomRateWrap').classList.add('hide');$('incomeAgentFixedWrap').classList.add('hide');if(mode==='customRate'){$('incomeAgentCustomRateWrap').classList.remove('hide');fee=price*(val('incomeAgentCustomRate')/100)}else if(mode==='fixed'){$('incomeAgentFixedWrap').classList.remove('hide');fee=val('incomeAgentFixed')}else fee=price*Number(mode);return fee}
function incomeCashBreakdown(price,ltv){const down=price*(1-ltv);const agent=calcIncomeAgentFee(price);const deed=val('incomeDeedAmount');const reg=val('incomeRegAmount');const stamp=val('incomeStampAmount');const scrivener=val('incomeScrivener');const other=val('incomeOther');return{down,agent,deed,reg,stamp,scrivener,other,total:down+agent+deed+reg+stamp+scrivener+other}}
function maxPriceByAvailableCash(cash,ltv){let lo=0,hi=Math.max(100,cash/Math.max(.01,1-ltv)*2);for(let i=0;i<80;i++){const mid=(lo+hi)/2;if(incomeCashBreakdown(mid,ltv).total<=cash)lo=mid;else hi=mid}return lo}
function calcIncome(){const inc=val('famIncome'),cash=val('cashOnHand'),dti=val('dti'),ltv=val('ltv2'),rate=val('rate')/100||.01775;const maxMonthly=inc*dti;const perWan=pmt(rate,(40-5)*12,10000);const maxLoanWan=maxMonthly/perWan;const priceByLoan=maxLoanWan/ltv;const priceByCash=maxPriceByAvailableCash(cash,ltv);const maxPrice=Math.max(0,Math.min(priceByLoan,priceByCash));const costs=incomeCashBreakdown(maxPrice,ltv);$('maxPrice').textContent=fmt(maxPrice)+' 萬';$('maxMonthly').textContent=fmt(maxMonthly)+' 元';$('maxLoan').textContent=fmt(maxPrice*ltv)+' 萬';$('incomeDownPay').textContent=fmt(costs.down)+' 萬';$('incomeAgentFeeShow').textContent=fmt(costs.agent)+' 萬';$('incomeDeedShow').textContent=fmt(costs.deed)+' 萬';$('incomeRegShow').textContent=fmt(costs.reg)+' 萬';$('incomeStampShow').textContent=fmt(costs.stamp)+' 萬';$('incomeFixedCostsShow').textContent=fmt(costs.scrivener+costs.other)+' 萬';$('incomeCashNeed').textContent=fmt(costs.total)+' 萬';const judge=dti<=.3?'輕鬆':dti<=.35?'可評估':'壓力偏高';$('incomeJudge').textContent=judge;const limited=priceByCash<=priceByLoan?'目前主要受自備現金限制':'目前主要受每月還款能力限制';$('incomeAdvice').textContent=`${limited}；除了基本頭期款約 ${fmt(costs.down)} 萬元外，另估仲介費、契稅、規費、印花稅及代書等費用約 ${fmt(costs.total-costs.down)} 萬元，建議總現金準備約 ${fmt(costs.total)} 萬元。`}
function calcSeller(){const sale=val('salePrice'),mort=val('mortLeft'),tax=val('sellerTax'),misc=val('sellerMisc');const fee=calcAgentFee('sellerFee',sale);const net=sale-fee-tax-mort-misc;$('sellerFee').textContent=fmt(fee)+' 萬';$('sellerTaxShow').textContent=fmt(tax)+' 萬';$('mortShow').textContent=fmt(mort)+' 萬';$('sellerNet').textContent=fmt(net)+' 萬'}
function calcCompare(){const {price,ltv,loanWan,effectiveLtv}=getBuyerLoanInputs(),rate=val('rate')/100,loan=loanWan*10000,grace=val('grace');if($('compareBasis'))$('compareBasis').innerHTML=`<b>本次比較基準</b><span>房價 ${fmt(price)} 萬元</span><span>貸款本金 ${fmt(loanWan)} 萬元</span><span>${buyerLoanMode==='principal'?'直接輸入本金'+(price>0?'（約'+(effectiveLtv*10).toFixed(2)+'成）':''):'貸款成數 '+(ltv*10).toFixed(1).replace('.0','')+'成'}</span>`;const cards=[30,35,40].map(y=>{const t=loanTimeline(loan,y,grace,rate);return `<article class="compare-card"><h3>${y}年｜${grace===0?'無寬限':'寬限'+grace+'年'}</h3><div class="compare-stages">${timelineHTML(t)}</div><p>最高月付約 <b>${fmt(t.maxPayment)} 元</b>｜建議月收入約 <b>${fmt(t.maxPayment/.35)} 元</b></p></article>`});$('compareBody').innerHTML=cards.join('')}


function rentalAutoRules(grossRent){
  const tenant=$('rentTenantType').value;
  const landlord=$('rentLandlordType').value;
  const companyTenant=(tenant==='company');
  const individualLandlord=(landlord==='individual');
  const rawWithholding=Number(grossRent)*val('rentWithholdRate')/100;
  const withholdingRequired=companyTenant && individualLandlord && rawWithholding>val('rentWithholdExemptTax');
  const nhiRequired=companyTenant && individualLandlord && Number(grossRent)>=val('rentNhiThreshold');
  return{tenant,landlord,companyTenant,individualLandlord,rawWithholding,withholdingRequired,nhiRequired};
}

function setRentalChoice(group,value){
  const map={mode:'rentCalcMode',landlord:'rentLandlordType',tenant:'rentTenantType'};
  const targetId=map[group];
  if(!targetId) return false;
  $(targetId).value=value;
  document.querySelectorAll('[data-rent-choice="'+group+'"]').forEach(function(btn){
    const selected=btn.getAttribute('data-value')===value;
    btn.classList.toggle('active',selected);
    btn.setAttribute('aria-pressed',selected?'true':'false');
  });
  syncRentalTaxDefaults();
  calcRental();
  return true;
}


function initRentalAdvancedPanel(){
  const btn=$('toggleRentAdvanced');
  const panel=$('rentAdvancedPanel');
  if(!btn||!panel) return;
  btn.addEventListener('click',()=>{
    const open=panel.classList.contains('hide');
    panel.classList.toggle('hide',!open);
    btn.textContent=open?'收合進階設定':'展開進階設定';
  });
}

function initRentalWizard(){
  document.querySelectorAll('[data-rent-choice]').forEach(function(btn){
    btn.setAttribute('aria-pressed',btn.classList.contains('active')?'true':'false');
  });

  const defaults={
    mode:'rentCalcMode',
    tenant:'rentTenantType',
    landlord:'rentLandlordType'
  };

  Object.keys(defaults).forEach(function(group){
    const input=document.getElementById(defaults[group]);
    if(input) setRentalChoice(group,input.value);
  });
}

function syncRentalTaxDefaults(){
  const gross=$('rentCalcMode').value==='forward'?val('rentAmount'):Math.max(val('rentTargetNet'),20000);
  const rules=rentalAutoRules(gross);
  const advancedPanel=$('rentAdvancedPanel');
  const advanced=advancedPanel && !advancedPanel.classList.contains('hide');
  if(!advanced){
    $('rentWithholdEnabled').checked=rules.withholdingRequired;
    $('rentNhiEnabled').checked=rules.nhiRequired;
    $('rentVatEnabled').checked=$('rentLandlordType').value==='company';
  }
  updateRentalTaxDecision(gross);
}
function updateRentalTaxDecision(grossRent){
  const rules=rentalAutoRules(grossRent);
  const withholdingTax=rules.rawWithholding;
  const nhiFee=Number(grossRent)*val('rentNhiRate')/100;
  $('rentWithholdDecision').textContent=rules.withholdingRequired
    ? `需扣 ${fmt(withholdingTax)} 元`
    : `免扣／不適用`;
  const decisionLines=[];
  if(!rules.companyTenant){
    decisionLines.push('👤 一般民眾承租：不辦理租金所得稅與補充保費代扣。');
  }else if(!rules.individualLandlord){
    decisionLines.push('🏢 公司房東：依發票、營業稅及公司稅務規則另行確認。');
  }else{
    decisionLines.push(rules.withholdingRequired?`✅ 所得稅預扣：${fmt(withholdingTax)} 元`:`⭕ 所得稅免扣：10% 應扣稅額未超過 2,000 元`);
    decisionLines.push(rules.nhiRequired?`✅ 補充保費：${fmt(nhiFee)} 元`:'⭕ 補充保費：未達 20,000 元門檻');
  }
  decisionLines.push('💡 稅務依出租人、承租人與租金金額自動判斷。');
  $('rentDecisionCard').innerHTML=decisionLines.map(x=>`<div>${x}</div>`).join('');
  $('rentWithholdDecision').className='decision '+(rules.withholdingRequired?'yes':'no');
  $('rentNhiDecision').textContent=rules.nhiRequired?`需扣 ${fmt(nhiFee)} 元`:'免扣／不適用';
  $('rentNhiDecision').className='decision '+(rules.nhiRequired?'yes':'no');
  $('rentVatDecision').textContent=$('rentVatEnabled').checked?'已納入試算':'待依稅籍確認';
  $('rentVatDecision').className='decision '+($('rentVatEnabled').checked?'yes':'manual');
  updateRentalTaxHint(grossRent,rules);
}
function updateRentalTaxHint(grossRent,rules){
  const notes=[];
  if(!rules.companyTenant){
    notes.push('承租人為一般自然人：系統預設不辦理租金 10% 扣繳，也不扣取租金補充保費。房東仍須申報年度租賃所得。');
  }else{
    if(rules.withholdingRequired) notes.push(`本次租金 ${fmt(grossRent)} 元，10% 預扣稅額 ${fmt(rules.rawWithholding)} 元，超過免扣繳稅額上限，系統判定需扣繳。`);
    else notes.push(`本次租金 ${fmt(grossRent)} 元，10% 預扣稅額 ${fmt(rules.rawWithholding)} 元未超過 2,000 元，系統判定免予扣繳。`);
    if(rules.nhiRequired) notes.push('個人房東且單次租金達 20,000 元，系統納入 2.11% 補充保費。');
    else notes.push('目前條件未納入租金補充保費。');
  }
  notes.push($('rentVatEnabled').checked?'已手動納入營業稅。':'營業稅仍須依房東稅籍、發票與契約條款人工確認。');
  $('rentTaxHint').textContent=notes.join(' ');
}
const RENT_TAX_BRACKETS={
  '115':[{max:610000,rate:.05,deduction:0},{max:1380000,rate:.12,deduction:42700},{max:2770000,rate:.20,deduction:153100},{max:5190000,rate:.30,deduction:430100},{max:Infinity,rate:.40,deduction:949100}],
  '114':[{max:590000,rate:.05,deduction:0},{max:1330000,rate:.12,deduction:41300},{max:2660000,rate:.20,deduction:147700},{max:4980000,rate:.30,deduction:413700},{max:Infinity,rate:.40,deduction:911700}]
};
function progressiveIncomeTax(netIncome,year){
  const income=Math.max(0,Number(netIncome)||0);
  const brackets=RENT_TAX_BRACKETS[String(year)]||RENT_TAX_BRACKETS['115'];
  const bracket=brackets.find(b=>income<=b.max)||brackets[brackets.length-1];
  return Math.max(0,income*bracket.rate-bracket.deduction);
}
function marginalIncomeTaxRate(netIncome,year){
  const income=Math.max(0,Number(netIncome)||0);
  const brackets=RENT_TAX_BRACKETS[String(year)]||RENT_TAX_BRACKETS['115'];
  return (brackets.find(b=>income<=b.max)||brackets[brackets.length-1]).rate;
}
function syncRentIncomeTaxUI(){
  const enabled=$('rentIncomeTaxEnabled').checked;
  $('rentIncomeTaxFields').classList.toggle('muted-fields',!enabled);
  $('rentActualExpenseWrap').classList.toggle('hide',$('rentExpenseMethod').value!=='actual');
  const year=$('rentTaxYear').value;
  $('rentBracketSummary').textContent=year==='115'
    ?'115年度：61萬以下5%、61萬～138萬12%、138萬～277萬20%、277萬～519萬30%、519萬以上40%'
    :'114年度：59萬以下5%、59萬～133萬12%、133萬～266萬20%、266萬～498萬30%、498萬以上40%';
}
function calcRentIncomeTax(grossRent,taxes){
  syncRentIncomeTaxUI();
  const enabled=$('rentIncomeTaxEnabled').checked && $('rentLandlordType').value==='individual';
  $('rentIncomeTaxResult').classList.toggle('hide',!enabled);
  if(!enabled) return null;
  const months=Math.min(12,Math.max(1,Math.round(val('rentIncomeMonths')||12)));
  const annualGross=Math.max(0,grossRent*months);
  const use=$('rentUse').value;
  const method=$('rentExpenseMethod').value;
  let annualExpense=0;
  let warning='';
  if(method==='standard43'){
    if(use==='land'){
      annualExpense=0;
      warning='目前物件用途為土地；土地出租不適用房屋租金43%法定可扣除費用標準，請改用實際費用並依規定處理地價稅。';
    }else{
      annualExpense=annualGross*.43;
      warning='43%是房屋租金的法定可扣除費用，不是免稅額，也不代表實際支出；其餘57%列為租賃所得。';
    }
  }else{
    annualExpense=Math.min(annualGross,Math.max(0,val('rentActualExpense')));
    warning='實際費用須保留合法憑證，最終仍以國稅局認定為準。';
  }
  const rentalIncome=Math.max(0,annualGross-annualExpense);
  const otherNet=Math.max(0,val('rentOtherNetIncome'));
  const year=$('rentTaxYear').value;
  const taxBefore=progressiveIncomeTax(otherNet,year);
  const taxAfter=progressiveIncomeTax(otherNet+rentalIncome,year);
  const incrementalTax=Math.max(0,taxAfter-taxBefore);
  const annualWithheld=taxes.withholdingOn?taxes.withholding*months:0;
  const balance=incrementalTax-annualWithheld;
  const marginal=marginalIncomeTaxRate(otherNet+rentalIncome,year);
  $('rentAnnualGrossShow').textContent=fmt(annualGross)+' 元';
  $('rentAnnualExpenseShow').textContent=fmt(annualExpense)+' 元';
  $('rentTaxableRentalShow').textContent=fmt(rentalIncome)+' 元';
  $('rentMarginalRateShow').textContent=Math.round(marginal*100)+'%';
  $('rentIncrementalTaxShow').textContent=fmt(incrementalTax)+' 元';
  $('rentAnnualWithheldShow').textContent=fmt(annualWithheld)+' 元';
  const expenseCalc=$('rentExpenseCalcShow');
  if(expenseCalc) expenseCalc.innerHTML=method==='standard43' && use!=='land'
    ? `全年租金收入 ${fmt(annualGross)} 元 × 43%<br>＝43%法定可扣除費用 ${fmt(annualExpense)} 元<br><small>此為法定可扣除費用，不代表房東實際支出。</small>`
    : `全年租金收入 ${fmt(annualGross)} 元<br>－列報費用 ${fmt(annualExpense)} 元`;
  const incomeCalc=$('rentIncomeTaxCalcShow');
  if(incomeCalc) incomeCalc.innerHTML=`全年租金收入 ${fmt(annualGross)} 元<br>－法定可扣除／列報費用 ${fmt(annualExpense)} 元<br>＝需申報租賃所得 ${fmt(rentalIncome)} 元<br>加入其他綜合所得淨額 ${fmt(otherNet)} 元後，依 ${year} 年度累進稅率計算<br>＝本案增加預估所得稅 ${fmt(incrementalTax)} 元`;
  const withheldCalc=$('rentWithheldCalcShow');
  if(withheldCalc) withheldCalc.innerHTML=taxes.withholdingOn
    ? `每月預扣 ${fmt(taxes.withholding)} 元 × ${months} 個月<br>＝全年預扣所得稅 ${fmt(annualWithheld)} 元`
    : '本案目前未啟用租金所得稅扣繳。';
  $('rentTaxBalanceShow').textContent=balance>0?'本案估算稅額高於預扣稅款 '+fmt(balance)+' 元':balance<0?'本案預扣稅款高於估算稅額 '+fmt(Math.abs(balance))+' 元':'兩者差額約 0 元';
  $('rentIncomeTaxWarning').textContent=warning+' 本試算以「其他綜合所得淨額」加上本案租賃所得，計算增加的稅額；最終是否退稅或補稅，仍須與其他所得、免稅額、扣除額、扣抵稅額及家庭合併申報結果一併確認。';
  return{annualGross,annualExpense,rentalIncome,otherNet,year,incrementalTax,annualWithheld,balance,marginal};
}

function rentalServiceFee(baseRent,modeId,fixedId,wrapId){
  const mode=$(modeId).value;
  $(wrapId).classList.toggle('hide',mode!=='fixed');
  if(mode==='fixed') return Math.max(0,val(fixedId));
  return Math.max(0,baseRent*Number(mode||0));
}
function rentalTaxParts(grossRent){
  const advancedPanel=$('rentAdvancedPanel');
  const advanced=advancedPanel && !advancedPanel.classList.contains('hide');
  const rules=rentalAutoRules(grossRent);
  const withholdingOn=advanced?$('rentWithholdEnabled').checked:rules.withholdingRequired;
  const nhiOn=advanced?$('rentNhiEnabled').checked:rules.nhiRequired;
  const vatOn=$('rentVatEnabled').checked;
  return{
    withholding:withholdingOn?grossRent*val('rentWithholdRate')/100:0,
    nhi:nhiOn?grossRent*val('rentNhiRate')/100:0,
    vat:vatOn?grossRent*val('rentVatRate')/100:0,
    withholdingOn,nhiOn,vatOn,rules
  };
}
function netFromGross(grossRent){const t=rentalTaxParts(grossRent);return grossRent-t.withholding-t.nhi;}
function solveGrossRentForTarget(target){
  let lo=0,hi=Math.max(target*2,50000);
  while(netFromGross(hi)<target && hi<100000000) hi*=2;
  for(let i=0;i<80;i++){const mid=(lo+hi)/2;if(netFromGross(mid)>=target)hi=mid;else lo=mid;}
  return hi;
}
function calcRental(){
  const mode=$('rentCalcMode').value;
  $('rentAmountWrap').classList.toggle('hide',mode!=='forward');$('rentTargetWrap').classList.toggle('hide',mode!=='reverse');
  let grossRent=mode==='reverse'?solveGrossRentForTarget(val('rentTargetNet')):val('rentAmount');grossRent=Math.max(0,grossRent);
  const taxes=rentalTaxParts(grossRent);
  updateRentalTaxDecision(grossRent);
  const ownerNetBeforeCosts=grossRent-taxes.withholding-taxes.nhi;
  const tenantPayment=grossRent+taxes.vat;
  const landlordService=rentalServiceFee(grossRent,'rentLandlordServiceMode','rentLandlordServiceFixed','rentLandlordServiceFixedWrap');
  const tenantService=rentalServiceFee(grossRent,'rentTenantServiceMode','rentTenantServiceFixed','rentTenantServiceFixedWrap');
  const serviceTotal=landlordService+tenantService;
  const serviceOwner=landlordService;
  const serviceMonthly=0;
  const holdingEnabled=$('rentHoldingEnabled').checked;
  const holdingMonthly=holdingEnabled?(val('rentHouseTaxAnnual')+val('rentLandTaxAnnual'))/12+val('rentManagement')+val('rentRepair')+val('rentOtherCost'):0;
  $('rentHoldingFields').classList.toggle('muted-fields',!holdingEnabled);
  // 仲介服務費獨立計算，不扣除屋主每月租金實拿與持有成本後淨收入
  const trueNet=ownerNetBeforeCosts-holdingMonthly;
  const deposit=grossRent*val('rentDepositMonths');
  const tenantInitial=tenantPayment+deposit+tenantService;
  // 簽約當下租金現金流也不扣房東服務費；服務費於獨立區塊顯示
  const signingCash=grossRent+deposit-taxes.withholding-taxes.nhi;
  $('rentMainLabel').textContent=mode==='reverse'?'反推建議應收租金':'每月約定租金';$('rentContractShow').textContent=fmt(grossRent)+' 元';
  $('rentWithholdShow').textContent=taxes.withholdingOn?fmt(taxes.withholding)+' 元':'0 元／免扣或不適用';
  $('rentNhiShow').textContent=taxes.nhiOn?fmt(taxes.nhi)+' 元':'0 元／免扣或不適用';
  $('rentVatShow').textContent=taxes.vatOn?fmt(taxes.vat)+' 元':'0 元／未納入';$('rentTenantPayShow').textContent=fmt(tenantPayment)+' 元';
  $('rentOwnerNetShow').textContent=fmt(ownerNetBeforeCosts)+' 元';
  $('rentServiceOwnerShow').textContent=fmt(serviceOwner)+' 元';
  $('rentServiceTenantShow').textContent=fmt(tenantService)+' 元';
  $('rentServiceTotalShow').textContent=fmt(serviceTotal)+' 元';
  $('rentServiceMonthlyShow').textContent='另計 '+fmt(serviceOwner)+' 元';
  $('rentHoldingMonthlyShow').textContent=holdingEnabled?fmt(holdingMonthly)+' 元':'未納入';$('rentTrueNetShow').textContent=fmt(trueNet)+' 元';
  $('rentDepositShow').textContent=fmt(deposit)+' 元';
  $('rentTenantInitialShow').textContent=fmt(tenantInitial)+' 元';
  $('rentSigningCashShow').textContent=fmt(signingCash)+' 元';
  const tenantLabel=$('rentTenantType').value==='company'?'公司行號承租':'一般自然人承租';
  const taxText=$('rentTaxMethod').value==='grossup'?'採稅外加／實拿反推邏輯':'採租金內含邏輯';
  const annualText=$('rentLandlordType').value==='individual'?'10% 扣繳僅屬預繳，房東次年仍須申報租賃所得。':'';
  const holdingText=holdingEnabled?`納入持有成本後，每月淨收入約 ${fmt(trueNet)} 元。`:'未納入房屋稅、地價稅等持有成本。';
  const incomeTax=calcRentIncomeTax(grossRent,taxes);
  const incomeTaxText=incomeTax?` 本案預估增加年度所得稅 ${fmt(incomeTax.incrementalTax)} 元；已預扣 ${fmt(incomeTax.annualWithheld)} 元。`:'';
  $('rentAdviceShow').innerHTML=`<div class="ai-line">📌 承租人：<strong>${tenantLabel}</strong></div><div class="ai-line">💰 房東每月實拿：<strong>${fmt(ownerNetBeforeCosts)} 元</strong></div><div class="ai-line">🧾 稅務：${taxText}</div><div class="ai-line">🏠 ${holdingText}</div><div class="ai-line">🤝 房東服務費 ${fmt(serviceOwner)} 元／租客服務費 ${fmt(tenantService)} 元（一次性另計）</div><div class="ai-reminder">💡 ${annualText}${incomeTaxText} 營業稅仍須依稅籍、發票與租約確認。</div>`;
  return{grossRent,taxes,tenantPayment,ownerNetBeforeCosts,serviceOwner,tenantService,serviceTotal,serviceMonthly,holdingMonthly,trueNet,deposit,tenantInitial,signingCash,incomeTax};
}

function calcAll(){calcBuyer();calcIncome();calcSeller();calcCompare();calcRental()}
function roleText(){if(currentRole==='joint')return '張坤驊 × 王詩芸｜0939-902-943 / 0930-262-215｜LINE：aj7229 / 0930262215';const a=activeAgent();return `${a.name}｜${a.phone}｜LINE：${a.line}`}
function copyBuyer(){openShareSettings('buyer')}
function openQrModal(kind){let html='';if(kind==='joint'||currentRole==='joint'){html=`<h3>選擇 LINE QR Code</h3><div class="qr-grid"><div><img src="${agents.kunhua.qr}" alt="張坤驊 QR"><b>張坤驊</b><small>LINE：aj7229</small></div><div><img src="${agents.shiyun.qr}" alt="王詩芸 QR"><b>王詩芸</b><small>LINE：0930262215</small></div></div>`}else{const a=activeAgent();html=`<h3>${a.name} LINE QR Code</h3><img class="single-qr" src="${a.qr}" alt="${a.name} QR"><p>LINE：${a.line}</p>`}$('qrBody').innerHTML=html;$('qrModal').classList.remove('hidden')}
function closeQrModal(){$('qrModal').classList.add('hidden')}
function openLine(){if(currentRole==='joint')return openQrModal('joint');window.open(activeAgent().lineUrl,'_blank')}
function callAgent(){const a=currentRole==='shiyun'?agents.shiyun:agents.kunhua;location.href='tel:'+a.phoneRaw}

function absoluteCardUrl(){ return new URL(getCardPage(), window.location.href).href; }
function shareCard(){
  const cardUrl = absoluteCardUrl();
  const text = '買賣房屋找我們｜'+roleText()+'\n'+cardUrl;
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(text).then(()=>alert('已複製「純名片頁」連結，可直接貼到 LINE 分享。')).catch(()=>fallbackCopy(text));
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
  try{document.execCommand('copy');alert('已複製純名片連結，可直接貼到 LINE 分享。')}catch(e){prompt('請複製名片連結：',text)}
  ta.remove();
}

const shareDefinitions={
  buyer:{
    title:'買方試算分享設定', storage:'khShareBuyerV10',
    simple:['price','loan','down','monthly','cash'],
    fields:[
      ['price','成交總價',()=>fmt(val('price'))+' 萬'],
      ['loan','貸款金額',()=>textOf('loanAmt')],
      ['down','基本自備款',()=>textOf('downPay')],
      ['gracePay','寬限期月付',()=>textOf('ioPay')],
      ['monthly','寬限期後月付',()=>textOf('mPay')],
      ['agent','仲介服務費',()=>fmt(calcBuyer().agent)+' 萬'],
      ['misc','雜費／代書／保險',()=>fmt(val('misc'))+' 萬'],
      ['cash','建議準備現金',()=>textOf('cashNeed')],
      ['income','建議家庭月收入',()=>textOf('needIncome')]
    ]
  },
  seller:{
    title:'賣方試算分享設定', storage:'khShareSellerV10',
    simple:['sale','mort','net'],
    fields:[
      ['sale','成交價',()=>fmt(val('salePrice'))+' 萬'],
      ['mort','清償貸款',()=>textOf('mortShow')],
      ['agent','仲介服務費',()=>textOf('sellerFee')],
      ['tax','稅費概估',()=>textOf('sellerTaxShow')],
      ['misc','代書／塗銷雜費',()=>fmt(val('sellerMisc'))+' 萬'],
      ['net','屋主實拿概估',()=>textOf('sellerNet')]
    ]
  },
  income:{
    title:'AI 購屋資金分析分享設定', storage:'khShareIncomeV10',
    simple:['price','down','loan','monthly','cash','advice'],
    fields:[
      ['price','建議最高總價',()=>textOf('maxPrice')],
      ['down','基本頭期款',()=>textOf('incomeDownPay')],
      ['loan','預估貸款',()=>textOf('maxLoan')],
      ['monthly','可承受月付',()=>textOf('maxMonthly')],
      ['agent','仲介服務費',()=>textOf('incomeAgentFeeShow')],
      ['deed','契稅估算',()=>textOf('incomeDeedShow')],
      ['reg','登記規費估算',()=>textOf('incomeRegShow')],
      ['stamp','印花稅估算',()=>textOf('incomeStampShow')],
      ['fixed','代書／其他',()=>textOf('incomeFixedCostsShow')],
      ['cash','建議準備現金',()=>textOf('incomeCashNeed')],
      ['judge','房貸壓力判斷',()=>textOf('incomeJudge')],
      ['advice','專業建議',()=>textOf('incomeAdvice')]
    ]
  },
  rental:{
    title:'AI 租賃中心分享設定', storage:'khShareRentalV114',
    simple:['rent','ownerNet','tenantPay','trueNet','advice'],
    presets:{
      landlord:['rent','ownerNet','trueNet','annualRent','taxableRental','incrementalTax','taxBalance','advice'],
      tenant:['rent','tenantPay','deposit','tenantService','tenantInitial','advice'],
      company:['rent','tenantPay','withhold','nhi','ownerNet','taxableRental','incrementalTax','taxBalance','advice'],
      professional:['rent','withhold','nhi','vat','tenantPay','ownerNet','service','tenantService','serviceTotal','tenantInitial','holding','trueNet','deposit','signing','annualRent','expenseDeduction','taxableRental','marginalRate','incrementalTax','annualWithhold','taxBalance','advice']
    },
    fields:[
      ['rent','約定／反推租金',()=>textOf('rentContractShow')],
      ['withhold','所得稅預扣',()=>textOf('rentWithholdShow')],
      ['nhi','補充保費',()=>textOf('rentNhiShow')],
      ['vat','營業稅',()=>textOf('rentVatShow')],
      ['tenantPay','承租人總支付',()=>textOf('rentTenantPayShow')],
      ['ownerNet','屋主每月實拿',()=>textOf('rentOwnerNetShow')],
      ['service','房東仲介服務費（另計）',()=>textOf('rentServiceOwnerShow')],
      ['tenantService','租客仲介服務費',()=>textOf('rentServiceTenantShow')],
      ['serviceTotal','仲介服務費合計（另計）',()=>textOf('rentServiceTotalShow')],
      ['tenantInitial','租客簽約準備金',()=>textOf('rentTenantInitialShow')],
      ['holding','持有成本月平均',()=>textOf('rentHoldingMonthlyShow')],
      ['trueNet','扣除持有成本後淨收入',()=>textOf('rentTrueNetShow')],
      ['deposit','押金',()=>textOf('rentDepositShow')],
      ['signing','簽約當下屋主現金流',()=>textOf('rentSigningCashShow')],
      ['annualRent','全年租金收入',()=>textOf('rentAnnualGrossShow')],
      ['expenseDeduction','43%法定可扣除費用',()=>textOf('rentAnnualExpenseShow')],
      ['taxableRental','需申報的租賃所得',()=>textOf('rentTaxableRentalShow')],
      ['marginalRate','增加本案後邊際稅率',()=>textOf('rentMarginalRateShow')],
      ['incrementalTax','本案增加的預估所得稅',()=>textOf('rentIncrementalTaxShow')],
      ['annualWithhold','全年預扣所得稅（扣繳稅款）',()=>textOf('rentAnnualWithholdShow')],
      ['taxBalance','本案預扣稅款與估算稅額差額',()=>textOf('rentTaxBalanceShow')],
      ['advice','AI分析與重要提醒',()=>textOf('rentAdviceShow')]
    ]
  }
};
let activeShareType='buyer';
function textOf(id){return $(id)?.textContent?.trim()||'-'}
function defaultSelection(type){const d=shareDefinitions[type];const saved=localStorage.getItem(d.storage);if(saved){try{return JSON.parse(saved)}catch(e){}}return d.simple.slice()}
function setSharePreset(preset){
  const d=shareDefinitions[activeShareType];
  let selected=[];
  if(activeShareType==='rental' && d.presets && d.presets[preset]) selected=d.presets[preset].slice();
  else if(preset==='full' || preset==='professional') selected=d.fields.map(x=>x[0]);
  else if(preset==='simple') selected=d.simple.slice();
  else selected=[...document.querySelectorAll('#shareOptions input:checked')].map(x=>x.value);
  document.querySelectorAll('#shareOptions input').forEach(x=>x.checked=selected.includes(x.value));
  updateSharePreview();
}
function openShareSettings(type){
  calcAll(); activeShareType=type; const d=shareDefinitions[type]; $('shareModalTitle').textContent=d.title;
  const rental=type==='rental';
  document.querySelectorAll('.share-presets button').forEach(btn=>{
    const rentalOnly=['landlord','tenant','company','professional'];
    const generalOnly=['simple','full'];
    btn.classList.toggle('hidden', rental ? generalOnly.includes(btn.dataset.preset) : rentalOnly.includes(btn.dataset.preset));
  });
  const selected=defaultSelection(type);
  $('shareOptions').innerHTML=d.fields.map(([key,label])=>`<label class="share-check"><input type="checkbox" value="${key}" ${selected.includes(key)?'checked':''}><span>${label}</span></label>`).join('');
  $('shareOptions').querySelectorAll('input').forEach(x=>x.addEventListener('change',updateSharePreview));
  $('shareModal').classList.remove('hidden'); updateSharePreview();
}
function closeShareSettings(){$('shareModal').classList.add('hidden')}
function buildRentalShareText(d,selected){
  const get=key=>{const f=d.fields.find(x=>x[0]===key);return f?f[2]():'-'};
  const lines=['🏠【AI 租賃分析】',''];
  const pushSection=(title,items)=>{const visible=items.filter(([key])=>selected.includes(key));if(!visible.length)return;lines.push('━━━━━━━━━━━━━━',title,'');visible.forEach(([key,label])=>lines.push(`${label}：${get(key)}`));lines.push('');};
  pushSection('💰 租金重點',[
    ['rent','約定／反推租金'],['tenantPay','承租人總支付'],['ownerNet','房東每月實拿'],['trueNet','扣除持有成本後淨收入']
  ]);
  pushSection('🧾 稅務分析',[
    ['withhold','所得稅預扣'],['nhi','補充保費'],['vat','營業稅'],['annualRent','全年租金收入'],['expenseDeduction','43%法定可扣除費用'],['taxableRental','需申報的租賃所得'],['marginalRate','增加本案後邊際稅率'],['incrementalTax','本案增加的預估所得稅'],['annualWithhold','全年預扣所得稅（扣繳稅款）'],['taxBalance','本案預扣稅款與估算稅額差額']
  ]);
  pushSection('📝 簽約費用',[
    ['deposit','押金'],['service','房東仲介服務費（另計）'],['tenantService','租客仲介服務費'],['serviceTotal','仲介服務費合計（另計）'],['tenantInitial','租客簽約準備金'],['signing','簽約當下房東現金流'],['holding','持有成本月平均']
  ]);
  if(selected.includes('advice')){lines.push('━━━━━━━━━━━━━━','🤖 AI分析與重要提醒','',get('advice'),'');}
  lines.push('━━━━━━━━━━━━━━','📞 聯絡資訊','',roleText(),'中信房屋 中壢高中加盟店｜安傢企業社','', '※以上為快速概估，實際金額及稅務仍依契約、申報資料與現行法令為準。');
  return lines.join('\n');
}
function buildShareText(){
  const d=shareDefinitions[activeShareType];
  const selected=[...document.querySelectorAll('#shareOptions input:checked')].map(x=>x.value);
  localStorage.setItem(d.storage,JSON.stringify(selected));
  if(activeShareType==='rental') return buildRentalShareText(d,selected);
  const title=activeShareType==='buyer'?'【買方購屋試算】':activeShareType==='seller'?'【賣方實拿估算】':'【AI 購屋資金分析】';
  const rows=d.fields.filter(([key])=>selected.includes(key)).map(([key,label,getter])=>`${label}：${getter()}`);
  return [title,...rows,'',roleText(),'中信房屋 中壢高中加盟店｜安傢企業社','以上為快速概估，實際金額依銀行、政府、代書及契約為準。'].join('\n');
}
function updateSharePreview(){$('sharePreview').textContent=buildShareText()}
async function copyShareResult(){const text=buildShareText();try{await navigator.clipboard.writeText(text);alert('分享內容已複製，可直接貼到 LINE。')}catch(e){fallbackCopy(text)}closeShareSettings()}
async function nativeShareResult(){const text=buildShareText();if(navigator.share){try{await navigator.share({title:shareDefinitions[activeShareType].title,text});closeShareSettings();return}catch(e){if(e.name==='AbortError')return}}copyShareResult()}

function init(){

syncBuyerLoanMode();
$('modeByPrice')?.addEventListener('click',()=>setBuyerLoanMode('price'));
$('modeByPrincipal')?.addEventListener('click',()=>setBuyerLoanMode('principal'));
$('rentWithholdEnabled').checked=false;
$('rentNhiEnabled').checked=false;
document.querySelectorAll('.role-card').forEach(b=>b.addEventListener('click',()=>showApp(b.dataset.role)));$('switchRole').onclick=showRoleScreen;$('backToRoles').onclick=showRoleScreen;$('closeQr').onclick=closeQrModal;$('qrModal').addEventListener('click',e=>{if(e.target.id==='qrModal')closeQrModal()});$('closeShare').onclick=closeShareSettings;$('shareModal').addEventListener('click',e=>{if(e.target.id==='shareModal')closeShareSettings()});document.querySelectorAll('.share-presets button').forEach(b=>b.addEventListener('click',()=>setSharePreset(b.dataset.preset)));$('copyShareText').onclick=copyShareResult;$('nativeShareText').onclick=nativeShareResult;document.querySelectorAll('.func-btn').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('.func-btn').forEach(b=>b.classList.remove('active'));document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));btn.classList.add('active');$(btn.dataset.page).classList.add('active');calcAll()}));document.querySelectorAll('input,select').forEach(el=>{el.addEventListener('input',calcAll);el.addEventListener('change',calcAll)});$('ratePreset').addEventListener('change',()=>{const preset=$('ratePreset').value;if(preset==='qingan3')$('rate').value='1.775';else if(preset!=='custom')$('rate').value=preset;calcAll()});$('callBtn').onclick=callAgent;$('lineBtn').onclick=openLine;$('shareBtn').onclick=shareCard;$('qrBtn').onclick=()=>openQrModal(currentRole);
['rentTenantType','rentLandlordType','rentCalcMode'].forEach(id=>$(id).addEventListener('change',()=>{syncRentalTaxDefaults();calcRental()}));
['rentWithholdEnabled','rentNhiEnabled','rentVatEnabled','rentAdvancedTax'].forEach(id=>$(id).addEventListener('change',()=>{calcRental()}));
$('rentHoldingEnabled').addEventListener('change',calcRental);
['rentIncomeTaxEnabled','rentTaxYear','rentExpenseMethod','rentActualExpense','rentIncomeMonths','rentOtherNetIncome','rentUse'].forEach(id=>$(id).addEventListener('change',calcRental));
syncRentalTaxDefaults();
if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js?v='+APP_VERSION).catch(()=>{});if(currentRole)showApp(currentRole);else showRoleScreen();calcAll()}
document.addEventListener('DOMContentLoaded',init);


// Release 9：避免腳本載入順序或瀏覽器快取造成卡片無法點選
document.addEventListener('DOMContentLoaded',function(){
  try{
    initRentalWizard();
initRentalAdvancedPanel();
    calcRental();
  }catch(err){
    console.error('Rental wizard init failed:',err);
  }
});
