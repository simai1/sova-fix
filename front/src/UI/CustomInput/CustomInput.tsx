import { FC } from "react";
import { useController, Control } from "react-hook-form";
import styles from "./styles.module.scss";

interface CustomInputProps {
  name: string;
  control: Control<any>;
  label?: string;
  placeholder?: string;
  type?: "text" | "textarea" | "password" | "email";
  maxLength?: number;
  regex?: RegExp;
  required?: boolean | string; // ← можно передать true или сообщение об ошибке
}

const CustomInput: FC<CustomInputProps> = ({
  name,
  control,
  label,
  placeholder,
  type = "text",
  maxLength,
  regex,
  required,
}) => {
  const {
    field: { value, onChange, ref },
    fieldState: { invalid, error },
  } = useController({
    name,
    control,
    rules: {
      required: required || false,
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const val = e.target.value;
    if (regex) {
      if (!regex.test(val)) return;
    }
    onChange(val);
  };

  return (
    <div className={styles.formGroup}>
      {label && <label className={styles.label}>{label}</label>}
      {type !== "textarea" ? (
        <input
          className={`${styles.input} ${invalid ? styles.invalid : ""}`}
          ref={ref}
          type={type}
          placeholder={placeholder}
          value={value || ""}
          onChange={handleChange}
          maxLength={maxLength || 75}
        />
      ) : (
        <textarea
          className={`${styles.textarea} ${invalid ? styles.invalid : ""}`}
          ref={ref}
          placeholder={placeholder}
          value={value || ""}
          onChange={handleChange}
          maxLength={maxLength || 300}
        />
      )}
    </div>
  );
};

export default CustomInput;
