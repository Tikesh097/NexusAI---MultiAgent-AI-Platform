import React, { useEffect } from 'react';

import Home from './pages/Home';
import getCurrentUser from './features/getCurrentUser';

import { useDispatch } from 'react-redux';
import { setUserData } from './redux/userSlice';

function App() {
    const dispatch = useDispatch();

    useEffect(() => {
        const getUser = async () => {
            try {
                const data = await getCurrentUser();

                if (data) {
                    dispatch(setUserData(data));
                }
            } catch (error) {
                console.error(
                    'Failed to get current user:',
                    error
                );
            }
        };

        getUser();
    }, [dispatch]);

    return (
        <Home />
    );
}

export default App;