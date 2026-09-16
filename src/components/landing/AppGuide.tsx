'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { MessageCircle, X, Send, RotateCcw } from 'lucide-react';
import { useI18n } from '@/i18n/I18nProvider';
import { guideReply, welcomeReply, MAX_MESSAGE_LENGTH, MAX_QUESTIONS, type GuideReply } from '@/lib/support/guide';
import { supportContacts } from '@/lib/support/contact';

type Message = { from: 'bot'; reply: GuideReply } | { from: 'user'; text: string };
export default function AppGuide() {
  const { href } = useI18n();
  const contacts = supportContacts();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([{ from: 'bot', reply: welcomeReply() }]);
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const questions = messages.filter(message => message.from === 'user').length;
  const limited = questions >= MAX_QUESTIONS;
  const lastReply = [...messages].reverse().find(message => message.from === 'bot');
  useEffect(() => { if (open) inputRef.current?.focus(); }, [open]);
  useEffect(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight; }, [messages, open]);
  function close() { setOpen(false); launcherRef.current?.focus(); }
  function send(value = input) {
    const text = value.trim();
    if (!text || text.length > MAX_MESSAGE_LENGTH) return;
    setMessages(previous => {
      const count = previous.filter(message => message.from === 'user').length;
      if (count >= MAX_QUESTIONS) return previous;
      const previousBot = [...previous].reverse().find(message => message.from === 'bot');
      const reply = guideReply(text, previousBot?.from === 'bot' ? previousBot.reply.topic : '', count);
      return [...previous, { from: 'user', text }, { from: 'bot', reply }];
    });
    setInput(''); inputRef.current?.focus();
  }
  function restart() { setMessages([{ from: 'bot', reply: welcomeReply() }]); setInput(''); setTimeout(() => inputRef.current?.focus(), 0); }
  return <>
    <button ref={launcherRef} type="button" onClick={() => open ? close() : setOpen(true)} aria-label={open ? 'Close app guide' : 'Open app guide'} aria-expanded={open} aria-controls="petsquare-app-guide" className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-tangerine text-white shadow-xl transition-transform hover:scale-105 motion-reduce:transition-none">
      {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
    </button>
    {open && <section id="petsquare-app-guide" role="dialog" aria-modal="false" aria-labelledby="app-guide-title" onKeyDown={event => { if (event.key === 'Escape') { event.preventDefault(); close(); } }} className="fixed bottom-24 right-4 z-50 flex h-[min(36rem,calc(100dvh-7rem))] w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-3xl border border-paper-dim bg-surface shadow-2xl">
      <header className="flex shrink-0 items-center justify-between gap-3 bg-abyss px-4 py-3 text-white"><div><h2 id="app-guide-title" className="font-display text-base">PetSquare app guide</h2><p className="mt-0.5 text-xs text-white/65">Automated, short answers about the app</p></div><button type="button" aria-label="Close guide window" onClick={close} className="rounded-full p-2 hover:bg-white/10"><X className="h-4 w-4" /></button></header>
      <div ref={logRef} role="log" aria-label="Guide conversation" aria-live="polite" aria-relevant="additions" className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain p-4">
        {messages.map((message, index) => <div key={index} className={`flex ${message.from === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[92%] break-words rounded-2xl px-3 py-2.5 text-sm leading-relaxed ${message.from === 'user' ? 'bg-tangerine text-white' : 'bg-paper text-navy'}`}>
          <span className="sr-only">{message.from === 'user' ? 'You: ' : 'Guide: '}</span>{message.from === 'user' ? message.text : <><p>{message.reply.text}</p>{message.reply.links.length > 0 && <div className="mt-3 flex flex-col gap-2">{message.reply.links.map(link => <Link key={link.path} href={href(link.path)} onClick={close} className="w-fit rounded-lg border border-sage/20 bg-surface px-3 py-1.5 text-xs font-medium text-sage hover:underline">{link.label} →</Link>)}</div>}</>}
        </div></div>)}
      </div>
      <div className="shrink-0 border-t border-paper-dim p-3">
        {!limited && lastReply?.from === 'bot' && <div className="mb-3 flex flex-wrap gap-1.5" aria-label="Suggested questions">{lastReply.reply.suggestions.map(suggestion => <button key={suggestion} type="button" onClick={() => send(suggestion)} className="rounded-full border border-sage/20 bg-paper px-2.5 py-1.5 text-[11px] text-sage hover:bg-sage/10">{suggestion}</button>)}</div>}
        <div className="mb-2 flex items-center justify-between gap-2"><p role="status" className="text-[11px] text-navy/55">{limited ? 'Guide complete. Start again for more help.' : `${MAX_QUESTIONS - questions} questions left in this chat`}</p><button type="button" onClick={restart} className="flex items-center gap-1 text-[11px] font-medium text-sage"><RotateCcw className="h-3 w-3" />Start new chat</button></div>
        <form onSubmit={event => { event.preventDefault(); send(); }} className="flex items-center gap-2"><input ref={inputRef} aria-label="Your app question" autoComplete="off" value={input} onChange={event => setInput(event.target.value)} maxLength={MAX_MESSAGE_LENGTH} disabled={limited} placeholder={limited ? 'Start a new chat to continue' : 'Ask how to use PetSquare…'} className="min-w-0 flex-1 rounded-full border border-paper-dim bg-surface px-3 py-2.5 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-tangerine/30 disabled:opacity-50" /><button type="submit" aria-label="Send question" disabled={limited || !input.trim()} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-abyss text-white disabled:opacity-35"><Send className="h-4 w-4" /></button></form>
        {(contacts.whatsapp || contacts.help) && <div className="mt-3 border-t border-paper-dim pt-3">
          <p className="mb-2 text-xs font-medium text-navy">Need more help?</p>
          <div className="flex flex-wrap gap-2">
            {contacts.whatsapp && <a href={contacts.whatsapp} target="_blank" rel="noopener noreferrer" className="flex-1 rounded-xl bg-sage px-3 py-2 text-center text-xs font-medium text-white">Contact support on WhatsApp ↗</a>}
            {contacts.help && <a href={contacts.help} target="_blank" rel="noopener noreferrer" className="rounded-xl border border-paper-dim px-3 py-2 text-xs font-medium text-sage">More support ↗</a>}
          </div>
          <p className="mt-2 text-[10px] text-navy/50">Opens a separate support channel. This chat is not sent automatically.</p>
        </div>}
        <p className="mt-2 text-[10px] text-navy/45">Automated app guide · {MAX_MESSAGE_LENGTH} characters per question</p>
      </div>
    </section>}
  </>;
}
