import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { SearchIcon } from "lucide-react";
import styles from "./mySets.module.css";
import MySet from "../../components/sets/mySet";

const MySets = () => {

    const token = localStorage.getItem("token");
    const navigate = useNavigate();

    const [ searchParams, setSearchParams ] = useSearchParams();

    const [ flashcardSets, setFlashcardSets ] = useState([]);
    const [ error, setError ] = useState(null);
    const [ numPages, setNumPages ] = useState(0);

    const currentPage = parseInt(searchParams.get("page") || "1");
    const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

    useEffect(() => { const loadResults = async () => {

        const params = new URLSearchParams();
        params.set("page", searchParams.get("page") || "1");
        params.set("limit", "9");
        if (searchParams.get("name")) params.set("name", searchParams.get("name"));

        const res = await fetch(`${BACKEND_URL}/users/me/flashcards?${params}`,
            { method: 'GET',
            headers: { "Authorization": `Bearer ${token}`, 
                        "Content-Type": "application/json" },
        });
        console.log(res);
        if (!res.ok) {
            const response = await res.json();
            setError(response.Error);
            return;
        }
        const response = await res.json();

        setFlashcardSets(response.flashcardSets);
        setNumPages(Math.ceil(response.count / 9));
        setError("");
        }
        loadResults();
    }, [searchParams, token]);

    const updateParams = (key, value) => {
        const newParams = new URLSearchParams(searchParams);
        newParams.set(key, value);
        if (key !== "page") newParams.set("page", "1"); // reset page
        setSearchParams(newParams);
    };

    return <>
        <div className={styles.mySetsContainer}>
            <div className={styles.mySetsHeader}>
                <div>
                    <h1>My Flashcard Sets</h1>
                    <p>Manage and study your flashcard sets</p>
                </div>
                <button className={styles.createButton} 
                    onClick={() => navigate("/create")}>
                        + Create New Set
                </button>
            </div>
            <div className={styles.searchBar}>
                <SearchIcon className={styles.searchIcon} />
                <input className={styles.searchInput}
                    type="search"
                    id="search"
                    required
                    placeholder="Search your sets..."
                    value={searchParams.get("name") || ""}
                    onChange={(e) => updateParams("name", e.target.value)}
                />
            </div>

            {error && <p className="promo-error">Error: {error}</p>}
            
            <div className={styles.resultsContainer}>
                {flashcardSets.length === 0 ? 
                    (<div style={{ textAlign: 'center' }}><p>No results found</p></div>) 
                    : (
                    <div className={styles.flashcardSets}>
                        {flashcardSets.map((set) => (
                            <MySet key={set.set_id} flashcardSet={set} />
                        ))}
                    </div>)}
            </div>
            <div className={styles.pageButtons}>
                <button disabled={currentPage <= 1}
                        onClick={() => updateParams("page", (currentPage - 1).toString())}>Back</button>
            
                <p>Page {numPages > 0 ? currentPage : 0} of {numPages}</p>
                    <button disabled={currentPage >= numPages}
                        onClick={() => updateParams("page", (currentPage + 1).toString())}>Next</button>
            </div>
        </div>
    </>;
}

export default MySets;