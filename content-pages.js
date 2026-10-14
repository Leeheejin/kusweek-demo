import { products, cases, guides, materials, faqs, sizes, sizeRows, getProduct, colorName } from './data.js';

const esc = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
const arrow = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15M13 5l7 7-7 7"/></svg>';
const download = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/></svg>';
const close = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>';

function head(title, english, description, parent) {
  return `<header class="page-head"><div class="wrap"><nav class="breadcrumb" aria-label="현재 위치"><a href="#/">홈</a><span aria-hidden="true">/</span>${parent ? `<a href="${esc(parent.href)}">${esc(parent.label)}</a><span aria-hidden="true">/</span>` : ''}<span aria-current="page">${esc(title)}</span></nav><span class="eyebrow">${esc(english)}</span><h1>${esc(title)}</h1><p>${esc(description)}</p></div></header>`;
}

function cta(title = '생각하고 있는 옷이 있나요?', description = '가까운 디자인에서 출발해 색상과 핏을 살펴보고, 필요한 내용을 요청서에 담아보세요.') {
  return `<section class="cta-section"><span class="eyebrow">LET’S MAKE IT YOURS</span><h2>${esc(title)}</h2><p>${esc(description)}</p><div class="actions" style="justify-content:center"><a class="btn blue" href="#/studio/utility">나의 샘플 구성하기 ${arrow}</a><a class="btn light" href="#/quote">제작 상담 요청</a></div></section>`;
}

function photo(product, { className = 'case-visual', alt = '', color = null } = {}) {
  if (product.sprite) return `<div class="${esc(className)} product-visual"><div class="sprite-photo" style="width:auto;height:100%;aspect-ratio:3/2;flex:0 0 auto" role="img" aria-label="${esc(alt || product.ko)}"></div></div>`;
  const image = product.id === 'utility' && color === 'khaki' ? 'assets/khaki.webp' : product.id === 'utility' && color === 'charcoal' ? 'assets/charcoal.webp' : product.image;
  return `<div class="${esc(className)}"><img src="${esc(image)}" alt="${esc(alt || product.ko)}" loading="lazy" decoding="async"></div>`;
}

function filterBar(route, values, active) {
  return `<nav class="filter-bar" aria-label="분류 선택"><div class="tabs">${values.map(value => `<a class="tab${value === active ? ' active' : ''}" href="#/${esc(route)}${value === '전체' ? '' : `?category=${encodeURIComponent(value)}`}"${value === active ? ' aria-current="page"' : ''}>${esc(value)}</a>`).join('')}</div></nav>`;
}

function modalHeader(title) {
  return `<header class="modal-header"><h2 id="content-modal-title">${esc(title)}</h2><form method="dialog"><button type="submit" data-action="close-modal" aria-label="창 닫기">${close}</button></form></header>`;
}

