import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import styles from "./study.module.css";

const Study = () => {

    const token = localStorage.getItem("token");
    const { setId } = useParams();
    const navigate = useNavigate();
    const [ currentCard, setCurrentCard ] = useState(null);
    const [ flashcardSet, setFlashcardSet ] = useState(null);
    const [ currentIndex, setCurrentIndex ] = useState(0);
    const [ currentSide, setCurrentSide ] = useState("front");
    const [ error, setError ] = useState(null);

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

        setFlashcardSet(response);
        setCurrentCard(response.flashcards.cards[0]);
        setError("");
        }
        loadInfo();
    }, [BACKEND_URL, setId, token]);

    const updateSide = () => {
        if (currentSide === "front") {
            setCurrentSide("back");
        }
        else {
            setCurrentSide("front");
        }
    }

    const handleNext = () => {
        setCurrentCard(flashcardSet.flashcards.cards[currentIndex + 1]);
        setCurrentIndex(currentIndex + 1);
        setCurrentSide("front");
    }

    const handleBack = () => {
        setCurrentCard(flashcardSet.flashcards.cards[currentIndex - 1]);
        setCurrentIndex(currentIndex - 1);
        setCurrentSide("front");
    }

    const handleDone = () => {
        navigate(`/flashcards/${setId}`);
    }

    if (!flashcardSet || !currentCard) return <div>Loading set...</div>;

    return (<>
        <div className={styles.studyContainer}>

            <div className={styles.headerRow}>
                <button className={styles.arrowLeft}
                    onClick={() => navigate(`/flashcards/${setId}`)}><ArrowLeft /></button>
                <h1>{flashcardSet.title}</h1>
            </div>
            {error && <p className={styles.error}>{error}</p>}
            <div className={styles.progressContainer}>
                <div className={styles.progressHeadings}>
                    <p>Progress</p>
                    <p className={styles.percentage}>{Math.ceil((currentIndex / flashcardSet.num_cards) * 100)}%</p>
                </div>
                <progress value={currentIndex / flashcardSet.num_cards}></progress>
                <p>Card {currentIndex + 1} of {flashcardSet.num_cards}</p>
            </div>
            
            <div className={styles.flashcardContainer} onClick={updateSide}>
                <div className={styles.cardText}>
                    {currentSide === "front" ? <h2>{currentCard.term}</h2>
                    : <h2>{currentCard.definition}</h2>}
                </div>
            </div>
            
            <div className={styles.moveButtons}>
                <button onClick={handleBack} disabled={currentIndex === 0}
                        className={styles.backButton}><ChevronLeft /></button>
                {(currentIndex + 1) >= flashcardSet.num_cards ?
                 (<button onClick={handleDone} className={styles.doneButton}>Done</button>) : 
                (<button onClick={handleNext} disabled={(currentIndex + 1) >= flashcardSet.num_cards}
                        className={styles.nextButton}><ChevronRight /></button>)}
            </div>
        </div>
    </>);
}

export default Study;