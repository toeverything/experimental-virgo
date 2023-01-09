import * as Y from 'yjs';
import { useEffect, useRef } from 'react';
import { TextEditor } from '@blocksuite/virgo';

export const Editor = () => {
  const editorARootRef = useRef<HTMLDivElement>(null);
  const editorBRootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const yDocA = new Y.Doc();
    const yDocB = new Y.Doc();

    yDocA.on('update', update => {
      Y.applyUpdate(yDocB, update);
    });

    yDocB.on('update', update => {
      Y.applyUpdate(yDocA, update);
    });

    if (editorARootRef.current) {
      const editorA = new TextEditor(
        editorARootRef.current,
        yDocA.getText('text'),
        text => {}
      );
    }
    if (editorBRootRef.current) {
      const editorB = new TextEditor(
        editorBRootRef.current,
        yDocB.getText('text'),
        text => {}
      );
    }
  }, []);

  return (
    <div>
      <p
        className={'mb-4'}
        suppressContentEditableWarning
        contentEditable={true}
        ref={editorARootRef}
      ></p>
      <p
        suppressContentEditableWarning
        contentEditable={true}
        ref={editorBRootRef}
      ></p>
    </div>
  );
};
