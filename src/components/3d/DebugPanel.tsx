import { useEffect, useRef } from 'react';
import { Pane } from 'tweakpane';
import { scrollState } from '../../lib/progress';

export function DebugPanel() {
  const paneRef = useRef<Pane | null>(null);

  useEffect(() => {
    // Only mount if url has ?debug=true or in dev (we can just add it generally for this stage)
    if (typeof window === 'undefined') return;

    if (!document.getElementById('tweakpane-container')) {
      const div = document.createElement('div');
      div.id = 'tweakpane-container';
      div.style.position = 'fixed';
      div.style.top = '10px';
      div.style.right = '10px';
      div.style.zIndex = '9999';
      div.style.pointerEvents = 'auto';
      document.body.appendChild(div);

      const pane = new Pane({ container: div, title: 'Scrubber' });
      paneRef.current = pane;

      // Add a virtual state object mapped to scroll
      const PARAMS = {
        progress: scrollState.target
      };

      const p = pane.addBinding(PARAMS, 'progress', {
        min: 0,
        max: 1,
        step: 0.001
      });

      p.on('change', (ev) => {
        // We update scroll position to match
        if (ev.last) return; // avoid infinite loop if dragging
        const maxScroll = document.body.scrollHeight - window.innerHeight;
        window.scrollTo(0, maxScroll * ev.value);
      });

      // Update pane from normal scroll
      const updateInterval = window.setInterval(() => {
        if (PARAMS.progress !== scrollState.target) {
          PARAMS.progress = scrollState.target;
          pane.refresh();
        }
      }, 100);

      const btn = pane.addButton({ title: 'Top' });
      btn.on('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });

      let md = false;
      const diagBtn = pane.addButton({ title: 'Toggle Mat Diag' });
      diagBtn.on('click', () => {
        md = !md;
        window.dispatchEvent(new CustomEvent('toggle-mat-diagnostics', { detail: md }));
      });

      return () => {
        clearInterval(updateInterval);
        pane.dispose();
        div.remove();
      };
    }
  }, []);

  return null;
}
