import { FC, useState, useRef, useEffect } from "react";
import { useController, Control } from "react-hook-form";
import styles from "./styles.module.scss";
import { Option } from "../../types/uiTypes";

interface CustomDropdownProps {
    name: string;
    control: Control<any>;
    options: Option[];
    placeholder?: string;
    label?: string;
    required?: boolean | string; // ← добавили поддержку required
}

const Dropdown: FC<CustomDropdownProps> = ({
    name,
    control,
    options,
    placeholder,
    label,
    required,
}) => {
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const {
        field: { value, onChange },
        fieldState: { error },
    } = useController({
        name,
        control,
        rules: {
            required: required || false,
        },
    });

    const handleSelect = (option: Option) => {
        onChange(option.value);
        setIsOpen(false);
    };

    const selectedOption = options.find((opt) => opt.value === value);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className={styles.List} ref={dropdownRef}>
            {label && <label>{label}</label>}
            <div className={styles.ListCont}>
                <input
                    readOnly
                    onClick={() => setIsOpen(!isOpen)}
                    value={selectedOption?.label || ""}
                    placeholder={placeholder}
                    style={isOpen ? { borderRadius: "5px 5px 0 0" } : undefined}
                    className={error ? styles.error : undefined}
                />
                <span
                    className={styles.arrowBot}
                    onClick={() => setIsOpen(!isOpen)}
                >
                    <img
                        style={{
                            transform: isOpen ? "rotate(0deg)" : "rotate(-90deg)",
                        }}
                        src="/img/arrow_bottom.svg"
                        alt="dropdown arrow"
                    />
                </span>
                {isOpen && (
                    <div className={styles.ListData}>
                        {options.map((option) => (
                            <p
                                key={option.value}
                                className={styles.NameForList}
                                onClick={() => handleSelect(option)}
                            >
                                {option.label}
                            </p>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dropdown;
