import { useState } from "react";
import { useAuth } from "../../contexts/authContext";
import styles from "../login/login.module.css";
import styles2 from "./signup.module.css";

import { useNavigate } from "react-router-dom";

const Signup = () => {

    const { register } = useAuth();
    const navigate = useNavigate();
    const [ error, setError ] = useState(null);
    const [ username, setUsername ] = useState("");
    const [ password, setPassword ] = useState("");
    const [ confirmPassword, setConfirmPassword ] = useState("");
    const [ email, setEmail ] = useState("");
    const [ showPassword, setShowPassword ] = useState(false);

    const handleRegister = async (e) => {
        
        e.preventDefault();
        if (confirmPassword !== password) {
            setError("Passwords do not match");
        }
        else {
            const error = await register({username, email, password});

            if (error) {
                setError(error);
            }
        }
    }

    const handleBack = async (e) => {
        e.preventDefault();
        navigate("/login");
    }

    return (
        <div className={styles.loginContainer}>

            <div className={styles.leftSide}>
                <div className={styles.leftText}>
                    <h1>Create an Account</h1>
                    <h5>Get started with flashcard maker today</h5>
                </div>
                <div className={styles.createBox}>
                    <div className={styles.boxContainer}>
                        <h3>Already have an account?</h3>
                        <button onClick={handleBack}>Sign in</button>
                    </div>
                </div>
            </div>

            <div className={styles.rightSide}>
                <h1 className={styles2.createText}>Create your account</h1>
                <div className={styles.signUp}>
                    <p>Or <a href="/login" onClick={handleBack}>log in to an existing account</a></p>
                </div>
                {error && <p className={styles.error}>{error}</p>}
                <form onSubmit={handleRegister} className={styles.form}>
                    <label htmlFor="username">Username</label>
                    <input type="text" 
                        placeholder="Enter username"
                        id="username"
                        className={`${styles2.formInput} ${styles.formInput}`}
                        value={username} 
                        onChange={(e) => setUsername(e.target.value)}
                        required/>
                    <label htmlFor="email">Email address</label>
                    <input type="email"
                        placeholder="name@example.com"
                        id="email"
                        value={email}
                        className={`${styles2.formInput} ${styles.formInput}`}
                        onChange={(e) => setEmail(e.target.value)}
                        required/>
                    <label htmlFor="password" className={styles2.passwordLabel}>
                        Password
                        <button type="button" 
                            className={`${styles2.showButton} ${styles.formButton}`} 
                            onClick={() => setShowPassword((prev) => !prev)}>
                            {showPassword ? 'Hide' : 'Show'}
                        </button>
                    </label>
                    <input type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        id="password" 
                        value={password}
                        className={`${styles2.formInput} ${styles.formInput}`} 
                        onChange={(e) => setPassword(e.target.value)}
                        required/>
                    <label htmlFor="conf-password">Confirm password</label>
                    <input type="password"
                        placeholder="••••••••"
                        id="conf-password"
                        className={`${styles2.formInput} ${styles.formInput}`} 
                        value={confirmPassword} 
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required/>

                    <button type="submit" className={styles.formButton}>Create account</button>
                </form>
            </div>
        </div>
    );
}

export default Signup;