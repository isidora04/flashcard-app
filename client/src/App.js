import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/authContext";
import Login from "./pages/login/login";
import Signup from "./pages/signup/signup";
import Layout from "./components/layout/layout";
import Home from "./pages/home/home";
import CreateSet from "./pages/createSet/createSet";
import Search from "./pages/search/search";
import MySets from "./pages/mySets/mySets";
import EditSet from "./pages/editSet/editSet";
import ViewSet from "./pages/viewSet/viewSet";
import Study from "./pages/study/study";
import PrivateRoute from "./PrivateRoute";

const MyRoutes = () => {
  return <Routes>
        <Route element={<Layout />}>
          <Route path="/home" element={<PrivateRoute><Home /></PrivateRoute>} />
          <Route path="/create" element={<PrivateRoute><CreateSet /></PrivateRoute>} />
          <Route path="/search" element={<PrivateRoute><Search /></PrivateRoute>} />
          <Route path="/users/me/flashcards" element={<PrivateRoute><MySets /></PrivateRoute>} />
          <Route path="/flashcards/:setId/edit" element={<PrivateRoute><EditSet /></PrivateRoute>} />
          <Route path="/flashcards/:setId" element={<PrivateRoute><ViewSet /></PrivateRoute>} />
          <Route path="/flashcards/:setId/study" element={<PrivateRoute><Study /></PrivateRoute>} />
          {/* <Route path="/profile" element={<Profile />} /> */}
        </Route>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        {/* <Route path="*" element={<NoPage />} /> */}
      </Routes>
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <MyRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
