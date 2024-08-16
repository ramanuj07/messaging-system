import { RouterProvider, createBrowserRouter } from "react-router-dom";
import MainContainer from "./MainContainer";

const Body = () => {
  const appRouter = createBrowserRouter([
    {
      path: "/",
      element: <MainContainer />,
    },
  ]);

  return (
    <div>
      <RouterProvider router={appRouter} />
    </div>
  );
};

export default Body;
