import { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';


/*
 * This provider should export a `user` context state that is 
 * set (to non-null) when:
 *     1. a hard reload happens while a user is logged in.
 *     2. the user just logged in.
 * `user` should be set to null when:
 *     1. a hard reload happens when no users are logged in.
 *     2. the user just logged out.
 */
export const AuthProvider = ({ children }) => {
    const navigate = useNavigate();
    const [ user, setUser ] = useState();

    useEffect(() => { const checkToken = async () => {
        if (localStorage.getItem("token")) {
            const getUser = await fetch(`${BACKEND_URL}/users/me`, 
                {method: "GET",
                headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` } });
            if (!getUser.ok) {
                const response = await getUser.json();
                return `${response.Error}`;
            }
            const userJson = await getUser.json();
            setUser(userJson);
        }
    }
    checkToken();
    }, []);


    /*
     * Logout the currently authenticated user.
     *
     * @remarks This function will always navigate to "/login".
     */
    const logout = () => {

        localStorage.removeItem("token");
        setUser(null);
        navigate("/login");
    };

    /**
     * Login a user with their credentials.
     *
     * @remarks Upon success, navigates to "/home". 
     * @param {string} username - The username of the user.
     * @param {string} password - The password of the user.
     * @returns {string} - Upon failure, Returns an error message.
     */
    const login = async (username, password) => {

        try {
            const res = await fetch(`${BACKEND_URL}/auth/tokens`, 
                {method: "POST", body: JSON.stringify({username, password}),
                headers: { "Content-Type": "application/json" }});
            if (!res.ok) {
                const response = await res.json();
                return `${response.Error}`;
            }
            
            const response = await res.json();
            localStorage.setItem("token", response.token);
    
            const getUser = await fetch(`${BACKEND_URL}/users/me`, 
                {method: "GET",
                headers: { "Authorization": `Bearer ${response.token}` } });
            if (!getUser.ok) {
                const response = await getUser.json();
                return `${response.Error}`;
            }
            const userJson = await getUser.json();
            setUser(userJson);
            navigate("/home");
        }
        catch (error) {
            return `Network error: ${error.message}`;
        }
            
    };

    /**
     * Registers a new user. 
     * 
     * @remarks Upon success, navigates to "/home".
     * @param {Object} userData - The data of the user to register (username, email, password).
     * @returns {string} - Upon failure, returns an error message.
     */
    const register = async (userData) => {

        try {
            const res = await fetch(`${BACKEND_URL}/users`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(userData)
            });
    
            if (!res.ok) {
                const response = await res.json();
                return `${response.Error}`;
            }
    
            navigate("/home");
    
        } catch (error) {
            return `Network error: ${error.message}`;
        }
    };

    return (
        <AuthContext.Provider value={{ user, setUser, login, logout, register }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};