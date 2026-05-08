import type { ReactNode } from 'react';

type ActionVariant = 'accent' | 'ghost';

type Props = {
  icon?: ReactNode;
  title?: string;
  text?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: ActionVariant;
  };
};

const LkEmpty = ({ icon, title, text, action }: Props): JSX.Element => (
  <div className="lk-empty">
    {icon ? (
      <div className="lk-empty__icon" aria-hidden>
        {icon}
      </div>
    ) : null}
    {title ? <h3 className="lk-empty__title">{title}</h3> : null}
    {text ? <p className="lk-empty__text">{text}</p> : null}
    {action ? (
      <button
        type="button"
        className={`lk-button lk-button--${action.variant ?? 'accent'} lk-empty__action`}
        onClick={action.onClick}
      >
        {action.label}
      </button>
    ) : null}
  </div>
);

export default LkEmpty;
