import React, { useEffect, useState } from 'react';
import styles from './Layout.module.scss'; // Импортируем стили
import { useLocation } from 'react-router-dom';

const Layout = ({ children }) => {
    const location = useLocation();
    const [isCardPage, setIsCardPage] = useState(false)

    useEffect(() => {
        if (location.pathname === '/CardPage/Card') setIsCardPage(true)
    }, [location])

    return (
        <div className={isCardPage ? `${styles.layout__container} ${styles.layout__container__card}` : styles.layout__container}>
            {children}
        </div>
    );
};

export default Layout;
