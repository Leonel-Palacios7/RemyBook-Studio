import { BookOpen, Moon, PenLine, Sun, Cloud, CloudOff, Loader2 } from 'lucide-react';
import { APP_CONFIG } from '@/config/app.config';
import type { RouteName } from '@/lib/router';
import type { SaveStatus } from '@/store/BookProvider';
import './topbar.css';

interface Props {
  route: RouteName;
  onNavigate: (route: RouteName) => void;
  bookTitle: string;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  saveStatus: SaveStatus;
}

const SAVE_LABEL: Record<SaveStatus, string> = {
  loading: 'Cargando…',
  saving: 'Guardando…',
  saved: 'Guardado en este equipo',
  error: 'No se pudo guardar',
};

export function Topbar({ route, onNavigate, bookTitle, theme, onToggleTheme, saveStatus }: Props) {
  const SaveIcon = saveStatus === 'error' ? CloudOff : saveStatus === 'saved' ? Cloud : Loader2;
  return (
    <header className="topbar">
      <div className="brand">
        <span className="brand-mark" aria-hidden="true">
          <BookOpen size={20} strokeWidth={2.4} />
        </span>
        <span className="brand-text">
          <strong>{APP_CONFIG.shortName}</strong>
          <small title={bookTitle}>{bookTitle || 'Publicación sin título'}</small>
        </span>
      </div>

      <nav className="nav-pill" aria-label="Secciones">
        <button
          type="button"
          className={route === 'read' ? 'is-active' : ''}
          aria-current={route === 'read' ? 'page' : undefined}
          onClick={() => onNavigate('read')}
        >
          <BookOpen size={16} /> <span>Lector</span>
        </button>
        <button
          type="button"
          className={route === 'edit' ? 'is-active' : ''}
          aria-current={route === 'edit' ? 'page' : undefined}
          onClick={() => onNavigate('edit')}
        >
          <PenLine size={16} /> <span>Editor</span>
        </button>
      </nav>

      <div className="topbar-actions">
        <span className={`save-status is-${saveStatus}`} role="status" title={SAVE_LABEL[saveStatus]}>
          <SaveIcon size={16} className={saveStatus === 'saving' || saveStatus === 'loading' ? 'spin' : ''} />
          <span className="save-label">{SAVE_LABEL[saveStatus]}</span>
        </span>
        <button
          type="button"
          className="icon-btn"
          onClick={onToggleTheme}
          aria-label={theme === 'dark' ? 'Usar tema claro' : 'Usar tema oscuro'}
          title={theme === 'dark' ? 'Tema claro' : 'Tema oscuro'}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  );
}
