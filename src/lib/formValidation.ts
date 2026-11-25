import type { SyntheticEvent } from "react";

export function validationMessage(validity: ValidityState, field: { type?: string; min?: string; max?: string; minLength?: number; maxLength?: number }) {
  if (validity.valueMissing) return "Completa este campo para continuar.";
  if (validity.typeMismatch) return field.type === "email" ? "Escribe un correo válido, por ejemplo: nombre@correo.com." : "Revisa el formato de este dato.";
  if (validity.badInput) return "Escribe un número válido.";
  if (validity.tooShort) return `Escribe al menos ${field.minLength} caracteres.`;
  if (validity.tooLong) return `Usa como máximo ${field.maxLength} caracteres.`;
  if (validity.rangeUnderflow) return `El valor debe ser ${field.min} o mayor.`;
  if (validity.rangeOverflow) return `El valor debe ser ${field.max} o menor.`;
  if (validity.stepMismatch) return "Revisa el importe y usa los incrementos indicados en el campo.";
  if (validity.patternMismatch) return "Revisa el formato indicado para este campo.";
  return "Revisa este campo antes de continuar.";
}
function input(event: SyntheticEvent) {
  const target = event.target;
  return target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement ? target : null;
}
export function spanishValidation(event: SyntheticEvent) {
  const field = input(event);
  if (!field) return;
  field.setCustomValidity("");
  if (!field.validity.valid) field.setCustomValidity(validationMessage(field.validity, field));
}
export function clearValidation(event: SyntheticEvent) { input(event)?.setCustomValidity(""); }
