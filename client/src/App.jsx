import { createBrowserRouter, RouterProvider, Navigate, redirect } from 'react-router-dom';
import { useState, useEffect, Suspense } from 'react';
import RootLayout from './components/RootLayout';
import StartPage from './components/StartPage';
import EventDetails from './components/EventDetails';
import Signup from './components/Signup';
import Signin from './components/Signin';
import Home from './components/Home';
import Workshops from './components/Workshops';
import Report from './components/Report';
import Profile from './components/Profile';
import ErrorPage from './components/ErrorPage';
import CreateWorkshop from './components/CreateWorkshop';
import ManageUsers from './components/ManageUsers';
import AccessControl from './components/AccessControl';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if user is authenticated
  useEffect(() => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  // Protected route loader function
  const protectedLoader = () => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) {
      return redirect('/');
    }
    return null;
  };

  const router = createBrowserRouter([
    {
      path: '/',
      element: <RootLayout />,
      errorElement: <ErrorPage />,
      children: [
        {
          path:'/',
          element: isAuthenticated ? <Navigate to="/home" /> : <Navigate to='/startpage'/>,
        },
        {
          path: 'startpage',
          element: <StartPage />
        },
        {
          path: 'signup',
          element: <Signup />
        },
        {
          path: 'signin',
          element: <Signin />
        },
        {
          path: 'home',
          element: isAuthenticated ? <Home /> : <Navigate to="/signin" />,
          loader: protectedLoader
        },
        {
          path: 'create-workshop',
          element: isAuthenticated ? <CreateWorkshop /> : <Navigate to="/signin" />,
          loader: protectedLoader
        },
        {
          path:'/workshops/:eventTitle',
          element: isAuthenticated? <EventDetails/> : <Navigate to='/signin'/>,
          loader:protectedLoader
        },
        {
          path: 'workshops',
          element: isAuthenticated ? <Workshops /> : <Navigate to="/signin" />,
          loader: protectedLoader
        },
        {
          path: 'report',
          element: isAuthenticated ? <Report /> : <Navigate to="/signin" />,
          loader: protectedLoader
        },
        {
          path: 'profile',
          element: isAuthenticated ? <Profile /> : <Navigate to="/signin" />,
          loader: protectedLoader
        },
        {
          path:'manage-users',
          element: isAuthenticated ? <ManageUsers /> : <Navigate to="/signin" />,
          loader: protectedLoader
        },
                {
          path:'access-control',
          element: isAuthenticated ? <AccessControl /> : <Navigate to="/signin" />,
          loader: protectedLoader
        }
      ]
    }
  ]);

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RouterProvider router={router} />
    </Suspense>
  );
}

export default App;