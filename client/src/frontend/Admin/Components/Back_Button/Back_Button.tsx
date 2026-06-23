import { useNavigate } from 'react-router-dom';
import styles from './Back_Button.module.css';

interface BackButtonProps {
	to?: string;
	className?: string;
	onClick?: () => void;
}

const Back_Button = ({ to, className = '', onClick }: BackButtonProps) => {
	const navigate = useNavigate();

	const handleClick = () => {
		if (onClick) {
			onClick();
			return;
		}

		if (to) {
			navigate(to);
			return;
		}

		window.history.back();
	};

	return (
		<button type="button" className={`${styles.backButton} ${className}`} onClick={handleClick}>
			<span className="material-symbols-outlined">arrow_back</span>
			<span>Back</span>
		</button>
	);
};

export default Back_Button;
