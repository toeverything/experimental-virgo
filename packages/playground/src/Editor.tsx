import * as Y from 'yjs';
import { useEffect, useRef } from 'react';
import { RangeStatic, Signal, TextEditor } from '@blocksuite/virgo';

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
      textA.insert(0, 'aaa');

      textA.observe(() => {
        console.log('A', textA.toString(), textA.toString().length);
        console.log(
          editorARootRef.current?.innerHTML,
          editorARootRef.current?.innerText === 'aaa\n\n'
        );
      });

      const signal = new Signal<RangeStatic | null>();
      // signal.on(range => {
      //   console.log('A', range);
      // });

      const editorA = new TextEditor('A', editorARootRef.current, textA, {
        updateRangeStatic: signal,
      });
    }
    if (editorBRootRef.current) {
      const textB = yDocB.getText('text');

      textB.observe(() => {
        console.log('B', textB.toString(), textB.toString().length);
        console.log(
          editorBRootRef.current?.innerText,
          editorBRootRef.current?.innerText === 'aaa\n\n'
        );
      });

      const signal = new Signal<RangeStatic | null>();
      // signal.on(range => {
      //   console.log('B', range);
      // });

      const editorB = new TextEditor('B', editorBRootRef.current, textB, {
        updateRangeStatic: signal,
      });
    }
  }, []);

  return (
    <div className={'grid grid-rows-2 gap-4 h-full w-full'}>
      <div
        className={'p-2'}
        suppressContentEditableWarning
        contentEditable={true}
        ref={editorARootRef}
      ></div>
      <div
        className={'p-2'}
        suppressContentEditableWarning
        contentEditable={true}
        ref={editorBRootRef}
      ></div>
    </div>
  );
};
