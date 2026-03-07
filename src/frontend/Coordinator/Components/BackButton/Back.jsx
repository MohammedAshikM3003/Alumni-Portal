import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Back.module.css';

const Back = ({ to, label = 'Back', className = '', onClick, }) => {
	const navigate = useNavigate();

	const handleBack = (event) => {
		if (onClick) {
			onClick(event);
		}

		if (event.defaultPrevented) {
			return;
		}

		if (typeof to === 'number') {
			navigate(to);
			return;
		}

		if (typeof to === 'string' && to.trim()) {
			navigate(to);
			return;
		}

		navigate(-1);
	};

	return (
		<button
			type="button"
			onClick={handleBack}
			className={`${styles.backButton} ${className}`.trim()}
			aria-label={label}
		>
			<span className="material-symbols-outlined" aria-hidden="true">
				arrow_back
			</span>
			<span>{label}</span>
		</button>
	);
};

export default Back;
