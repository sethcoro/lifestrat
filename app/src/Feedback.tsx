import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { sendFeedback } from './analytics';

type Props = { fg: string; bg: string; font?: string; ctx: Record<string, unknown> };

// Top-level component so the text box keeps focus while typing.
export default function Feedback({ fg, bg, font, ctx }: Props) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [err, setErr] = useState('');

  const submit = async () => {
    if (!rating) { setErr('Pick a number from 1 to 10 first.'); return; }
    setErr('');
    setState('sending');
    const ok = await sendFeedback(rating, comment, ctx);
    setState(ok ? 'sent' : 'error');
  };

  const t = { color: fg, fontFamily: font };

  if (state === 'sent') {
    return (
      <View style={[s.box, { borderColor: fg }]}>
        <Text style={[s.body, t]}>Thanks. That helps.</Text>
      </View>
    );
  }

  return (
    <View style={[s.box, { borderColor: fg }]}>
      <Text style={[s.body, t]}>How was this run? (1 = bad, 10 = great)</Text>
      <View style={s.grid}>
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <Pressable
            key={n}
            onPress={() => { setRating(n); setErr(''); }}
            style={[s.cell, { borderColor: fg, backgroundColor: rating === n ? fg : bg }]}
          >
            <Text style={[s.cellText, { color: rating === n ? bg : fg, fontFamily: font }]}>{n}</Text>
          </Pressable>
        ))}
      </View>
      <TextInput
        value={comment}
        onChangeText={setComment}
        placeholder="Anything we should change? (optional)"
        placeholderTextColor={fg}
        multiline
        maxLength={1000}
        style={[s.input, { borderColor: fg, color: fg, fontFamily: font }]}
      />
      {!!err && <Text style={[s.small, t]}>{err}</Text>}
      {state === 'error' && <Text style={[s.small, t]}>Couldn't send that. Check your connection and try again.</Text>}
      <Pressable onPress={submit} style={[s.send, { backgroundColor: fg, borderColor: fg }]}>
        <Text style={[s.sendText, { color: bg, fontFamily: font }]}>{state === 'sending' ? 'SENDING...' : 'SEND FEEDBACK'}</Text>
      </Pressable>
      <Text style={[s.small, t]}>Your rating and note are sent as written. No name or account.</Text>
    </View>
  );
}

const s = StyleSheet.create({
  box: { borderWidth: 1, padding: 14, marginTop: 18 },
  body: { fontSize: 13, lineHeight: 20, marginBottom: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  cell: { width: 44, height: 40, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  cellText: { fontSize: 14 },
  input: { borderWidth: 1, minHeight: 72, padding: 10, fontSize: 13, textAlignVertical: 'top' },
  send: { borderWidth: 1, paddingVertical: 12, marginTop: 12, alignItems: 'center' },
  sendText: { fontSize: 14, letterSpacing: 1 },
  link: { fontSize: 12, textDecorationLine: 'underline', marginTop: 12 },
  small: { fontSize: 11, marginTop: 8 },
});
