import { Pipe, PipeTransform } from '@angular/core';
import { format, parseISO } from 'date-fns';

@Pipe({
  name: 'dateFormat',
  standalone: true,
})
export class DateFormatPipe implements PipeTransform {
  transform(value: string | Date | null | undefined, formatStr: string = 'MMM dd, yyyy'): string {
    if (!value) {
      return '';
    }

    const date = typeof value === 'string' ? parseISO(value) : value;
    return format(date, formatStr);
  }
}

