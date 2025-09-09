/* ===== Tema y estado persistente ===== */
const root = document.documentElement;
const themeToggle = document.getElementById('themeToggle');
const savedTheme = localStorage.getItem('theme') || (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
root.setAttribute('data-theme', savedTheme);
themeToggle.textContent = savedTheme === 'light' ? '🌞' : '🌙';
themeToggle.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    root.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    themeToggle.textContent = next === 'light' ? '🌞' : '🌙';
});

/* ===== Sidebar colapsable ===== */
const sb = document.querySelector('.sidebar');
const sbToggle = document.getElementById('sbToggle');
const sbState = localStorage.getItem('sb-collapsed') === '1';
if (sbState) sb.classList.add('collapsed');
sbToggle.setAttribute('aria-expanded', (!sbState).toString());
sbToggle.addEventListener('click', ()=>{
    sb.classList.toggle('collapsed');
    const collapsed = sb.classList.contains('collapsed');
    localStorage.setItem('sb-collapsed', collapsed ? '1' : '0');
    sbToggle.setAttribute('aria-expanded', (!collapsed).toString());
});

/* ===== Datos de demo ===== */
const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
function rnd(min,max){ return Math.round(min + Math.random()*(max-min)); }
function genRevenue(n=12){
    const now = new Date();
    const arr = [];
    for(let i=n-1;i>=0;i--){
        const d = new Date(now.getFullYear(), now.getMonth()-i, 1);
        arr.push({ label: months[d.getMonth()], value: rnd(8000, 24000) });
    }
    return arr;
}
const revenue12 = genRevenue(12);
const traffic = [
    {label:'Orgánico', value: 42},
    {label:'Ads',      value: 28},
    {label:'Referido', value: 16},
    {label:'Social',   value: 14},
];

const orders = Array.from({length: 56}).map((_,i)=>({
    id: 1001+i,
    customer: ['Alex','María','Juan','Luisa','Karla','Diego','Ruth','Pablo'][rnd(0,7)],
    date: new Date(Date.now()-rnd(0,29)*86400000),
    status: ['Pagada','Pendiente','Reembolsada'][rnd(0,2)],
    total: (Math.random()*250 + 20)
}));

/* ===== KPIs ===== */
const sum = a => a.reduce((n,x)=>n+x,0);
const kpiRevenue = document.getElementById('kpiRevenue');
const kpiOrders = document.getElementById('kpiOrders');
const kpiCustomers = document.getElementById('kpiCustomers');
const kpiConv = document.getElementById('kpiConv');
const kpiRevenueTrend = document.getElementById('kpiRevenueTrend');
const kpiOrdersTrend = document.getElementById('kpiOrdersTrend');
const kpiCustomersTrend = document.getElementById('kpiCustomersTrend');
const kpiConvTrend = document.getElementById('kpiConvTrend');

const revTotal = sum(revenue12.map(r=>r.value));
const ordTotal = orders.length;
const custTotal = new Set(orders.map(o=>o.customer)).size;
const conv = (3.4 + Math.random()).toFixed(1);

kpiRevenue.textContent = new Intl.NumberFormat('es-MX',{style:'currency',currency:'USD'}).format(revTotal);
kpiOrders.textContent = ordTotal.toString();
kpiCustomers.textContent = custTotal.toString();
kpiConv.textContent = `${conv}%`;
kpiRevenueTrend.textContent = '▲ +8.2%';
kpiOrdersTrend.textContent = '▲ +3.1%';
kpiCustomersTrend.textContent = '▲ +1.4%';
kpiConvTrend.textContent = '▲ +0.3%';

/* ===== Charts (progressive enhancement) ===== */
const lineCtx = document.getElementById('lineChart');
const doughCtx = document.getElementById('doughnutChart');
let lineChart, doughChart;

function drawCharts(range=12){
    if (typeof Chart === 'undefined') return; // por si falla CDN
    const data = revenue12.slice(-range);
    const labels = data.map(d=>d.label);
    const values = data.map(d=>d.value);

    lineChart?.destroy();
    lineChart = new Chart(lineCtx, {
        type:'line',
        data:{ labels, datasets:[{
        label:'Ingresos', data:values, tension:.35, fill:true
        }]},
        options:{
        responsive:true,
        maintainAspectRatio:false,
        plugins:{ legend:{ display:false } },
        scales:{
            y:{ ticks:{ callback:v=>'$'+Intl.NumberFormat('es-MX').format(v) } }
        }
        }
    });

    doughChart?.destroy();
    doughChart = new Chart(doughCtx, {
        type:'doughnut',
        data:{
        labels: traffic.map(t=>t.label),
        datasets:[{ data: traffic.map(t=>t.value) }]
        },
        options:{
        responsive:true, maintainAspectRatio:false,
        plugins:{ legend:{ position:'bottom' } },
        cutout: '62%'
        }
    });
}
drawCharts();
document.getElementById('revRange').addEventListener('change', e=>{
    drawCharts(parseInt(e.target.value,10));
});

/* ===== Tabla de órdenes: búsqueda + paginación ===== */
const tbody = document.getElementById('ordersBody');
const search = document.getElementById('ordersSearch');
const pageSizeSel = document.getElementById('ordersPageSize');
const prevBtn = document.getElementById('prevPage');
const nextBtn = document.getElementById('nextPage');
const pageInfo = document.getElementById('pageInfo');

let state = { q:'', page:1, pageSize: parseInt(pageSizeSel.value,10) };

function formatDate(d){
    return d.toLocaleDateString('es-MX',{ year:'2-digit', month:'short', day:'2-digit' });
}
function formatMoney(n){
    return new Intl.NumberFormat('es-MX',{style:'currency',currency:'USD'}).format(n);
}
function filtered(){
    const q = state.q.toLowerCase().trim();
    if(!q) return orders;
    return orders.filter(o =>
        String(o.id).includes(q) ||
        o.customer.toLowerCase().includes(q) ||
        o.status.toLowerCase().includes(q)
    );
}
function renderTable(){
    const data = filtered();
    const pages = Math.max(1, Math.ceil(data.length / state.pageSize));
    state.page = Math.min(state.page, pages);
    const start = (state.page-1)*state.pageSize;
    const rows = data.slice(start, start+state.pageSize);

    tbody.innerHTML = rows.map(r=>`
        <tr>
        <td>#${r.id}</td>
        <td>${r.customer}</td>
        <td>${formatDate(r.date)}</td>
        <td>${r.status}</td>
        <td class="num">${formatMoney(r.total)}</td>
        </tr>
    `).join('');

    pageInfo.textContent = `${state.page} / ${pages}`;
    prevBtn.disabled = state.page<=1;
    nextBtn.disabled = state.page>=pages;
}
search.addEventListener('input', e=>{ state.q = e.target.value; state.page=1; renderTable(); });
pageSizeSel.addEventListener('change', e=>{ state.pageSize = parseInt(e.target.value,10); state.page=1; renderTable(); });
prevBtn.addEventListener('click', ()=>{ state.page--; renderTable(); });
nextBtn.addEventListener('click', ()=>{ state.page++; renderTable(); });
renderTable();

/* ===== Búsqueda global (demo): filtra tabla también ===== */
document.getElementById('globalSearch').addEventListener('input', e=>{
    search.value = e.target.value;
    search.dispatchEvent(new Event('input'));
});
