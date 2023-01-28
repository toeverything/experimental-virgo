import * as Y from 'yjs';
import { TextEditor } from '@blocksuite/virgo';
import { BaseArrtiubtes } from '@blocksuite/virgo/src/types';
import { SlButton } from '@shoelace-style/shoelace/dist/react';

function format(editor: TextEditor, mark: Partial<BaseArrtiubtes>): void {
  const rangeStatic = editor.getRangeStatic();
  if (!rangeStatic) {
    return;
  }

  editor.formatText(
    rangeStatic,
    { type: 'base', ...mark },
    {
      mode: 'merge',
    }
  );
  editor.syncRangeStatic();
}

export const ToolBar = ({
  editor,
  undoManager,
}: {
  editor: TextEditor;
  undoManager: Y.UndoManager;
}) => {
  return (
    <div>
      <SlButton
        onClick={() => {
          format(editor, { bold: true });
        }}
      >
        bold
      </SlButton>
      <SlButton
        onClick={() => {
          format(editor, { italic: true });
        }}
      >
        italic
      </SlButton>
      <SlButton
        onClick={() => {
          format(editor, { underline: true });
        }}
      >
        underline
      </SlButton>
      <SlButton
        onClick={() => {
          format(editor, { strikethrough: true });
        }}
      >
        strikethrough
      </SlButton>
      <SlButton
        onClick={() => {
          const rangeStatic = editor.getRangeStatic();
          if (rangeStatic) {
            editor.resetText(rangeStatic);
            editor.syncRangeStatic();
          }
        }}
      >
        reset
      </SlButton>
      <SlButton
        onClick={() => {
          undoManager.undo();
        }}
      >
        undo
      </SlButton>
      <SlButton
        onClick={() => {
          undoManager.redo();
        }}
      >
        redo
      </SlButton>
    </div>
  );
};
