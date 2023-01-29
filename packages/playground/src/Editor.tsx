import * as Y from 'yjs';
import { useEffect, useRef } from 'react';
import { RichText } from './components/rich-text';
import { RangeStatic, TextEditor } from '@blocksuite/virgo';
import type { DeltaInsert } from '@blocksuite/virgo';
import { proxy, useSnapshot } from 'valtio';
import { ToolBar } from './ToolBar';
import { renderElement } from './render';

const store = proxy<{
  docA: {
    rangeStatic: RangeStatic | null;
    deltas: DeltaInsert[];
  };
  docB: {
    rangeStatic: RangeStatic | null;
    deltas: DeltaInsert[];
  };
}>({
  docA: {
    rangeStatic: null,
    deltas: [],
  },
  docB: {
    rangeStatic: null,
    deltas: [],
  },
});

const TEXT_ID = 'virgo';
const yDocA = new Y.Doc();
const yDocB = new Y.Doc();

yDocA.on('update', update => {
  Y.applyUpdate(yDocB, update);
  store.docA.deltas = yDocA.getText(TEXT_ID).toDelta();
});

yDocB.on('update', update => {
  Y.applyUpdate(yDocA, update);
  store.docB.deltas = yDocB.getText(TEXT_ID).toDelta();
});

const textA = yDocA.getText(TEXT_ID);
const undoManagerA = new Y.UndoManager(textA);
textA.insert(0, 'Hello World', { type: 'base' });
textA.insert(2, 'Haa', { type: 'inline-code' });
const editorA = new TextEditor(textA, renderElement);
editorA.signals.updateRangeStatic.on(([rangeStatic]) => {
  store.docA.rangeStatic = rangeStatic;
});

const textB = yDocB.getText(TEXT_ID);
const undoManagerB = new Y.UndoManager(textB);
const editorB = new TextEditor(textB, renderElement);
editorB.signals.updateRangeStatic.on(([rangeStatic]) => {
  store.docB.rangeStatic = rangeStatic;
});

export const Editor = () => {
  const containerA = useRef<HTMLDivElement>(null);
  const containerB = useRef<HTMLDivElement>(null);

  const storeSnap = useSnapshot(store);

  useEffect(() => {
    if (containerA.current) {
      const container = containerA.current;

      const richTextA = new RichText();
      richTextA.editor = editorA;
      container.appendChild(richTextA);
    }

    if (containerB.current) {
      const container = containerB.current;

      const richTextB = new RichText();
      richTextB.editor = editorB;
      container.appendChild(richTextB);
    }
  }, []);

  return (
    <div className={'grid grid-cols-2 gap-4 h-full w-full'}>
      <div
        className={
          'grid grid-rows-[90px_40px_repeat(2,minmax(0,1fr))] max-h-full overflow-y-scroll'
        }
      >
        <ToolBar editor={editorA} undoManager={undoManagerA}></ToolBar>
        <div className={'p-2'}>Doc A</div>
        <div
          className={'p-2 bg-neutral-900 rounded-md'}
          suppressContentEditableWarning
          ref={containerA}
        ></div>
        <div className={'grid grid-rows-2'}>
          <p>{JSON.stringify(storeSnap.docA.rangeStatic)}</p>
          <p>{JSON.stringify(storeSnap.docA.deltas)}</p>
        </div>
      </div>
      <div
        className={
          'grid grid-rows-[90px_40px_repeat(2,minmax(0,1fr))] max-h-full overflow-y-scroll'
        }
      >
        <ToolBar editor={editorB} undoManager={undoManagerB}></ToolBar>
        <div className={'p-2'}>Doc B</div>
        <div
          className={'p-2 bg-neutral-900 rounded-md'}
          suppressContentEditableWarning
          ref={containerB}
        ></div>
        <div className={'grid grid-rows-2'}>
          <p>{JSON.stringify(storeSnap.docB.rangeStatic)}</p>
          <p>{JSON.stringify(storeSnap.docB.deltas)}</p>
        </div>
      </div>
    </div>
  );
};
