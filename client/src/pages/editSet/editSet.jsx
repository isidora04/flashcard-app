import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Trash2 } from "lucide-react";
import styles from "../createSet/createSet.module.css";
import TextareaAutosize from "react-textarea-autosize";

const EditSet = () => {

    const token = localStorage.getItem("token");
    const { setId } = useParams();
    const navigate = useNavigate();
    const [ title, setTitle ] = useState("");
    const [ permissions, setPermissions ] = useState("");
    const [ flashcards, setFlashcards ] = useState([]);
    const [ error, setError ] = useState(null);
    const [ deletedCards, setDeletedCards ] = useState([]);

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

        setTitle(response.title);
        setFlashcards(response.flashcards.cards);
        setPermissions(response.permissions);
        setError("");
        }
        loadInfo();
    }, [BACKEND_URL, setId, token]);

    // for editing set features (i.e. permissions or title)
    const handleEdit = async (e) => {
        e.preventDefault();
        
        if (!title.trim()) {
            setError("Title cannot be empty");
            return;
        }

        const res = await fetch(`${BACKEND_URL}/flashcards/${setId}`,
            { method: 'PATCH',
            headers: { "Authorization": `Bearer ${token}`, 
                        "Content-Type": "application/json" },
            body: JSON.stringify({title, permissions})
        });
        if (!res.ok) {
            const response = await res.json();
            setError(response.Error);
            return;
        }
        const response = await res.json();

        setError(""); // reset error
        setTitle("");
        navigate(`/flashcards/${response.setId}`); // return to regular view
    }

    const editFlashcards = async (e) => { // on save edit flashcard button click
        e.preventDefault();

        if (flashcards.some(f => !f.term.trim() || !f.definition.trim()) || flashcards.length === 0) {
            setError("Each flashcard must have both a term and definition");
            return;
        }

        for (const card of flashcards) {
            const { flashcard_id, term, definition } = card;

            if (typeof flashcard_id === 'string') { // it's a temp card, so add it
                const res = await fetch(`${BACKEND_URL}/flashcards/${setId}`,
                    { method: 'POST',
                    headers: { "Authorization": `Bearer ${token}`, 
                                "Content-Type": "application/json" },
                    body: JSON.stringify({term, definition})
                });
                if (!res.ok) {
                    const response = await res.json();
                    setError(response.Error);
                    return;
                }
            }
            else {
                const res = await fetch(`${BACKEND_URL}/flashcards/${setId}/${flashcard_id}`,
                    { method: 'PATCH',
                    headers: { "Authorization": `Bearer ${token}`, 
                                "Content-Type": "application/json" },
                    body: JSON.stringify({term, definition})
                });
                if (!res.ok) {
                    const response = await res.json();
                    setError(response.Error);
                    return;
                }
            }
        }
        for (const deletedCard of deletedCards) {
            const { flashcard_id } = deletedCard;

            // temp cards were never in db so they don't need to be removed
            if (typeof flashcard_id !== 'string') {
                const res = await fetch(`${BACKEND_URL}/flashcards/${setId}/${flashcard_id}`,
                    { method: 'DELETE',
                    headers: { "Authorization": `Bearer ${token}`, 
                                "Content-Type": "application/json" },
                });
                if (!res.ok) {
                    const response = await res.json();
                    setError(response.Error);
                    return;
                }
            }
        }
    }

    const handleFlashcardChange = (index, side, value) => {
        const updated = [...flashcards];
        updated[index][side] = value;
        setFlashcards(updated);
    };

    const handleAddCard = () => {
        const tempId = `temp-${Date.now()}`;
        setFlashcards([...flashcards, { flashcard_id: tempId, term: "", definition: "" }]);
    };

    const handleDeleteCard = (index) => {
        if (flashcards.length === 1) {
            return; // need at least 1 flashcard
        }
        const updated = flashcards.filter((_element, i) => i !== index);
        setFlashcards(updated);

        const toDelete = flashcards[index];
        setDeletedCards([...deletedCards, toDelete]);
    }

    const handleSaveAll = async (e) => {
        await editFlashcards(e);
        await handleEdit(e);
    };

    return (<>
        <div className={styles.createContainer}>

            <div className={styles.createHeader}>
                <div className={styles.titleContainer}>
                    <button className={styles.arrowLeft} 
                        onClick={() => navigate("/users/me/flashcards")}><ArrowLeft /></button>
                    <h1>Edit Flashcard Set</h1>
                </div>
                <div className={styles.actionButtons}>
                    <button className={styles.cancelButton}
                        onClick={() => navigate("/users/me/flashcards")}>Cancel</button>
                    <button className={styles.publishButton}
                        onClick={handleSaveAll}>Save Changes</button>
                </div>
            </div>

            {error && <p className={styles.error}>{error}</p>}
            
            <div className={styles.detailsBox}>
                <h3>Set Details</h3>
                <label htmlFor="title" className={styles.titleLabel}>Title</label>
                <input type="text" className={styles.titleInput}
                    required
                    id="title"
                    placeholder="Enter set title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                />
                <div className={styles.visibility}>
                    <p>Visibility</p>
                    <input type="radio"
                        value="pub" 
                        name="visibility"
                        id="public"
                        checked={permissions === "pub"}
                        onChange={(e) => setPermissions(e.target.value)}>
                    </input>
                    <label htmlFor="public">Public</label>
                    <input type="radio"
                        value="pri"
                        name="visibility"
                        id="private"
                        checked={permissions === "pri"}
                        onChange={(e) => setPermissions(e.target.value)}>
                    </input>
                    <label htmlFor="private">Private</label>
                </div>
            </div>
            
            <div className={styles.flashcardContainer}>
                <h3 className={styles.flashcardsLabel}>Flashcards</h3>
                <div className={styles.cardTable}>
                    {flashcards.map((card, index) => (
                        <div key={index} className={styles.createCardRow}>
                            <div className={styles.createCardHeader}>
                                <h5>Card {index + 1}</h5>
                                <button className={styles.deleteCardButton}
                                    onClick={() => handleDeleteCard(index)}>
                                    <Trash2 />
                                </button>
                            </div>
                            <div className={styles.cardContent}>
                                <div className={styles.cardFront}>
                                <label htmlFor="term">Front</label>
                                <TextareaAutosize id="term" className={styles.frontInput}
                                    placeholder="Question or term" minRows={5}
                                    value={card.term}
                                    onChange={(e) => handleFlashcardChange(index, "term", e.target.value)}
                                />
                                </div>
                                <div className={styles.cardBack}>
                                <label htmlFor="definition">Back</label>
                                <TextareaAutosize id="definition" className={styles.backInput}
                                    placeholder="Answer or definition" minRows={5}
                                    value={card.definition}
                                    onChange={(e) => handleFlashcardChange(index, "definition", e.target.value)}
                                />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                <button className={styles.addCardButton} onClick={handleAddCard}>
                    + Add Card
                </button>
            </div>
            <button className={styles.saveButton} onClick={handleSaveAll}>Save Changes</button>
        </div>
    </>);
}

export default EditSet;