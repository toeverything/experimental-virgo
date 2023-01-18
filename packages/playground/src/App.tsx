import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Editor } from './Editor';
import { TestEditor } from './TestEditor';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Editor></Editor>,
  },
  {
    path: 'test/:id',
    element: <TestEditor></TestEditor>,
  },
]);

export const App = () => {
  return (
    <div
      className={'grid justify-center items-center h-full w-full bg-[#242424]'}
    >
      <div className={'w-[700px] h-96 bg-[#202124] text-[#d5d5cf]'}>
        <RouterProvider router={router}></RouterProvider>
      </div>
    </div>
  );
};
