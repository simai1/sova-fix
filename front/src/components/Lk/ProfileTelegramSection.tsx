import { useState } from 'react';

import LinkTelegramModal from './LinkTelegramModal';
import { showToast } from './toastBus';

import { LkTelegram, useUnlinkTelegramMutation } from '@/API/rtkQuery/lk.api';
import { getErrorMessage } from '@/utils/getErrorMessage';

type Props = {
  telegram: LkTelegram | null | undefined;
};

const ProfileTelegramSection = ({ telegram }: Props): JSX.Element => {
  const [open, setOpen] = useState(false);
  const [unlink, unlinkState] = useUnlinkTelegramMutation();

  const linked = telegram?.linked === true;
  const username = telegram?.username ?? null;
  const tgIdMasked = telegram?.tgId ?? null;

  const handleUnlink = async (): Promise<void> => {
    if (!window.confirm('Отвязать Telegram? Уведомления перестанут приходить.')) return;
    try {
      await unlink().unwrap();
      showToast('success', 'Telegram отвязан');
    } catch (err) {
      showToast('error', getErrorMessage(err));
    }
  };

  return (
    <div className="ui-card">
      <h2 className="ui-card__title">Telegram</h2>
      <div className="ui-profile__tg">
        {linked ? (
          <>
            <div className="ui-profile__tg-status ui-profile__tg-status--linked">
              <span aria-hidden="true">✓</span>
              <span>Привязан:</span>
              <span className="ui-profile__tg-username">
                {username ? `@${username}` : (tgIdMasked ?? 'Telegram')}
              </span>
            </div>
            <button
              type="button"
              className="ui-button ui-button--danger ui-button--block"
              onClick={handleUnlink}
              disabled={unlinkState.isLoading}
            >
              Отвязать
            </button>
          </>
        ) : (
          <>
            <div className="ui-profile__tg-status ui-profile__tg-status--empty">
              Уведомления о заявках в Telegram ещё не подключены.
            </div>
            <button
              type="button"
              className="ui-button ui-button--accent ui-button--block"
              onClick={() => setOpen(true)}
            >
              Привязать Telegram
            </button>
          </>
        )}
      </div>

      <LinkTelegramModal open={open} onClose={() => setOpen(false)} />
    </div>
  );
};

export default ProfileTelegramSection;
