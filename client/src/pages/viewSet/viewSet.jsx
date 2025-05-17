import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Trash2, Globe, Lock } from "lucide-react";
import { useAuth } from "../../contexts/authContext";
import styles from "./viewSet.module.css";
import styles2 from "./deleteSet.module.css";
import ViewCard from "../../components/cards/viewCard";

const ViewSet = () => {

    const token = localStorage.getItem("token");
    const { user } = useAuth();
    const { setId } = useParams();
    const navigate = useNavigate();
    const [ flashcards, setFlashcards ] = useState([]);
    const [ flashcardSet, setFlashcardSet ] = useState(null);
    const [ error, setError ] = useState(null);
    const [ popupOpen, setPopupOpen ] = useState(false);

    const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

    useEffect(() => { const loadInfo = async () => {

        const res = await fetch(`${BACKEND_URL}/flashcards/${setId}?limit=max`,
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

        setFlashcards(response.flashcards.cards);
        setFlashcardSet(response);
        setError("");
        }
        loadInfo();
    }, [BACKEND_URL, setId, token]);

    const timeAgo = (dateString) => {
        const now = new Date();
        const updated = new Date(dateString);
        const diff = Math.floor((now - updated) / 1000); // difference in seconds

        const units = [
            { name: "year", seconds: 31536000 },
            { name: "month", seconds: 2592000 },
            { name: "day", seconds: 86400 },
            { name: "hour", seconds: 3600 },
            { name: "minute", seconds: 60 },
            { name: "second", seconds: 1 }
        ];

        for (const unit of units) {
            const value = Math.floor(diff / unit.seconds);
            if (value > 0) {
                return `${value} ${unit.name}${value !== 1 ? "s" : ""} ago`;
            }
        }

        return "just now";
    };

    // to update the view whenever a card is updated
    const updateFlashcard = (updated) => {
        setFlashcards((prev) =>
        prev.map((card) =>
        card.flashcard_id === updated.flashcard_id ? updated : card)
        );
    };

    const deleteSet = async (event) => {
        event.preventDefault();

        const res = await fetch(`${BACKEND_URL}/flashcards/${setId}`,
            { method: 'DELETE',
            headers: { "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json" }
        });
        if (!res.ok) {
            const response = await res.json();
            setError(response.error);
            return;
        }
        navigate("/users/me/flashcards");
    };

    const handleDelete = () => {
        setPopupOpen(true);
    }

    // Disable scrolling when popup is open
    useEffect(() => {
        if (popupOpen) {
            document.body.style.overflow = "hidden";
        } 
        else {
            document.body.style.overflow = "";
        }

        // reset
        return () => {
        document.body.style.overflow = "";
        };
    }, [popupOpen]);


    if (!flashcardSet || !user) return <div>Loading set...</div>;

    return (<>
        <div className={styles.viewContainer}>

            <div className={styles.headerRow}>
                <button className={styles.arrowLeft}
                    onClick={() => navigate("/users/me/flashcards")}><ArrowLeft /></button>
                <h2 className={styles.setTitle}>{flashcardSet.title}</h2>
                {flashcardSet.permissions === "pub" ? 
                    (<p className={styles.permissions}>
                        <Globe className={styles.globe} /> Public</p>) 
                    : (<p className={styles.permissions}>
                        <Lock className={styles.lock} /> Private</p>)}
            </div>
            <div className={styles.setInfo}>
                <div className={styles.userInfo}>
                    <button className={styles.iconButton}>{flashcardSet.username.charAt(0)}</button>
                    <p className={styles.username}>{flashcardSet.username}</p>
                </div>
                <p className={styles.dates}>
                    Created {new Date(flashcardSet.created_at).toLocaleDateString()}{" "}
                    • Last modified {timeAgo(flashcardSet.last_updated)}{" "}
                    • {flashcardSet.num_cards} cards
                </p>
            </div>
            {error && <p className={styles.error}>{error}</p>}
            
            <div className={styles.detailsBox}>
                <h3 className={styles.flashcardsHeading}>Flashcards</h3>
                {flashcardSet.username === user.username && (<div className={styles.ownerButtons}>
                <button className={styles.editButton}
                    onClick={() => navigate(`/flashcards/${setId}/edit`)}>Edit Set</button>
                <button className={styles.deleteButton}
                    onClick={handleDelete}><Trash2 className={styles.trash} />Delete Set</button>
                {popupOpen && (
                        <div className={styles2.deleteRef}>
                            <div className={styles2.deleteContainer}>
                                <h5>Delete flashcard set?</h5>
                                <p>This action cannot be undone. This will permanently 
                                    delete the flashcard set &quot;{flashcardSet.title}&quot; and all of its cards.</p>
                                <div className={styles2.deleteButtons}>
                                    <button className={styles2.deleteButton} onClick={deleteSet}
                                        >Yes, delete
                                    </button>
                                    <button className={styles2.cancelButton} onClick={() => setPopupOpen(false)}
                                        >No, go back
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}</div>)}
            </div>
            
            <div className={styles.flashcardContainer}>
                <div className={styles.cardTable}>
                    {flashcards.map((card, index) => (
                        <ViewCard key={card.flashcard_id} flashcard={card} setId={setId}
                            index={index} setError={setError} onUpdate={updateFlashcard} />
                    ))}
                </div>
            </div>
            
            <div className={styles.viewButtons}>
                <button className={styles.backButton}
                    onClick={() => navigate("/users/me/flashcards")}>Back to My Sets</button>
                <button className={styles.studyButton}
                    onClick={() => navigate(`/flashcards/${setId}/study`)}>Study Set</button>
            </div>
        </div>
    </>);
}

export default ViewSet;