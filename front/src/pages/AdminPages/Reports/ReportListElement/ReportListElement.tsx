import { Form } from 'antd';
import { FC } from 'react';

import styles from './styles.module.scss';
import { ReportListElementProps } from './types';
import AntCheckbox from '../../../../UI/Antd/AntCheckbox/AntCheckbox';

const ReportListElement: FC<ReportListElementProps> = ({
  label,
  name,
  labelPosition,
  disabled,
}) => {
  return (
    <div className={styles.container}>
      <Form.Item name={name} noStyle valuePropName="checked">
        <AntCheckbox disabled={disabled} labelPosition={labelPosition}>
          {label}
        </AntCheckbox>
      </Form.Item>
    </div>
  );
};

export default ReportListElement;
