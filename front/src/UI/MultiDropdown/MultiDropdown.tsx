import { FC, useState, useRef, useEffect } from "react";
import { useController, Control } from "react-hook-form";
import styles from "./styles.module.scss";
import { Option } from "../../types/uiTypes";

interface MultiDropdownProps {
    name: string;
    control: Control<any>;
    options: Option[];
    placeholder?: string;
    label?: string;
    allValue?: string;
    required?: boolean | string;
}

const MultiDropdown: FC<MultiDropdownProps> = ({
    name,
    control,
    options,
    placeholder,
    label,
    allValue,
    required,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const {
        field: { value = [], onChange },
        fieldState: { error },
    } = useController({
        name,
        control,
        rules: {
            required: required || false,
        },
    });

    const toggleOption = (option: Option) => {
        const isAllOption = allValue !== undefined && option.value === allValue;

        if (isAllOption) {
            onChange([allValue]);
        } else {
            if (value.includes(option.value)) {
                onChange(value.filter((id: any) => id !== option.value));
            } else {
                const newValues = value.filter((id: any) => id !== allValue);
                onChange([...newValues, option.value]);
            }
        }
    };

    const selectedOptions = options.filter((opt) => value.includes(opt.value));

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
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className={styles.List}>
            {label && <label>{label}</label>}
            <div className={styles.ListCont} ref={dropdownRef}>
                <input
                    readOnly
                    onClick={() => setIsOpen(!isOpen)}
                    value={selectedOptions.map((opt) => opt.label).join(", ")}
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
                            transform: isOpen
                                ? "rotate(0deg)"
                                : "rotate(-90deg)",
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
                                className={
                                    value.includes(option.value)
                                        ? `${styles.NameForList} ${styles.selected}`
                                        : styles.NameForList
                                }
                                onClick={() => toggleOption(option)}
                                style={{
                                    fontWeight: value.includes(option.value)
                                        ? "bold"
                                        : "normal",
                                }}
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

export default MultiDropdown;
