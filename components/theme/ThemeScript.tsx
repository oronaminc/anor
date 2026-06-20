import {
  DEFAULT_ACCENT,
  DEFAULT_MODE,
  STORAGE_ACCENT,
  STORAGE_MODE,
} from "./theme";

/**
 * Inline, blocking script that applies the saved accent + dark mode before
 * first paint to avoid a flash of the default theme (FOUC).
 */
export function ThemeScript() {
  const code = `(function(){try{
    var a=localStorage.getItem('${STORAGE_ACCENT}')||'${DEFAULT_ACCENT}';
    var m=localStorage.getItem('${STORAGE_MODE}')||'${DEFAULT_MODE}';
    var d=m==='dark'||(m==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);
    var el=document.documentElement;
    el.setAttribute('data-accent',a);
    el.classList.toggle('dark',d);
  }catch(e){}})();`;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
