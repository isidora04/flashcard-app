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

const MyRoutes = () => {
  return <Routes>
        <Route element={<Layout />}>
          <Route path="/home" element={<Home />} />
          <Route path="/create" element={<CreateSet />} />
          <Route path="/search" element={<Search />} />
          <Route path="/users/me/flashcards" element={<MySets />} />
          <Route path="/flashcards/:setId/edit" element={<EditSet />} />
          <Route path="/flashcards/:setId" element={<ViewSet />} />
          <Route path="/flashcards/:setId/study" element={<Study />} />
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
