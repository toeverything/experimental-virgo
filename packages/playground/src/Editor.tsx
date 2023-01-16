import * as Y from 'yjs';
import { useEffect, useRef } from 'react';
import { RangeStatic, TextEditor } from '@blocksuite/virgo';
import { Signal } from '@blocksuite/virgo/src/utils/signal';

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

      const signal = new Signal<RangeStatic | null>();
      signal.on(range => {
        console.log('A', range);
      });

      const editorA = new TextEditor('A', editorARootRef.current, textA, {
        updateRangeStatic: signal,
      });
    }
    if (editorBRootRef.current) {
      const textB = yDocB.getText('text');

      const signal = new Signal<RangeStatic | null>();
      signal.on(range => {
        console.log('B', range);
      });

      const editorB = new TextEditor('B', editorBRootRef.current, textB, {
        updateRangeStatic: signal,
      });
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
