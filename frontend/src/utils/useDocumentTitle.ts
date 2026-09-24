import { useEffect } from 'react';

/** Sets `document.title` to `${title} | Event Registration` for the life of the calling page. */
export function useDocumentTitle(title: string): void {
  useEffect(() => {
    document.title = `${title} | Event Registration`;
  }, [title]);
}
