type Variant = 'list' | 'card' | 'line';

type Props = {
  variant?: Variant;
  count?: number;
};

const LkSkeleton = ({ variant = 'list', count = 3 }: Props): JSX.Element => {
  if (variant === 'list') {
    return (
      <div className="ui-skeleton-list" aria-hidden>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="ui-skeleton-list-item">
            <span className="ui-skeleton-list-item__line ui-skeleton-list-item__line--w-1/3" />
            <span className="ui-skeleton-list-item__line ui-skeleton-list-item__line--w-3/4" />
            <span className="ui-skeleton-list-item__line ui-skeleton-list-item__line--w-1/2" />
          </div>
        ))}
      </div>
    );
  }
  if (variant === 'card') {
    return <div className="ui-skeleton" style={{ height: '8rem', width: '100%' }} aria-hidden />;
  }
  return <span className="ui-skeleton" style={{ height: '0.875rem', width: '100%' }} aria-hidden />;
};

export default LkSkeleton;
