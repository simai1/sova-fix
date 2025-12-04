import { FC, ReactNode, MouseEvent, HTMLAttributes } from 'react';

import styles from './styles.module.scss';

interface ModalProps extends HTMLAttributes<HTMLDivElement> {
  open: boolean;
  title?: string;
  children?: ReactNode;
  widthAuto?: boolean;
  onClose: () => void;
}

const Modal: FC<ModalProps> = ({
  open,
  title,
  children,
  widthAuto = false,
  onClose,
  className,
}) => {
  if (!open) return null;

  const handleOverlayClick = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className={styles.modal} onClick={handleOverlayClick}>
      <div className={styles.modal__content} style={widthAuto ? { width: 'auto' } : undefined}>
        <div className={styles.modal__header}>
          {title && <h2 className={styles.modal__title}>{title}</h2>}
          <button className={styles.modal__closeBtn} onClick={onClose}>
            ×
          </button>
        </div>
        <div className={`${styles.modal__body} ${className}`}>{children}</div>
      </div>
    </div>
  );
};

export default Modal;
