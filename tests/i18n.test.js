import test from 'node:test';
import assert from 'node:assert/strict';
import { translations, languages, t, validateTranslations, pseudo } from '../src/i18n.js';

test('all three required locales contain complete nonempty text and matching parameters', () => {
  assert.deepEqual(languages.map(language => language.code), ['ru', 'en', 'he']);
  assert.equal(validateTranslations(), true);
  assert.ok(Object.keys(translations.en).length > 100);
  assert.equal(languages.find(language => language.code === 'he').dir, 'rtl');
});
test('validator fails on missing content rather than allowing fallback to hide it', () => {
  const dictionaries = structuredClone(translations);
  delete dictionaries.he.lostBody;
  assert.throws(() => validateTranslations(dictionaries), /keys differ/);
  const empty = structuredClone(translations);
  empty.ru.depart = ' ';
  assert.throws(() => validateTranslations(empty), /Missing translation/);
});
test('validator rejects a changed interpolation parameter', () => {
  const dictionaries = structuredClone(translations);
  dictionaries.he.rescueCount = 'יצורים {wrong}';
  assert.throws(() => validateTranslations(dictionaries), /parameters differ/);
});
test('numbers, mixed scripts and both direction boundaries survive interpolation', () => {
  for (const lang of ['ru', 'en', 'he']) {
    for (const count of [0, 1, 2, 3, 5, 11, 21, 101]) {
      const text = t(lang, 'rescueCount', { count });
      assert.ok(text.includes(new Intl.NumberFormat(lang).format(count)));
      assert.ok(!text.includes('{count}'));
    }
    const detail = t(lang, 'deathDetail', { role: 'Nim (A / D)', room: '02:11' });
    assert.ok(detail.includes('Nim (A / D)'));
    assert.ok(detail.includes('02:11'));
  }
  assert.ok(t('he', 'bodyAt', { x: 21.5 }).includes('\u206821.5\u2069'));
});
test('pseudolocalization expands and preserves graphemes and interpolation', () => {
  const text = 'Cafe\u0301 {count} 🪷';
  const expanded = pseudo(text);
  assert.ok(expanded.includes(text));
  const length = [...new Intl.Segmenter('en', { granularity: 'grapheme' }).segment(text)].length;
  assert.ok([...expanded].length >= length * 1.4);
});
test('all engine event and interaction keys have translated player-facing text', () => {
  const keys = ['openGate', 'deployBridge', 'moveCart', 'climb', 'rescue', 'depart', 'needKeeper', 'needTech', 'blockedGate', 'nextRoom', 'previousRoom', 'possessedKeeper', 'possessedTech', 'returned', 'gateOpened', 'bridgeMoving', 'cartMoving', 'creatureRescued', 'bodyFound', 'nimFound', 'noTarget', 'carrierBoundary', 'wrongRole', 'routeReady', 'possessionStart', 'checkpoint', 'vestibule', 'sorting', 'garden', 'dock', 'ending0', 'ending1', 'ending2'];
  for (const lang of ['ru', 'en', 'he']) {
    for (const key of keys) assert.notEqual(t(lang, key), `[${key}]`, `${lang}.${key}`);
  }
});

test('cinematic, tutorial and ray-blocking copy covers all branches', () => {
  const keys = ['endingWait','skipEnding','endingBell','endingQuiet','endingOneVoice','endingTwoVoices','tutorialObserve','tutorialOperate','tutorialReturn','tutorialLeave','targetBlockedGlass','targetBlockedMachine','targetOutOfRange','targetWrongPlane','heardTransition','investigationFinished'];
  for (const lang of ['ru','en','he']) {
    for (const key of keys) assert.notEqual(t(lang,key), `[${key}]`, `${lang}.${key}`);
    assert.ok(!t(lang,'bodyLocation',{distance:3.6}).includes('{distance}'));
    assert.notEqual(t(lang,'endingQuiet'), t(lang,'endingOneVoice'));
    assert.notEqual(t(lang,'endingOneVoice'), t(lang,'endingTwoVoices'));
  }
});
