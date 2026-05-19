import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import ChatComposer from './ChatComposer';
import ChatStream from './ChatStream';
import LkEmpty from './LkEmpty';
import LkSpinner from './LkSpinner';
import { showToast } from './toastBus';

import {
  ChatMessage,
  useAddCommentMutation,
  useGetMeQuery,
  useGetMyRequestQuery,
  useGetRequestCommentsQuery,
} from '@/API/rtkQuery/lk.api';
import { useRequestSubscription } from '@/hooks/useRequestSubscription';
import { getErrorMessage } from '@/utils/getErrorMessage';

type Props = {
  mode: 'contractor' | 'customer' | 'admin';
  requestId?: string;
};

const RequestChat = ({ mode, requestId: requestIdProp }: Props): JSX.Element => {
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();
  const requestId = requestIdProp ?? params.id ?? '';
  const isEmbedded = mode === 'admin';

  const { data: me } = useGetMeQuery();
  const { data: request } = useGetMyRequestQuery(requestId, { skip: !requestId });

  useRequestSubscription(requestId);

  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [accumulated, setAccumulated] = useState<ChatMessage[]>([]);
  const [hasMore, setHasMore] = useState<boolean>(false);

  const {
    data: page,
    isLoading,
    isFetching,
    isError,
  } = useGetRequestCommentsQuery({ requestId, cursor, limit: 30 }, { skip: !requestId });

  useEffect(() => {
    if (!page) return;
    setHasMore(page.hasMore);
    setAccumulated((prev) => {
      if (!cursor) {
        return page.items;
      }
      const map = new Map<string, ChatMessage>();
      [...page.items, ...prev].forEach((m) => map.set(m.id, m));
      return Array.from(map.values()).sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
    });
  }, [page, cursor]);

  const handleLoadMore = (): void => {
    if (!page?.nextCursor || isFetching) return;
    setCursor(page.nextCursor);
  };

  const [addComment, addCommentState] = useAddCommentMutation();

  const handleSend = async ({ text, file }: { text: string; file?: File }): Promise<void> => {
    if (!requestId) return;
    try {
      await addComment({ id: requestId, text, file }).unwrap();
      setCursor(undefined);
    } catch (err) {
      showToast('error', getErrorMessage(err));
    }
  };

  const handleBack = (): void => {
    if (mode === 'admin') return;
    const back =
      mode === 'contractor'
        ? `/contractor/requests/${requestId}`
        : `/customer/requests/${requestId}`;
    navigate(back);
  };

  if (!requestId) return <LkEmpty text="Заявка не найдена" />;
  if (!request && !isLoading && !isFetching) return <LkEmpty text="Заявка не найдена" />;
  if (!request) return <LkSpinner />;

  return (
    <div className={isEmbedded ? 'ui-chat ui-chat--embedded' : 'ui-chat'}>
      {isEmbedded ? null : (
        <div className="ui-chat__subhead">
          <button type="button" className="ui-chat__back" onClick={handleBack}>
            ← К заявке
          </button>
          <span className="ui-chat__subhead-title">№ {request.number}</span>
          {request.Object?.name ? (
            <>
              <span aria-hidden="true">·</span>
              <span>{request.Object.name}</span>
            </>
          ) : null}
        </div>
      )}

      <ChatStream
        messages={accumulated}
        meUserId={me?.user?.id}
        isLoading={isLoading}
        isError={isError}
        hasMore={hasMore}
        isFetchingMore={isFetching && !!cursor}
        onLoadMore={handleLoadMore}
      />

      <ChatComposer
        onSubmit={handleSend}
        isSending={addCommentState.isLoading}
        autoGrow={!isEmbedded}
      />
    </div>
  );
};

export default RequestChat;
