import assert from 'node:assert/strict';
import test from 'node:test';
import { ageStages, freeReadings } from '../src/lib/age-stages.ts';
import { scriptFor, speakMandarin, stopSpeech, type Script } from '../src/lib/speech.ts';

type RecordedUtterance = {
  text: string;
  lang: string;
  rate: number;
  onend?: () => void;
  onerror?: () => void;
};

function installSpeechMock() {
  const calls: string[] = [];
  const utterances: RecordedUtterance[] = [];
  const originalWindow = globalThis.window;
  const originalUtterance = globalThis.SpeechSynthesisUtterance;

  class MockUtterance implements RecordedUtterance {
    text: string;
    lang = '';
    rate = 1;
    onend?: () => void;
    onerror?: () => void;

    constructor(text: string) {
      this.text = text;
    }
  }

  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      speechSynthesis: {
        cancel: () => calls.push('cancel'),
        speak: (utterance: RecordedUtterance) => {
          calls.push('speak');
          utterances.push(utterance);
        },
      },
    },
  });
  Object.defineProperty(globalThis, 'SpeechSynthesisUtterance', {
    configurable: true,
    value: MockUtterance,
  });

  return {
    calls,
    utterances,
    restore() {
      if (originalWindow === undefined) delete (globalThis as { window?: Window }).window;
      else Object.defineProperty(globalThis, 'window', { configurable: true, value: originalWindow });
      if (originalUtterance === undefined) {
        delete (globalThis as { SpeechSynthesisUtterance?: typeof SpeechSynthesisUtterance }).SpeechSynthesisUtterance;
      } else {
        Object.defineProperty(globalThis, 'SpeechSynthesisUtterance', { configurable: true, value: originalUtterance });
      }
    },
  };
}

test('each age reading has both scripts and is spoken verbatim with the matching Mandarin locale', () => {
  const mock = installSpeechMock();
  try {
    for (const age of ageStages) {
      const reading = freeReadings[age];
      for (const [script, locale, language] of [
        ['trad', 'zh-TW', 'zh-Hant'],
        ['simp', 'zh-CN', 'zh-Hans'],
      ] as const satisfies readonly [Script, string, 'zh-Hant' | 'zh-Hans'][]) {
        const text = reading.text[language];
        const before = mock.utterances.length;

        assert.equal(speakMandarin(text, script), true, `${age} ${script} should start`);

        const utterance = mock.utterances.at(-1)!;
        assert.equal(utterance.text, text);
        assert.equal(utterance.lang, locale);
        assert.equal(utterance.rate, 0.8);
        assert.equal(mock.utterances.length, before + 1);
      }
    }
  } finally {
    mock.restore();
  }
});

test('starting a reading cancels previous speech before speaking, and stop cancels it', () => {
  const mock = installSpeechMock();
  try {
    assert.equal(speakMandarin('第一篇短文', 'trad'), true);
    assert.deepEqual(mock.calls, ['cancel', 'speak']);

    stopSpeech();
    assert.deepEqual(mock.calls, ['cancel', 'speak', 'cancel']);
  } finally {
    mock.restore();
  }
});

test('the selected website language chooses its corresponding writing system', () => {
  assert.equal(scriptFor('zh-Hans'), 'simp');
  assert.equal(scriptFor('zh-Hant'), 'trad');
  assert.equal(scriptFor('en'), 'trad');
});

test('unsupported browser speech returns false without attempting playback', () => {
  const originalWindow = globalThis.window;
  Object.defineProperty(globalThis, 'window', { configurable: true, value: {} });
  try {
    assert.equal(speakMandarin('你好', 'simp'), false);
  } finally {
    if (originalWindow === undefined) delete (globalThis as { window?: Window }).window;
    else Object.defineProperty(globalThis, 'window', { configurable: true, value: originalWindow });
  }
});
