import { useEffect } from "react";
import { useDispatch } from "react-redux";

import Home from "./pages/Home";
import getCurrentUser from "./features/getCurrentUser";
import { setUserData } from "./redux/userSlice";

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    const getUser = async () => {
      try {
        const data = await getCurrentUser();

        if (data?.user) {
          dispatch(setUserData(data.user));
        }
      } catch (error) {
        console.error("Failed to get current user:", error);
      }
    };

    getUser();
  }, [dispatch]);

  return <Home />;
}

export default App;