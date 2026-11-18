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

test('V2 manual controls, inventory, traversal and failure events are complete in all locales', () => {
  const keys = ['jump','crouch','standUp','climbUp','climbDown','throwItem','pickupItem','heldItem','emptyHands','instructionJump','instructionCrouch','instructionClimb','instructionThrow','tutorialMove','tutorialJump','tutorialCrawl','tutorialLadder','tutorialThrow','traversalHint','v2Badge','climbLadder','land','itemImpact','heardImpact','searching','cannotStand','cannotJump','crouchEnabled','crouchDisabled','fell','fallLost','exitAbove','saveMigrated','staffCannotThrow','carrierFell','bolt','can'];
  for (const lang of ['ru','en','he']) {
    for (const key of keys) {
      const text=t(lang,key);
      assert.notEqual(text,`[${key}]`,`${lang}.${key}`);
      assert.ok(!text.includes('{'),`${lang}.${key} must not require an unprovided parameter`);
    }
    assert.notEqual(t(lang,'pickupItem'),t(lang,'throwItem'));
    assert.notEqual(t(lang,'crouch'),t(lang,'standUp'));
    assert.notEqual(t(lang,'heldItem'),t(lang,'emptyHands'));
    assert.match(t(lang,'instructionJump'), /Space/);
    assert.match(t(lang,'instructionCrouch'), /C/);
    assert.match(t(lang,'instructionClimb'), /W \/ S/);
    assert.match(t(lang,'instructionThrow'), /F/);
    assert.match(t(lang,'instructionPossess'), /Q/);
    assert.doesNotMatch(t(lang,'instructionPossess'), /Space/);
    assert.doesNotMatch(t(lang,'instructionMove'), /automat|сам приг|אוטומט/i);
  }
});

test('V2 elevation formats real numbers rather than concatenating untranslated units', () => {
  for (const lang of ['ru','en','he']) {
    for (const height of [0,1.2,2.3,4.8,11.5]) {
      const value = new Intl.NumberFormat(lang,{maximumFractionDigits:1}).format(height);
      const text=t(lang,'elevation',{height});
      assert.ok(text.includes(value));
      assert.ok(!text.includes('{height}'));
      if(lang==='he')assert.ok(text.includes(`\u2068${value}\u2069`));
    }
  }
  assert.ok(t('ru','elevation',{height:2.3}).includes('2,3'));
  assert.ok(t('en','elevation',{height:2.3}).includes('2.3'));
});

test('all literal engine notification and interaction keys are localizable', async () => {
  const {readFile}=await import('node:fs/promises');
  const source=await readFile(new URL('../src/engine.js',import.meta.url),'utf8');
  const notificationKeys=[...source.matchAll(/emit\(\s*\w+\s*,\s*['"][^'"]+['"]\s*,\s*['"]([^'"]+)['"]\s*(?=,|\))/g)].map(match=>match[1]);
  const interactionKeys=[...source.matchAll(/\bkey:\s*['"]([^'"]+)['"]\s*(?=,|})/g)].map(match=>match[1]);
  assert.ok(notificationKeys.length>10,'engine source must contain real notification keys');
  for(const lang of ['ru','en','he'])for(const key of new Set([...notificationKeys,...interactionKeys])) {
    assert.equal(typeof translations[lang][key],'string',`${lang}.${key}`);
  }
});
