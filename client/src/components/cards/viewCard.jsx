import styles from "./viewCard.module.css";
import { SquarePen, CheckIcon } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../contexts/authContext';
import TextareaAutosize from "react-textarea-autosize"

const ViewCard = ({ flashcard, index, setError, setId, onUpdate, flashcardSet }) => {

    const [ front, setFront ] = useState(flashcard.term);
    const [ back, setBack ] = useState(flashcard.definition);

    const [ editMode, setEditMode ] = useState(false);

    const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
    const token = localStorage.getItem("token");
    const { user } = useAuth();
    
    const handleEdit = async () => {
        const res = await fetch(`${BACKEND_URL}/flashcards/${setId}/${flashcard.flashcard_id}`,
            { method: 'PATCH',
            headers: { "Authorization": `Bearer ${token}`, 
                        "Content-Type": "application/json" },
            body: JSON.stringify({term: front, definition: back})
        });
        if (!res.ok) {
            const response = await res.json();
            setError(response.Error);
            return;
        }
        const updated = await res.json();
        onUpdate(updated);
        setEditMode(false);
    }

    return (<>
        <div className={styles.cardContainer}>
            <div className={styles.cardContent}>
                <div className={styles.cardHeader}>
                    <h3 className={styles.cardTitle}>Card {index + 1}</h3>
                    {flashcardSet.username === user.username &&
                        (editMode ? <button className={styles.doneButton}
                            onClick={handleEdit}><CheckIcon /></button>
                        : <button className={styles.editButton}
                            onClick={() => setEditMode(true)}><SquarePen /></button>)}
                </div>
                <div className={styles.cardInfo}>
                    <div className={styles.cardFront}>
                        {editMode ? 
                        <TextareaAutosize value={front} className={styles.editFront}
                            onChange={(e) => setFront(e.target.value)} />
                        : <p className={styles.cardTerm}>{flashcard.term}</p>}
                    </div>
                    <div className={styles.cardBack}>
                        {editMode ? 
                        <TextareaAutosize value={back} className={styles.editBack}
                            onChange={(e) => setBack(e.target.value)} />
                        : <p className={styles.cardTerm}>{flashcard.definition}</p>}
                    </div>
                </div>
            </div>
        </div>
    </>);
}

export default ViewCard;