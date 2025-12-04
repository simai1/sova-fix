import { Checkbox, CheckboxProps } from 'antd';
import classNames from 'classnames';
import { FC } from 'react';

import styles from './styles.module.scss';

interface AntCheckboxProps extends CheckboxProps {
  labelPosition?: 'left' | 'right';
}

const AntCheckbox: FC<AntCheckboxProps> = ({ labelPosition = 'right', children, ...props }) => {
  return (
    <div
      className={classNames(styles.wrapper, {
        [styles.leftLabel as string]: labelPosition === 'left',
      })}
    >
      <Checkbox className={styles.checkbox} {...props}>
        {children}
      </Checkbox>
    </div>
  );
};

export default AntCheckbox;
