import { Button } from 'antd';
import classNames from 'classnames';
import { FC } from 'react';

import styles from './styles.module.scss';
import { AntButtonProps } from './types';

const AntButton: FC<AntButtonProps> = ({ children, colorVariant, ...props }) => {
  return (
    <Button
      type="primary"
      rootClassName={classNames(styles.button, colorVariant && styles[colorVariant])}
      {...props}
    >
      {children}
    </Button>
  );
};

export default AntButton;
