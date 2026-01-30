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
          colorPrimary: '#ffe20d', // ActiveText-color
          colorSuccess: '#c5e384', // Main-green-color
          colorError: '#d69a81', // Red-color
          colorTextBase: '#1d1d1b', // black-color
          colorBgContainer: '#ffffff', // white-color

          borderRadius: 8,

          fontFamily: 'Inter, system-ui, sans-serif',
        },
        components: {
          Table: {
            headerBg: '#b7ab9e',
            rowHoverBg: 'hwb(0 94% 6%)',
          },
          Button: {
            colorPrimaryHover: '#f3d911',
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
