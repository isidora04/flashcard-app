import { useAuth } from "../../contexts/authContext";
import style from "./profileDropdown.module.css";
import { useState } from "react";
import { LogOutIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ProfileDropdown = () => {

const { user, logout } = useAuth();
const [ open, setOpen ] = useState(false);
const navigate = useNavigate();

const handleLogout = () => {
    logout();
}

  return (<>
    <div className={style.profileContainer}>
        {user && <div className={style.profileButton}><button onClick={() => setOpen(!open)}>
        {user.username.charAt(0)}
        </button></div>}
        {open && user && (<div className={style.dropdown}>
            <p>My Account</p>
            <button onClick={() => navigate("/home")} className={style.navButton}>Home</button>
            <button onClick={() => navigate("/create")} className={style.navButton}>Create</button>
            <button onClick={() => navigate("/users/me/flashcards")} className={style.navButton}>My Sets</button>
            <button onClick={handleLogout} className={style.logoutButton}><LogOutIcon className={style.logoutIcon} /> Log out</button>
        </div>)}
    </div>
    </>
  );
};

export default ProfileDropdown;