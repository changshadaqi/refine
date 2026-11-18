import React from "react";
import { createRoot } from "react-dom/client";
import KindeProvider from "@refine-auth/kinde-react";

import App from "./App";

const container = document.getElementById("root");
// eslint-disable-next-line
const root = createRoot(container!);

root.render(
  <React.StrictMode>
    <KindeProvider
      clientId={import.meta.env.VITE_KINDE_CLIENT_ID}
      domain={import.meta.env.VITE_KINDE_DOMAIN}
      logoutUri={window.location.origin}
      redirectUri={window.location.origin}
      // Local Storage is necessary to keep auth persistent
      isDangerouslyUseLocalStorage
    >
      <App />
    </KindeProvider>
  </React.StrictMode>,
);
