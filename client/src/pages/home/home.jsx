import { useState } from "react";
import { useAuth } from "../../contexts/authContext";
import styles from "./home.module.css";
import { useNavigate } from "react-router-dom";
import { SearchIcon } from "lucide-react";

const Home = () => {

    const { user } = useAuth();
    const navigate = useNavigate();
    const [ error, setError ] = useState(null);
    const [ searchInput, setSearchInput ] = useState("");

    const handleSearch = async (e) => {
        e.preventDefault();
        navigate(`/search?name=${encodeURIComponent(searchInput.trim())}`);
    }

    return (<>
        <div className={styles.homeContainer}>

            <div className={styles.welcomeBox}>
                {!user ? (<p>Loading</p>) :
                (<div className={styles.welcomeHeading}>
                      <h1>Welcome back, {user.username}!</h1>
                    <button onClick={() => navigate("/create")}>+ Create New Set</button>
                </div>)}
                <form className={styles.searchContainer} onSubmit={handleSearch}>
                    <div className={styles.searchBar}>
                        <SearchIcon className={styles.searchIcon} />
                        <input className={styles.searchInput}
                            type="search"
                            id="search"
                            required
                            placeholder="Search for a flashcard set"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                        />
                        </div>
                    <button type="submit" className={styles.searchButton} 
                        disabled={!searchInput.trim()}>Search</button>
                </form>
            </div>
            
            {/* <div className={styles.recentContainer}> add later along w/ recommended
                <h1>Recently Created</h1>
            </div> */}

        </div>
    </>);
}

export default Home;