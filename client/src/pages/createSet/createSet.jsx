import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Trash2 } from "lucide-react";
import styles from "./createSet.module.css";
import TextareaAutosize from "react-textarea-autosize"


const CreateSet = () => {

    const token = localStorage.getItem("token");
    const navigate = useNavigate();
    const [ title, setTitle ] = useState("");
    const [ permissions, setPermissions ] = useState("pub");
    const [ flashcards, setFlashcards ] = useState([{ term: "", definition: "" }]);
    const [ error, setError ] = useState(null);

    const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

    const handleCreate = async (e) => {
        e.preventDefault();
        
        if (!title.trim()) {
            setError("Title is required");
            return;
        }
        if (flashcards.some(f => !f.term.trim() || !f.definition.trim()) || flashcards.length === 0) {
            setError("Each flashcard must have both a term and definition");
            return;
        }

        const res = await fetch(`${BACKEND_URL}/flashcards`,
            { method: 'POST',
            headers: { "Authorization": `Bearer ${token}`, 
                        "Content-Type": "application/json" },
            body: JSON.stringify({title, permissions, flashcards})
        });
        if (!res.ok) {
            const response = await res.json();
            setError(response.Error);
            return;
        }
        const response = await res.json();

        setError(""); // reset error
        setTitle("");
        setFlashcards([{ term: "", definition: "" }]);
        navigate(`/flashcards/${response.set_id}`);
    }

    const handleFlashcardChange = (index, side, value) => {
        const updated = [...flashcards];
        updated[index][side] = value;
        setFlashcards(updated);
    };

    const handleAddCard = () => {
        setFlashcards([...flashcards, {term: "", definition: ""}]);
    };

    const handleDeleteCard = (index) => {
        if (flashcards.length === 1) {
            return; // need at least 1 flashcard
        }
        const updated = flashcards.filter((_element, i) => i !== index);
        setFlashcards(updated);
    }

    return (<>
        <div className={styles.createContainer}>

            <div className={styles.createHeader}>
                <div className={styles.titleContainer}>
                    <button onClick={() => navigate("/home")} className={styles.arrowLeft}><ArrowLeft /></button>
                    <h1>Create New Flashcard Set</h1>
                </div>
                <div className={styles.actionButtons}>
                    <button className={styles.cancelButton} 
                        onClick={() => navigate("/home")}>Cancel</button>
                    <button className={styles.publishButton} 
                        onClick={handleCreate}>Publish</button>
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
                                <TextareaAutosize type="text" id="term" className={styles.frontInput}
                                    placeholder="Question or term" minRows={5}
                                    value={card.term}
                                    onChange={(e) => handleFlashcardChange(index, "term", e.target.value)}
                                />
                                </div>
                                <div className={styles.cardBack}>
                                <label htmlFor="definition">Back</label>
                                <TextareaAutosize type="text" id="definition" className={styles.backInput}
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
            <button className={styles.saveButton} onClick={handleCreate}>Publish</button>
        </div>
    </>);
}

export default CreateSet;