/**
 * KUSWEEK local workflow demo. No HTTP requests, accounts or external delivery.
 *
 * createWorkflowStore(options?) =>
 *   getState()                         deeply frozen public snapshot
 *   subscribe(fn, {immediate=true}?)    unsubscribe function
 *   createRequest(input)               request, including its new threadId
 *   updateRequest(id, {status?, supplierNote?}) -> request
 *   createThread(config?)              thread; accepts raw config or
 *                                     {config, title, requestId}
 *   sendMessage(threadId, text, {role='customer', attachments=[]}?) -> message
 *   setAutoReply(boolean)              boolean
 *   getRequest(id) / getThread(id)     frozen entity or null
 *   resetDemo() / dispose()
 *
 * input: {config|configSnapshot, quantity, sizeBreakdown, deadline, budget,
 *         contact:{name,company,email,phone}, contactNote, attachments, title}
 * config: {product,color,fabric,fit,pocket,collar,sleeve,logo,logoText,size,
 *          view,purpose,sizeBreakdown,previewImage,previewKey}
 * Choices accept strings or {id,name,label,value,hex}; sizeBreakdown accepts
 * [{size,quantity}] or a size -> quantity map. Deadline is optional YYYY-MM-DD.
 * Attachment records retain only name,size,type,lastModified, never file data.
 * previewImage is an optional PNG/WebP base64 data URI, <=250 KiB decoded.
 * previewKey is the caller's thumbnail configuration key (up to 2000 chars).
 * The complete submitted configSnapshot is immutable; updateRequest only
 * changes workflow status and the supplier's internal note.
 *
 * state: {schemaVersion,revision,mode,disclaimer,storageMode,settings,
 *         requests,threads,updatedAt}. Each thread owns a messages array.
 * All text is plain text: render with textContent, not innerHTML.
 * A supplier reply cancels pending demo replies in that thread.
 *
 * Demo automatic replies are off by default; supplier replies need no login.
 * Optional test/embedding options: storageKey, storage (null disables),
 * channelFactory(name), seed=false, autoReplyDelay=850. Call dispose on teardown.
 */

export const STATUS_SEQUENCE = Object.freeze(['request', 'review', 'cad', 'sample', 'production']);
export const STATUS_LABELS = Object.freeze({
  request: '견적 요청', review: '요구사항 검토', cad: 'CAD 설계 검토',
  sample: '샘플 확인', production: '제작 준비',
});
export const DEMO_NOTICE = '브라우저에만 저장되는 데모입니다. 요청·상담은 실제 업체로 전송되지 않습니다.';
export function getNextStatus(status) {
  const i = STATUS_SEQUENCE.indexOf(status);
  return i >= 0 ? STATUS_SEQUENCE[i + 1] || null : null;
}

