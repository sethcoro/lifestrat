import { ReactElement, useEffect, useRef, useState } from 'react';
import { Alert, AppState, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Feedback from './src/Feedback';
import { getConsent, init as initAnalytics, newRun, setConsent, track } from './src/analytics';
import {
  Detail, Difficulty, Episode, SITUATIONS, START_AGES, STAT_LABELS, Situation, StatKey, Stats, Step,
  applyFx, buildEpisodes, debrief, endingText, fmtMoney, startStats,
} from './src/engine';

const FONT = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' });
const DETAILS: Detail[] = ['Quick', 'Detailed'];
const DIFFS: Difficulty[] = ['Easy', 'Medium', 'Hard'];
const KEYS: StatKey[] = ['satisfaction', 'health', 'relationships', 'seniority', 'influence', 'netWorth'];
const LETTERS = 'ABCDEFGHIJ';
const DIFF_NOTE: Record<Difficulty, string> = {
  Easy: 'Setbacks are halved. Situations show hints.',
  Medium: 'A realistic mix, with some luck in the money.',
  Hard: 'Setbacks hit 50% harder, luck swings more, and situations add a complication.',
};

type Mode = 'life' | 'sit';
type Screen = 'consent' | 'start' | 'play' | 'ending' | 'settings';
type Entry = { kind: 'pick' | 'note' | 'result' | 'sit' | 'twist'; text: string };

function useColors(dark: boolean) {
  return dark ? { bg: '#000', fg: '#fff' } : { bg: '#fff', fg: '#000' };
}

export default function App() {
  const [dark, setDark] = useState(false);
  const [screen, setScreen] = useState<Screen>('start');
  const [back, setBack] = useState<Screen>('start');
  const [mode, setMode] = useState<Mode>('life');
  const [age, setAge] = useState(18);
  const [detail, setDetail] = useState<Detail>('Quick');
  const [diff, setDiff] = useState<Difficulty>('Medium');
  const [sitPick, setSitPick] = useState<string>('random');
  const [eps, setEps] = useState<Episode[]>([]);
  const [sit, setSit] = useState<Situation | null>(null);
  const [epIdx, setEpIdx] = useState(0);
  const [stepIdx, setStepIdx] = useState(0);
  const [part, setPart] = useState<'A' | 'B'>('A');
  const [firstPick, setFirstPick] = useState(0);
  const [stats, setStats] = useState<Stats>(startStats(18));
  const [thread, setThread] = useState<Entry[]>([]);
  const [analyticsOn, setAnalyticsOn] = useState(false);
  const scroller = useRef<ScrollView>(null);
  const decisionStart = useRef(Date.now());
  const startRef = useRef<Stats>(startStats(18));
  const pos = useRef({ screen: 'start' as Screen, label: '', part: '' });
  const c = useColors(dark);

  useEffect(() => {
    AsyncStorage.getItem('dark').then((v) => v && setDark(v === '1')).catch(() => {});
    initAnalytics().then(() => {
      const consent = getConsent();
      setAnalyticsOn(consent === true);
      if (consent === null) setScreen('consent');
      track('app_open');
    });
  }, []);

  pos.current = {
    screen,
    label: mode === 'sit' ? sit?.title ?? '' : eps[epIdx]?.title ?? '',
    part: mode === 'sit' ? String(stepIdx + 1) : `${epIdx + 1}${part}`,
  };
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s !== 'active' && pos.current.screen === 'play') {
        track('run_abandon', { scenario: pos.current.label, at: pos.current.part });
      }
    });
    return () => sub.remove();
  }, []);

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    AsyncStorage.setItem('dark', next ? '1' : '0').catch(() => {});
    track('settings_change', { setting: 'dark', value: next });
  };

  const chooseConsent = async (on: boolean) => {
    await setConsent(on);
    setAnalyticsOn(on);
    setScreen('start');
  };

  const toggleAnalytics = async () => {
    const next = !analyticsOn;
    if (!next) track('settings_change', { setting: 'analytics', value: false });
    await setConsent(next);
    setAnalyticsOn(next);
  };

  const currentStep = (): Step => {
    if (mode === 'sit' && sit) return sit.steps[stepIdx];
    const ep = eps[epIdx];
    return part === 'A' ? ep.a : ep.b[firstPick];
  };

  const begin = () => {
    let base: Stats;
    let firstText: string;
    let scenario: string;
    if (mode === 'sit') {
      const chosen = sitPick === 'random' ? SITUATIONS[Math.floor(Math.random() * SITUATIONS.length)] : SITUATIONS.find((s) => s.id === sitPick)!;
      base = { ...startStats(30), ...chosen.start };
      setSit(chosen);
      setStepIdx(0);
      firstText = chosen.steps[0].situation;
      scenario = chosen.title;
    } else {
      const list = buildEpisodes(detail, age);
      base = startStats(age);
      setEps(list);
      setEpIdx(0);
      setPart('A');
      firstText = list[0].a.situation;
      scenario = list[0].title;
    }
    startRef.current = base;
    setStats(base);
    setThread([{ kind: 'sit', text: firstText }]);
    setScreen('play');
    newRun();
    track('run_start', { mode, age: mode === 'life' ? age : null, detail: mode === 'life' ? detail : null, difficulty: diff, scenario });
    decisionStart.current = Date.now();
  };

  const pick = (i: number) => {
    const step = currentStep();
    const opt = step.options[i];
    let next = applyFx(stats, opt.fx, diff);
    const ms = Date.now() - decisionStart.current;
    decisionStart.current = Date.now();
    const entries: Entry[] = [{ kind: 'pick', text: opt.text }, { kind: 'note', text: opt.note }];
    const letter = LETTERS[i].toLowerCase();

    if (mode === 'sit' && sit) {
      track('choice', { mode, scenario: sit.title, episode: 1, part: String(stepIdx + 1), option: letter, text: opt.text, ms, stats: next });
      if (stepIdx === 1 && diff === 'Hard') {
        next = applyFx(next, sit.twist.fx, 'Medium');
        entries.push({ kind: 'twist', text: sit.twist.text });
      }
      setStats(next);
      if (stepIdx + 1 >= sit.steps.length) {
        setThread((t) => [...t, ...entries]);
        track('run_end', { mode, scenario: sit.title, stats: next });
        setScreen('ending');
        return;
      }
      setStepIdx(stepIdx + 1);
      entries.push({ kind: 'sit', text: sit.steps[stepIdx + 1].situation });
    } else {
      const ep = eps[epIdx];
      track('choice', { mode, scenario: ep.title, episode: epIdx + 1, part, option: letter, text: opt.text, ms, stats: next });
      setStats(next);
      if (part === 'A') {
        setFirstPick(i);
        setPart('B');
        entries.push({ kind: 'sit', text: ep.b[i].situation });
      } else {
        track('episode_result', { scenario: ep.title, episode: epIdx + 1, first: LETTERS[firstPick].toLowerCase(), second: letter });
        entries.push({ kind: 'result', text: `${ep.title.toUpperCase()}: ${ep.result[firstPick]}` });
        if (epIdx + 1 >= eps.length) {
          setThread((t) => [...t, ...entries]);
          track('run_end', { mode, stats: next, episodes: eps.length });
          setScreen('ending');
          return;
        }
        setEpIdx(epIdx + 1);
        setPart('A');
        entries.push({ kind: 'sit', text: eps[epIdx + 1].a.situation });
      }
    }
    setThread((t) => [...t, ...entries]);
    setTimeout(() => scroller.current?.scrollToEnd({ animated: true }), 50);
  };

  const openSettings = () => { setBack(screen); setScreen('settings'); };

  const Btn = ({ label, onPress, on, solid }: { label: string; onPress: () => void; on?: boolean; solid?: boolean }) => (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.btn,
        { borderColor: c.fg, backgroundColor: on || solid || pressed ? c.fg : c.bg },
      ]}
    >
      {({ pressed }) => (
        <Text style={[styles.btnText, { color: on || solid || pressed ? c.bg : c.fg }]}>{label}</Text>
      )}
    </Pressable>
  );

  const Meters = () => (
    <View style={styles.meters}>
      {KEYS.map((k) => (
        <View key={k} style={styles.meterRow}>
          <Text style={[styles.small, { color: c.fg, width: 84 }]}>{STAT_LABELS[k]}</Text>
          {k === 'netWorth' ? (
            <Text style={[styles.small, { color: c.fg }]}>{fmtMoney(stats.netWorth)}</Text>
          ) : (
            <View style={[styles.track, { borderColor: c.fg }]}>
              <View style={{ width: `${stats[k]}%`, height: '100%', backgroundColor: c.fg }} />
            </View>
          )}
        </View>
      ))}
    </View>
  );

  const Header = ({ left, right }: { left: string; right?: string }) => (
    <View style={styles.header}>
      <Text style={[styles.small, { color: c.fg }]}>{left}</Text>
      <Text style={[styles.small, { color: c.fg }]} onPress={right ? (screen === 'settings' ? () => setScreen(back) : openSettings) : undefined}>{right ?? ''}</Text>
    </View>
  );

  let body: ReactElement;

  if (screen === 'consent') {
    body = (
      <ScrollView contentContainerStyle={styles.pad}>
        <Text style={[styles.title, { color: c.fg }]}>LIFESTRAT</Text>
        <Text style={[styles.body, { color: c.fg, marginTop: 16 }]}>
          This is a beta. Can we record how you play: the choices you make, where you stop, and your final stats?
        </Text>
        <Text style={[styles.body, { color: c.fg, marginTop: 12 }]}>
          It is anonymous. No name, no account, no free text. It shows how people play a game, not how they live. You can turn it off any time in settings.
        </Text>
        <View style={{ height: 24 }} />
        <Btn label="YES, SHARE" solid onPress={() => chooseConsent(true)} />
        <Btn label="NO THANKS" onPress={() => chooseConsent(false)} />
      </ScrollView>
    );
  } else if (screen === 'start') {
    const picked = SITUATIONS.find((s) => s.id === sitPick);
    body = (
      <ScrollView contentContainerStyle={styles.pad}>
        <Header left="" right="settings" />
        <Text style={[styles.title, { color: c.fg }]}>LIFESTRAT</Text>
        <Text style={[styles.body, { color: c.fg }]}>a life, one choice at a time.</Text>
        <Text style={[styles.label, { color: c.fg }]}>mode</Text>
        <View style={styles.row}>
          <Btn label="LIFE" on={mode === 'life'} onPress={() => setMode('life')} />
          <Btn label="SITUATION" on={mode === 'sit'} onPress={() => setMode('sit')} />
        </View>
        {mode === 'life' ? (
          <>
            <Text style={[styles.label, { color: c.fg }]}>starting age</Text>
            <View style={styles.row}>{START_AGES.map((a) => <Btn key={a} label={String(a)} on={a === age} onPress={() => setAge(a)} />)}</View>
            <Text style={[styles.label, { color: c.fg }]}>detail</Text>
            <View style={styles.row}>{DETAILS.map((d) => <Btn key={d} label={d} on={d === detail} onPress={() => setDetail(d)} />)}</View>
          </>
        ) : (
          <>
            <Text style={[styles.label, { color: c.fg }]}>situation</Text>
            <Btn label="RANDOM" on={sitPick === 'random'} onPress={() => setSitPick('random')} />
            {SITUATIONS.map((s) => <Btn key={s.id} label={s.title} on={sitPick === s.id} onPress={() => setSitPick(s.id)} />)}
            {picked && <Text style={[styles.small, { color: c.fg, marginTop: 4 }]}>{picked.blurb}</Text>}
          </>
        )}
        <Text style={[styles.label, { color: c.fg }]}>difficulty</Text>
        <View style={styles.row}>{DIFFS.map((d) => <Btn key={d} label={d} on={d === diff} onPress={() => setDiff(d)} />)}</View>
        <Text style={[styles.small, { color: c.fg, marginTop: 2 }]}>{DIFF_NOTE[diff]}</Text>
        <View style={{ height: 24 }} />
        <Btn label="BEGIN" solid onPress={begin} />
        <Text style={[styles.small, styles.center, { color: c.fg, marginTop: 14 }]}>17+ · fiction, not prediction</Text>
      </ScrollView>
    );
  } else if (screen === 'play') {
    const step = currentStep();
    const sitMode = mode === 'sit' && sit;
    const total = sitMode ? sit!.steps.length : eps.length;
    const doneDots = sitMode ? stepIdx : epIdx;
    const left = sitMode ? sit!.title.toUpperCase() : `AGE ${eps[epIdx].age}`;
    const right = sitMode ? `STEP ${stepIdx + 1}/${total}` : `EP ${epIdx + 1}/${total} · PART ${part}/2`;
    body = (
      <View style={{ flex: 1 }}>
        <View style={styles.pad}>
          <Header left={left} right={right} />
          <View style={styles.dots}>
            {Array.from({ length: total }).map((_, i) => (
              <View key={i} style={[styles.dot, { borderColor: c.fg, backgroundColor: i < doneDots ? c.fg : c.bg }]} />
            ))}
          </View>
          <Meters />
        </View>
        <ScrollView ref={scroller} style={{ flex: 1 }} contentContainerStyle={styles.threadPad}>
          {thread.slice(0, -1).map((e, i) => (
            <Text
              key={i}
              style={[
                e.kind === 'pick' ? styles.pick : e.kind === 'result' || e.kind === 'twist' ? styles.result : styles.past,
                { color: c.fg, borderColor: c.fg },
              ]}
            >
              {e.kind === 'pick' ? `> ${e.text}` : e.text}
            </Text>
          ))}
          <Text style={[styles.sit, { color: c.fg }]}>{thread[thread.length - 1].text}</Text>
          {sitMode && diff === 'Easy' && !!step.hint && (
            <Text style={[styles.small, { color: c.fg, marginTop: 10, fontStyle: 'italic' }]}>hint: {step.hint}</Text>
          )}
        </ScrollView>
        <View style={[styles.pad, { paddingTop: 8 }]}>
          <ScrollView style={{ maxHeight: 320 }}>
            {step.options.map((op, i) => (
              <Btn key={i} label={`${LETTERS[i]}. ${op.text}`} onPress={() => pick(i)} />
            ))}
          </ScrollView>
          <Text
            style={[styles.small, { color: c.fg, textAlign: 'right', textDecorationLine: 'underline' }]}
            onPress={() => {
              track('report_tap', { scenario: pos.current.label, at: pos.current.part });
              Alert.alert('Report', 'Thanks. In the real app this sends the text to us for review.');
            }}
          >
            report
          </Text>
        </View>
      </View>
    );
  } else if (screen === 'ending') {
    const sitMode = mode === 'sit' && sit;
    const end = endingText(stats);
    const db = sitMode ? debrief(startRef.current, stats) : null;
    body = (
      <ScrollView contentContainerStyle={styles.pad}>
        <Header left={sitMode ? 'DEBRIEF' : 'THE END'} right="settings" />
        <Text style={[styles.body, { color: c.fg, marginVertical: 16 }]}>
          {db ? `${sit!.title}: ${db.verdict}` : end.summary}
        </Text>
        <View style={[styles.card, { borderColor: c.fg }]}>
          <Text style={[styles.title, { color: c.fg, fontSize: 18 }]}>LIFESTRAT</Text>
          <Text style={[styles.small, { color: c.fg, marginBottom: 12 }]}>
            {sitMode ? `${sit!.title} · ${diff}` : `start ${age} · ${detail} · ${diff}`}
          </Text>
          {db ? (
            db.rows.map((r) => (
              <Text key={r.label} style={[styles.small, { color: c.fg, marginBottom: 4 }]}>
                {r.label.padEnd(10, ' ')} {r.from} {'->'} {r.to}
              </Text>
            ))
          ) : (
            <>
              <Meters />
              <Text style={[styles.body, { color: c.fg, marginTop: 14 }]}>"{end.epitaph}"</Text>
            </>
          )}
        </View>
        <Feedback fg={c.fg} bg={c.bg} font={FONT} ctx={{ mode, scenario: sitMode ? sit!.title : null, age, detail, difficulty: diff, stats }} />
        <View style={{ height: 20 }} />
        <Btn label="PLAY AGAIN" solid onPress={() => setScreen('start')} />
      </ScrollView>
    );
  } else {
    body = (
      <ScrollView contentContainerStyle={styles.pad}>
        <Header left="SETTINGS" right="close" />
        <View style={{ height: 8 }} />
        <Btn label={dark ? 'Dark mode: on' : 'Dark mode: off'} onPress={toggleDark} />
        <Btn label={analyticsOn ? 'Share anonymous play data: on' : 'Share anonymous play data: off'} onPress={toggleAnalytics} />
        <Btn label="Restore purchases" onPress={() => Alert.alert('Restore purchases', 'Not connected yet.')} />
        <Btn label="Privacy policy" onPress={() => Alert.alert('Privacy policy', 'A link goes here before launch.')} />
        <Btn label="Contact support" onPress={() => Alert.alert('Support', 'An email address goes here before launch.')} />
        <Btn
          label="Delete my data"
          onPress={() =>
            Alert.alert('Delete my data', 'This clears everything saved on this device.', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Delete',
                style: 'destructive',
                onPress: () => { AsyncStorage.clear().catch(() => {}); setDark(false); setScreen('start'); },
              },
            ])
          }
        />
        <Text style={[styles.small, { color: c.fg, marginTop: 12 }]}>
          Stories are fiction. This shows how people play a game, not how they live.
        </Text>
      </ScrollView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <StatusBar style={dark ? 'light' : 'dark'} />
      <View style={{ flex: 1, width: '100%', maxWidth: 480, alignSelf: 'center' }}>
        {body}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  pad: { padding: 20 },
  threadPad: { paddingHorizontal: 20, paddingBottom: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  title: { fontFamily: FONT, fontSize: 24, letterSpacing: 4, marginTop: 10 },
  body: { fontFamily: FONT, fontSize: 14, lineHeight: 22 },
  small: { fontFamily: FONT, fontSize: 11, letterSpacing: 1 },
  label: { fontFamily: FONT, fontSize: 11, letterSpacing: 1.5, marginTop: 20, marginBottom: 8 },
  center: { textAlign: 'center' },
  row: { flexDirection: 'row', gap: 8 },
  btn: { borderWidth: 1, paddingVertical: 12, paddingHorizontal: 12, marginBottom: 10, flexGrow: 1, flexShrink: 1 },
  btnText: { fontFamily: FONT, fontSize: 14, lineHeight: 20 },
  meters: { marginTop: 8 },
  meterRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  track: { flex: 1, height: 7, borderWidth: 1 },
  dots: { flexDirection: 'row', gap: 4, marginBottom: 6 },
  dot: { flex: 1, height: 6, borderWidth: 1 },
  sit: { fontFamily: FONT, fontSize: 15, lineHeight: 24, marginTop: 8 },
  past: { fontFamily: FONT, fontSize: 12, lineHeight: 19, marginTop: 10, borderLeftWidth: 2, paddingLeft: 10 },
  pick: { fontFamily: FONT, fontSize: 13, lineHeight: 20, marginTop: 14 },
  result: { fontFamily: FONT, fontSize: 12, lineHeight: 19, marginVertical: 14, borderWidth: 1, padding: 10 },
  card: { borderWidth: 1, padding: 16 },
});
