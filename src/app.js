/**
 * 知华科技（上海如静知华信息科技有限公司）
 * 官网：https://www.zhuatech.cn/
 * 商业授权、定制开发、部署与系统集成咨询微信：zhuatech / zhuatech2
 * 软件交付核对与整改清单的本地交互界面。
 */
import {
  STATUSES, TEMPLATES, createItem, createProject, createState, issuesToCsv,
  parseBackup, projectToCsv, recordGaps, safeFileName, statusCounts,
} from './core.js';

const STORAGE_KEY = 'zhuatech.acceptance-record.v1';
const $ = (id) => document.getElementById(id);
const dom = {
  projectSelect: $('projectSelect'), projectName: $('projectName'), projectVersion: $('projectVersion'),
  acceptanceDate: $('acceptanceDate'), itemList: $('itemList'), itemTotal: $('itemTotal'),
  statusFilter: $('statusFilter'), searchInput: $('searchInput'), listEmpty: $('listEmpty'),
  pendingCount: $('pendingCount'), passedCount: $('passedCount'), failedCount: $('failedCount'),
  naCount: $('naCount'), gapCount: $('gapCount'), itemDialog: $('itemDialog'), itemForm: $('itemForm'),
  projectDialog: $('projectDialog'), projectForm: $('projectForm'), backupInput: $('backupInput'),
  confirmDialog: $('confirmDialog'), confirmMessage: $('confirmMessage'), confirmYesButton: $('confirmYesButton'),
  storageWarning: $('storageWarning'), toast: $('toast'), printReport: $('printReport'),
  templateSelect: $('templateSelect'),
  newProjectHint: $('newProjectHint'), exportIssuesButton: $('exportIssuesButton'),
};

let state;
let editingItemId = null;
let toastTimer;

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? parseBackup(saved) : createState();
  } catch (error) {
    dom.storageWarning.textContent = '本地记录无法读取。可以导入之前的 JSON 备份；在此页继续编辑会覆盖当前异常数据。';
    dom.storageWarning.hidden = false;
    return createState();
  }
}

function activeProject() {
  return state.projects.find((project) => project.id === state.activeProjectId);
}

function announce(message) {
  dom.toast.textContent = message;
  dom.toast.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => dom.toast.classList.remove('is-visible'), 3600);
}

function askConfirm(message, confirmLabel = '确认') {
  dom.confirmMessage.textContent = message;
  dom.confirmYesButton.textContent = confirmLabel;
  dom.confirmDialog.returnValue = '';
  dom.confirmDialog.showModal();
  return new Promise((resolve) => {
    dom.confirmDialog.addEventListener('close', () => resolve(dom.confirmDialog.returnValue === 'yes'), { once: true });
  });
}

function persist() {
  activeProject().updatedAt = new Date().toISOString();
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    dom.storageWarning.hidden = true;
  } catch {
    dom.storageWarning.textContent = '浏览器未能保存本地记录。请立即导出 JSON 备份，并检查浏览器的存储设置。';
    dom.storageWarning.hidden = false;
    announce('本地保存失败，请导出备份');
  }
}

function node(tag, className = '', text = '') {
  const element = document.createElement(tag);
  if (className) element.className = className;
  element.textContent = text;
  return element;
}

function renderProjectFields() {
  const project = activeProject();
  dom.projectSelect.replaceChildren();
  for (const entry of state.projects) {
    const option = node('option', '', entry.name || '未命名项目');
    option.value = entry.id;
    dom.projectSelect.append(option);
  }
  dom.projectSelect.value = project.id;
  dom.projectName.value = project.name;
  dom.projectVersion.value = project.version;
  dom.acceptanceDate.value = project.acceptanceDate;
}

function renderSummary() {
  const items = activeProject().items;
  const counts = statusCounts(items);
  dom.pendingCount.textContent = counts['待检查'];
  dom.passedCount.textContent = counts['通过'];
  dom.failedCount.textContent = counts['未通过'];
  dom.exportIssuesButton.disabled = counts['未通过'] === 0;
  dom.exportIssuesButton.title = counts['未通过'] === 0 ? '先将发现的问题标记为未通过' : '';
  dom.naCount.textContent = counts['不适用'];
  dom.gapCount.textContent = items.filter((item) => recordGaps(item).length > 0).length;
  dom.itemTotal.textContent = `(${items.length})`;
}

function itemMatches(item) {
  const filter = dom.statusFilter.value;
  if (filter === 'gaps' && recordGaps(item).length === 0) return false;
  if (filter !== 'all' && filter !== 'gaps' && item.status !== filter) return false;
  const query = dom.searchInput.value.trim().toLocaleLowerCase('zh-CN');
  if (!query) return true;
  return [item.code, item.category, item.title, item.criterion].some(
    (value) => value.toLocaleLowerCase('zh-CN').includes(query),
  );
}

