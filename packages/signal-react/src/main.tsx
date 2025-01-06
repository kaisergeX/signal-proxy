import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import SignalPlayground from './playground.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SignalPlayground />
  </StrictMode>,
);
