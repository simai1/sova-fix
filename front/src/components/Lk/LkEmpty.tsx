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
  <div className="ui-empty">
    {icon ? (
      <div className="ui-empty__icon" aria-hidden>
        {icon}
      </div>
    ) : null}
    {title ? <h3 className="ui-empty__title">{title}</h3> : null}
    {text ? <p className="ui-empty__text">{text}</p> : null}
    {action ? (
      <button
        type="button"
        className={`ui-button ui-button--${action.variant ?? 'accent'} ui-empty__action`}
        onClick={action.onClick}
      >
        {action.label}
      </button>
    ) : null}
  </div>
);

export default LkEmpty;