const VERSION = 1;
const DEFAULT_KEY = 'kusweek-studio:workflow:v1';
const CHOICE_KEYS = ['product', 'color', 'fabric', 'fit', 'pocket', 'collar', 'sleeve', 'logo', 'logoText', 'size', 'view', 'purpose'];
const clone = value => JSON.parse(JSON.stringify(value));
const freeze = value => {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
};
const text = (value, limit = 4000) => String(value ?? '').replace(/\u0000/g, '').trim().slice(0, limit);
const id = prefix => `${prefix}-${globalThis.crypto?.randomUUID?.() || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`}`;
const stampOrder = (a = {}, b = {}) => (Number(a.clock) || 0) - (Number(b.clock) || 0) || String(a.actor || '').localeCompare(String(b.actor || ''));
const byStamp = (a, b) => stampOrder(a._stamp, b._stamp) || a.id.localeCompare(b.id);
const newest = (a, b) => stampOrder(a._stamp, b._stamp) >= 0 ? a : b;
const publicCopy = value => {
  const result = clone(value);
  const strip = item => {
    if (!item || typeof item !== 'object') return;
    delete item._stamp;
    for (const child of Object.values(item)) strip(child);
  };
  strip(result);
  return freeze(result);
};

function quantity(value, fallback = 0) {
  if (value === undefined || value === null || value === '') return fallback;
  const n = Number(value);
  if (!Number.isSafeInteger(n) || n < 0 || n > 10000000) throw new TypeError('수량은 0 이상의 정수로 입력해 주세요.');
  return n;
}
function choice(value) {
  if (value === undefined || value === null) return '';
  if (typeof value !== 'object') return text(value, 180);
  const result = {};
  for (const key of ['id', 'name', 'label', 'value', 'hex']) {
    if (value[key] !== undefined && typeof value[key] !== 'object') result[key] = text(value[key], 180);
  }
  return result;
}
const choiceLabel = value => typeof value === 'object' ? value?.label || value?.name || value?.value || value?.id || '' : value || '';
function sizes(value) {
  if (!value) return [];
  const entries = Array.isArray(value) ? value : Object.entries(value).map(([size, amount]) => ({size, quantity: amount}));
  if (entries.length > 30) throw new TypeError('사이즈는 최대 30개까지 입력할 수 있습니다.');
  const result = new Map();
  for (const item of entries) {
    const size = text(item.size ?? item.label, 30);
    const amount = quantity(item.quantity ?? item.qty);
    if (!size) throw new TypeError('사이즈 이름을 입력해 주세요.');
    if (amount) result.set(size, (result.get(size) || 0) + amount);
  }
  return [...result].map(([size, amount]) => ({size, quantity: amount}));
}
function attachments(value = []) {
  if (!Array.isArray(value) || value.length > 12) throw new TypeError('첨부 정보는 최대 12개까지 저장할 수 있습니다.');
  return value.map(file => {
    if (!file || !text(file.name, 240)) throw new TypeError('첨부 파일 이름을 확인해 주세요.');
    const bytes = Number(file.size ?? 0);
    if (!Number.isSafeInteger(bytes) || bytes < 0) throw new TypeError('첨부 파일 크기를 확인해 주세요.');
    return {
      name: text(file.name, 240), size: bytes, type: text(file.type, 120),
      lastModified: Number.isFinite(Number(file.lastModified)) ? Math.max(0, Number(file.lastModified)) : 0,
    };
  });
}
function thumbnail(value) {
  if (value === undefined || value === null || value === '') return '';
  const limit = 250 * 1024;
  const error = () => new TypeError('미리보기는 250KB 이하의 PNG 또는 WebP 데이터 이미지여야 합니다.');
  if (typeof value !== 'string' || value.length > Math.ceil(limit / 3) * 4 + 64) throw error();
  const match = /^data:image\/(png|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);
  if (!match || match[2].length % 4) throw error();
  const payload = match[2], padding = payload.endsWith('==') ? 2 : payload.endsWith('=') ? 1 : 0;
  if (payload.length * 3 / 4 - padding > limit) throw error();
  let header;
  try { header = globalThis.atob(payload.slice(0, 32)); } catch { throw error(); }
  if (match[1] === 'png' ? !header.startsWith('\x89PNG\r\n\x1a\n') : header.slice(0, 4) !== 'RIFF' || header.slice(8, 12) !== 'WEBP') throw error();
  return value;
}
function snapshot(config = {}, input = {}) {
  const result = {};
  for (const key of CHOICE_KEYS) result[key] = choice(config[key]);
  result.sizeBreakdown = sizes(input.sizeBreakdown ?? config.sizeBreakdown);
  const total = result.sizeBreakdown.reduce((sum, item) => sum + item.quantity, 0);
  result.quantity = quantity(input.quantity ?? config.quantity, total);
  if (total && result.quantity !== total) throw new TypeError('사이즈별 수량의 합계와 전체 수량을 맞춰 주세요.');
  result.deadline = text(input.deadline ?? config.deadline, 10);
  if (result.deadline && (!/^\d{4}-\d{2}-\d{2}$/.test(result.deadline) || !Number.isFinite(Date.parse(result.deadline)) || new Date(result.deadline).toISOString().slice(0, 10) !== result.deadline)) {
    throw new TypeError('희망 납기를 YYYY-MM-DD 형식의 날짜로 입력해 주세요.');
  }
  result.budget = text(input.budget ?? config.budget, 100);
  result.contactNote = text(input.contactNote ?? input.note ?? config.contactNote);
  const contact = input.contact ?? config.contact ?? {};
  result.contact = Object.fromEntries(['name', 'company', 'email', 'phone'].map(key => [key, text(contact[key], 180)]));
  result.attachments = attachments(input.attachments ?? config.attachments ?? []);
  result.previewImage = thumbnail(input.previewImage ?? config.previewImage);
  result.previewKey = text(input.previewKey ?? config.previewKey, 2000);
  return result;
}

function union(a, b, mergeItem = newest) {
  const map = new Map(a.map(item => [item.id, item]));
  for (const item of b) map.set(item.id, map.has(item.id) ? mergeItem(map.get(item.id), item) : item);
  return [...map.values()];
}
function merge(a, b) {
  if (!b) return a;
  const epochOrder = stampOrder(a.epoch, b.epoch);
  if (epochOrder) return clone(epochOrder > 0 ? a : b);
  return {
    schemaVersion: VERSION, epoch: a.epoch, clock: Math.max(a.clock, b.clock),
    updatedAt: a.updatedAt > b.updatedAt ? a.updatedAt : b.updatedAt,
    settings: newest(a.settings, b.settings),
    requests: union(a.requests, b.requests, (x, y) => ({...newest(x, y), statusHistory: union(x.statusHistory, y.statusHistory).sort(byStamp)})),
    threads: union(a.threads, b.threads, (x, y) => ({...newest(x, y), messages: union(x.messages, y.messages).sort(byStamp)})),
  };
}
function validRecord(value) {
  if (!value || value.schemaVersion !== VERSION || !value.epoch || !Number.isFinite(value.clock) || !value.settings || typeof value.settings.autoReply !== 'boolean' || !Array.isArray(value.requests) || !Array.isArray(value.threads)) return null;
  if (value.requests.some(r => !r || typeof r.id !== 'string' || !r.configSnapshot || !STATUS_SEQUENCE.includes(r.status) || !Array.isArray(r.statusHistory))) return null;
  if (value.threads.some(t => !t || typeof t.id !== 'string' || !t.configSnapshot || !Array.isArray(t.messages) || t.messages.some(m => !m || typeof m.id !== 'string' || typeof m.text !== 'string'))) return null;
  return value;
}

export function createWorkflowStore(options = {}) {
  const storageKey = options.storageKey || DEFAULT_KEY;
  const actor = id('tab');
  const listeners = new Set(), pending = new Map();
  let disposed = false, storage, channel, storageMode = 'memory';
  try { storage = Object.hasOwn(options, 'storage') ? options.storage : globalThis.localStorage; } catch { storage = null; }
  const now = () => new Date().toISOString();
  const blank = () => ({
    schemaVersion: VERSION, epoch: {clock: 0, actor: 'initial'}, clock: 0,
    updatedAt: now(), settings: {autoReply: false, _stamp: {clock: 0, actor: 'seed'}},
    requests: [], threads: [],
  });
  let record = blank();

  function readStorage() {
    if (!storage) return null;
    try {
      const raw = storage.getItem(storageKey);
      storageMode = 'persistent';
      return raw ? validRecord(JSON.parse(raw)) : null;
    } catch { storageMode = 'memory'; return null; }
  }
  function writeStorage() {
    if (!storage) { storageMode = 'memory'; return; }
    try { storage.setItem(storageKey, JSON.stringify(record)); storageMode = 'persistent'; }
    catch { storageMode = 'memory'; }
  }
  function nextStamp() { record.clock += 1; return {clock: record.clock, actor}; }
  function ensureActive() { if (disposed) throw new Error('이 데모 저장소는 종료되었습니다.'); }
  function getState() {
    return publicCopy({
      schemaVersion: VERSION, revision: record.clock, mode: 'local-demo', disclaimer: DEMO_NOTICE,
      storageMode, settings: record.settings, updatedAt: record.updatedAt,
      requests: [...record.requests].sort((a, b) => b.createdAt.localeCompare(a.createdAt) || a.id.localeCompare(b.id)),
      threads: record.threads,
    });
  }
  function emit() {
    const state = getState();
    for (const fn of [...listeners]) {
      try { fn(state); } catch (error) { console.error('KUSWEEK demo subscriber failed:', error); }
    }
  }
  function cancel(threadId) {
    const timer = pending.get(threadId);
    if (timer !== undefined) clearTimeout(timer);
    pending.delete(threadId);
  }
  function cancelAll() { for (const threadId of pending.keys()) cancel(threadId); }
  function receive(incoming) {
    if (disposed || !validRecord(incoming)) return;
    const before = JSON.stringify(record);
    const oldEpoch = record.epoch;
    record = merge(record, incoming);
    if (before === JSON.stringify(record)) return;
    if (stampOrder(oldEpoch, record.epoch) || !record.settings.autoReply) cancelAll();
    for (const [threadId, timer] of pending) {
      const thread = record.threads.find(item => item.id === threadId);
      if (!thread || thread.messages.at(-1)?.role !== 'customer') { clearTimeout(timer); pending.delete(threadId); }
    }
    writeStorage(); emit();
  }
  function begin() { ensureActive(); record = merge(record, readStorage()); }
  function commit() {
    record.updatedAt = now();
    writeStorage();
    try { channel?.postMessage({type: 'state', actor, record}); } catch { /* storage events remain available */ }
    emit();
  }
  function findThread(threadId) {
    const thread = record.threads.find(item => item.id === threadId);
    if (!thread) throw new Error('상담을 찾을 수 없습니다.');
    return thread;
  }
  function addMessage(thread, content, role, files = [], extra = {}) {
    const createdAt = now(), stamp = nextStamp();
    const message = {
      id: id('message'), threadId: thread.id, role, text: content, attachments: files,
      senderLabel: extra.isAutoReply ? '데모 자동응답' : role === 'supplier' ? '업체 담당자 · 데모' : role === 'system' ? '데모 워크플로우' : '고객 · 데모',
      isAutoReply: false, isExample: false, delivery: 'local-only', createdAt, ...extra, _stamp: stamp,
    };
    thread.messages.push(message); thread.updatedAt = createdAt; thread._stamp = stamp;
    return message;
  }
  function newThread(config, title, requestId = null, example = false) {
    const createdAt = now();
    const thread = {
      id: id('thread'), title: text(title || `${choiceLabel(config.product) || '의류'} 제작 상담`, 200),
      requestId, configSnapshot: clone(config), messages: [], isExample: example,
      createdAt, updatedAt: createdAt, _stamp: nextStamp(),
    };
    record.threads.push(thread);
    return thread;
  }
  function responseFor(thread, content) {
    const c = thread.configSnapshot;
    const garment = choiceLabel(c.product) || '선택한 의류';
    const fit = choiceLabel(c.fit) || '선택한 핏';
    const fabric = choiceLabel(c.fabric) || '선택한 원단';
    const color = choiceLabel(c.color) || '선택한 컬러';
    const prefix = '[데모 자동응답] ';
    if (/핏|사이즈|치수|기장|소매|size|fit/i.test(content)) {
      const breakdown = c.sizeBreakdown.map(item => `${item.size} ${item.quantity}장`).join(', ');
      return `${prefix}${garment}의 ${fit} 설정을 확인했습니다.${breakdown ? ` 요청 사이즈는 ${breakdown}입니다.` : ''} 변경할 기장·소매 치수를 남기면 담당자가 패턴 검토 항목으로 정리하는 흐름입니다. 실제 치수는 CAD 검토와 샘플 확인 후 확정합니다.`;
    }
    if (/원단|소재|컬러|색|fabric|color/i.test(content)) return `${prefix}현재 선택은 ${fabric} / ${color}입니다. 원하는 두께·촉감·색상 기준을 남겨 주세요. 실제 원단 재고와 색상은 담당자가 확인하며, 이 화면에서는 확인되지 않습니다.`;
    if (/납기|배송|일정|언제|deadline/i.test(content)) return `${prefix}${c.deadline ? `희망 납기 ${c.deadline}` : '희망 납기 미정'}으로 기록되어 있습니다. 요구사항 검토 → CAD 설계 검토 → 샘플 확인 → 제작 준비 순서로 진행 여부를 협의하는 데모입니다. 실제 납기 약속은 생성되지 않습니다.`;
    if (/가격|견적|금액|예산|단가|비용|price|cost/i.test(content)) return `${prefix}수량 ${c.quantity || '미정'}${c.quantity ? '장' : ''}${c.budget ? `, 희망 예산 ${c.budget}` : ''}을 기준으로 요청 내용을 정리합니다. 원단·봉제 사양 검토 후 업체가 견적을 제안하는 흐름이며, 자동으로 확정된 견적은 아닙니다.`;
    if (/캐드|CAD|패턴|샘플|제작|생산/i.test(content)) return `${prefix}${garment}의 선택 사양을 요구사항으로 정리하고, 담당자 CAD 검토와 샘플 확인을 거쳐 제작 준비로 이어집니다. 이 데모는 상태와 상담의 연결만 보여주며 실제 CAD 파일이나 제작 지시를 생성하지 않습니다.`;
    return `${prefix}${garment} / ${fit} / ${fabric} 설정에 관한 상담으로 기록했습니다. 필요한 디자인·수량·납기를 구체적으로 남겨 주세요. 업체 받은함에서 같은 상담을 확인하고 담당자 답변을 작성할 수 있습니다.`;
  }
  function scheduleReply(threadId, messageId) {
    cancel(threadId);
    if (!record.settings.autoReply) return;
    const delay = Math.max(0, Number.isFinite(options.autoReplyDelay) ? options.autoReplyDelay : 850);
    pending.set(threadId, setTimeout(() => {
      pending.delete(threadId);
      if (disposed) return;
      begin();
      const thread = record.threads.find(item => item.id === threadId);
      const last = thread?.messages.at(-1);
      if (!record.settings.autoReply || !last || last.id !== messageId || last.role !== 'customer') return;
      addMessage(thread, responseFor(thread, last.text), 'supplier', [], {isAutoReply: true});
      commit();
    }, delay));
  }

  function createThread(input = {}) {
    begin();
    const config = snapshot(input.configSnapshot || input.config || input, input);
    if (input.requestId && !record.requests.some(r => r.id === input.requestId)) throw new Error('연결할 요청을 찾을 수 없습니다.');
    const thread = newThread(config, input.title, input.requestId || null);
    commit(); return publicCopy(thread);
  }
  function createRequest(input = {}) {
    begin();
    const config = snapshot(input.configSnapshot || input.config || input, input);
    if (!choiceLabel(config.product)) throw new TypeError('요청할 의류를 선택해 주세요.');
    if (config.quantity < 1) throw new TypeError('요청 수량은 1장 이상 입력해 주세요.');
    const createdAt = now(), requestId = id('request'), stamp = nextStamp();
    const title = text(input.title || `${choiceLabel(config.product)} · ${config.quantity}장`, 200);
    const thread = newThread(config, `${title} 상담`, requestId);
    const request = {
      id: requestId, title, requestNumber: `DEMO-${new Date().toISOString().slice(0,10).replaceAll('-', '')}-${requestId.slice(-6).toUpperCase()}`,
      status: 'request', configSnapshot: config, quantity: config.quantity, deadline: config.deadline,
      budget: config.budget, contact: clone(config.contact), contactNote: config.contactNote,
      attachments: clone(config.attachments), supplierNote: '', threadId: thread.id,
      statusHistory: [{id: id('event'), status: 'request', label: STATUS_LABELS.request, createdAt, _stamp: stamp}],
      isExample: false, delivery: 'local-only', createdAt, updatedAt: createdAt, _stamp: stamp,
    };
    record.requests.push(request);
    addMessage(thread, `견적 요청이 이 브라우저의 데모 받은함에 저장되었습니다. ${DEMO_NOTICE}`, 'system');
    commit(); return publicCopy(request);
  }
  function updateRequest(requestId, patch = {}) {
    begin();
    const request = record.requests.find(item => item.id === requestId);
    if (!request) throw new Error('요청을 찾을 수 없습니다.');
    if (Object.keys(patch).some(key => !['status', 'supplierNote'].includes(key))) throw new TypeError('제출된 요구사항은 변경할 수 없습니다. 상태와 업체 메모만 수정할 수 있습니다.');
    if (patch.status !== undefined && !STATUS_SEQUENCE.includes(patch.status)) throw new TypeError('올바른 처리 상태를 선택해 주세요.');
    const stamp = nextStamp(), changedStatus = patch.status !== undefined && patch.status !== request.status;
    if (patch.supplierNote !== undefined) request.supplierNote = text(patch.supplierNote);
    if (changedStatus) {
      request.status = patch.status;
      request.statusHistory.push({id: id('event'), status: patch.status, label: STATUS_LABELS[patch.status], createdAt: now(), _stamp: stamp});
      addMessage(findThread(request.threadId), `데모 처리 상태가 '${STATUS_LABELS[patch.status]}'(으)로 변경되었습니다. 실제 CAD·샘플·생산 작업이 실행된 것은 아닙니다.`, 'system');
    }
    request.updatedAt = now(); request._stamp = stamp;
    commit(); return publicCopy(request);
  }
  function sendMessage(threadId, content, {role = 'customer', attachments: files = []} = {}) {
    begin();
    if (!['customer', 'supplier'].includes(role)) throw new TypeError('메시지 역할은 customer 또는 supplier여야 합니다.');
    const body = text(content, 6000);
    if (!body) throw new TypeError('메시지를 입력해 주세요.');
    const message = addMessage(findThread(threadId), body, role, attachments(files));
    if (role === 'supplier') cancel(threadId);
    commit();
    if (role === 'customer') scheduleReply(threadId, message.id);
    return publicCopy(message);
  }
  function setAutoReply(enabled) {
    begin();
    if (typeof enabled !== 'boolean') throw new TypeError('자동응답 설정은 true 또는 false여야 합니다.');
    record.settings = {autoReply: enabled, _stamp: nextStamp()};
    if (!enabled) cancelAll();
    commit(); return enabled;
  }

  function seedExamples() {
    if (options.seed === false) return;
    const base = {
      product: '유틸리티 셔츠', color: '인디고', fabric: '코튼 트윌', fit: '레귤러',
      pocket: '양쪽 플랩 포켓', collar: '레귤러 칼라', sleeve: '긴 소매',
    };
    for (const [i, status] of ['review', 'cad'].entries()) {
      const config = snapshot({...base, color: i ? '샌드' : '인디고', fit: i ? '릴랙스' : '레귤러'}, {
        quantity: i ? 60 : 120, sizeBreakdown: i ? {100: 30, 105: 30} : {95: 20, 100: 50, 105: 50},
        contact: {name: '가상 고객', company: `가상 예시 스튜디오 ${i+1}`},
        contactNote: '[가상 예시] 실제 주문이나 고객 정보가 아닌 화면 시연용 요구사항입니다.',
      });
      const createdAt = now(), stamp = {clock: 0, actor: 'seed'};
      const requestId = `example-request-${i+1}`, threadId = `example-thread-${i+1}`;
      const thread = {
        id: threadId, requestId, title: `[가상 예시] ${config.color} 셔츠 상담`, configSnapshot: clone(config),
        messages: [{id: `example-message-${i+1}`, threadId, role: 'customer', senderLabel: '가상 예시 고객',
          text: `[가상 예시] ${config.quantity}장의 팀 셔츠를 검토하고 있습니다. 선택한 ${config.fit} 핏과 ${config.color} 컬러 기준으로 제작 상담 흐름을 확인하고 싶습니다.`,
          attachments: [], isAutoReply: false, isExample: true, delivery: 'local-only', createdAt, _stamp: stamp}],
        isExample: true, createdAt, updatedAt: createdAt, _stamp: stamp,
      };
      record.threads.push(thread);
      record.requests.push({
        id: requestId, title: `[가상 예시] ${config.color} 팀 셔츠 · ${config.quantity}장`, requestNumber: `DEMO-EXAMPLE-00${i+1}`,
        status, configSnapshot: config, quantity: config.quantity, deadline: '', budget: '', contact: clone(config.contact),
        contactNote: config.contactNote, attachments: [], supplierNote: '[가상 예시] 시연용 처리 상태입니다.', threadId,
        statusHistory: STATUS_SEQUENCE.slice(0, STATUS_SEQUENCE.indexOf(status)+1).map((s, n) => ({id: `example-event-${i+1}-${n}`, status: s, label: STATUS_LABELS[s], createdAt, _stamp: stamp})),
        isExample: true, delivery: 'local-only', createdAt, updatedAt: createdAt, _stamp: stamp,
      });
    }
  }
  function resetDemo() {
    begin(); cancelAll();
    const epoch = {clock: Math.max(Date.now(), record.epoch.clock + 1), actor};
    record = blank(); record.epoch = epoch; seedExamples(); commit(); return getState();
  }
  function subscribe(fn, {immediate = true} = {}) {
    ensureActive();
    if (typeof fn !== 'function') throw new TypeError('구독 콜백이 필요합니다.');
    listeners.add(fn);
    if (immediate) fn(getState());
    return () => listeners.delete(fn);
  }

  const stored = readStorage();
  if (stored) record = stored;
  else { seedExamples(); writeStorage(); }
  const onStorage = event => {
    if (event.key !== storageKey || !event.newValue) return;
    try { receive(JSON.parse(event.newValue)); } catch { /* ignore malformed external storage */ }
  };
  const onChannel = event => {
    const message = event.data;
    if (!message || message.actor === actor) return;
    if (message.type === 'state') receive(message.record);
    if (message.type === 'hello') {
      try { channel?.postMessage({type: 'state', actor, record}); } catch { /* local state remains usable */ }
    }
  };
  globalThis.addEventListener?.('storage', onStorage);
  try {
    channel = options.channelFactory ? options.channelFactory(`${storageKey}:sync`) : typeof globalThis.BroadcastChannel === 'function' ? new globalThis.BroadcastChannel(`${storageKey}:sync`) : null;
    if (channel) {
      if (channel.addEventListener) channel.addEventListener('message', onChannel);
      else channel.onmessage = onChannel;
      channel.postMessage({type: 'hello', actor});
    }
  } catch { channel = null; }

  return {
    getState, subscribe, createRequest, updateRequest, createThread, sendMessage, setAutoReply, resetDemo,
    getRequest: requestId => publicCopy(record.requests.find(item => item.id === requestId) || null),
    getThread: threadId => publicCopy(record.threads.find(item => item.id === threadId) || null),
    dispose() {
      if (disposed) return;
      disposed = true; cancelAll(); listeners.clear();
      globalThis.removeEventListener?.('storage', onStorage);
      if (channel?.removeEventListener) channel.removeEventListener('message', onChannel);
      if (channel) channel.onmessage = null;
      channel?.close?.();
    },
  };
}