function sizeTable() {
  return `<div class="table-wrap" tabindex="0" role="region" aria-label="일반핏 셔츠 참고 치수표"><table><caption style="text-align:left;padding:0 0 14px;font-size:12px;color:var(--muted)">일반핏 참고 규격 · 단위 cm</caption><thead><tr><th scope="col">항목</th>${sizes.map(size => `<th scope="col">${esc(size)}</th>`).join('')}</tr></thead><tbody>${sizeRows.map(([label, ...values]) => `<tr><th scope="row">${esc(label)}</th>${values.map(value => `<td>${esc(value)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}

export function renderAbout() {
  return `<section class="about-hero"><div class="copy"><span class="eyebrow">KUSWEEK · HANSUNG F&amp;C</span><h1>셔츠에서 시작되는<br>새로운 가능성.</h1><p>한성에프앤씨의 KUSWEEK.<br>셔츠와 오버셔츠를 출발점으로, 고객이 원하는 옷을 함께 구체화합니다. 익숙한 실루엣에 사용자의 용도와 취향을 더하는 일입니다.</p><div class="actions" style="margin-top:28px"><a class="btn" href="#/products">컬렉션 둘러보기 ${arrow}</a></div></div><img src="assets/factory.jpg" alt="제공된 회사 소개 자료의 의류 제작 현장" decoding="async"></section>
    <section class="section wrap"><div class="intro-grid"><div><span class="eyebrow">FROM YOUR IDEA</span><h2>막연한 생각을,<br>함께 만들 수 있는 옷으로.</h2></div><div><p>처음부터 완성된 디자인을 준비할 필요는 없습니다. 누가, 어떤 하루에 입을 옷인지 이야기하는 것부터 시작합니다. 시각 샘플을 보며 색상과 핏을 비교하고, 원하는 디테일을 하나씩 정리합니다.</p><a class="text-link" href="#/guides/start">처음 제작을 준비한다면 ${arrow}</a></div></div></section>
    <section class="section" style="background:var(--paper)"><div class="wrap"><div class="section-heading"><div><span class="eyebrow">DESIGN THAT CONNECTS</span><h2>선택이 설계로 이어지도록.</h2><p>화면에서 정리한 요구사항을 다음 제작 단계가 이해할 수 있는 정보로 연결합니다.</p></div></div><div class="values"><article><b>01 · DISCOVER</b><h3>보고, 비교하고.</h3><p>가까운 디자인을 찾고 컬러와 실루엣을 비교합니다. 고객이 느끼는 편안함과 브랜드가 원하는 인상을 함께 살펴봅니다.</p></article><article><b>02 · DEFINE</b><h3>원하는 것을 명확하게.</h3><p>선택한 디자인에 수량, 사이즈, 로고와 추가 요구를 담습니다. AI가 보조하는 요구 정리는 담당자가 검토할 제안형 수주의 출발점입니다.</p></article><article><b>03 · DEVELOP</b><h3>만들 수 있는 사양으로.</h3><p>담당자의 검토를 거쳐 패턴·CAD, 샘플 확인, 생산 준비로 연결하는 과정을 보여줍니다. 치수와 소재, 봉제 조건은 실물 확인 후 확정합니다.</p></article></div><p class="fine-print">이 웹사이트는 브랜드·제작 프로세스의 데모입니다. 이미지 기반 미리보기와 요청 관리 체험을 제공하며, 실제 CAD 자동 생성이나 생산 실행을 의미하지 않습니다.</p></div></section>
    ${cta()}`;
}

export function renderGuides(id) {
  if (!id) return `${head('제작 가이드', 'A GOOD PLACE TO START', '작은 선택부터 제작 준비까지. 필요한 내용을 차근차근 살펴보세요.')}<section class="wrap"><div class="guide-grid">${guides.map((guide, index) => `<a class="guide-card" href="#/guides/${esc(guide.id)}"><span class="eyebrow">${String(index + 1).padStart(2, '0')} / ${esc(guide.category)}</span><h3>${esc(guide.title)}</h3><p>${esc(guide.desc)}</p>${arrow}</a>`).join('')}</div></section>${cta('첫 제작, 어디서 시작할까요?', '용도와 희망 수량부터 적어주세요. 디자인이 정해지지 않았어도 시작할 수 있습니다.')}`;
  const guide = guides.find(item => item.id === id);
  if (!guide) return `${head('가이드를 찾을 수 없습니다', 'GUIDE', '다른 제작 가이드를 확인해 주세요.')}<div class="wrap section"><a class="btn" href="#/guides">가이드 목록으로 ${arrow}</a></div>`;
  const extra = id === 'size' ? `<h2>기준 치수부터 확인하세요.</h2><p>아래 수치는 제공된 일반핏 셔츠 표의 참고값입니다. 신체 치수나 현재 컬렉션 각 제품의 확정 실측값으로 사용하지 않습니다.</p><div style="margin:26px 0">${sizeTable()}</div><p class="fine-print">예: 100 사이즈 — 어깨 48 · 가슴둘레 114 · 팔길이 60 · 총장 78cm. 가슴단면은 둘레의 절반인 57cm입니다. 제품별 핏과 완성 치수는 샘플 검토에서 확인합니다.</p><div class="actions" style="margin-top:24px"><a class="btn light" href="downloads/size-guide.pdf" download>사이즈 가이드 PDF ${download}</a></div>`
    : id === 'sample' ? `<h2>한 사양으로 이어지는 제작 과정.</h2><p>요청서의 변경사항과 검토 의견을 같은 맥락에서 확인하고, 패턴·CAD와 샘플 단계에서 정리합니다. 실제 제작 여부와 일정은 담당자의 확인을 거쳐 결정됩니다.</p><div class="actions" style="margin-top:24px"><a class="btn light" href="downloads/production-brief.pdf" download>제작 브리프 PDF ${download}</a></div>`
      : id === 'care' ? `<h2>화면 다음에는, 실물 스와치.</h2><p>소재의 촉감과 두께, 색상은 실물로 비교하는 것이 좋습니다. 세탁 방법과 케어라벨은 확정 원단의 조건을 기준으로 정합니다.</p><a class="text-link" href="#/materials">소재와 제작 디테일 ${arrow}</a>` : '';
  return `${head(guide.title, guide.category, guide.desc, { href: '#/guides', label: '제작 가이드' })}<div class="wrap"><article class="reading"><span class="eyebrow">BEFORE WE BEGIN</span><h2>이렇게 준비해 보세요.</h2><ol>${guide.steps.map(step => `<li>${esc(step)}</li>`).join('')}</ol>${extra}<hr style="margin:38px 0"><div class="actions"><a class="btn" href="#/studio/utility">샘플 구성해 보기 ${arrow}</a><a class="text-link" href="#/guides">모든 가이드</a></div></article></div>`;
}

export function renderMaterials(filter = '전체') {
  const categories = ['전체', ...new Set(materials.map(item => item.category))];
  const active = categories.includes(filter) ? filter : '전체';
  const visible = materials.filter(item => active === '전체' || item.category === active);
  return `${head('소재와 제작 디테일', 'MATERIALS & CRAFT', '원단의 조직에서 봉제의 작은 간격까지. 원하는 옷을 구체화하는 선택들을 살펴보세요.')}<section class="wrap">${filterBar('materials', categories, active)}<div class="material-grid">${visible.map(item => `<article class="material-card"><button type="button" data-action="material-modal" data-id="${esc(item.id)}" aria-haspopup="dialog" aria-label="${esc(item.ko)} 자세히 보기"><div class="material-swatch texture-${esc(item.style)}" aria-hidden="true"></div><span class="eyebrow" style="margin:20px 0 9px;font-size:9px">${esc(item.category)} · ${esc(item.name)}</span><h3 style="margin-top:0">${esc(item.ko)}</h3><p>${esc(item.desc)}</p><span class="text-link" style="margin-top:18px">디테일 살펴보기 ${arrow}</span></button></article>`).join('')}</div><p class="fine-print" style="margin-top:-55px;margin-bottom:55px">소재 이미지는 조직과 제작 항목을 설명하는 시각 예시입니다. 원단 혼용률·중량·색상·가공 조건은 실물 스와치와 샘플을 통해 확인합니다.</p></section>${cta('옷의 분위기는, 소재에서 시작됩니다.', '원하는 촉감과 계절감, 착용 환경을 요청서에 함께 남겨주세요.')}`;
}

export function renderCatalogues() {
  const entries = [
    { title: 'KUSWEEK Catalogue', ko: '브랜드 · 컬렉션', label: '01 / COLLECTION', file: 'catalogue.pdf', description: '브랜드와 컬렉션, 제안형 제작 흐름을 한눈에 살펴보세요.', image: 'assets/clay.webp' },
    { title: 'Size & Fit Guide', ko: '사이즈 · 핏 가이드', label: '02 / SIZE & FIT', file: 'size-guide.pdf', description: '참고 치수와 측정 방법을 제작 준비에 활용하세요.', image: 'assets/ivory.png' },
    { title: 'Production Brief', ko: '제작 브리프', label: '03 / YOUR BRIEF', file: 'production-brief.pdf', description: '용도, 디자인, 수량과 검토할 사양을 차근차근 정리하세요.', image: 'assets/charcoal.webp' },
  ];
  return `${head('카탈로그 & 자료실', 'TAKE A CLOSER LOOK', '브랜드를 살펴보고, 제작에 필요한 정보를 가까이 두세요.')}<section class="wrap"><div class="downloads">${entries.map(entry => `<article class="download-item"><a class="download-cover" href="downloads/${esc(entry.file)}" download aria-label="${esc(entry.ko)} PDF 다운로드"><small>${esc(entry.label)}</small><h2>${esc(entry.title).replaceAll(' ', '<br>')}</h2><img src="${esc(entry.image)}" alt="" loading="lazy" aria-hidden="true"></a><h3>${esc(entry.ko)}</h3><p>${esc(entry.description)}</p><a class="text-link" href="downloads/${esc(entry.file)}" download>PDF 다운로드 ${download}</a></article>`).join('')}</div></section><section class="cta-section"><h2>자료를 보며 떠오른 생각이 있나요?</h2><p>가까운 샘플을 선택하고 원하는 변경사항을 요청서에 남겨보세요.</p><a class="btn blue" href="#/quote">제작 상담 요청 ${arrow}</a></section>`;
}

export function renderCases(filter = '전체') {
  const categories = ['전체', ...new Set(cases.map(item => item.type))];
  const active = categories.includes(filter) ? filter : '전체';
  return `${head('옷으로 이어지는 이야기', 'IDEAS IN CONTEXT', '팀의 하루와 브랜드의 분위기에서 출발한 제안 시나리오. 가까운 이야기를 찾아보세요.')}<section class="wrap">${filterBar('cases', categories, active)}<div class="cases-grid" style="padding-bottom:36px">${cases.filter(item => active === '전체' || item.type === active).map(item => `<article class="case-card"><button type="button" data-action="case-modal" data-id="${esc(item.id)}" aria-haspopup="dialog" aria-label="${esc(item.title)} 제안 보기" style="text-align:left;width:100%;padding:0">${photo(getProduct(item.product), { color: item.color, alt: `${item.meta} 제안 샘플` })}<span class="eyebrow" style="margin:23px 0 10px;font-size:9px">${esc(item.type)} / ${esc(item.meta)}</span><h3 style="margin-top:0">${esc(item.title)}</h3><p>${esc(item.summary)}</p><span class="text-link" style="margin-top:17px">제안 살펴보기 ${arrow}</span></button></article>`).join('')}</div><p class="fine-print" style="margin-top:0;margin-bottom:70px">본 콘텐츠는 제작 상담을 설명하기 위한 제안 시나리오이며 실제 고객명, 계약 또는 납품 실적을 나타내지 않습니다.</p></section>${cta('우리 팀에게 어울리는 옷은?', '일하는 환경과 브랜드의 분위기를 알려주세요. 가까운 디자인을 바탕으로 요구사항을 정리할 수 있습니다.')}`;
}

export function renderFAQ() {
  return `${head('자주 묻는 질문', 'HERE TO HELP', '미리보기부터 제작 상담까지, 시작 전에 궁금한 내용을 확인하세요.')}<section class="wrap section"><div class="faq">${faqs.map(([question, answer], index) => `<details${index === 0 ? ' open' : ''}><summary>${esc(question)}</summary><p>${esc(answer)}</p></details>`).join('')}<div class="actions" style="margin-top:35px"><a class="btn" href="#/quote">내 조건으로 상담 요청 ${arrow}</a><a class="text-link" href="#/guides">제작 가이드 보기</a></div></div></section>`;
}

export function renderCaseModal(id) {
  const item = cases.find(entry => entry.id === id);
  if (!item) return `${modalHeader('제안을 찾을 수 없습니다')}<div class="modal-body"><p>목록에서 다른 제안을 선택해 주세요.</p></div>`;
  const product = getProduct(item.product);
  return `${modalHeader(item.title)}<div class="modal-body">${photo(product, { color: item.color, alt: `${item.meta} 시각 제안` })}<span class="eyebrow" style="margin:24px 0 13px">${esc(item.type)} · ${esc(item.meta)}</span><p>${esc(item.summary)}</p><h3>이런 옷이 필요했어요.</h3><ul>${item.needs.map(need => `<li>${esc(need)}</li>`).join('')}</ul><h3>하나의 제안으로 정리하면.</h3><p>${esc(item.proposal)}</p><dl class="spec-list"><div><dt>기준 디자인</dt><dd>${esc(product.ko)}</dd></div><div><dt>제안 컬러</dt><dd>${esc(colorName(item.color))}</dd></div><div><dt>다음 검토</dt><dd>소재 · 치수 · 로고 사양</dd></div></dl><div class="actions"><a class="btn blue" href="#/studio/${esc(product.id)}" data-action="close-modal">이 디자인으로 시작 ${arrow}</a><a class="btn light" href="#/quote" data-action="close-modal">요구사항 정리하기</a></div><p class="fine-print">실제 납품 사례가 아닌 제안 시나리오입니다. 최종 소재와 사양은 제작 상담·샘플 검토에서 확정합니다.</p></div>`;
}

export function renderMaterialModal(id) {
  const item = materials.find(entry => entry.id === id);
  if (!item) return `${modalHeader('자료를 찾을 수 없습니다')}<div class="modal-body"><p>목록에서 다른 소재 또는 제작 항목을 선택해 주세요.</p></div>`;
  const productId = item.id === 'twill' ? 'everyday' : item.id === 'canvas' ? 'field' : 'utility';
  const checks = {
    washed: ['촉감과 워싱 강도', '색상·로트 차이', '수축률과 세탁 조건'],
    twill: ['원단 중량과 밀도', '실루엣과 드레이프', '착용 환경과 세탁 빈도'],
    canvas: ['중량과 계절감', '활동 시 여유', '안쪽 봉제 마감'],
    pattern: ['기준 사이즈와 완성 치수', '그레이딩·시접·봉제 사양', '샘플 수정 이력'],
    sewing: ['부위별 봉제와 보강', '스티치 간격과 부자재', '칼라·포켓·커프스의 균형'],
    branding: ['로고 원본과 크기', '위치와 컬러 수', '원단과 후가공 방식의 적합성'],
    quality: ['치수 허용 오차', '외관·봉제 검수 항목', '라벨·포장·납기 조건'],
  };
  return `${modalHeader(item.ko)}<div class="modal-body"><div class="material-swatch texture-${esc(item.style)}" style="height:240px" aria-hidden="true"></div><span class="eyebrow" style="margin:24px 0 12px">${esc(item.category)} · ${esc(item.name)}</span><p>${esc(item.desc)}</p><h3>선택 전에 함께 확인할 것.</h3><p>${esc(item.detail)}</p><ul>${(checks[item.id] || []).map(check => `<li>${esc(check)}</li>`).join('')}</ul><div class="actions" style="margin-top:25px"><a class="btn blue" href="#/studio/${esc(productId)}" data-action="close-modal">샘플에서 살펴보기 ${arrow}</a><a class="text-link" href="#/guides/sample" data-action="close-modal">제작 흐름 알아보기</a></div><p class="fine-print">표면 이미지는 이해를 돕는 시각 예시입니다. 실제 원단과 제작 조건은 스와치·샘플로 확인합니다.</p></div>`;
}
