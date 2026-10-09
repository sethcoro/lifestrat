import { ReactElement, useEffect, useRef, useState } from 'react';
import { Alert, AppState, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import Feedback from './src/Feedback';
import { getConsent, init as initAnalytics, newRun, setConsent, track } from './src/analytics';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Detail, Difficulty, Episode, Option, Part, START_STATS, STAT_LABELS, StatKey, Stats,
  applyFx, endingText, episodesFor,
} from './src/engine';

const FONT = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' });
const AGES = [8, 14, 18, 22];
const DETAILS: Detail[] = ['Quick', 'Detailed'];
const DIFFS: Difficulty[] = ['Easy', 'Medium', 'Hard'];
const KEYS: StatKey[] = ['satisfaction', 'health', 'relationships', 'seniority', 'influence', 'netWorth'];

type Screen = 'consent' | 'start' | 'play' | 'ending' | 'settings';
type Entry = { kind: 'pick' | 'note' | 'result' | 'sit'; text: string };

function useColors(dark: boolean) {
  return dark ? { bg: '#000', fg: '#fff' } : { bg: '#fff', fg: '#000' };
}

export default function App() {
  const [dark, setDark] = useState(false);
  const [screen, setScreen] = useState<Screen>('start');
  const [back, setBack] = useState<Screen>('start');
  const [age, setAge] = useState(18);
  const [detail, setDetail] = useState<Detail>('Quick');
  const [diff, setDiff] = useState<Difficulty>('Medium');
  const [eps, setEps] = useState<Episode[]>([]);
  const [epIdx, setEpIdx] = useState(0);
  const [part, setPart] = useState<'A' | 'B'>('A');
  const [firstPick, setFirstPick] = useState<'a' | 'b'>('a');
  const [stats, setStats] = useState<Stats>(START_STATS);
  const [thread, setThread] = useState<Entry[]>([]);
  const scroller = useRef<ScrollView>(null);
  const c = useColors(dark);

  const [analyticsOn, setAnalyticsOn] = useState(false);
  const decisionStart = useRef(Date.now());
  const pos = useRef({ screen: 'start' as Screen, ep: 0, part: 'A' as 'A' | 'B', title: '' });

  useEffect(() => {
    AsyncStorage.getItem('dark').then((v) => v && setDark(v === '1')).catch(() => {});
    initAnalytics().then(() => {
      const consent = getConsent();
      setAnalyticsOn(consent === true);
      if (consent === null) setScreen('consent');
      track('app_open');
    });
  }, []);

  // Keep a ref of where the player is, so leaving mid-run can be recorded.
  pos.current = { screen, ep: epIdx, part, title: eps[epIdx]?.title ?? '' };
  useEffect(() => {
    const sub = AppState.addEventListener('change', (st) => {
      if (st !== 'active' && pos.current.screen === 'play') {
        track('run_abandon', { episode: pos.current.ep + 1, part: pos.current.part, title: pos.current.title });
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

  const currentPart = (): Part => {
    const ep = eps[epIdx];
    return part === 'A' ? ep.partA : ep.partB[firstPick];
  };

  const begin = () => {
    const list = episodesFor(detail, age);
    setEps(list);
    setEpIdx(0);
    setPart('A');
    setStats(START_STATS);
    setThread([{ kind: 'sit', text: list[0].partA.situation }]);
    setScreen('play');
    newRun();
    track('run_start', { age, detail, difficulty: diff, episodes: list.length });
    decisionStart.current = Date.now();
  };

  const pick = (which: 'a' | 'b') => {
    const ep = eps[epIdx];
    const p = currentPart();
    const opt: Option = p[which];
    const nextStats = applyFx(stats, opt.fx, diff);
    setStats(nextStats);
    track('choice', {
      episode: epIdx + 1, title: ep.title, part, option: which, text: opt.text,
      ms: Date.now() - decisionStart.current, stats: nextStats,
    });
    decisionStart.current = Date.now();
    if (part === 'B') {
      track('episode_result', { episode: epIdx + 1, title: ep.title, first: firstPick, second: which });
      if (epIdx + 1 >= eps.length) track('run_end', { stats: nextStats, episodes: eps.length });
    }
    const entries: Entry[] = [
      { kind: 'pick', text: opt.text },
      { kind: 'note', text: opt.note },
    ];
    if (part === 'A') {
      setFirstPick(which);
      setPart('B');
      entries.push({ kind: 'sit', text: ep.partB[which].situation });
    } else {
      entries.push({ kind: 'result', text: `${ep.title.toUpperCase()}: ${ep.result[firstPick]}` });
      if (epIdx + 1 >= eps.length) {
        setThread((t) => [...t, ...entries]);
        setScreen('ending');
        return;
      }
      setEpIdx(epIdx + 1);
      setPart('A');
      entries.push({ kind: 'sit', text: eps[epIdx + 1].partA.situation });
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
            <Text style={[styles.small, { color: c.fg }]}>{stats.netWorth < 0 ? '-' : ''}${Math.abs(stats.netWorth).toLocaleString()}</Text>
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
    body = (
      <ScrollView contentContainerStyle={styles.pad}>
        <Header left="" right="settings" />
        <Text style={[styles.title, { color: c.fg }]}>LIFESTRAT</Text>
        <Text style={[styles.body, { color: c.fg }]}>a life, one choice at a time.</Text>
        <Text style={[styles.label, { color: c.fg }]}>starting age</Text>
        <View style={styles.row}>{AGES.map((a) => <Btn key={a} label={String(a)} on={a === age} onPress={() => setAge(a)} />)}</View>
        <Text style={[styles.label, { color: c.fg }]}>detail</Text>
        <View style={styles.row}>{DETAILS.map((d) => <Btn key={d} label={d} on={d === detail} onPress={() => setDetail(d)} />)}</View>
        <Text style={[styles.label, { color: c.fg }]}>difficulty</Text>
        <View style={styles.row}>{DIFFS.map((d) => <Btn key={d} label={d} on={d === diff} onPress={() => setDiff(d)} />)}</View>
        <View style={{ height: 28 }} />
        <Btn label="BEGIN" solid onPress={begin} />
        <Text style={[styles.small, styles.center, { color: c.fg, marginTop: 14 }]}>17+ · fiction, not prediction</Text>
      </ScrollView>
    );
  } else if (screen === 'play') {
    const p = currentPart();
    const ep = eps[epIdx];
    body = (
      <View style={{ flex: 1 }}>
        <View style={styles.pad}>
          <Header left={`AGE ${ep.age}`} right={`EP ${epIdx + 1}/${eps.length} · PART ${part}/2`} />
          <View style={styles.dots}>
            {eps.map((_, i) => (
              <View key={i} style={[styles.dot, { borderColor: c.fg, backgroundColor: i < epIdx ? c.fg : c.bg }]} />
            ))}
          </View>
          <Meters />
        </View>
        <ScrollView ref={scroller} style={{ flex: 1 }} contentContainerStyle={styles.threadPad}>
          {thread.slice(0, -1).map((e, i) => (
            <Text key={i} style={[e.kind === 'pick' ? styles.pick : e.kind === 'result' ? styles.result : styles.past, { color: c.fg, borderColor: c.fg }]}>
              {e.kind === 'pick' ? `> ${e.text}` : e.text}
            </Text>
          ))}
          <Text style={[styles.sit, { color: c.fg }]}>{thread[thread.length - 1].text}</Text>
        </ScrollView>
        <View style={styles.pad}>
          <Btn label={`A. ${p.a.text}`} onPress={() => pick('a')} />
          <Btn label={`B. ${p.b.text}`} onPress={() => pick('b')} />
          <Text
            style={[styles.small, { color: c.fg, textAlign: 'right', textDecorationLine: 'underline' }]}
            onPress={() => {
              track('report_tap', { episode: epIdx + 1, part });
              Alert.alert('Report', 'Thanks. In the real app this sends the text to us for review.');
            }}
          >
            report
          </Text>
        </View>
      </View>
    );
  } else if (screen === 'ending') {
    const end = endingText(stats);
    body = (
      <ScrollView contentContainerStyle={styles.pad}>
        <Header left="THE END" right="settings" />
        <Text style={[styles.body, { color: c.fg, marginVertical: 16 }]}>{end.summary}</Text>
        <View style={[styles.card, { borderColor: c.fg }]}>
          <Text style={[styles.title, { color: c.fg, fontSize: 18 }]}>LIFESTRAT</Text>
          <Text style={[styles.small, { color: c.fg, marginBottom: 12 }]}>start {age} · {detail} · {diff}</Text>
          <Meters />
          <Text style={[styles.body, { color: c.fg, marginTop: 14 }]}>"{end.epitaph}"</Text>
        </View>
        <Feedback fg={c.fg} bg={c.bg} font={FONT} ctx={{ age, detail, difficulty: diff, stats }} />
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


