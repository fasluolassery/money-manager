import { type LabeledInputProps, LabeledText } from "@/components/labeled-text.js";

export type TextFieldProps = Omit<LabeledInputProps, "control">;

export function TextField(props: TextFieldProps) {
  return <LabeledText control="input" {...props} />;
}
