type Props = {
  size?: number; // в rem; по умолчанию 1.5
  withWordmark?: boolean;
};

const LkLogoMark = ({ size = 1.5, withWordmark = false }: Props): JSX.Element => {
  const dim = `${size}rem`;
  return (
    <span className="lk-page__brand" aria-label="sova fix">
      <span
        aria-hidden="true"
        style={{
          width: dim,
          height: dim,
          borderRadius: '50%',
          background: 'var(--lk-accent)',
          color: 'var(--lk-accent-fg)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontSize: `calc(${dim} * 0.6)`,
          lineHeight: 1,
        }}
      >
        S
      </span>
      {withWordmark ? (
        <span style={{ fontWeight: 600, fontSize: 'var(--lk-fs-md)' }}>sova fix</span>
      ) : null}
    </span>
  );
};

export default LkLogoMark;
