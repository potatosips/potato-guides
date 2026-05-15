const $=(s,r=document)=>r.querySelector(s);const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
$$('.copy-btn').forEach(btn=>btn.addEventListener('click',async()=>{const code=btn.parentElement.querySelector('code').innerText;await navigator.clipboard.writeText(code);const old=btn.textContent;btn.textContent='Copied';setTimeout(()=>btn.textContent=old,1200)}));
$('[data-menu-toggle]')?.addEventListener('click',()=> $('[data-mobile-panel]')?.classList.toggle('open'));
const modal=$('[data-search-modal]'), input=$('#site-search'), results=$('#search-results');let index=[];
async function loadIndex(){try{index=await fetch('/search-index.json').then(r=>r.json())}catch(e){index=[]}}
function openSearch(){modal.classList.add('open');modal.setAttribute('aria-hidden','false');setTimeout(()=>input?.focus(),30);loadIndex()}
function closeSearch(){modal.classList.remove('open');modal.setAttribute('aria-hidden','true')}
$('[data-search-open]')?.addEventListener('click',openSearch);$('[data-search-close]')?.addEventListener('click',closeSearch);modal?.addEventListener('click',e=>{if(e.target===modal)closeSearch()});
document.addEventListener('keydown',e=>{if(e.key==='/'&&!['INPUT','TEXTAREA'].includes(document.activeElement.tagName)){e.preventDefault();openSearch()} if(e.key==='Escape')closeSearch()});
function render(q){q=q.trim().toLowerCase();if(!q){results.innerHTML='<p class="muted">Type to search the guide.</p>';return}const terms=q.split(/\s+/);const found=index.map(item=>{const hay=(item.title+' '+item.tags+' '+item.text).toLowerCase();const score=terms.reduce((s,t)=>s+(hay.includes(t)?1:0),0);return{item,score}}).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,12);results.innerHTML=found.length?found.map(({item})=>`<a class="result" href="${item.url}"><strong>${item.title}</strong><span>${item.text.slice(0,150)}...</span></a>`).join(''):'<p class="muted">No results.</p>'}
input?.addEventListener('input',e=>render(e.target.value));