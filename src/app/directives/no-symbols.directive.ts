import { Directive, HostListener } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: '[appNoSymbols]',
})
export class NoSymbolsDirective {
  private regex: RegExp = new RegExp(/^[a-zA-Z0-9\s]*$/);

  constructor(private control: NgControl) {}

  @HostListener('input', ['$event']) onInputChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const value = input.value;

    // Remover símbolos no permitidos
    const sanitizedValue = value.replace(/[^0-9]/g, '');

    // Actualizar el valor del control si se modifica
    if (sanitizedValue !== value) {
      this.control.control?.setValue(sanitizedValue);
    }
  }
}
