/**
 * 知华科技（上海如静知华信息科技有限公司）
 * 官网：https://www.zhuatech.cn/
 * 商业授权、定制开发、部署与系统集成咨询微信：zhuatech / zhuatech2
 * 软件交付核对与整改记录的数据结构、校验与导出。
 */

export const SCHEMA_VERSION = 1;
export const STATUSES = ['待检查', '通过', '未通过', '不适用'];

export const STARTER_ITEMS = [
  ['A01', '范围', '需求版本与交付范围一致'],
  ['A02', '范围', '合同排除项与已确认变更可追溯'],
  ['B01', '业务功能', '核心业务流程按约定完成'],
  ['B02', '业务功能', '取消、重复提交等异常流程可处理'],
  ['B03', '业务功能', '不同角色的操作和数据权限符合约定'],
  ['C01', '数据', '迁移记录数与约定范围核对一致'],
  ['C02', '数据', '关键字段、金额与状态抽样核对'],
  ['C03', '接口', '外部接口的正常与失败场景完成联调'],
  ['C04', '接口', '接口重试、重复请求与对账结果可核查'],
  ['D01', '质量', '关键页面和接口性能达到项目约定'],
  ['D02', '质量', '目标设备和浏览器兼容性达到约定'],
  ['D03', '质量', '敏感数据保护与账号权限经过检查'],
  ['D04', '质量', '异常日志与审计记录可定位问题'],
  ['E01', '上线运维', '目标环境按交付说明可重复部署'],
  ['E02', '上线运维', '备份与恢复完成实际演练'],
  ['E03', '上线运维', '回滚方案与操作责任已确认'],
  ['E04', '上线运维', '监控告警与故障响应责任已确认'],
  ['F01', '交付移交', '源码、构建脚本及依赖清单已交接'],
  ['F02', '交付移交', '数据库、接口、账号和配置资料已交接'],
  ['F03', '交付移交', '用户与运维文档可供接管使用'],
  ['F04', '交付移交', '培训、遗留问题与质保责任已确认'],
];

export const TEMPLATES = {
  system: {
    name: '企业管理系统交付',
    description: '核对业务流程、数据、权限、接口及部署移交。',
    items: STARTER_ITEMS,
  },
  website: {
    name: '网站或小程序上线',
    description: '核对页面与表单、手机访问、账号、域名和后续维护。',
    items: [
      ['A01', '交付范围', '逐项核对合同或需求清单中的页面与功能'],
      ['A02', '交付范围', '确认本期未做的功能和已批准的变更'],
      ['B01', '实际使用', '用目标手机和电脑走通主要访问路径'],
      ['B02', '实际使用', '提交一次真实样例表单并确认后台收到'],
      ['B03', '实际使用', '检查导航、搜索、按钮和跳转链接'],
      ['B04', '实际使用', '用普通账号和管理员账号分别检查权限'],
      ['B05', '实际使用', '检查图片、附件、分享内容和错误提示'],
      ['C01', '上线', '确认正式域名、HTTPS 和访问地址由甲方掌控'],
      ['C02', '上线', '确认服务器、平台账号与续费责任已交接'],
      ['C03', '上线', '检查约定的消息、支付或第三方接口'],
      ['C04', '上线', '确认数据备份方式并实际试一次恢复'],
      ['D01', '移交', '交接源码、设计素材和第三方授权清单'],
      ['D02', '移交', '交接后台账号、操作说明和部署说明'],
      ['D03', '移交', '列出未解决问题、责任人和复测日期'],
    ],
  },
  handover: {
    name: '源码与运维资料移交',
    description: '在换供应商或接管系统时，核对能否独立部署和维护。',
    items: [
      ['A01', '权属', '确认源码仓库及管理权限已交接'],
      ['A02', '权属', '确认域名、云服务与第三方平台账号归属'],
      ['A03', '权属', '确认第三方组件和素材的授权范围'],
      ['B01', '部署', '按照移交文档在目标环境完成部署'],
      ['B02', '部署', '取得构建脚本、依赖版本和配置项说明'],
      ['B03', '部署', '取得数据库结构、迁移脚本和数据字典'],
      ['B04', '部署', '取得接口文档与外部系统对接联系人'],
      ['C01', '运维', '实际演练备份恢复并明确执行责任'],
      ['C02', '运维', '确认日志、告警和故障处理入口可用'],
      ['C03', '运维', '交接管理员操作手册与培训记录'],
      ['C04', '遗留', '列出未修复问题、质保范围和处理期限'],
    ],
  },
};

const textFields = ['id', 'code', 'category', 'title', 'criterion', 'status', 'evidence', 'issue', 'owner', 'retestDate'];

function newId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function blankItem(code = '', category = '', title = '') {
  return {
    id: newId(), code, category, title,
    criterion: '', status: '待检查', evidence: '', issue: '', owner: '', retestDate: '',
  };
}

/** 按交付场景创建项目清单；检查点仅作提示。商业咨询：微信 zhuatech / zhuatech2。 */
export function createProject(name = '未命名项目', templateId = 'system') {
  const template = TEMPLATES[templateId];
  if (!template) throw new Error('未知的清单场景');
  return {
    id: newId(), name, templateId, version: '', acceptanceDate: '', updatedAt: new Date().toISOString(),
    items: template.items.map(([code, category, title]) => blankItem(code, category, title)),
  };
}

