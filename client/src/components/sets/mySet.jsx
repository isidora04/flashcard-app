import { useNavigate } from 'react-router-dom';
import styles from "./mySet.module.css";
import { Ellipsis, SquarePen, Globe, Lock } from 'lucide-react';

const MySet = ({ flashcardSet }) => {

    let navigate = useNavigate();

    const handleStudy = () => {
        navigate(`/flashcards/${flashcardSet.set_id}/study`)
    }
    
    const handleEdit = () => {
        navigate(`/flashcards/${flashcardSet.set_id}/edit`);
    }

    const handleInfo = () => {
        navigate(`/flashcards/${flashcardSet.set_id}`);
    }

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

    return (<>
        <div className={styles.cardContainer}>
            <div className={styles.cardContent}>
                <div className={styles.cardHeader}>
                    <h2 onClick={handleInfo} className={styles.cardTitle}>{flashcardSet.title}</h2>
                    <div className={styles.rightSide}>
                        {flashcardSet.permissions === "pub" ? 
                            (<p><Globe className={styles.globe} /> Public</p>) 
                            : (<p><Lock className={styles.lock} /> Private</p>)}
                        <button className={styles.moreButton}><Ellipsis /></button>
                    </div>
                </div>
                <div className={styles.cardInfo}>
                    <div className={styles.cardDates}>
                        <p>Last updated {timeAgo(flashcardSet.last_updated)}</p>
                        <p>Created {new Date(flashcardSet.created_at).toLocaleDateString()}</p>
                    </div>
                    <p className={styles.numCards}>{flashcardSet.num_cards} 
                        &nbsp;{flashcardSet.num_cards === 1 ? "card" : "cards"}</p>
                </div>
                <div className={styles.setButtons}>
                    <button onClick={handleEdit}
                            className={styles.editButton}><SquarePen className={styles.squarePen} />Edit
                    </button>
                    <button className={styles.studyButton} 
                        onClick={handleStudy}>Study
                    </button>
                </div>
            </div>
        </div>
    </>);
}

export default MySet;