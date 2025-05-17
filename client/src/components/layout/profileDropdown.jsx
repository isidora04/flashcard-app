import { useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/authContext";
import style from "./profileDropdown.module.css";
import { useState } from "react";
import { LogOutIcon } from "lucide-react";

const ProfileDropdown = () => {

const { user, logout } = useAuth();
const [ open, setOpen ] = useState(false);

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
            <button onClick={handleLogout} className={style.logoutButton}><LogOutIcon className={style.logoutIcon} /> Log out</button>
        </div>)}
    </div>
    </>
  );
};

export default ProfileDropdown;