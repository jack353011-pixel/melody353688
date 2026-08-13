const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const worldMap = fs.readFileSync(path.join(root, 'js/11-world-map.js'), 'utf8');
const section = worldMap.match(/const SHERINE_WORLD_LEVEL = 40;[\s\S]*?\nfunction renderSherinePray\(/);
assert.ok(section, '找不到席琳世界難度切換程式');

const logs = [];
let saves = 0;
let renders = 0;
const context = vm.createContext({
    player: { lv: 1, sherineWorld: false, sherineMad: false },
    mapState: { current: 'town_sherine' },
    logSys: message => logs.push(message),
    applySherineTheme: () => {},
    saveGame: () => { saves += 1; },
    renderMobs: () => { renders += 1; },
    document: { getElementById: () => null }
});
vm.runInContext(section[0].replace(/\nfunction renderSherinePray\($/, ''), context);

context.toggleSherineWorld();
assert.equal(context.player.sherineWorld, false, 'Lv39 以下不應能開啟席琳世界');
assert.match(logs.at(-1), /等級未達 40/, '席琳等級不足提示錯誤');

context.player.lv = 40;
context.mapState.current = 'forest';
context.toggleSherineWorld();
assert.equal(context.player.sherineWorld, false, '戰鬥區不應能切換世界難度');
assert.match(logs.at(-1), /只能在安全區切換/, '非安全區提示錯誤');

context.mapState.current = 'town_sherine';
context.toggleSherineWorld();
assert.equal(context.player.sherineWorld, true, 'Lv40 應能在安全區開啟席琳世界');
assert.equal(context.player.sherineMad, false, '開啟席琳世界時應關閉瘋狂席琳');

context.player.sherineWorld = false;
context.player.lv = 69;
context.toggleSherineMad();
assert.equal(context.player.sherineMad, false, 'Lv69 不應能開啟瘋狂席琳');
assert.match(logs.at(-1), /等級未達 70/, '瘋狂席琳等級不足提示錯誤');

context.player.lv = 70;
context.player.sherineWorld = true;
context.toggleSherineMad();
assert.equal(context.player.sherineMad, true, 'Lv70 應能在安全區開啟瘋狂席琳');
assert.equal(context.player.sherineWorld, false, '開啟瘋狂席琳時應關閉一般席琳');

context.player.lv = 1;
context.toggleSherineMad();
assert.equal(context.player.sherineMad, false, '舊存檔即使等級不足也應能關閉高難度');
assert.equal(saves, 3, '只有成功切換才應存檔');
assert.equal(renders, 3, '只有成功切換才應刷新怪物');

assert.match(worldMap, /不需要完成故事即可解鎖/, '介面應說明世界難度不綁故事');
assert.match(worldMap, /瘋狂的席琳世界（地獄難度・Lv\$\{SHERINE_MAD_LEVEL\}）/, '介面缺少地獄難度與 Lv70 標示');
assert.doesNotMatch(worldMap, /珍稀套裝裝備|套裝效果與席琳結晶掉率/, '席琳面板仍含已退役的裝備套裝掉落說明');
assert.match(worldMap, /套裝效果不會直接附在掉落裝備上/, '席琳面板應說明套裝效果改由遺骸承載');
assert.match(worldMap, /一般怪祝福率 3%、頭目固定 20%/, '煉獄祝福率說明與實際規則不符');
assert.match(worldMap, /一般怪祝福率 5%、頭目固定 30%/, '地獄祝福率說明與實際規則不符');

console.log('席琳世界難度測試通過');
