/**
 * 知华科技（上海如静知华信息科技有限公司）
 * 官网：https://www.zhuatech.cn/
 * 商业授权、定制开发、部署与系统集成咨询微信：zhuatech / zhuatech2
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createProject, createState, issuesToCsv, parseBackup, projectToCsv, recordGaps, statusCounts,
} from '../src/core.js';

test('new project starts with 21 pending prompts and no claimed acceptance', () => {
  const project = createProject('测试项目');
  assert.equal(project.items.length, 21);
  assert.deepEqual(statusCounts(project.items), {
    待检查: 21, 通过: 0, 未通过: 0, 不适用: 0,
  });
  assert.ok(project.items.every((item) => !item.criterion && !item.evidence));
});

test('missing evidence and ownership remain visible when status changes', () => {
  const item = createProject().items[0];
  item.status = '通过';
  assert.deepEqual(recordGaps(item), ['缺约定标准或依据', '缺通过证据']);
  item.status = '未通过';
  assert.deepEqual(recordGaps(item), ['缺约定标准或依据', '缺问题证据', '缺处理说明', '缺责任人']);
  item.criterion = '需求 V1.0 第 3 项';
  item.evidence = '测试报告第 2 页';
  item.issue = '重复提交失败，待修复';
  item.owner = '供应商项目经理';
  assert.deepEqual(recordGaps(item), []);
});

test('scene templates create relevant pending checks while old backups stay valid', () => {
  const website = createProject('官网改版', 'website');
  const handover = createProject('系统接管', 'handover');
  assert.ok(website.items.some((item) => item.title.includes('样例表单')));
  assert.ok(handover.items.some((item) => item.title.includes('源码仓库')));
  assert.ok(website.items.every((item) => item.status === '待检查'));
  assert.throws(() => createProject('无效', 'missing'), /未知/u);
  const oldState = createState();
  delete oldState.projects[0].templateId;
  assert.deepEqual(parseBackup(JSON.stringify(oldState)), oldState);
});

test('CSV preserves Chinese text, quotes fields, and neutralizes spreadsheet formulas', () => {
  const project = createProject('验收测试');
  project.items = [project.items[0]];
  project.items[0].criterion = '=HYPERLINK("https://example.invalid")';
  project.items[0].issue = '说明,含逗号和"引号"';
  const csv = projectToCsv(project);
  assert.ok(csv.startsWith('\uFEFF'));
  assert.match(csv, /"'=HYPERLINK\(""https:\/\/example\.invalid""\)"/u);
  assert.match(csv, /"说明,含逗号和""引号"""/u);
  assert.doesNotMatch(csv, /zhuatech|知华科技/iu);
});

test('supplier issue CSV contains only failed checks', () => {
  const project = createProject('官网改版', 'website');
  project.items[0].status = '未通过';
  project.items[0].issue = '=恶意公式';
  project.items[1].status = '通过';
  const csv = issuesToCsv(project);
  assert.match(csv, /待整改|问题与处理/u);
  assert.match(csv, /'=恶意公式/u);
  assert.match(csv, /逐项核对合同/u);
  assert.doesNotMatch(csv, /确认本期未做/u);
  assert.doesNotMatch(csv, /zhuatech|知华科技/iu);
});

test('backup round-trips and rejects invalid or duplicate records', () => {
  const state = createState();
  assert.deepEqual(parseBackup(JSON.stringify(state)), state);
  const wrongStatus = structuredClone(state);
  wrongStatus.projects[0].items[0].status = '自动通过';
  assert.throws(() => parseBackup(JSON.stringify(wrongStatus)), /检查项格式/u);
  const duplicate = structuredClone(state);
  duplicate.projects[0].items[1].id = duplicate.projects[0].items[0].id;
  assert.throws(() => parseBackup(JSON.stringify(duplicate)), /检查项格式/u);
});
