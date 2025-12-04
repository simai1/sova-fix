import { LoadingOutlined } from '@ant-design/icons';
import { Spin } from 'antd';
import { FC } from 'react';

import styles from './styles.module.scss';

const AntLoader: FC = () => {
  return (
    <Spin
      className={styles.container}
      indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />}
    />
  );
};

export default AntLoader;
