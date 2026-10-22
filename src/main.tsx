import {createRoot} from 'react-dom/client';
import '@fontsource/cormorant-garamond/300.css';
import '@fontsource/cormorant-garamond/400.css';
import '@fontsource/cormorant-garamond/400-italic.css';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';
import './styles/base.css';
import './styles/layout.css';
import './styles/scenes.css';
import './styles/sections.css';
import './styles/overlay.css';
import './styles/responsive.css';
import './styles/dossier.css';
import {App} from './app/App';

const container = document.getElementById('root');
if (!container) throw new Error('Root container missing');

createRoot(container).render(<App />);
