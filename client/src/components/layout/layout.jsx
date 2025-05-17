import { Outlet, Link, useLocation } from "react-router-dom";
import style from "./layout.module.css";
import ProfileDropdown from "./profileDropdown";

const Layout = () => {

const location = useLocation();

  return (
    <>
      <nav>
        <div className={style.navContainer}>
          <ul>
            <li className={style.navTitle}>Flashcard Maker</li>
            <li><Link to="/home" 
              className={location.pathname === "/home" ? style.activeLink : ""}
              >Home</Link></li>
            <li><Link to="/create"
              className={location.pathname === "/create" ? style.activeLink : ""}
              >Create</Link></li>
            <li><Link to="/users/me/flashcards"
              className={location.pathname === "/users/me/flashcards" ? style.activeLink : ""}
              >My Sets</Link></li>
          </ul>
          <ProfileDropdown></ProfileDropdown>
        </div>
      </nav>
      <main>
        <Outlet />
      </main>
      <footer>
        &copy; Flashcard Maker 2025.
      </footer>
    </>
  );
};

export default Layout;