function renderList() {
  const items = activeProject().items.filter(itemMatches);
  const fragment = document.createDocumentFragment();
  for (const item of items) {
    const row = node('article', 'item-row');
    const main = node('div', 'item-main');
    const head = node('div', 'item-head');
    head.append(node('span', 'item-code', item.code || '未编号'));
    head.append(node('span', 'item-category', item.category || '未分类'));
    head.append(node('span', 'item-title', item.title || '未命名检查项'));
    main.append(head);
    if (item.criterion.trim()) main.append(node('div', 'item-subline', `依据：${item.criterion}`));
    const gaps = recordGaps(item);
    if (gaps.length) main.append(node('span', 'item-gap', gaps.join('、')));
    row.append(main);

    const status = node('select', 'row-status');
    status.setAttribute('aria-label', `${item.code || item.title}的结果`);
    status.dataset.status = item.status;
    for (const value of STATUSES) {
      const option = node('option', '', value);
      option.value = value;
      status.append(option);
    }
    status.value = item.status;
    status.addEventListener('change', () => {
      item.status = status.value;
      persist();
      renderSummary();
      renderList();
      announce('结果已保存');
    });
    row.append(status);

    const edit = node('button', 'edit-button', '填写');
    edit.type = 'button';
    edit.setAttribute('aria-label', `填写${item.code || item.title}的验收记录`);
    edit.addEventListener('click', () => openEditor(item.id));
    row.append(edit);
    fragment.append(row);
  }
  dom.itemList.replaceChildren(fragment);
  dom.listEmpty.hidden = items.length !== 0;
}

function render() {
  renderProjectFields();
  renderSummary();
  renderList();
}

function field(name) {
  return dom.itemForm.elements.namedItem(name);
}

function openEditor(itemId = null) {
  editingItemId = itemId;
  const item = itemId ? activeProject().items.find((entry) => entry.id === itemId) : createItem();
  $('editorTitle').textContent = itemId ? '填写检查项' : '新增检查项';
  field('code').setCustomValidity('');
  for (const key of ['code', 'category', 'title', 'criterion', 'status', 'evidence', 'issue', 'owner', 'retestDate']) {
    field(key).value = item[key];
  }
  $('deleteItemButton').hidden = !itemId;
  dom.itemDialog.showModal();
  field(itemId ? 'criterion' : 'code').focus();
}

function download(name, content, type) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}

function renderPrintReport() {
  const project = activeProject();
  const report = dom.printReport;
  report.replaceChildren();
  report.append(node('h1', '', '软件交付核对记录'));
  report.append(node('p', '', `项目：${project.name || '未命名项目'}　交付版本：${project.version || '未填'}　验收日期：${project.acceptanceDate || '未填'}`));
  report.append(node('p', '', '结果为人工填写记录；项目验收结论应以合同、需求与双方确认的证据为准。'));
  const table = node('table');
  const thead = node('thead');
  const headerRow = node('tr');
  for (const title of ['编号', '领域', '检查点', '项目约定标准及依据', '结果', '证据位置', '问题与处理', '责任人', '复测日期']) {
    headerRow.append(node('th', '', title));
  }
  thead.append(headerRow);
  table.append(thead);
  const body = node('tbody');
  for (const item of project.items) {
    const row = node('tr');
    for (const key of ['code', 'category', 'title', 'criterion', 'status', 'evidence', 'issue', 'owner', 'retestDate']) {
      row.append(node('td', '', item[key]));
    }
    body.append(row);
  }
  table.append(body);
  report.append(table);
}

