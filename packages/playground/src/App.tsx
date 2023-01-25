import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Editor } from './Editor';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Editor></Editor>,
  },
  {
    path: 'test/:id',
    element: <Editor></Editor>,
  },
]);

export const App = () => {
  return (
    <div
      className={'grid justify-center items-center h-full w-full bg-[#242424]'}
    >
      <div
        className={
          'w-[1200px] h-[600px] bg-[#202124] text-[#d5d5cf] rounded-md p-2'
        }
      >
        <RouterProvider router={router}></RouterProvider>
      </div>
    </div>
  );
};
