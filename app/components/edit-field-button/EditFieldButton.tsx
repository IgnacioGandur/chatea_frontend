import Popover from "../popover/Popover";
import PillButton from "../pill-button/PillButton";
import CustomInput from "../custom-input/CustomInput";
import styles from "./EditFieldButton.module.css";
import type { FetcherWithComponents } from "react-router";
import classes from "~/css/classes.module.css";
import type { MaterialSymbols } from "material-design-icons-literal-types";

interface EditFieldButtonProps {
    anchorButtonClass?: string;
    fieldId: string;
    labelText: string;
    inputIcon: MaterialSymbols;
    buttonIcon?: MaterialSymbols;
    placeholder: string;
    inputName: string;
    intentValue: string;
    fetcher: FetcherWithComponents<any>;
    inputClarification?: string;
}

export default function EditFieldButton({
    anchorButtonClass,
    fieldId,
    labelText,
    inputIcon,
    buttonIcon,
    placeholder,
    inputName,
    intentValue,
    fetcher,
    inputClarification,
}: EditFieldButtonProps) {
    return (
        <Popover
            anchorButtonClass={`${anchorButtonClass ? anchorButtonClass : ""} ${styles.anchorButton}`}
            altPopoverClass={styles.editPopover}
            anchorName={`--${fieldId}`}
            popoverTarget={fieldId}
            buttonContent={
                <span
                    className={`${classes.defaultIcon} ${styles.buttonIcon} material-symbols-rounded`}
                >
                    {buttonIcon ? buttonIcon : "edit"}
                </span>
            }
            anchorButtonAriaLabel={labelText}
            anchorButtonTitle={labelText}
        >
            <fetcher.Form
                className={`
                    ${styles.editForm}
                    ${classes.floatingForm}
                    ${classes.flexColumnCenter}
                `}
                method="post"
            >
                <input
                    type="hidden"
                    name="intent"
                    value={intentValue}
                />
                <CustomInput
                    labelText={labelText}
                    id={fieldId}
                    icon={inputIcon}
                    placeholder={placeholder}
                    clarification={inputClarification}
                    required
                    name={inputName}
                />
                <PillButton
                    buttonAriaLabel="Confirm"
                    buttonTitle="Confirm"
                    type="submit"
                    buttonText="Confirm"
                    includeEmptySpace={true}
                    includeIcon={false}
                    altButtonClassName={styles.pillButton}
                />
            </fetcher.Form>
        </Popover>
    );
}
