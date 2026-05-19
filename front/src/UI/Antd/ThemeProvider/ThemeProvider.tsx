import { ConfigProvider, theme } from 'antd';
import ruRU from 'antd/locale/ru_RU';
import { FC, PropsWithChildren } from 'react';

export const ThemeProvider: FC<PropsWithChildren> = ({ children }) => {
  return (
    <ConfigProvider
      locale={ruRU}
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#F5C518',
          colorSuccess: '#15803D',
          colorError: '#B91C1C',
          colorTextBase: '#18181B',
          colorBgContainer: '#FFFFFF',

          borderRadius: 8,

          fontFamily: 'FactWeb, system-ui, sans-serif',
        },
        components: {
          Table: {
            headerBg: '#b7ab9e',
            rowHoverBg: 'hwb(0 94% 6%)',
          },
          Input: {
            padding: 10,
          },
        },
      }}
    >
      {children}
    </ConfigProvider>
  );
};
