import { FC, useState } from "react";
import styles from "./styles.module.scss";

interface TooltipProps {
    text: string;
    children: React.ReactNode;
    condition: boolean;
}

const Tooltip: FC<TooltipProps> = ({ text, children, condition }) => {
    const [visible, setVisible] = useState(false);

    if (!condition) return children;

    return (
        <div
            className={styles.tooltipWrapper}
            onMouseEnter={() => setVisible(true)}
            onMouseLeave={() => setVisible(false)}
        >
            {children}
            {visible && <div className={styles.tooltip}>{text}</div>}
        </div>
    );
};

export default Tooltip;
