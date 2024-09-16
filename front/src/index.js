import React from "react";
import ReactDOM from "react-dom/client";
import { StyledEngineProvider } from '@mui/material/styles';
import App from "./App";
import { Provider } from "react-redux";
import store, { persistor } from "./store/store";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <Provider store={store}>
      <StyledEngineProvider injectFirst>
          <App />
      </StyledEngineProvider>
  </Provider>
)

