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
      <footer
        className="p-4 bg-[#242424] rounded-lg shadow md:flex md:items-center md:justify-between md:p-6">
    <span className="text-sm text-gray-400 sm:text-center">Copyright © 2023 <a
      href="https://affine.pro/" target="_blank" className="hover:underline">Toeverything</a>
    </span>
        <ul
          className="flex flex-wrap items-center mt-3 text-sm text-gray-400 sm:mt-0">
          <li>
            <a href="https://github.com/toeverything/experimental-virgo" target="_blank" className="mr-4 hover:underline md:mr-6 ">GitHub</a>
          </li>
        </ul>
      </footer>
    </div>
  );
};
