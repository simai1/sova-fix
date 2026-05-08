type Props = {
  text: string;
  onRetry?: () => void;
};

const LkErrorBanner = ({ text, onRetry }: Props): JSX.Element => (
  <div className="lk-error-banner" role="alert">
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
    <span style={{ flex: 1 }}>{text}</span>
    {onRetry ? (
      <button type="button" className="lk-link" onClick={onRetry}>
        Повторить
      </button>
    ) : null}
  </div>
);

export default LkErrorBanner;
