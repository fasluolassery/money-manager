import { LabeledText, type LabeledTextareaProps } from "@/components/labeled-text.js";

export type TextAreaProps = Omit<LabeledTextareaProps, "control">;

export function TextArea(props: TextAreaProps) {
  return <LabeledText control="textarea" {...props} />;
}