function bindEvents() {
  for (const [id, template] of Object.entries(TEMPLATES)) {
    const option = node('option', '', template.name);
    option.value = id;
    dom.templateSelect.append(option);
  }
  dom.templateSelect.addEventListener('change', () => {
    dom.newProjectHint.textContent = TEMPLATES[dom.templateSelect.value].description;
  });
  dom.projectSelect.addEventListener('change', () => {
    state.activeProjectId = dom.projectSelect.value;
    dom.statusFilter.value = 'all';
    dom.searchInput.value = '';
    persist();
    render();
  });
  for (const [element, key] of [[dom.projectName, 'name'], [dom.projectVersion, 'version'], [dom.acceptanceDate, 'acceptanceDate']]) {
    element.addEventListener('input', () => {
      activeProject()[key] = element.value;
      if (key === 'name') dom.projectSelect.selectedOptions[0].textContent = element.value || '未命名项目';
      persist();
    });
  }
  $('newProjectButton').addEventListener('click', () => {
    dom.projectForm.reset();
    dom.templateSelect.value = 'website';
    dom.newProjectHint.textContent = TEMPLATES.website.description;
    dom.projectDialog.showModal();
    dom.projectForm.elements.namedItem('newProjectName').focus();
  });
  $('cancelProjectButton').addEventListener('click', () => dom.projectDialog.close());
  dom.projectForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const name = dom.projectForm.elements.namedItem('newProjectName').value.trim();
    if (!name) return;
    if (state.projects.length >= 50) return announce('最多保存 50 个项目，请先导出备份');
    const project = createProject(name, dom.templateSelect.value);
    state.projects.push(project);
    state.activeProjectId = project.id;
    persist();
    dom.projectDialog.close();
    render();
    announce('项目已创建');
  });
  $('deleteProjectButton').addEventListener('click', async () => {
    const project = activeProject();
    if (!await askConfirm(`删除“${project.name || '未命名项目'}”及其全部检查记录？删除后无法撤销。`, '删除项目')) return;
    state.projects = state.projects.filter((entry) => entry.id !== project.id);
    if (!state.projects.length) state = createState();
    else state.activeProjectId = state.projects[0].id;
    persist();
    render();
    announce('项目已删除');
  });
  dom.statusFilter.addEventListener('change', renderList);
  dom.searchInput.addEventListener('input', renderList);
  $('addItemButton').addEventListener('click', () => openEditor());
  $('closeEditorButton').addEventListener('click', () => dom.itemDialog.close());
  $('cancelEditorButton').addEventListener('click', () => dom.itemDialog.close());
  dom.itemForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!dom.itemForm.reportValidity()) return;
    const project = activeProject();
    const code = field('code').value.trim();
    if (project.items.some((item) => item.code.toLocaleLowerCase('zh-CN') === code.toLocaleLowerCase('zh-CN') && item.id !== editingItemId)) {
      field('code').setCustomValidity('这个编号已存在');
      field('code').reportValidity();
      return;
    }
    field('code').setCustomValidity('');
    if (!editingItemId && project.items.length >= 500) return announce('单个项目最多 500 项');
    const item = editingItemId ? project.items.find((entry) => entry.id === editingItemId) : createItem();
    for (const key of ['code', 'category', 'title', 'criterion', 'status', 'evidence', 'issue', 'owner', 'retestDate']) {
      item[key] = field(key).value.trim();
    }
    if (!editingItemId) project.items.push(item);
    persist();
    dom.itemDialog.close();
    renderSummary();
    renderList();
    announce('检查记录已保存');
  });
  field('code').addEventListener('input', () => field('code').setCustomValidity(''));
  $('deleteItemButton').addEventListener('click', async () => {
    const project = activeProject();
    const item = project.items.find((entry) => entry.id === editingItemId);
    if (!item || !await askConfirm(`删除检查项“${item.code} ${item.title}”？`, '删除检查项')) return;
    project.items = project.items.filter((entry) => entry.id !== editingItemId);
    persist();
    dom.itemDialog.close();
    renderSummary();
    renderList();
    announce('检查项已删除');
  });
  $('exportCsvButton').addEventListener('click', () => {
    const project = activeProject();
    download(`${safeFileName(project.name)}-交付核对记录.csv`, projectToCsv(project), 'text/csv;charset=utf-8');
    announce('完整核对记录已导出');
  });
  dom.exportIssuesButton.addEventListener('click', () => {
    const project = activeProject();
    if (!project.items.some((item) => item.status === '未通过')) return announce('还没有标记为未通过的问题');
    download(`${safeFileName(project.name)}-待整改清单.csv`, issuesToCsv(project), 'text/csv;charset=utf-8');
    announce('待整改清单已导出，请核对后发给供应商');
  });
  $('exportJsonButton').addEventListener('click', () => {
    download('知华验收记录-全部项目备份.json', JSON.stringify(state, null, 2), 'application/json;charset=utf-8');
    announce('全部项目备份已导出');
  });
  $('importJsonButton').addEventListener('click', () => dom.backupInput.click());
  dom.backupInput.addEventListener('change', async () => {
    const file = dom.backupInput.files?.[0];
    dom.backupInput.value = '';
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) return announce('备份文件不能超过 10 MB');
    try {
      const incoming = parseBackup(await file.text());
      if (!await askConfirm(`导入后将替换当前浏览器中的 ${state.projects.length} 个项目。`, '替换并导入')) return;
      state = incoming;
      persist();
      render();
      announce('备份已导入');
    } catch (error) {
      announce(error.message || '备份导入失败');
    }
  });
  $('printButton').addEventListener('click', () => {
    renderPrintReport();
    window.print();
  });
}

state = loadState();
bindEvents();
render();
