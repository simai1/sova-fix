import { useEffect, useRef } from 'react';

import { showToast } from './toastBus';

import { usePushSubscription } from '@/hooks/usePushSubscription';

const ProfilePushSection = (): JSX.Element => {
  const { state, enable, disable, sendTest, error } = usePushSubscription();
  const lastErrorRef = useRef<string | null>(null);

  useEffect(() => {
    if (error && error !== lastErrorRef.current) {
      lastErrorRef.current = error;
      showToast('error', error);
    }
    if (!error) lastErrorRef.current = null;
  }, [error]);

  const handleEnable = async (): Promise<void> => {
    await enable();
  };

  const handleDisable = async (): Promise<void> => {
    if (!window.confirm('Отключить push-уведомления на этом устройстве?')) return;
    await disable();
    if (!error) showToast('success', 'Push-уведомления отключены');
  };

  const handleTest = async (): Promise<void> => {
    await sendTest();
    showToast('info', 'Тестовое уведомление отправлено');
  };

  return (
    <div className="ui-card">
      <h2 className="ui-card__title">Push-уведомления</h2>
      <div className="ui-profile__push">
        <div className="ui-profile__push-status">
          {state === 'subscribed' ? (
            <span className="ui-chip ui-chip--push-on">Включены</span>
          ) : null}
          {state === 'granted-not-subscribed' ? (
            <span className="ui-chip ui-chip--push-off">Отключены</span>
          ) : null}
          {state === 'denied' ? (
            <span className="ui-chip ui-chip--push-denied">Запрещено</span>
          ) : null}
          {state === 'unsupported' ? (
            <span
              className="ui-chip ui-chip--push-muted"
              title="Обновите браузер или войдите с другого устройства"
            >
              Браузер не поддерживает push
            </span>
          ) : null}
          {state === 'unavailable' ? (
            <span className="ui-chip ui-chip--push-warn">Временно недоступно</span>
          ) : null}
          {state === 'loading' ? (
            <span className="ui-chip ui-chip--push-muted">Подключение…</span>
          ) : null}
        </div>

        <p className="ui-profile__push-hint">
          {state === 'denied'
            ? 'Разрешите уведомления в настройках браузера и обновите страницу.'
            : null}
          {state === 'unavailable' ? 'Push-уведомления отключены администратором.' : null}
          {state === 'unsupported' ? 'Этот браузер не поддерживает push-уведомления.' : null}
          {state === 'subscribed' || state === 'granted-not-subscribed' || state === 'loading'
            ? 'Получайте уведомления о статусах заявок и комментариях, даже когда вкладка закрыта.'
            : null}
        </p>

        <div className="ui-button-grid">
          {state === 'granted-not-subscribed' ? (
            <button type="button" className="ui-button ui-button--accent" onClick={handleEnable}>
              Включить уведомления
            </button>
          ) : null}

          {state === 'subscribed' ? (
            <>
              <button type="button" className="ui-button ui-button--danger" onClick={handleDisable}>
                Отключить
              </button>
              <button type="button" className="ui-button ui-button--ghost" onClick={handleTest}>
                Отправить тестовое
              </button>
            </>
          ) : null}

          {state === 'loading' ? (
            <button type="button" className="ui-button ui-button--ghost" disabled>
              Подключение…
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default ProfilePushSection;
