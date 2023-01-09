import { Editor } from './Editor';

export const App = () => {
  return (
    <div
      className={'grid justify-center items-center h-full w-full bg-[#242424]'}
    >
      <div className={'w-96 h-96 bg-[#202124] text-[#d5d5cf]'}>
        <Editor></Editor>
      </div>
    </div>
  );
};
