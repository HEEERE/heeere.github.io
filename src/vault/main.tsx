import '@fontsource/cormorant-garamond/400.css';
import '@fontsource/cormorant-garamond/500.css';
import '@fontsource/cormorant-garamond/600.css';
import '@fontsource/cormorant-garamond/400-italic.css';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';
import './vault.css';
import './vault-layout.css';
import './vault-components.css';
import './garden.css';

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {VaultProvider} from './VaultProvider';
import {VaultApp} from './VaultApp';
import {captureInstallPrompt, registerVaultServiceWorker} from './pwa';
import {isNativeGarden, gardenName} from './lib/native';

if (isNativeGarden()) {
  document.documentElement.classList.add('garden-native');
  document.title = gardenName;
} else {
  captureInstallPrompt();
  registerVaultServiceWorker();
}

const container = document.getElementById('vault-root');
if (!container) throw new Error('vault root missing');

createRoot(container).render(
  <StrictMode>
    <VaultProvider>
      <VaultApp />
    </VaultProvider>
  </StrictMode>,
);
