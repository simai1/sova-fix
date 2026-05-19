import { useEffect, useState } from 'react';

import { LkToast, subscribeToasts } from './toastBus';

const TOAST_TTL_MS = 4000;

const LkToastArea = (): JSX.Element => {
  const [toasts, setToasts] = useState<LkToast[]>([]);

  useEffect(() => {
    const unsub = subscribeToasts((t) => {
      setToasts((prev) => [...prev, t]);
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((x) => x.id !== t.id));
      }, TOAST_TTL_MS);
    });
    return unsub;
  }, []);

  return (
    <div className="ui-toast-area" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`ui-toast ui-toast--${t.type}`} role="status">
          {t.message}
        </div>
      ))}
    </div>
  );
};

export default LkToastArea;
