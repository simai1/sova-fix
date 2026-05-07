import { useEffect, useRef } from 'react';

import ChatMessage from './ChatMessage';
import LkEmpty from './LkEmpty';
import LkSpinner from './LkSpinner';

import { ChatMessage as ChatMessageType } from '@/API/rtkQuery/lk.api';

type Props = {
  messages: ChatMessageType[];
  meUserId: string | undefined;
  isLoading: boolean;
  isError: boolean;
  hasMore: boolean;
  isFetchingMore: boolean;
  onLoadMore: () => void;
};

// Группировка сообщений по дням в TZ Europe/Moscow.
const dayKey = (iso: string): string => {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('ru-RU', {
      timeZone: 'Europe/Moscow',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
};

const dayLabel = (iso: string): string => {
  try {
    const now = new Date();
    const d = new Date(iso);
    const todayKey = now.toLocaleDateString('ru-RU', { timeZone: 'Europe/Moscow' });
    const dKey = d.toLocaleDateString('ru-RU', { timeZone: 'Europe/Moscow' });
    if (dKey === todayKey) return 'Сегодня';
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const yKey = yesterday.toLocaleDateString('ru-RU', { timeZone: 'Europe/Moscow' });
    if (dKey === yKey) return 'Вчера';
    return d.toLocaleDateString('ru-RU', {
      timeZone: 'Europe/Moscow',
      day: 'numeric',
      month: 'long',
    });
  } catch {
    return iso;
  }
};

const ChatStream = ({
  messages,
  meUserId,
  isLoading,
  isError,
  hasMore,
  isFetchingMore,
  onLoadMore,
}: Props): JSX.Element => {
  const streamRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const topSentinelRef = useRef<HTMLDivElement | null>(null);
  const lastIdRef = useRef<string | null>(null);
  const lastCountRef = useRef<number>(0);

  // Авто-скролл вниз при первом маунте и при появлении нового сообщения.
  // Но не при подгрузке СТАРЫХ сообщений сверху (там lastIdRef не меняется).
  useEffect(() => {
    if (messages.length === 0) return;
    const lastId = messages[messages.length - 1]?.id ?? null;
    const grew = messages.length > lastCountRef.current;
    const newLastMsg = lastId !== lastIdRef.current;
    // Скроллим только если конец ленты «обновился»: либо появился новый
    // последний id, либо в первый раз (lastIdRef === null).
    if (newLastMsg && grew) {
      // Используем requestAnimationFrame, чтобы ждать рендер.
      requestAnimationFrame(() => {
        bottomRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' });
      });
    }
    lastIdRef.current = lastId;
    lastCountRef.current = messages.length;
  }, [messages]);

  // Подгрузка предыдущих сообщений при достижении верха ленты.
  useEffect(() => {
    const el = topSentinelRef.current;
    if (!el || !hasMore) return;
    const observer = new IntersectionObserver((entries) => {
      const [entry] = entries;
      if (entry?.isIntersecting && !isFetchingMore && !isLoading) {
        onLoadMore();
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, isFetchingMore, isLoading, onLoadMore]);

  if (isLoading && messages.length === 0) {
    return (
      <div className="lk-chat__stream" ref={streamRef}>
        <LkSpinner />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="lk-chat__stream" ref={streamRef}>
        <LkEmpty text="Не удалось загрузить переписку" />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="lk-chat__stream" ref={streamRef}>
        <LkEmpty text="Сообщений пока нет — начните переписку" />
      </div>
    );
  }

  // Формируем рендер с разделителями дат. Группа добавляется при смене dayKey.
  const rendered: JSX.Element[] = [];
  let lastDay: string | null = null;
  messages.forEach((msg) => {
    const k = dayKey(msg.createdAt);
    if (k !== lastDay) {
      rendered.push(
        <div key={`day-${k}-${msg.id}`} className="lk-chat__day">
          {dayLabel(msg.createdAt)}
        </div>,
      );
      lastDay = k;
    }
    const isMine = !!meUserId && msg.author?.id === meUserId;
    rendered.push(<ChatMessage key={msg.id} message={msg} isMine={isMine} />);
  });

  return (
    <div className="lk-chat__stream" ref={streamRef}>
      <div ref={topSentinelRef} style={{ height: 1 }} />
      {isFetchingMore ? <LkSpinner /> : null}
      {rendered}
      <div ref={bottomRef} style={{ height: 1 }} />
    </div>
  );
};

export default ChatStream;