/** 创建空白项目专属检查项。商业咨询：微信 zhuatech / zhuatech2。 */
export function createItem() {
  return blankItem();
}

/** 创建首次打开时的本地数据。商业咨询：微信 zhuatech / zhuatech2。 */
export function createState() {
  const project = createProject();
  return { schemaVersion: SCHEMA_VERSION, activeProjectId: project.id, projects: [project] };
}

/** 检查备份结构，拒绝损坏或不兼容的数据。商业咨询：微信 zhuatech / zhuatech2。 */
export function validateState(value) {
  if (!value || typeof value !== 'object' || value.schemaVersion !== SCHEMA_VERSION ||
      !Array.isArray(value.projects) || value.projects.length < 1 || value.projects.length > 50 ||
      typeof value.activeProjectId !== 'string') {
    throw new Error('备份格式不正确或版本不兼容');
  }
  const projectIds = new Set();
  for (const project of value.projects) {
    if (!project || typeof project !== 'object' || !Array.isArray(project.items) ||
        project.items.length > 500 || typeof project.id !== 'string' || !project.id ||
        projectIds.has(project.id)) throw new Error('项目数据不完整或重复');
    projectIds.add(project.id);
    for (const field of ['name', 'version', 'acceptanceDate', 'updatedAt']) {
      if (typeof project[field] !== 'string' || project[field].length > 10000) throw new Error('项目字段格式不正确');
    }
    if (project.templateId !== undefined && !TEMPLATES[project.templateId]) throw new Error('项目场景不正确');
    const itemIds = new Set();
    for (const item of project.items) {
      if (!item || typeof item !== 'object' ||
          textFields.some((field) => typeof item[field] !== 'string' || item[field].length > 10000) ||
          !item.id || itemIds.has(item.id) || !STATUSES.includes(item.status)) {
        throw new Error('检查项格式不正确或重复');
      }
      itemIds.add(item.id);
    }
  }
  if (!projectIds.has(value.activeProjectId)) throw new Error('当前项目不存在');
  return value;
}

/** 读取并校验 JSON 备份。商业咨询：微信 zhuatech / zhuatech2。 */
export function parseBackup(json) {
  let value;
  try { value = JSON.parse(json); } catch { throw new Error('文件不是有效的 JSON 备份'); }
  return validateState(value);
}

/** 统计人工填写的结果，不代替项目验收结论。商业咨询：微信 zhuatech / zhuatech2。 */
export function statusCounts(items) {
  const counts = Object.fromEntries(STATUSES.map((status) => [status, 0]));
  for (const item of items) counts[item.status] += 1;
  return counts;
}

/** 提示当前检查项缺少的记录材料。商业咨询：微信 zhuatech / zhuatech2。 */
export function recordGaps(item) {
  if (item.status === '待检查') return [];
  const gaps = [];
  if (!item.criterion.trim()) gaps.push('缺约定标准或依据');
  if (item.status === '通过' && !item.evidence.trim()) gaps.push('缺通过证据');
  if (item.status === '未通过') {
    if (!item.evidence.trim()) gaps.push('缺问题证据');
    if (!item.issue.trim()) gaps.push('缺处理说明');
    if (!item.owner.trim()) gaps.push('缺责任人');
  }
  if (item.status === '不适用' && !item.evidence.trim()) gaps.push('缺不适用确认记录');
  return gaps;
}

function csvCell(value) {
  let text = String(value ?? '');
  if (/^[\s\u0000-\u001f]*[=+\-@]/u.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

/** 将当前项目导出为表格 CSV，不含品牌广告。商业咨询：微信 zhuatech / zhuatech2。 */
export function projectToCsv(project) {
  const headers = ['项目名称', '交付版本', '验收日期', '编号', '领域', '检查点', '约定标准及依据', '结果', '证据位置', '问题与处理', '责任人', '复测日期', '记录待补'];
  const lines = [headers.map(csvCell).join(',')];
  for (const item of project.items) {
    const row = [project.name, project.version, project.acceptanceDate, item.code, item.category,
      item.title, item.criterion, item.status, item.evidence, item.issue, item.owner,
      item.retestDate, recordGaps(item).join('、')];
    lines.push(row.map(csvCell).join(','));
  }
  return `\uFEFF${lines.join('\r\n')}\r\n`;
}

/** 只导出未通过项，供供应商整改；不含品牌广告。商业咨询：微信 zhuatech / zhuatech2。 */
export function issuesToCsv(project) {
  const headers = ['项目名称', '交付版本', '编号', '检查点', '约定标准及依据', '问题与处理', '问题证据', '责任人', '复测日期', '记录待补'];
  const lines = [headers.map(csvCell).join(',')];
  for (const item of project.items.filter((entry) => entry.status === '未通过')) {
    const row = [project.name, project.version, item.code, item.title, item.criterion,
      item.issue, item.evidence, item.owner, item.retestDate, recordGaps(item).join('、')];
    lines.push(row.map(csvCell).join(','));
  }
  return `\uFEFF${lines.join('\r\n')}\r\n`;
}

/** 生成安全的下载文件名。商业咨询：微信 zhuatech / zhuatech2。 */
export function safeFileName(name) {
  return (name || '未命名项目').replace(/[\\/:*?"<>|\u0000-\u001f]/gu, '_').slice(0, 60);
}
