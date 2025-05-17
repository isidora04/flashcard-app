import { useState } from "react";
import { useAuth } from "../../contexts/authContext";
import styles from "./login.module.css";
import { useNavigate } from "react-router-dom";

const Login = () => {

    const { login } = useAuth();
    const navigate = useNavigate();
    const [ error, setError ] = useState(null);
    const [ username, setUsername ] = useState("");
    const [ password, setPassword ] = useState("");

    const handleLogin = async (e) => {
        
        e.preventDefault();
        const error = await login(username, password);

        if (error) {
            setError(error);
        }
    }

    const handleSignup = async (e) => {
        e.preventDefault();
        navigate("/signup");
    }

    return (
        <div className={styles.loginContainer}>

            <div className={styles.leftSide}>
                <div className={styles.leftText}>
                    <h1>Welcome to Flashcard Maker</h1>
                    <h5>Sign in to begin</h5>
                </div>
                <div className={styles.createBox}>
                    <div className={styles.boxContainer}>
                        <h3>New here?</h3>
                        <button onClick={handleSignup}>Create an account</button>
                    </div>
                </div>
            </div>

            <div className={styles.rightSide}>
                <h1>Log in to your account</h1>
                {error && <p className={styles.error}>{error}</p>}
                <form className={styles.form} onSubmit={handleLogin}>
                    <label htmlFor="username">Username</label>
                    <input type="text" className={styles.formInput}
                        placeholder="Enter username"
                        id="username"
                        value={username} 
                        onChange={(e) => setUsername(e.target.value)}
                        required/>
                    <label htmlFor="password">Password</label>
                    <input type="password" className={styles.formInput}
                        placeholder="••••••••"
                        id="password" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)}
                        required/>
                    <button type="submit" className={styles.formButton}>Sign in</button>
                </form>
                <div className={styles.signUp}>
                    <p>Don't have an account? <a href="/signup" onClick={handleSignup}>Sign up</a></p>
                </div>
            </div>
        </div>
    );
}

export default Login;