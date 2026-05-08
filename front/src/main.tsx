import '@fontsource-variable/inter/wght.css';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';

import App from './App.jsx';
import store from './store/store.js';
import { ThemeProvider } from './UI/Antd/ThemeProvider/ThemeProvider.js';
import { migrateLegacyUserData } from './utils/auth';

// Перенос userData из localStorage в sessionStorage для пользователей со старой версией.
// Должен отработать до первого рендера, поэтому вызывается до createRoot.
migrateLegacyUserData();

const container = document.getElementById('root') as HTMLElement;
dayjs.extend(utc);

const root = ReactDOM.createRoot(container);
root.render(
  <Provider store={store}>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </Provider>,
);
