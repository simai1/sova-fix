type Props = {
  size?: number;
  withWordmark?: boolean;
};

const LkLogoMark = ({ size = 1.5, withWordmark = false }: Props): JSX.Element => {
  const dim = `${size}rem`;
  return (
    <span className="ui-page__brand" aria-label="sova fix">
      <span
        aria-hidden="true"
        style={{
          width: dim,
          height: dim,
          borderRadius: '50%',
          background: 'var(--color-primary)',
          color: 'var(--color-primary-fg)',
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
        <span style={{ fontWeight: 600, fontSize: 'var(--font-size-md)' }}>sova fix</span>
      ) : null}
    </span>
  );
};

export default LkLogoMark;
