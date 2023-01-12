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
      const textA = yDocA.getText('text');
      textA.insert(0, 'Hello World');
      const editorA = new TextEditor(editorARootRef.current, textA, text => {});
    }
    if (editorBRootRef.current) {
      const textB = yDocB.getText('text');
      const editorB = new TextEditor(editorBRootRef.current, textB, text => {});
    }
  }, []);

  return (
    <div className={'grid grid-rows-2 gap-4 h-full w-full'}>
      <p
        className={'p-2'}
        suppressContentEditableWarning
        contentEditable={true}
        ref={editorARootRef}
      ></p>
      <p
        className={'p-2'}
        suppressContentEditableWarning
        contentEditable={true}
        ref={editorBRootRef}
      ></p>
    </div>
  );
};
