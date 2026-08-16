const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'js/14-craft-pandora.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'css/style.css'), 'utf8');

assert.match(source, /function pandoraOpenDetail\(ev, i\)/,
    '黑市商品沒有可互動的完整能力視窗');
assert.match(source, /onclick="pandoraOpenDetail\(event,\$\{i\}\)"/,
    '黑市商品卡沒有綁定點擊詳情');
assert.match(source, /event\.key==='Enter'\|\|event\.key===' '/,
    '黑市商品卡缺少鍵盤開啟詳情');
assert.match(source, /event\.stopPropagation\(\);buyPandoraItem\(\$\{i\}\)/,
    '購買按鈕會誤開商品詳情');
assert.match(source, /body\.querySelectorAll\('details\.item-detail-full'\)[\s\S]*?detail\.open = true/,
    '完整能力在詳情視窗中仍是收合狀態');
assert.match(source, /if \(event\.key === 'Escape'\) pandoraCloseDetail\(event\)/,
    '商品詳情不能使用 Escape 關閉');
assert.match(css, /\.pandora-detail-body\s*\{[\s\S]*?overflow-y:\s*auto/,
    '商品詳情內容過長時無法捲動');
assert.match(css, /max-height:\s*calc\(100dvh - 32px\)/,
    '商品詳情視窗沒有限制在可視高度內');

console.log('pandora detail modal regression tests passed');
