import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { SearchIcon } from "lucide-react";
import SearchSet from "../../components/sets/searchSet";
import styles from "./search.module.css";

const Search = () => {

    const token = localStorage.getItem("token");
    const navigate = useNavigate();

    const [ searchParams, setSearchParams ] = useSearchParams();

    const [ flashcardSets, setFlashcardSets ] = useState([]);
    const [ error, setError ] = useState(null);
    const [ numPages, setNumPages ] = useState(0);

    // put the previous search in the search bar at the start + track future searches
    const [ searchInput, setSearchInput ] = useState(searchParams.get("name"));
    const currentPage = parseInt(searchParams.get("page") || "1");
    const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

    useEffect(() => { const loadResults = async () => {

        const params = new URLSearchParams();
        params.set("page", searchParams.get("page") || "1");
        params.set("limit", "9");
        params.set("name", searchParams.get("name"));
        if (searchParams.get("numCards")) {params.set("numCards", searchParams.get("numCards"))}

        const res = await fetch(`${BACKEND_URL}/flashcards?${params}`,
            { method: 'GET',
            headers: { "Authorization": `Bearer ${token}`, 
                        "Content-Type": "application/json" },
        });
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
    }, [searchParams, token, BACKEND_URL]);

    const updateParams = (key, value) => {
        const newParams = new URLSearchParams(searchParams);
        if (key==="numCards" && value === "all") { // don't show "all" in url
            newParams.delete("numCards");
        }
        else {
            newParams.set(key, value);
        }
        if (key !== "page") newParams.set("page", "1"); // reset page
        setSearchParams(newParams);
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        navigate(`/search?name=${encodeURIComponent(searchInput)}`);
    }

    return <>
        <div className={styles.searchContainer}>

            <h1>Search Flashcards</h1>

            <form className={styles.searchForm} onSubmit={handleSearch}>
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
                <button type="submit" className={styles.searchButton}>Search</button>
            </form>

            <h2 className={styles.resultsHeader}>Results for &quot;{searchParams.get("name")}&quot;</h2>

            <div className={styles.filtersContainer}>
                <h3>Flashcard Sets</h3>
                <select id="numCards" name="numCards" className={styles.numCardsFilter}
                    onChange={(e) => {updateParams("numCards", e.target.value)}}>
                    <option value="all">Number of cards: All</option>
                    <option value="lessThanNineteen">Number of cards: &lt;19 cards</option>
                    <option value="twentyToFourtyNine">Number of cards: 20-49 cards</option>
                    <option value="fiftyOrMore">Number of cards: 50+ cards</option>
                </select>
            </div>

            {error && <p>Error: {error}</p>}
            
            <div className={styles.resultsContainer}>
                {flashcardSets.length === 0 ? 
                    (<div style={{ textAlign: 'center' }}><p>No results found</p></div>) 
                    : (
                    <div className={styles.flashcardSets}>
                        {flashcardSets.map((set) => (
                            <SearchSet key={set.set_id} flashcardSet={set} />
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

export default Search;